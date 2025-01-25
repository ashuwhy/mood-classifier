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

// Configure ytdl-core base.js location
process.env.YTDL_NO_UPDATE = 'true';  // Disable auto-updates
if (!fs.existsSync(path.join(__dirname, 'js'))) {
    fs.mkdirSync(path.join(__dirname, 'js'), { recursive: true });
}
process.env.YTDL_CACHE_DIR = path.join(__dirname, 'js');

// Configure ffmpeg path
let ffmpegPath;
try {
    if (app.isPackaged) {
        // For production: use the unpacked ffmpeg from ffmpeg-static
        const ffmpegStatic = require('ffmpeg-static');
        ffmpegPath = ffmpegStatic.replace(
            'app.asar',
            'app.asar.unpacked'
        );
        
        // Fallback to system ffmpeg if the static version isn't found
        if (!fs.existsSync(ffmpegPath)) {
            ffmpegPath = '/opt/homebrew/bin/ffmpeg';
        }
    } else {
        // For development: try ffmpeg-static first, then system ffmpeg
        try {
            ffmpegPath = require('ffmpeg-static');
        } catch (err) {
            ffmpegPath = '/opt/homebrew/bin/ffmpeg';
        }
    }
    
    // Verify the path exists
    if (!fs.existsSync(ffmpegPath)) {
        throw new Error(`FFmpeg path does not exist: ${ffmpegPath}`);
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
            webSecurity: true
        }
    });

    win.loadFile(path.join(__dirname, 'moodclassifier', 'index.html'));
    
    /*
    // Add resize event listener
    win.on('resize', () => {
        const [width, height] = win.getSize();
        console.log(`Window size: ${width}x${height}`);
    });
    */
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

// Handle YouTube download request
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

        // Create a temporary file for the downloaded audio
        const tempFile = path.join(app.getPath('temp'), `${Date.now()}.webm`);
        
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