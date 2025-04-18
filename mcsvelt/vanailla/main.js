require('dotenv').config();

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');
const axios = require('axios');
const https = require('https');
const ffmpeg = require('fluent-ffmpeg');

// Add these functions at the top level
function getAppDataPath() {
    const appName = 'MoodClassifier';
    switch (process.platform) {
        case "darwin": {
            return path.join(process.env.HOME, "Library", "Application Support", appName);
        }
        case "win32": {
            return path.join(process.env.APPDATA, appName);
        }
        case "linux": {
            return path.join(process.env.HOME, `.${appName}`);
        }
        default: {
            console.log("Unsupported platform!");
            process.exit(1);
        }
    }
}

// Configure ffmpeg path
let ffmpegPath;
try {
    if (app.isPackaged) {
        // For production: first try the bundled ffmpeg from extraResources
        const bundledPath = path.join(process.resourcesPath, 'ffmpeg', process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
        console.log('Checking bundled FFmpeg path:', bundledPath);
        
        if (fs.existsSync(bundledPath)) {
            console.log('Using bundled FFmpeg');
            ffmpegPath = bundledPath;
        } else {
            console.log('Bundled FFmpeg not found, trying ffmpeg-static');
            try {
                // Fallback to ffmpeg-static
                const ffmpegStatic = require('ffmpeg-static');
                if (ffmpegStatic) {
                    ffmpegPath = ffmpegStatic;
                    
                    // Handle asar case for packaged app
                    if (app.isPackaged && ffmpegPath && ffmpegPath.includes('app.asar')) {
                        ffmpegPath = ffmpegPath.replace('app.asar', 'app.asar.unpacked');
                        console.log('Modified ffmpeg-static path for asar:', ffmpegPath);
                    }
                } else {
                    console.log('ffmpeg-static returned null or undefined path');
                }
            } catch (staticError) {
                console.error('Error loading ffmpeg-static:', staticError);
            }
        }
    } else {
        // For development: use ffmpeg-static
        try {
            ffmpegPath = require('ffmpeg-static');
            console.log('Development FFmpeg path:', ffmpegPath);
        } catch (devError) {
            console.error('Error loading ffmpeg-static in development:', devError);
        }
    }
    
    console.log('Current platform:', process.platform);
    console.log('Initial FFmpeg path:', ffmpegPath);
    
    // Platform-specific fallbacks if ffmpeg-static fails
    if (!ffmpegPath || !fs.existsSync(ffmpegPath)) {
        console.log('FFmpeg not found at:', ffmpegPath);
        switch (process.platform) {
            case 'win32': // Windows first since we're targeting Windows
                // Check common Windows installation paths
                const windowsPaths = [
                    'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe', // This should be first as it's our install location
                    path.join(process.resourcesPath, 'ffmpeg', 'ffmpeg.exe'),
                    path.join(app.getAppPath(), 'ffmpeg', 'ffmpeg.exe'),
                    path.join(app.getPath('exe'), '..', 'ffmpeg', 'ffmpeg.exe'),
                    'C:\\Program Files (x86)\\ffmpeg\\bin\\ffmpeg.exe',
                    'C:\\ffmpeg\\bin\\ffmpeg.exe',
                    path.join(process.env.LOCALAPPDATA || '', 'ffmpeg', 'bin', 'ffmpeg.exe'),
                    path.join(process.env.APPDATA || '', 'ffmpeg', 'bin', 'ffmpeg.exe')
                ];
                
                for (const windowsPath of windowsPaths) {
                    console.log('Trying Windows FFmpeg path:', windowsPath);
                    if (fs.existsSync(windowsPath)) {
                        ffmpegPath = windowsPath;
                        console.log('Found FFmpeg at:', ffmpegPath);
                        break;
                    }
                }
                break;
            case 'darwin': // macOS
                const macPaths = [
                    '/opt/homebrew/bin/ffmpeg',
                    '/opt/homebrew/Cellar/ffmpeg/7.1_4/bin/ffmpeg',
                    '/usr/local/bin/ffmpeg'
                ];
                for (const macPath of macPaths) {
                    console.log('Trying macOS FFmpeg path:', macPath);
                    if (fs.existsSync(macPath)) {
                        ffmpegPath = macPath;
                        console.log('Found FFmpeg at:', ffmpegPath);
                        break;
                    }
                }
                break;
            case 'linux': // Linux
                const linuxPaths = [
                    '/usr/bin/ffmpeg',
                    '/usr/local/bin/ffmpeg'
                ];
                for (const path of linuxPaths) {
                    if (fs.existsSync(path)) {
                        ffmpegPath = path;
                        break;
                    }
                }
                break;
        }
    }
    
    // Final verification
    if (!fs.existsSync(ffmpegPath)) {
        throw new Error(`FFmpeg not found. Please install FFmpeg or verify its installation path. Tried path: ${ffmpegPath}`);
    }
    
    ffmpeg.setFfmpegPath(ffmpegPath);
    console.log('FFmpeg path set to:', ffmpegPath);
} catch (error) {
    console.error('Error setting up FFmpeg:', error);
    throw error;
}

// Defer requiring modules until they are needed
let youtubeDlExec;

// Create a custom axios instance with longer timeout and keep-alive
const axiosInstance = axios.create({
  timeout: 30000, // 30 seconds timeout
  httpsAgent: new https.Agent({ 
    keepAlive: true,
    rejectUnauthorized: false // Only if you're having SSL issues
  }),
  headers: {
    'Authorization': `Bearer ${process.env.GENIUS_ACCESS_TOKEN}`
  }
});

function createWindow() {
    const win = new BrowserWindow({
        width: 1068,
        height: 720,
        minWidth: 1068,
        minHeight: 720,
        icon: path.join(__dirname, 'icon', 'icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'js', 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false,
            nodeIntegration: false,
            webSecurity: true,
            devTools: !app.isPackaged // Disable DevTools in production
        }
    });

    win.loadFile(path.join(__dirname, 'moodclassifier', 'index.html'));
    
    // Disable menu in production
    if (app.isPackaged) {
        win.setMenu(null);
    }
    
    // Prevent new windows from being opened
    win.webContents.setWindowOpenHandler(({ url }) => {
        return { action: 'deny' };
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// Handle toggle-enabled request
ipcMain.handle('toggle-enabled', async (event, enabled) => {
    try {
        return { success: true, enabled };
    } catch (error) {
        console.error('Error toggling enabled state:', error);
        throw error;
    }
});

// Remove ytdl-core configuration section
const appDataPath = getAppDataPath();

// Update the download-youtube-audio handler to only use youtube-dl-exec
ipcMain.handle('download-youtube-audio', async (event, url) => {
    try {
        // Use youtube-dl-exec (yt-dlp) exclusively
        console.log('Downloading YouTube audio with yt-dlp...');
        return await downloadWithYtDlp(url);
    } catch (error) {
        console.error('Error downloading with yt-dlp:', error.message);
        throw new Error(`Failed to download YouTube audio: ${error.message}`);
    }
});

/**
 * Download YouTube audio using youtube-dl-exec (yt-dlp)
 * @param {string} url - YouTube URL
 * @returns {Promise<Object>} - File path and video details
 */
async function downloadWithYtDlp(url) {
    // Lazy load youtube-dl-exec
    if (!youtubeDlExec) {
        try {
            youtubeDlExec = require('youtube-dl-exec');
        } catch (error) {
            console.error('Failed to load youtube-dl-exec:', error.message);
            throw new Error('youtube-dl-exec is not installed. Run: npm install youtube-dl-exec --save');
        }
    }
    
    // First get video info for title/author
    const videoInfo = await youtubeDlExec(url, {
        dumpSingleJson: true,
        noCheckCertificates: true,
        noWarnings: true,
        preferFreeFormats: true,
        addHeader: [
            'referer:youtube.com', 
            'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
        ]
    });
    
    // Show save dialog to let user choose where to save the WAV file
    const { filePath, canceled } = await dialog.showSaveDialog({
        title: 'Save Audio File',
        defaultPath: `${videoInfo.title.replace(/[/\\?%*:|"<>]/g, '-')}.wav`,
        filters: [{ name: 'Audio Files', extensions: ['wav'] }]
    });

    if (canceled || !filePath) {
        throw new Error('Save operation was canceled.');
    }

    // Create a temporary file in the app data directory
    const tempFile = path.join(appDataPath, `${Date.now()}.m4a`);
    
    // Ensure the directory exists
    if (!fs.existsSync(appDataPath)) {
        fs.mkdirSync(appDataPath, { recursive: true });
    }
    
    console.log('Downloading with yt-dlp to:', tempFile);
    
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
        ]
    });
    
    // Verify the file was created
    if (!fs.existsSync(tempFile)) {
        // Try one more approach - direct download with simpler options
        console.log('File not found at expected path, trying direct download...');
        await youtubeDlExec(url, {
            output: tempFile,
            format: 'bestaudio', 
            noCheckCertificates: true,
            addHeader: [
                'referer:youtube.com', 
                'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
            ]
        });
        
        if (!fs.existsSync(tempFile)) {
            throw new Error('Failed to download the audio file');
        }
    }
    
    console.log('Downloaded audio to temp file:', tempFile);
    
    // Then convert the temporary file to WAV
    return new Promise((resolve, reject) => {
        ffmpeg(tempFile)
            .toFormat('wav')
            .audioCodec('pcm_s16le')
            .audioChannels(2)
            .audioFrequency(44100)
            .on('progress', (progress) => {
                console.log('FFmpeg processing progress:', progress.percent, '%');
            })
            .on('end', () => {
                console.log('FFmpeg conversion complete');
                // Clean up temp file
                fs.unlink(tempFile, (err) => {
                    if (err) console.error('Error deleting temp file:', err);
                });
                
                resolve({
                    filePath,
                    videoDetails: {
                        title: videoInfo.title,
                        author: videoInfo.uploader
                    }
                });
            })
            .on('error', (error) => {
                // Clean up temp file on error
                fs.unlink(tempFile, (err) => {
                    if (err) console.error('Error deleting temp file:', err);
                });
                
                console.error('FFmpeg error:', error);
                reject(error);
            })
            .save(filePath);
    });
}

// Asynchronous file reading using streams
ipcMain.handle('read-audio-file', async (event, filePath) => {
    try {
        // Handle the case where filePath is an object
        if (typeof filePath === 'object') {
            if (filePath.filePath) {
                filePath = filePath.filePath;
            } else {
                throw new Error('Invalid file path object provided');
            }
        }
        
        // Validate that we have a string path
        if (typeof filePath !== 'string') {
            throw new Error('Invalid file path provided');
        }

        const buffer = await fs.promises.readFile(filePath);
        return buffer;
    } catch (error) {
        console.error('Error reading audio file:', error);
        throw error;
    }
});