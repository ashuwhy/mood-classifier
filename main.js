require('dotenv').config();

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');
const { Client } = require('genius-lyrics');
const genius = new Client(process.env.GENIUS_ACCESS_TOKEN);
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
let ytdl;

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

// Modify the ytdl-core configuration section
// Replace the existing ytdl configuration with:
const appDataPath = getAppDataPath();
const ytdlCachePath = path.join(appDataPath, 'ytdl-cache');

// Configure ytdl-core base.js location
process.env.YTDL_NO_UPDATE = 'true';  // Disable auto-updates
if (!fs.existsSync(ytdlCachePath)) {
    fs.mkdirSync(ytdlCachePath, { recursive: true });
}
process.env.YTDL_CACHE_DIR = ytdlCachePath;

// Update the download-youtube-audio handler
ipcMain.handle('download-youtube-audio', async (event, url) => {
    if (!ytdl) ytdl = require('@distube/ytdl-core');
    
    try {
        const info = await ytdl.getInfo(url);
        const audioFormat = ytdl.chooseFormat(info.formats, { 
            quality: 'highestaudio',
            filter: 'audioonly'
        });

        // Show save dialog to let user choose where to save the WAV file
        const { filePath, canceled } = await dialog.showSaveDialog({
            title: 'Save Audio File',
            defaultPath: `${info.videoDetails.title.replace(/[/\\?%*:|"<>]/g, '-')}.wav`,
            filters: [{ name: 'Audio Files', extensions: ['wav'] }]
        });

        if (canceled || !filePath) {
            throw new Error('Save operation was canceled.');
        }

        // Create a temporary file in the app data directory
        const tempFile = path.join(appDataPath, `${Date.now()}.webm`);
        
        // Ensure the directory exists
        if (!fs.existsSync(appDataPath)) {
            fs.mkdirSync(appDataPath, { recursive: true });
        }
        
        // First download the audio to a temporary file
        await new Promise((resolve, reject) => {
            const audioStream = ytdl.downloadFromInfo(info, { format: audioFormat });
            const writeStream = fs.createWriteStream(tempFile);
            
            audioStream.pipe(writeStream);
            
            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
            audioStream.on('error', reject);
        });

        // Then convert the temporary file to WAV
        return new Promise((resolve, reject) => {
            ffmpeg(tempFile)
                .toFormat('wav')
                .audioCodec('pcm_s16le')
                .audioChannels(2)
                .audioFrequency(44100)
                .on('end', () => {
                    // Clean up temp file
                    fs.unlink(tempFile, (err) => {
                        if (err) console.error('Error deleting temp file:', err);
                    });
                    
                    resolve({
                        filePath,
                        videoDetails: {
                            title: info.videoDetails.title,
                            author: info.videoDetails.author.name
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

    } catch (error) {
        console.error('Error downloading audio:', error);
        throw error;
    }
});

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

// Handle lyrics request
ipcMain.handle('get-lyrics', async (event, { artist, title }) => {
    try {
        if (!artist || !title) {
            throw new Error('Artist and title are required');
        }

        // Clean up the search terms
        const cleanTitle = title.replace(/\([^)]*\)/g, '').trim();
        const cleanArtist = artist.replace(/\([^)]*\)/g, '').trim();
        
        // Use Musixmatch API
        const musixmatchApiKey = process.env.MUSIXMATCH_API_KEY || '2d782bc7a52a41ba2fc1ef05b9cf40d7';
        
        console.log('Searching for lyrics:', { cleanTitle, cleanArtist });
        
        // Search for the track
        const searchResponse = await axios.get('https://api.musixmatch.com/ws/1.1/track.search', {
            params: {
                q_track: cleanTitle,
                q_artist: cleanArtist,
                apikey: musixmatchApiKey,
                s_track_rating: 'desc'
            }
        });

        console.log('Search response:', searchResponse.data);

        if (!searchResponse.data.message.body.track_list.length) {
            // Try with just the title
            console.log('No results with artist, trying title only:', cleanTitle);
            const titleOnlyResponse = await axios.get('https://api.musixmatch.com/ws/1.1/track.search', {
                params: {
                    q_track: cleanTitle,
                    apikey: musixmatchApiKey,
                    s_track_rating: 'desc'
                }
            });
            
            if (!titleOnlyResponse.data.message.body.track_list.length) {
                throw new Error('No lyrics found');
            }
            
            searchResponse.data = titleOnlyResponse.data;
        }

        const track = searchResponse.data.message.body.track_list[0].track;
        console.log('Found track:', track.track_name);
        
        // Get the lyrics
        const lyricsResponse = await axios.get('https://api.musixmatch.com/ws/1.1/track.lyrics.get', {
            params: {
                track_id: track.track_id,
                apikey: musixmatchApiKey
            }
        });

        console.log('Got lyrics response');

        if (!lyricsResponse.data.message.body.lyrics) {
            throw new Error('No lyrics found');
        }

        const lyrics = lyricsResponse.data.message.body.lyrics.lyrics_body
            .split('\n')
            .filter(line => !line.includes('This Lyrics is NOT'))  // Remove the Musixmatch commercial
            .join('\n')
            .trim();

        console.log('Lyrics processed');

        // Return song information including the lyrics
        return {
            title: track.track_name,
            artist: track.artist_name,
            lyrics: lyrics,
            album_art: track.album_coverart_800x800 || track.album_coverart_500x500 || track.album_coverart_350x350 || track.album_coverart_100x100
        };

    } catch (error) {
        console.error('Error in get-lyrics handler:', error);
        throw error;
    }
});