import { createDynamicBackground, initializeBackground, updateBackground } from './backgroundEffect.mjs';

class AnalysisResults {
    constructor(classifierNames) {
        this.analysisMeters = {};
        this.bpmBox = document.querySelector('#bpm-value');
        this.keyBox = document.querySelector('#key-value');
        if (classifierNames instanceof Array) {
            this.names = classifierNames;
            classifierNames.forEach((n) => {
                this.analysisMeters[n] = document.querySelector(`#${n} > .classifier-meter`);
            });
        } else {
            throw TypeError("List of classifier names provided is not of type Array");
        }
    }

    updateMeters(values) {
        this.names.forEach((n) => {
            this.analysisMeters[n].style.setProperty('--meter-width', values[n]*100);
        });
    }

    updateValueBoxes(essentiaAnalysis) {
        const stringBpm = essentiaAnalysis.bpm.toString();
        const formattedBpm = stringBpm.slice(0, stringBpm.indexOf('.') + 2); // keep 1 decimal places only
        this.bpmBox.textContent = formattedBpm;
        this.keyBox.textContent = `${essentiaAnalysis.keyData.key} ${essentiaAnalysis.keyData.scale}`;
    }
}

function toggleUploadDisplayHTML(mode) {
    switch (mode) {
        case 'display':
            const fileDropArea = document.querySelector('#file-drop-area');
            const fileSelectArea = document.querySelector('#file-select-area');
            if (fileDropArea) {
                fileDropArea.remove();
            }
            const waveformDiv = document.createElement('div');
            waveformDiv.setAttribute('id', 'waveform');

            const controlsTemplate = document.querySelector('#playback-controls');

            fileSelectArea.appendChild(waveformDiv);
            fileSelectArea.appendChild(controlsTemplate.content.cloneNode(true));

            return WaveSurfer.create({
                container: '#waveform',
                progressColor: '#3a3a3a',
                waveColor: '#fff2f2'
            });
        
        case 'upload':
            // remove #waveform
            // insert file-drop-area into file-select-area
    
        default:
            break;
    }
}

class PlaybackControls {
    constructor(wavesurferInstance) {
        this.wavesurfer = wavesurferInstance;
        this.initializeControls();
    }

    initializeControls() {
        // Wait for controls to be available in the DOM
        setTimeout(() => {
            this.controls = {
                backward: document.querySelector('#backward'),
                play: document.querySelector('#play'),
                forward: document.querySelector('#forward'),
                mute: document.querySelector('#mute'),
                volumeSlider: document.querySelector('#volume-slider'),
                lyricsButton: document.querySelector('#lyrics-button')
            };

            if (this.controls.volumeSlider) {
                // Set initial volume to 30%
                const defaultVolume = 0.3;
                this.wavesurfer.setVolume(defaultVolume);
                this.controls.volumeSlider.value = defaultVolume;
                this.controls.volumeSlider.style.setProperty('--volume-percentage', '30%');
            }

            this.setupEventListeners();
        }, 100); // Small delay to ensure DOM elements are available
    }

    setupEventListeners() {
        if (!this.controls) return;

        if (this.controls.backward) {
            this.controls.backward.onclick = () => {
                const currentTime = this.wavesurfer.getCurrentTime();
                const newTime = Math.max(currentTime - 5, 0);
                this.wavesurfer.seekTo(newTime / this.wavesurfer.getDuration());
            };
        }

        if (this.controls.play) {
            this.controls.play.onclick = () => {
                this.wavesurfer.playPause();
                this.updatePlayButtonIcon();
            };

            // Update play button on wavesurfer events
            this.wavesurfer.on('play', () => this.updatePlayButtonIcon());
            this.wavesurfer.on('pause', () => this.updatePlayButtonIcon());
        }

        if (this.controls.forward) {
            this.controls.forward.onclick = () => {
                const currentTime = this.wavesurfer.getCurrentTime();
                const duration = this.wavesurfer.getDuration();
                const newTime = Math.min(currentTime + 5, duration);
                this.wavesurfer.seekTo(newTime / duration);
            };
        }

        if (this.controls.mute) {
            this.controls.mute.onclick = () => {
                this.wavesurfer.toggleMute();
                this.updateMuteButtonIcon();
            };
        }

        if (this.controls.volumeSlider) {
            this.controls.volumeSlider.oninput = (e) => {
                const volume = parseFloat(e.target.value);
                this.wavesurfer.setVolume(volume);
                this.updateVolumeSlider(volume);
                this.updateMuteButtonIcon();
            };
        }

        if (this.controls.lyricsButton) {
            this.controls.lyricsButton.addEventListener('click', () => this.showLyrics());
        }
    }

    toggleEnabled(isEnabled) {
        if (!this.controls) return;
        
        Object.values(this.controls).forEach(control => {
            if (control) {
                if (isEnabled) {
                    control.removeAttribute('disabled');
                } else {
                    control.setAttribute('disabled', '');
                }
            }
        });
    }

    updatePlayButtonIcon() {
        if (!this.controls.play) return;
        const isPlaying = this.wavesurfer.isPlaying();
        const icon = this.controls.play.querySelector('.material-icons-round');
        icon.textContent = isPlaying ? 'pause' : 'play_arrow';
    }

    updateMuteButtonIcon() {
        if (!this.controls.mute) return;
        const isMuted = this.wavesurfer.getVolume() === 0;
        const icon = this.controls.mute.querySelector('.material-icons-round');
        icon.textContent = isMuted ? 'volume_off' : 'volume_up';
    }

    updateVolumeSlider(volume) {
        if (!this.controls.volumeSlider) return;
        const percentage = (volume * 100).toFixed(0) + '%';
        this.controls.volumeSlider.style.setProperty('--volume-percentage', percentage);
    }

    async showLyrics() {
        if (!window.currentSongMetadata) {
            console.error('No song metadata available');
            return;
        }

        const overlay = document.querySelector('.lyrics-overlay');
        const songTitle = overlay.querySelector('.song-title');
        const songArtist = overlay.querySelector('.song-artist');
        const lyricsContent = overlay.querySelector('.lyrics-content');

        try {
            // Show loading state
            overlay.style.display = 'flex';
            overlay.style.opacity = '1';
            overlay.style.pointerEvents = 'auto';
            songTitle.textContent = window.currentSongMetadata.title;
            songArtist.textContent = window.currentSongMetadata.artist;
            lyricsContent.innerHTML = '<div class="lyrics-line loading">Loading lyrics...</div>';

            // Fetch song info
            const songInfo = await window.electronAPI.getLyrics({
                artist: window.currentSongMetadata.artist,
                title: window.currentSongMetadata.title
            });

            if (songInfo && songInfo.lyrics) {
                // Update metadata with more accurate info
                songTitle.textContent = songInfo.title;
                songArtist.textContent = songInfo.artist;

                // Format and display lyrics
                const formattedLyrics = songInfo.lyrics
                    .split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 0 && !line.includes('*'))  // Remove empty lines and Musixmatch footer
                    .map(line => {
                        // Check if line is a section header (e.g., [Verse], [Chorus])
                        if (line.match(/^\[(.*?)\]$/)) {
                            return `<div class="lyrics-line section-header">${line}</div>`;
                        }
                        return `<div class="lyrics-line">${line}</div>`;
                    })
                    .join('');

                lyricsContent.innerHTML = formattedLyrics;

                // Update album art if available
                if (songInfo.album_art) {
                    handleAlbumArtLoad(songInfo.album_art);
                }

                // Add click handler to close overlay
                const closeHandler = (e) => {
                    if (e.target === overlay) {
                        overlay.style.display = 'none';
                        overlay.style.opacity = '0';
                        overlay.style.pointerEvents = 'none';
                        overlay.removeEventListener('click', closeHandler);
                    }
                };
                overlay.addEventListener('click', closeHandler);

                // Add keyboard handler to close overlay with Escape key
                const keyHandler = (e) => {
                    if (e.key === 'Escape') {
                        overlay.style.display = 'none';
                        overlay.style.opacity = '0';
                        overlay.style.pointerEvents = 'none';
                        document.removeEventListener('keydown', keyHandler);
                    }
                };
                document.addEventListener('keydown', keyHandler);
            } else {
                lyricsContent.innerHTML = '<div class="lyrics-line">No lyrics found</div>';
            }
        } catch (error) {
            console.error('Error fetching lyrics:', error);
            lyricsContent.innerHTML = '<div class="lyrics-line">Error loading lyrics</div>';
        }
    }
}

async function fetchAlbumArt(songTitle, artistName) {
    const query = encodeURIComponent(`${songTitle} ${artistName}`);
    const url = `https://itunes.apple.com/search?term=${query}&limit=1&entity=musicTrack`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.results.length > 0) {
            return data.results[0].artworkUrl100.replace('100x100', '600x600');
        }
    } catch (error) {
        console.error('Error fetching album art:', error);
    }
    return null;
}

export function handleAlbumArtLoad(albumArtUrl) {
    if (!albumArtUrl) return;
    
    const img = new Image();
    img.crossOrigin = "Anonymous";
    
    img.onload = function() {
        try {
            // ColorThief is available globally from the script tag
            const colorThief = new ColorThief();
            const palette = colorThief.getPalette(img, 8);
            const colors = palette.map(color => `rgb(${color[0]}, ${color[1]}, ${color[2]})`);
            
            console.log('Extracted colors:', colors); // Debug log
            
            // Create the color grid first
            const colorGrid = document.querySelector('.lyrics-color-grid');
            if (colorGrid) {
                colorGrid.innerHTML = '';
                
                // Create 40 cells (8x5 grid) instead of 64
                for (let i = 0; i < 40; i++) {
                    const cell = document.createElement('div');
                    cell.className = 'color-cell';
                    
                    const colorIndex = i % colors.length;
                    const color = colors[colorIndex];
                    
                    const variation = Math.random() * 20 - 10;
                    const [r, g, b] = color.match(/\d+/g).map(Number);
                    const newR = Math.min(255, Math.max(0, r + variation));
                    const newG = Math.min(255, Math.max(0, g + variation));
                    const newB = Math.min(255, Math.max(0, b + variation));
                    
                    cell.style.backgroundColor = `rgb(${newR}, ${newG}, ${newB})`;
                    cell.style.animationDelay = `${(i * 0.08)}s`; // Slightly faster delay between cells
                    colorGrid.appendChild(cell);
                }
            }
            
            // Then update the background
            updateBackground(colors);
        } catch (error) {
            console.error('Error extracting colors:', error);
        }
    };
    
    img.onerror = function() {
        console.error('Error loading image:', albumArtUrl);
    };
    
    img.src = albumArtUrl;
}

function updateColors(albumArtUrl) {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    
    img.onload = function() {
        const colorThief = new ColorThief();
        try {
            // Get the color palette
            const palette = colorThief.getPalette(img, 5);
            const dominantColor = colorThief.getColor(img);
            
            // Apply colors to lyrics overlay
            const overlay = document.querySelector('.lyrics-overlay');
            if (overlay) {
                const [r, g, b] = dominantColor;
                const [r2, g2, b2] = palette[1] || dominantColor;
                
                overlay.style.background = `linear-gradient(to bottom, 
                    rgba(${r}, ${g}, ${b}, 0.95),
                    rgba(${r2}, ${g2}, ${b2}, 0.85))`;
                
                // Add blur effect
                overlay.style.backdropFilter = 'blur(30px)';
                overlay.style.WebkitBackdropFilter = 'blur(30px)';
            }
            
            // Update lyrics text color based on brightness
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            const textColor = brightness > 128 ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)';
            
            document.querySelectorAll('.lyrics-line').forEach(line => {
                line.style.color = textColor;
            });
            
        } catch (error) {
            console.error('Error extracting colors:', error);
        }
    };
    
    img.onerror = function() {
        console.error('Error loading image:', albumArtUrl);
    };
    
    img.src = albumArtUrl;
}

export { AnalysisResults, toggleUploadDisplayHTML, PlaybackControls };