import { AnalysisResults, toggleUploadDisplayHTML, PlaybackControls } from './viz.js';
import { preprocess, shortenAudio } from './audioUtils.js';
import { createDynamicBackground, initializeBackground, updateBackground } from './backgroundEffect.mjs';
import { handleAlbumArtLoad } from './viz.js';  

const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();
const KEEP_PERCENTAGE = 0.15; // keep only 15% of audio file

let essentia = null;
let essentiaAnalysis;
let featureExtractionWorker = null;
let inferenceWorkers = {};
const modelNames = ['mood_happy' , 'mood_sad', 'mood_relaxed', 'mood_aggressive', 'danceability'];
let inferenceResultPromises = [];

const resultsViz = new AnalysisResults(modelNames);
let wavesurfer;
let controls;
let fileLoaded = false;

// Define worker creation functions first
function createInferenceWorkers() {
    modelNames.forEach((n) => { 
        inferenceWorkers[n] = new Worker('./src/inference.js');
        inferenceWorkers[n].postMessage({
            name: n
        });
        inferenceWorkers[n].onmessage = function listenToWorker(msg) {
            if (msg.data.predictions) {
                const preds = msg.data.predictions;
                inferenceResultPromises.push(new Promise((res) => {
                    res({ [n]: preds });
                }));
                collectPredictions();
                console.log(`${n} predictions: `, preds);
            }
        };
    });
}

function collectPredictions() {
    if (inferenceResultPromises.length == modelNames.length) {
        Promise.all(inferenceResultPromises).then((predictions) => {
            const allPredictions = {};
            Object.assign(allPredictions, ...predictions);
            resultsViz.updateMeters(allPredictions);
            resultsViz.updateValueBoxes(essentiaAnalysis);
            toggleLoader();
            controls.toggleEnabled(true)
            inferenceResultPromises = [];
        })
    }
}

function decodeFile(arrayBuffer) {
    audioCtx.resume().then(() => {
        audioCtx.decodeAudioData(arrayBuffer).then(async function handleDecodedAudio(audioBuffer) {
            console.info("Done decoding audio!");
            
            const prepocessedAudio = preprocess(audioBuffer);
            await audioCtx.suspend();

            if (essentia) {
                essentiaAnalysis = computeKeyBPM(prepocessedAudio);
            }

            // reduce amount of audio to analyse
            let audioData = shortenAudio(prepocessedAudio, KEEP_PERCENTAGE, true);

            // send for feature extraction
            createFeatureExtractionWorker();

            featureExtractionWorker.postMessage({
                audio: audioData.buffer
            }, [audioData.buffer]);
            audioData = null;
        }).catch(error => {
            console.error('Error decoding audio:', error);
            toggleLoader();
        });
    });
}

function computeKeyBPM(audioSignal) {
    let vectorSignal = essentia.arrayToVector(audioSignal);
    const keyData = essentia.KeyExtractor(vectorSignal, true, 4096, 4096, 12, 3500, 60, 25, 0.2, 'bgate', 16000, 0.0001, 440, 'cosine', 'hann');
    const bpm = essentia.PercivalBpmEstimator(vectorSignal, 1024, 2048, 128, 128, 210, 50, 16000).bpm;
    
    return {
        keyData: keyData,
        bpm: bpm
    };
}

function createFeatureExtractionWorker() {
    featureExtractionWorker = new Worker('./src/featureExtraction.js');
    featureExtractionWorker.onmessage = function listenToFeatureExtractionWorker(msg) {
        // feed to models
        if (msg.data.features) {
            modelNames.forEach((n) => {
                // send features off to each of the models
                inferenceWorkers[n].postMessage({
                    features: msg.data.features
                });
            });
            msg.data.features = null;
        }
        // free worker resource until next audio is uploaded
        featureExtractionWorker.terminate();
    };
}

// Then add the DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', () => {
    initializeBackground();
    createDynamicBackground();
    
    // Initialize Essentia and workers
    EssentiaWASM().then((wasmModule) => {
        essentia = new wasmModule.EssentiaJS(false);
        essentia.arrayToVector = wasmModule.arrayToVector;
    });
    createInferenceWorkers();

    // Add refresh button functionality
    const resetButton = document.getElementById('reset-app');
    if (resetButton) {
        resetButton.addEventListener('click', () => {
            if (fileLoaded) {
                const userChoice = confirm("Are you sure you want to reset? This will clear the current audio.");
                if (userChoice) {
                    location.reload();
                }
            } else {
                location.reload();
            }
        });
    }

    const downloadButton = document.getElementById('download-youtube-audio');
    if (downloadButton) {
        downloadButton.addEventListener('click', async () => {
            const url = document.getElementById('youtube-url').value.trim();
            if (!url) {
                alert('Please enter a YouTube URL.');
                return;
            }

            if (fileLoaded) {
                const userChoice = confirm("A file is already loaded. Would you like to refresh the page to load a new file?");
                if (userChoice) {
                    localStorage.setItem('youtubeURL', url);
                    location.reload();
                }
                return;
            }

            try {
                downloadButton.disabled = true;
                // Store original text content
                const originalText = downloadButton.textContent;
                // Create loading indicator element
                const loadingSpan = document.createElement('span');
                loadingSpan.className = 'loading-indicator';
                loadingSpan.style.opacity = '0.7';
                downloadButton.appendChild(loadingSpan);
                
                const result = await window.electronAPI.downloadYouTubeAudio(url);
                const fileBuffer = await window.electronAPI.readAudioFile(result.filePath);
                const fileBlob = new Blob([fileBuffer], { type: 'audio/wav' });
                const file = new File([fileBlob], `${result.videoDetails.title}.wav`, { type: 'audio/wav' });

                // Set song metadata from YouTube info
                window.currentSongMetadata = {
                    title: result.videoDetails.title,
                    artist: result.videoDetails.author
                };

                processFileUpload([file]);
            } catch (error) {
                console.error('Error processing YouTube download:', error);
                alert('Error processing YouTube download: ' + error.message);
            } finally {
                downloadButton.disabled = false;
                // Remove loading indicator if it exists
                const loadingIndicator = downloadButton.querySelector('.loading-indicator');
                if (loadingIndicator) {
                    loadingIndicator.remove();
                }
            }
        });
    }

    // Set up drop area event listeners
    setupDropArea();
});

function setupDropArea() {
    const dropInput = document.createElement('input');
    dropInput.setAttribute('type', 'file');
    dropInput.style.display = 'none';
    document.body.appendChild(dropInput);

    dropInput.addEventListener('change', () => {
        processFileUpload(dropInput.files);
    });

    const dropArea = document.querySelector('#file-drop-area');
    if (dropArea) {
        dropArea.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        dropArea.addEventListener('drop', (e) => {
            e.preventDefault();
            const files = e.dataTransfer.files;
            processFileUpload(files);
        });

        dropArea.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropInput.click();
        });
    }
}

function processFileUpload(files) {
    if (fileLoaded) {
        const userChoice = confirm("A file is already loaded. Would you like to refresh the page to load a new file?");
        if (userChoice) {
            location.reload();
        }
        return;
    }

    if (files.length > 1) {
        alert("Only single-file uploads are supported currently");
        throw Error("Multiple file upload attempted, cannot process.");
    } else if (files.length) {
        toggleLoader();
        const file = files[0];
        console.log('File type:', file.type);

        // Set song metadata from filename
        let filename = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
        
        // Clean up common video-related suffixes
        filename = filename
            .replace(/\s*\(Official\s*Video\)/i, '')
            .replace(/\s*\(Official\s*Music\s*Video\)/i, '')
            .replace(/\s*\(Official\s*Audio\)/i, '')
            .replace(/\s*\(Lyric\s*Video\)/i, '')
            .replace(/\s*\(Lyrics\)/i, '')
            .replace(/\s*\(Audio\)/i, '')
            .replace(/\s*\(Visualizer\)/i, '')
            .replace(/\s*\[Official\s*Video\]/i, '')
            .replace(/\s*\[Official\s*Music\s*Video\]/i, '')
            .replace(/\s*\[Official\s*Audio\]/i, '')
            .replace(/\s*\[Lyric\s*Video\]/i, '')
            .replace(/\s*\[Lyrics\]/i, '')
            .replace(/\s*\[Audio\]/i, '')
            .replace(/\s*\[Visualizer\]/i, '')
            .trim();
        
        // Try to extract artist and title from filename (assuming format: "Artist - Title")
        let title = filename;
        let artist = 'Unknown Artist';
        
        const separators = [' - ', ' – ', ' — ', ' -- '];
        for (const separator of separators) {
            if (filename.includes(separator)) {
                [artist, title] = filename.split(separator);
                break;
            }
        }
        
        window.currentSongMetadata = {
            title: title.trim(),
            artist: artist.trim()
        };

        file.arrayBuffer().then((ab) => {
            console.log('ArrayBuffer obtained');
            decodeFile(ab);
            wavesurfer = toggleUploadDisplayHTML('display');
            wavesurfer.loadBlob(file);
            controls = new PlaybackControls(wavesurfer);
            controls.toggleEnabled(false);
            fileLoaded = true;
        }).catch(error => {
            console.error('Error converting file to ArrayBuffer:', error);
            toggleLoader();
        });
    }
}

function toggleLoader() {
    const loader = document.querySelector('#loader');
    loader.classList.toggle('disabled');
    loader.classList.toggle('active');
}

async function fetchLyrics(artist, title) {
    try {
        // Clean up the search terms
        const cleanTitle = title.replace(/\([^)]*\)/g, '').trim();
        const cleanArtist = artist.replace(/\([^)]*\)/g, '').trim();
        
        // First try Musixmatch API
        const musixmatchApiKey = process.env.MUSIXMATCH_API_KEY || '465ee52acbadcdca8462b96c8a4efde5';
        
        // Search for the track
        const searchResponse = await axios.get(`https://api.musixmatch.com/ws/1.1/track.search`, {
            params: {
                q_track: cleanTitle,
                q_artist: cleanArtist,
                apikey: musixmatchApiKey,
                s_track_rating: 'desc'
            }
        });

        if (!searchResponse.data.message.body.track_list.length) {
            // Try with just the title
            const titleOnlyResponse = await axios.get(`https://api.musixmatch.com/ws/1.1/track.search`, {
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
        
        // Get the lyrics
        const lyricsResponse = await axios.get(`https://api.musixmatch.com/ws/1.1/track.lyrics.get`, {
            params: {
                track_id: track.track_id,
                apikey: musixmatchApiKey
            }
        });

        if (!lyricsResponse.data.message.body.lyrics) {
            throw new Error('No lyrics found');
        }

        const lyrics = lyricsResponse.data.message.body.lyrics.lyrics_body
            .split('\n')
            .filter(line => !line.includes('This Lyrics is NOT'))  // Remove the Musixmatch commercial
            .join('\n')
            .trim();

        // Get track details including album art
        const trackInfoResponse = await axios.get(`https://api.musixmatch.com/ws/1.1/track.get`, {
            params: {
                track_id: track.track_id,
                apikey: musixmatchApiKey
            }
        });

        // Return song information including the lyrics
        return {
            title: track.track_name,
            artist: track.artist_name,
            lyrics: lyrics,
            album_art: track.album_coverart_800x800 || track.album_coverart_500x500 || track.album_coverart_350x350 || track.album_coverart_100x100
        };

    } catch (error) {
        console.error('Error fetching lyrics:', error);
        throw error;
    }
}


