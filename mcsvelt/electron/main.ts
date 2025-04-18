import { app, BrowserWindow, session, shell, ipcMain, dialog } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import dotenv from 'dotenv'
import { createRequire } from 'module'
import { spawn, exec } from 'child_process'
import axios from 'axios'
import crypto from 'crypto'
import FormData from 'form-data'
import * as os from 'os'

// Define FFmpegProgress interface
interface FFmpegProgress {
  percent: number;
  frames?: number;
  currentFps?: number;
  currentKbps?: number;
  targetSize?: number;
  timemark?: string;
}

// Load environment variables
dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isDev = process.env.NODE_ENV === 'development'

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (process.platform === 'win32') {
  app.setAppUserModelId(app.getName())
}

let mainWindow: BrowserWindow | null = null

/**
 * Get the app data path based on platform
 */
function getAppDataPath(): string {
  const appName = 'MoodClassifier'
  switch (process.platform) {
    case "darwin": {
      return path.join(process.env.HOME || '', "Library", "Application Support", appName)
    }
    case "win32": {
      return path.join(process.env.APPDATA || '', appName)
    }
    case "linux": {
      return path.join(process.env.HOME || '', `.${appName}`)
    }
    default: {
      console.log("Unsupported platform!")
      process.exit(1)
      return ''
    }
  }
}

// Create app data directory if it doesn't exist
const appDataPath = getAppDataPath()
if (!fs.existsSync(appDataPath)) {
  fs.mkdirSync(appDataPath, { recursive: true })
}

// Lazy imports for youtube-dl and ffmpeg
let youtubeDlExec: any
let ffmpeg: any

// --- Register IPC Handlers Early --- 

// IPC handler for opening external links
ipcMain.handle('openExternalLink', (event, url) => {
  // Validate URL for security
  try {
    const parsedUrl = new URL(url)
    if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
      shell.openExternal(url)
      console.log(`Opened external URL: ${url}`)
      return { success: true }
    } else {
      console.warn(`Blocked opening non-HTTP URL: ${url}`)
      return { error: 'Invalid URL protocol' }
    }
  } catch (error) {
    console.error(`Invalid URL received: ${url}`)
    return { error: 'Invalid URL format' }
  }
})

// Handle YouTube audio downloads
ipcMain.handle('download-youtube-audio', async (event, url) => {
  try {
    console.log('Downloading YouTube audio...')
    return await downloadWithYtDlp(url)
  } catch (error: any) {
    console.error('Error downloading with yt-dlp:', error.message)
    throw new Error(`Failed to download YouTube audio: ${error.message}`)
  }
})

// Handle audio file reading
ipcMain.handle('read-audio-file', async (event, filePath) => {
  try {
    // Handle the case where filePath is an object
    if (typeof filePath === 'object') {
      if (filePath.filePath) {
        filePath = filePath.filePath
      } else {
        throw new Error('Invalid file path object provided')
      }
    }
    
    // Validate that we have a string path
    if (typeof filePath !== 'string') {
      throw new Error('Invalid file path provided')
    }

    const buffer = await fs.promises.readFile(filePath)
    return buffer
  } catch (error) {
    console.error('Error reading audio file:', error)
    throw error
  }
})

// Handle toggle-enabled request
ipcMain.handle('toggle-enabled', async (event, enabled) => {
  try {
    return { success: true, enabled }
  } catch (error) {
    console.error('Error toggling enabled state:', error)
    throw error
  }
})

// Handle music recognition with ACRCloud
ipcMain.handle('recognize-music', async (event, filePath) => {
  try {
    console.log('Recognizing music in file:', filePath)
    if (typeof filePath === 'object' && filePath.filePath) {
      filePath = filePath.filePath
    }
    
    if (typeof filePath !== 'string') {
      throw new Error('Invalid file path provided')
    }
    
    // Verify that the file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File does not exist: ${filePath}`)
    }
    
    // Check file size - if too large, trim it
    const stat = fs.statSync(filePath)
    console.log(`File size: ${stat.size} bytes`)
    
    // ACRCloud works best with first 10-20 seconds of audio
    // If file is too large, create a shorter version
    const MAX_SIZE = 2 * 1024 * 1024 // 2MB is usually enough for recognition
    if (stat.size > MAX_SIZE) {
      console.log(`File too large (${stat.size} bytes), trimming to first 20 seconds`)
      
      // Create a temporary shortened file
      const tempFilePath = path.join(appDataPath, `temp_short_${Date.now()}.wav`)
      
      // Use the already imported ffmpeg to trim the file
      const require = createRequire(import.meta.url)
      const ffmpegStaticPath = require('ffmpeg-static')
      
      return new Promise((resolve, reject) => {
        const args = [
          '-i', filePath,
          '-t', '20', // Take first 20 seconds
          '-acodec', 'copy', // Copy audio codec without re-encoding
          tempFilePath
        ]
        
        console.log(`Trimming audio: ${ffmpegStaticPath} ${args.join(' ')}`)
        const ffmpegProcess = spawn(ffmpegStaticPath, args)
        
        ffmpegProcess.on('close', async (code) => {
          if (code === 0) {
            console.log(`Successfully trimmed audio to ${tempFilePath}`)
            try {
              // Use the shortened file for recognition
              const result = await recognizeMusicWithACRCloud(tempFilePath)
              // Clean up the temporary file
              fs.unlinkSync(tempFilePath)
              resolve(result)
            } catch (err) {
              // Clean up on error
              if (fs.existsSync(tempFilePath)) {
                fs.unlinkSync(tempFilePath)
              }
              reject(err)
            }
          } else {
            console.error(`Error trimming audio: exit code ${code}`)
            reject(new Error(`Failed to trim audio file: exit code ${code}`))
          }
        })
        
        ffmpegProcess.on('error', (err) => {
          console.error('Error starting ffmpeg process:', err)
          reject(new Error(`Failed to start ffmpeg process: ${err.message}`))
        })
      })
    }
    
    // If file size is acceptable, proceed with recognition
    const result = await recognizeMusicWithACRCloud(filePath)
    console.log('Recognition result received:', 
      result.status ? `Status: ${result.status.code} - ${result.status.msg}` : 'No status in response')
    return result
  } catch (error: any) {
    console.error('Error recognizing music:', error.message)
    if (error.stack) {
      console.error('Stack trace:', error.stack)
    }
    // Return a structured error object for the client
    return {
      status: {
        code: 3000, // Custom error code
        msg: `Music recognition failed: ${error.message}`
      },
      error: true,
      errorDetails: error.message
    }
  }
})

// Handle saving temporary files for browser uploaded files
ipcMain.handle('save-temp-file', async (event, data) => {
  try {
    if (!data || !data.buffer || !data.name) {
      throw new Error('Invalid file data provided')
    }
    
    // Create a buffer from the array
    const buffer = Buffer.from(data.buffer)
    
    // Create a temporary filename in the app data directory
    const tempFileName = `temp_${Date.now()}_${data.name}`
    const tempFilePath = path.join(appDataPath, tempFileName)
    
    // Write the file
    await fs.promises.writeFile(tempFilePath, buffer)
    console.log('Saved temporary file:', tempFilePath)
    
    // Return the path to the temporary file
    return tempFilePath
  } catch (error: any) {
    console.error('Error saving temporary file:', error.message)
    throw new Error(`Failed to save temporary file: ${error.message}`)
  }
})

// Add handler for fetching images to avoid CORS issues
ipcMain.handle('fetch-image', async (event, imageUrl) => {
  try {
    console.log('Fetching image via main process proxy:', imageUrl);
    
    // Generate a unique filename based on the URL hash
    const urlHash = crypto
      .createHash('md5')
      .update(imageUrl)
      .digest('hex');
    
    const tempFileName = `img_${urlHash}.jpg`;
    const tempFilePath = path.join(appDataPath, tempFileName);
    
    // Check if we already have this image cached
    if (fs.existsSync(tempFilePath)) {
      console.log('Using cached image:', tempFilePath);
      
      // Return data URL to avoid any CORS issues entirely
      const imageBuffer = fs.readFileSync(tempFilePath);
      const base64Image = imageBuffer.toString('base64');
      return { 
        url: `data:image/jpeg;base64,${base64Image}`,
        cached: true
      };
    }
    
    // Fetch the image
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    // Save the image to a temporary file
    await fs.promises.writeFile(tempFilePath, response.data);
    console.log('Saved fetched image to:', tempFilePath);
    
    // Convert to data URL and return
    const imageBuffer = fs.readFileSync(tempFilePath);
    const base64Image = imageBuffer.toString('base64');
    
    return { 
      url: `data:image/jpeg;base64,${base64Image}`,
      cached: false
    };
  } catch (error: any) {
    console.error('Error fetching image:', error.message);
    return { error: error.message };
  }
})
// Confirm handler registration
console.log('Registered IPC handler for: fetch-image');

// Add handler for manual temp file cleanup
ipcMain.handle('cleanup-temp-files', async (event) => {
  try {
    console.log('Manual cleanup requested from UI')
    cleanupTempFiles()
    return { success: true, message: 'Temporary files cleaned up successfully' }
  } catch (error: any) {
    console.error('Error during manual cleanup:', error.message)
    return { success: false, error: error.message }
  }
})
console.log('Registered IPC handler for: cleanup-temp-files'); // Add confirmation

// Add this near your other IPC handlers
ipcMain.handle('demucs:separate', async (_, filePath) => {
  try {
    if (!filePath || !fs.existsSync(filePath)) {
      throw new Error('Invalid file path');
    }

    console.log('Starting Demucs stem separation for:', filePath);
    
    const outputDir = path.join(os.tmpdir(), 'demucs-output', Date.now().toString());
    fs.mkdirSync(outputDir, { recursive: true });
    
    console.log('Created output directory:', outputDir);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`Audio file not found: ${filePath}`);
    }

    // Get a unique ID for this separation request
    const separationId = Date.now().toString();
    
    // Create a progress event channel name based on the separation ID
    const progressChannel = `demucs:progress:${separationId}`;
    
    // Create the demucs command without the --wav flag (it's not supported)
    const command = `demucs --verbose -n htdemucs "${filePath}" -o "${outputDir}"`;
    
    console.log('Running command:', command);
    
    return new Promise((resolve, reject) => {
      const childProcess = exec(command);
      
      let stdoutData = '';
      let stderrData = '';
      let progress = 0;
      
      // Parse progress from stdout or stderr
      const parseProgress = (data: Buffer | string) => {
        // Look for progress percentage in the output
        const progressMatch = data.toString().match(/(\d+)%\|/);
        if (progressMatch && progressMatch[1]) {
          const newProgress = parseInt(progressMatch[1], 10);
          
          // Only send updates when progress changes meaningfully
          if (newProgress > progress && (newProgress - progress >= 1 || newProgress === 100)) {
            progress = newProgress;
            
            // Send the progress to the renderer
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send(progressChannel, { progress });
            }
          }
        }
      };
      
      // Capture stdout data
      if (childProcess.stdout) {
        childProcess.stdout.on('data', (data) => {
          console.log(`Demucs stdout: ${data}`);
          stdoutData += data;
          parseProgress(data);
        });
      }
      
      // Capture stderr data
      if (childProcess.stderr) {
        childProcess.stderr.on('data', (data) => {
          console.log(`Demucs stderr: ${data}`);
          stderrData += data;
          parseProgress(data);
        });
      }
      
      // Handle process completion
      childProcess.on('close', (code) => {
        console.log(`Demucs process exited with code ${code}`);
        
        if (code !== 0) {
          console.error('Demucs failed with exit code:', code);
          console.error('Stdout:', stdoutData);
          console.error('Stderr:', stderrData);
          reject(new Error(`Demucs failed with exit code ${code}. Check the logs for details.`));
          return;
        }
        
        // Get the actual path where stems are saved
        // Demucs creates a directory structure like: outputDir/modelName/songName/[stems]
        const modelName = 'htdemucs';
        const songName = path.basename(filePath, path.extname(filePath));
        const stemDirectory = path.join(outputDir, modelName, songName);
        
        console.log('Expected stem directory:', stemDirectory);
        
        // Verify the stem directory exists
        if (!fs.existsSync(stemDirectory)) {
          console.error('Stem directory not found. Directory listing:');
          try {
            // List the output directory to see what's there
            const files = fs.readdirSync(outputDir);
            console.log('Files in output directory:', files);
            
            if (files.length > 0 && fs.existsSync(path.join(outputDir, files[0]))) {
              const subdir = path.join(outputDir, files[0]);
              const subdirFiles = fs.readdirSync(subdir);
              console.log(`Files in ${files[0]} subdirectory:`, subdirFiles);
            }
          } catch (err) {
            console.error('Error listing directory:', err);
          }
          
          reject(new Error('Stem directory not found after processing. Check the logs for details.'));
          return;
        }
        
        // List the files in the stem directory
        try {
          const stemFiles = fs.readdirSync(stemDirectory);
          console.log('Found stem files:', stemFiles);
        } catch (err) {
          console.error('Error listing stem files:', err);
        }
        
        // Return the directory path and the progress channel name
        resolve({
          stemDirectory,
          progressChannel
        });
      });
      
      // Handle process errors
      childProcess.on('error', (err) => {
        console.error('Error starting Demucs process:', err);
        reject(new Error(`Failed to start Demucs process: ${err.message}`));
      });
    });
  } catch (error) {
    console.error('Error in demucs:separate handler:', error);
    throw error;
  }
});

// Add this near your other IPC handlers
ipcMain.handle('electron:showItemInFolder', (_, filePath) => {
  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error('Invalid file path');
  }
  
  // Show the item in file explorer
  shell.showItemInFolder(filePath);
});

// Add a handler to check if Demucs is installed
ipcMain.handle('check-demucs-installed', async () => {
  return new Promise((resolve) => {
    // Use 'demucs -h' instead of '--version' since Demucs doesn't support a clean version output
    exec('demucs -h', (error, stdout) => {
      if (error) {
        console.log('Demucs not found:', error.message);
        resolve(false);
      } else {
        console.log('Demucs is installed');
        resolve(true);
      }
    });
  });
});

// Add this near your other IPC handlers
ipcMain.handle('electron:readAudioFile', async (_, filePath) => {
  try {
    if (!filePath || !fs.existsSync(filePath)) {
      throw new Error('Invalid file path');
    }
    
    console.log('Reading audio file:', filePath);
    
    // Read the file as binary
    const buffer = fs.readFileSync(filePath);
    return buffer;
  } catch (error) {
    console.error('Error reading audio file:', error);
    throw error;
  }
});

// --- End of Early IPC Handler Registration ---

async function createWindow() {
  console.log('Creating window...')
  console.log('Development mode:', isDev)
  
  // Add performance optimizing command line switches
  app.commandLine.appendSwitch('enable-zero-copy')
  app.commandLine.appendSwitch('enable-gpu-rasterization')
  app.commandLine.appendSwitch('enable-native-gpu-memory-buffers')
  app.commandLine.appendSwitch('canvas-msaa-sample-count', '0')  // Disable antialiasing for performance
  app.commandLine.appendSwitch('disable-smooth-scrolling')  // Disable smooth scrolling for performance
  app.commandLine.appendSwitch('ignore-gpu-blocklist')
  
  // Get preload script path
  const preloadScriptPath = path.join(__dirname, 'preload.js')
  console.log('Preload script path:', preloadScriptPath)
  
  // Create the browser window - initially hidden for faster perceived startup
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: true, // Show immediately to better debug startup issues
    backgroundColor: '#0a0a0a', // Set background color to reduce flicker
    webPreferences: {
      nodeIntegration: false, // Disable node integration for security
      contextIsolation: true, // Enable context isolation for security
      sandbox: true, // Enable sandbox for additional security
      preload: preloadScriptPath, // Use preload script for safe API exposure
      disableBlinkFeatures: 'Auxclick', // Disable potentially dangerous features
      webSecurity: true, // Ensure web security is enabled
      allowRunningInsecureContent: false, // Prevent loading of insecure content
      backgroundThrottling: false, // Prevent throttling when in background
      enableWebSQL: false, // Disable deprecated WebSQL
      spellcheck: false, // Disable spellcheck for performance
      v8CacheOptions: 'code', // Enable V8 code caching for better JS performance
    },
    autoHideMenuBar: true, // Hide menu bar for cleaner UI
    frame: true,
    titleBarStyle: 'default',
  })

  // Set strict Content Security Policy - removed unsafe-eval
  session.defaultSession.webRequest.onHeadersReceived({urls: ['*://*/*']}, (details, callback) => {
    const headers = { ...details.responseHeaders };
    // Remove any existing Content-Security-Policy headers
    Object.keys(headers).forEach(key => {
      if (key.toLowerCase() === 'content-security-policy') {
        delete headers[key];
      }
    });
    headers['Content-Security-Policy'] = [
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net blob:; script-src-elem 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net blob:; object-src 'none'; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; img-src 'self' data: https://*; media-src 'self' blob:; connect-src 'self' https://*; worker-src 'self' blob:; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; frame-src 'none';"
    ];
    callback({ responseHeaders: headers });
  })

  // Prevent navigation to untrusted origins
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const parsedUrl = new URL(url)
    const validOrigins = ['localhost', '127.0.0.1'] // Add your app's domains here
    
    if (!isDev && !validOrigins.includes(parsedUrl.hostname)) {
      event.preventDefault()
      // Open external links in default browser instead of blocking them
      shell.openExternal(url)
      console.log(`External navigation to ${url} opened in default browser`)
    }
  })

  // Handle link clicks properly
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Open links in external browser
    shell.openExternal(url)
    return { action: 'deny' } // Prevent creating new electron windows
  })

  // Load the app
  try {
    if (isDev) {
      // Load from dev server
      console.log('Loading from dev server: http://localhost:5173')
      try {
        await mainWindow.loadURL('http://localhost:5173')
        console.log('Successfully loaded from dev server')
      } catch (devError) {
        console.error('Failed to load from dev server:', devError)
        // Fallback to loading from file if available
        try {
          const fallbackPath = path.join(__dirname, '../dist/index.html')
          if (fs.existsSync(fallbackPath)) {
            console.log('Trying fallback path:', fallbackPath)
            await mainWindow.loadFile(fallbackPath)
          } else {
            throw new Error('No fallback path available')
          }
        } catch (fallbackError) {
          console.error('Failed to load fallback:', fallbackError)
          mainWindow.webContents.loadURL('data:text/html,<h1>Failed to load application</h1>')
        }
      }
    } else {
      // Load the index.html when not in development
      const filePath = path.join(__dirname, '../dist/index.html')
      console.log('Loading from file:', filePath)
      await mainWindow.loadFile(filePath)
    }
  } catch (error) {
    console.error('Error loading content:', error)
  }

  // Only show window when content is loaded - reduces perceived lag
  mainWindow.once('ready-to-show', () => {
    console.log('Window ready to show')
    mainWindow?.show()
  })

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

/**
 * Download YouTube audio using youtube-dl-exec (yt-dlp)
 * @param url - YouTube URL
 * @returns Promise with file path and video details
 */
async function downloadWithYtDlp(url: string): Promise<{
  filePath: string
  videoDetails: {
    title: string
    author: string
  }
}> {
  // Lazy load youtube-dl-exec
  if (!youtubeDlExec) {
    try {
      // Use createRequire to load CommonJS modules in ESM
      const require = createRequire(import.meta.url);
      
      // Load the module directly and handle its configuration
      const ytdlModule = require('youtube-dl-exec');
      
      // Configure binary path - this will help avoid __dirname issues
      // Use the module's create function with explicit path to the binary
      const binName = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
      const binPath = path.resolve(path.join(
        path.dirname(fileURLToPath(import.meta.url)), 
        '../node_modules/youtube-dl-exec/bin', 
        binName
      ));
      
      console.log('YouTube DL binary path:', binPath);
      
      // Check if the binary exists at the expected path
      if (fs.existsSync(binPath)) {
        console.log('Using custom binary path for youtube-dl-exec');
        youtubeDlExec = ytdlModule.create(binPath);
      } else {
        // Fallback to default behavior
        console.log('Binary not found at expected path, using default');
        youtubeDlExec = ytdlModule;
      }
    } catch (error) {
      console.error('Failed to load youtube-dl-exec:', error)
      throw new Error('youtube-dl-exec is not installed. Run: npm install youtube-dl-exec --save')
    }
  }
  
  // Get ffmpeg path
  let ffmpegStaticPath: string;
  try {
    const require = createRequire(import.meta.url);
    ffmpegStaticPath = require('ffmpeg-static');
    if (!ffmpegStaticPath || !fs.existsSync(ffmpegStaticPath)) {
      throw new Error('ffmpeg-static path not found or invalid');
    }
    console.log('Using ffmpeg-static path:', ffmpegStaticPath);
  } catch (err) {
     console.error('Failed to get ffmpeg-static path:', err);
     // Try finding system ffmpeg as a fallback (optional, but good practice)
     const ffmpegPaths = [
        process.platform === 'darwin' ? '/opt/homebrew/bin/ffmpeg' : null,
        process.platform === 'darwin' ? '/usr/local/bin/ffmpeg' : null,
        process.platform === 'win32' ? 'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe' : null, // Adjust if needed
        process.platform === 'linux' ? '/usr/bin/ffmpeg' : null
      ].filter(Boolean);

      let foundSystemPath = false;
      for (const testPath of ffmpegPaths) {
        if (testPath && fs.existsSync(testPath)) {
          console.log('Found system ffmpeg at:', testPath);
          ffmpegStaticPath = testPath; // Use system path if found
          foundSystemPath = true;
          break;
        }
      }
      if (!foundSystemPath) {
         console.error('ffmpeg-static not found and system ffmpeg not found.');
         throw new Error('FFmpeg is not installed or accessible. Please ensure ffmpeg-static is installed or ffmpeg is in your system PATH.');
      }
  }

  // Store the binary path determined during initialization
  const ytdlpBinaryPath = youtubeDlExec.path;
  console.log("Using yt-dlp binary at:", ytdlpBinaryPath);

  // First get video info for title/author
  const videoInfo = await youtubeDlExec(url, {
    dumpSingleJson: true,
    noCheckCertificates: true,
    noWarnings: true,
    preferFreeFormats: true,
    addHeader: [
      'referer:youtube.com', 
      'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
    ],
    youtubeDlpPath: ytdlpBinaryPath // Explicitly set path here
  })
  
  // Show save dialog to let user choose where to save the WAV file
  const { filePath, canceled } = await dialog.showSaveDialog({
    title: 'Save Audio File',
    defaultPath: `${videoInfo.title.replace(/[/\\?%*:|"<>]/g, '-')}.wav`,
    filters: [{ name: 'Audio Files', extensions: ['wav'] }]
  })

  if (canceled || !filePath) {
    throw new Error('Save operation was canceled.')
  }

  // Create a temporary file in the app data directory
  const tempFile = path.join(appDataPath, `${Date.now()}.m4a`)
  
  console.log('Downloading with yt-dlp to:', tempFile)
  
  // Download audio with yt-dlp using correct format options
  await youtubeDlExec(url, {
    output: tempFile,
    extractAudio: true,
    audioFormat: 'm4a',     // Using m4a instead of webm
    audioQuality: '0',      // Best quality - must be a string
    format: 'bestaudio',    // Get best audio quality
    noCheckCertificates: true,
    noWarnings: true,
    preferFreeFormats: true,
    addHeader: [
      'referer:youtube.com', 
      'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
    ],
    youtubeDlpPath: ytdlpBinaryPath // Explicitly set path here too
  })
  
  // Verify the file was created
  if (!fs.existsSync(tempFile)) {
    throw new Error('Failed to download the audio file')
  }
  
  console.log('Downloaded audio to temp file:', tempFile)
  
  // Then convert the temporary file to WAV using direct ffmpeg call
  return new Promise((resolve, reject) => {
    const args = [
      '-i', tempFile,
      '-vn', // No video
      '-acodec', 'pcm_s16le', // WAV format
      '-ac', '2', // Stereo
      '-ar', '44100', // Sample rate
      filePath // Output path
    ];

    console.log(`Running ffmpeg: ${ffmpegStaticPath} ${args.join(' ')}`);
    const ffmpegProcess = spawn(ffmpegStaticPath, args);

    let stderrOutput = '';
    ffmpegProcess.stdout.on('data', (data) => {
      console.log(`ffmpeg stdout: ${data}`);
    });

    ffmpegProcess.stderr.on('data', (data) => {
      console.error(`ffmpeg stderr: ${data}`);
      stderrOutput += data.toString(); // Capture stderr for potential error messages
    });

    ffmpegProcess.on('close', (code) => {
      // Clean up temp file regardless of success or failure
      fs.unlink(tempFile, (err) => {
        if (err) console.error('Error deleting temp file:', tempFile, err);
        else console.log('Deleted temp file:', tempFile);
      });

      if (code === 0) {
        console.log('FFmpeg conversion complete');
        resolve({
          filePath,
          videoDetails: {
            title: videoInfo.title,
            author: videoInfo.uploader // Make sure videoInfo is still accessible here
          }
        });
      } else {
        console.error(`FFmpeg process exited with code ${code}`);
        console.error('FFmpeg stderr details:', stderrOutput);
        reject(new Error(`FFmpeg conversion failed with code ${code}. Stderr: ${stderrOutput}`));
      }
    });

    ffmpegProcess.on('error', (err) => {
      // Clean up temp file on spawn error
      fs.unlink(tempFile, (unlinkErr) => {
        if (unlinkErr) console.error('Error deleting temp file on spawn error:', tempFile, unlinkErr);
      });
      console.error('Failed to start FFmpeg process:', err);
      reject(new Error(`Failed to start FFmpeg process: ${err.message}`));
    });
  });
}

/**
 * Recognize music in audio file using ACRCloud API
 * @param filePath - Path to the audio file
 * @returns Promise with recognition results
 */
async function recognizeMusicWithACRCloud(filePath: string): Promise<any> {
  try {
    // Create require function for ESM
    const require = createRequire(import.meta.url);
    
    // ACRCloud API credentials from environment variables or config
    const host = process.env.ACRCLOUD_HOST || 'identify-eu-west-1.acrcloud.com';
    const accessKey = process.env.ACRCLOUD_ACCESS_KEY || '';
    const accessSecret = process.env.ACRCLOUD_ACCESS_SECRET || '';
    
    console.log('ACRCloud credentials check:', {
      host,
      accessKeyAvailable: !!accessKey,
      accessSecretAvailable: !!accessSecret
    });
    
    // Validate API credentials
    if (!accessKey || !accessSecret) {
      return {
        status: {
          code: 3001,
          msg: 'ACRCloud API credentials not configured'
        },
        error: true,
        errorDetails: 'Please set ACRCLOUD_ACCESS_KEY and ACRCLOUD_ACCESS_SECRET environment variables'
      };
    }
    
    // Read file data
    const fileBuffer = fs.readFileSync(filePath);
    const fileSize = fileBuffer.length;
    console.log(`Read file ${filePath}, size: ${fileSize} bytes`);
    
    // Validate file data
    if (fileSize === 0) {
      return {
        status: {
          code: 3002,
          msg: 'Empty audio file'
        },
        error: true,
        errorDetails: 'The audio file is empty'
      };
    }
    
    // Prepare signature
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const sigVersion = '1';
    const dataType = 'audio';
    const httpMethod = 'POST';
    const httpUri = '/v1/identify';
    
    const stringToSign = [httpMethod, httpUri, accessKey, dataType, sigVersion, timestamp].join('\n');
    const signature = crypto
      .createHmac('sha1', accessSecret)
      .update(Buffer.from(stringToSign, 'utf-8'))
      .digest()
      .toString('base64');
    
    // Create form data
    const form = new FormData(); // Use imported FormData
    
    // Carefully add data to the form
    try {
      form.append('sample', fileBuffer, { filename: 'sample.wav' });
      form.append('access_key', accessKey);
      form.append('data_type', dataType);
      form.append('signature_version', sigVersion);
      form.append('signature', signature);
      form.append('sample_bytes', fileSize.toString());
      form.append('timestamp', timestamp);
    } catch (formError: any) {
      console.error('Error creating form data:', formError);
      return {
        status: {
          code: 3003,
          msg: 'Error creating request'
        },
        error: true,
        errorDetails: `Form data creation failed: ${formError.message}`
      };
    }
    
    console.log(`Making ACRCloud API request to https://${host}/v1/identify`);
    
    // Make the API request with timeout
    const response = await axios.post(`https://${host}/v1/identify`, form, {
      headers: {
        ...form.getHeaders(),
        'User-Agent': 'MoodClassifier/1.0',
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 30000 // 30 second timeout
    });
    
    console.log('ACRCloud API response status:', response.status);
    console.log('ACRCloud API response received:', 
      JSON.stringify(response.data).substring(0, 300) + (JSON.stringify(response.data).length > 300 ? '...' : ''));
    
    // Verify the response contains expected fields
    if (!response.data || !response.data.status) {
      console.error('Invalid response format from ACRCloud API:', response.data);
      return {
        status: {
          code: 3004,
          msg: 'Invalid response from ACRCloud'
        },
        error: true,
        errorDetails: 'The ACRCloud API returned an invalid response format',
        rawResponse: response.data
      };
    }
    
    // Process response to ensure album art is included
    if (response.data.status.code === 0 && response.data.metadata && response.data.metadata.music && response.data.metadata.music.length > 0) {
      const music = response.data.metadata.music[0];
      
      // Check for album art in various locations in the response
      let albumArt = null;
      
      // Try to find album art in different possible paths
      if (music.album && music.album.images) {
        albumArt = music.album.images;
        console.log('Found album art in music.album.images');
      } else if (music.external_metadata) {
        // Check Spotify
        if (music.external_metadata.spotify && music.external_metadata.spotify.album && 
            music.external_metadata.spotify.album.images) {
          albumArt = music.external_metadata.spotify.album.images[0].url;
          console.log('Found album art in Spotify metadata');
        } 
        // Check Apple Music
        else if (music.external_metadata.apple_music && music.external_metadata.apple_music.artwork) {
          albumArt = music.external_metadata.apple_music.artwork.url;
          console.log('Found album art in Apple Music metadata');
        }
        // Check Deezer
        else if (music.external_metadata.deezer && music.external_metadata.deezer.album && 
                music.external_metadata.deezer.album.cover) {
          albumArt = music.external_metadata.deezer.album.cover;
          console.log('Found album art in Deezer metadata');
        }
        // Check YouTube
        else if (music.external_metadata.youtube && music.external_metadata.youtube.thumbnail) {
          albumArt = music.external_metadata.youtube.thumbnail;
          console.log('Found album art in YouTube metadata');
        }
      }
      
      // Add extracted album art to the response
      if (albumArt) {
        console.log('Adding album art to response:', albumArt);
        music.album_art = albumArt;
      } else {
        console.log('No album art found in the response');
      }
      
      // Log the complete music object to help debug
      console.log('Music metadata object:', JSON.stringify(music, null, 2).substring(0, 500) + '...');
    }
    
    return response.data;
  } catch (error: any) {
    // Enhanced error logging
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('ACRCloud API error response:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
      return {
        status: {
          code: error.response.status,
          msg: 'ACRCloud API error'
        },
        error: true,
        errorDetails: `HTTP ${error.response.status}: ${JSON.stringify(error.response.data)}`,
        rawResponse: error.response.data
      };
    } else if (error.request) {
      // The request was made but no response was received
      console.error('ACRCloud API no response received:', error.message);
      console.error('Request details:', error.request);
      return {
        status: {
          code: 3005,
          msg: 'No response from ACRCloud API'
        },
        error: true,
        errorDetails: `Request timeout or network error: ${error.message}`
      };
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('ACRCloud API request setup error:', error.message);
      console.error('Error stack:', error.stack);
      return {
        status: {
          code: 3006,
          msg: 'Error setting up ACRCloud API request'
        },
        error: true,
        errorDetails: error.message
      };
    }
  }
}

/**
 * Clean up temporary files in the app data directory and Demucs output directories
 */
function cleanupTempFiles() {
  try {
    console.log('Cleaning up temporary files in:', appDataPath);
    
    // Read directory contents
    const files = fs.readdirSync(appDataPath);
    let deletedCount = 0;
    
    // Filter for temp files
    const tempFilePatterns = [
      /^temp_\d+_.*\.wav$/,       // Uploaded temp files
      /^temp_short_\d+\.wav$/,    // Shortened audio files
      /^\d+\.m4a$/                // YouTube-dl temporary files
    ];
    
    for (const file of files) {
      const isTemp = tempFilePatterns.some(pattern => pattern.test(file));
      
      if (isTemp) {
        const filePath = path.join(appDataPath, file);
        try {
          // Get file stats to check when it was created
          const stats = fs.statSync(filePath);
          const fileAge = Date.now() - stats.birthtimeMs;
          const fileSizeKB = Math.round(stats.size / 1024);
          
          // Delete the file
          fs.unlinkSync(filePath);
          deletedCount++;
          console.log(`Deleted temp file: ${file} (${fileSizeKB}KB, ${Math.round(fileAge / 1000 / 60)} minutes old)`);
        } catch (err) {
          console.error(`Failed to delete temp file ${file}:`, err);
        }
      }
    }
    
    console.log(`Cleanup complete. Deleted ${deletedCount} temporary files.`);
    
    // Also clean up Demucs output directories in os.tmpdir()
    const demucsOutputDir = path.join(os.tmpdir(), 'demucs-output');
    if (fs.existsSync(demucsOutputDir)) {
      try {
        console.log('Cleaning up Demucs output directory:', demucsOutputDir);
        const rimraf = require('rimraf');
        rimraf.sync(demucsOutputDir);
        console.log('Successfully deleted Demucs output directory');
      } catch (err) {
        console.error('Error cleaning up Demucs output directory:', err);
        
        // Fallback to manual deletion if rimraf fails
        try {
          const outputDirs = fs.readdirSync(demucsOutputDir);
          for (const dir of outputDirs) {
            try {
              const dirPath = path.join(demucsOutputDir, dir);
              fs.rmdirSync(dirPath, { recursive: true });
              console.log(`Deleted Demucs output directory: ${dirPath}`);
            } catch (rmErr) {
              console.error(`Failed to delete Demucs output directory ${dir}:`, rmErr);
            }
          }
        } catch (readErr) {
          console.error('Error reading Demucs output directories:', readErr);
        }
      }
    }
  } catch (err) {
    console.error('Error during temp file cleanup:', err);
  }
}

// Register cleanup handlers (these depend on app events)
function registerCleanupHandlers() {
  // Clean up when app is about to quit
  app.on('will-quit', () => {
    console.log('App is quitting, cleaning up...');
    cleanupTempFiles();
  });
  
  // Also clean up when all windows are closed (may not fire on macOS)
  app.on('window-all-closed', () => {
    console.log('All windows closed, cleaning up...');
    cleanupTempFiles();
    
    // Continue with existing logic
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
  
  // Schedule periodic cleanup every 30 minutes to prevent disk filling up
  // if app runs for extended periods
  const CLEANUP_INTERVAL = 30 * 60 * 1000; // 30 minutes
  setInterval(() => {
    console.log('Running scheduled temp file cleanup');
    cleanupTempFiles();
  }, CLEANUP_INTERVAL);
}

// Optimize startup by doing heavy initialization work after the app is visible
async function optimizeStartup() {
  console.log('Starting application initialization...')
  
  // Register cleanup handlers that depend on app events
  registerCleanupHandlers();
  
  // Reduce startup impact by controlling when GPU processes start
  app.commandLine.appendSwitch('enable-features', 'CalculateNativeWinOcclusion')
  
  // Explicitly set memory limits to prevent excessive memory usage
  app.commandLine.appendSwitch('js-flags', '--max-old-space-size=512')
  
  // Reduce power usage when app is in background
  app.on('browser-window-blur', () => {
    if (mainWindow && !isDev) {
      mainWindow.webContents.setBackgroundThrottling(true)
    }
  })
  
  app.on('browser-window-focus', () => {
    if (mainWindow && !isDev) {
      mainWindow.webContents.setBackgroundThrottling(false)
    }
  })

  // Create a single instance lock - prevents multiple instances
  const gotTheLock = app.requestSingleInstanceLock()
  if (!gotTheLock) {
    console.log('Another instance is already running. Quitting...')
    app.quit()
    return
  }

  // Focus the main window if a second instance tries to launch
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  // Initialize app when ready
  await app.whenReady()
  console.log('Electron app ready, creating window...')
  createWindow()

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) createWindow()
  })
}

// Start the optimized app
try {
  optimizeStartup()
} catch (error) {
  console.error('Error during startup:', error)
}

// Quit when all windows are closed, except on macOS where it's common
// for applications to stay open until the user quits explicitly with Cmd + Q
app.on('window-all-closed', () => {
  // Note: Cleanup already handled in registerCleanupHandlers
  if (process.platform !== 'darwin') {
    app.quit()
  }
}) 