<script lang="ts">
  import { onMount } from 'svelte';

  interface FileWithPath extends File {
    filePath?: string;
  }

  export let currentFile: FileWithPath | null = null;
  export let processing = false;

  let musicRecognized = false;
  let musicInfo: any = null;
  let error: string | null = null;
  let albumArtUrl: string | null = null;

  // Handle image loading errors
  let albumArtLoadError = false;
  
  function handleImageError() {
    console.error('Failed to load album art:', albumArtUrl);
    tryNextAlbumArt();
  }
  
  function handleImageLoad() {
    console.log('Album art loaded successfully');
    albumArtLoadError = false;
  }

  // Watch for changes in currentFile and automatically recognize when a new file is set
  $: if (currentFile && !processing && !musicRecognized) {
    recognizeMusic();
  }

  async function recognizeMusic() {
    if (!currentFile) return;

    try {
      processing = true;
      musicRecognized = false;
      error = null;
      musicInfo = null;
      albumArtUrl = null;

      // If the file has a path, use it directly
      if (currentFile.filePath) {
        await processFile(currentFile.filePath);
      } else {
        // For files uploaded through browser, we need to save them temporarily
        try {
          // Convert File to ArrayBuffer
          const arrayBuffer = await currentFile.arrayBuffer();
          const buffer = new Uint8Array(arrayBuffer);
          
          // Use Electron IPC to save the file temporarily and get a path
          const tempFilePath = await window.api.invoke('save-temp-file', {
            buffer: Array.from(buffer),
            name: currentFile.name
          });
          
          // Now process the temporary file
          await processFile(tempFilePath);
        } catch (err) {
          console.error('Error handling browser file:', err);
          error = "Cannot process this file. Please try downloading from YouTube instead.";
          processing = false;
        }
      }
    } catch (err) {
      console.error('Error during music recognition:', err);
      error = err instanceof Error ? err.message : 'Unknown error during music recognition';
      processing = false;
    }
  }

  async function processFile(filePath: string) {
    try {
      // Use the IPC API to send the request to the main process
      const response = await window.api.invoke('recognize-music', filePath);
      
      console.log('Recognition response received:', response);
      
      if (response && response.status && response.status.code === 0 && 
          response.metadata && response.metadata.music && response.metadata.music.length > 0) {
        
        const music = response.metadata.music[0];
        
        // Store the full music object for reference and display
        musicInfo = {
          title: music.title || 'Unknown Title',
          // Extract all artists, not just the first one
          artists: music.artists ? music.artists.map((a: any) => a.name).join(', ') : 'Unknown Artist',
          // Store array of all artists for detailed view
          artistsList: music.artists || [],
          album: music.album ? music.album.name || 'Unknown Album' : 'Unknown Album',
          // Add additional metadata
          score: music.score,
          genres: music.genres ? music.genres.map((g: any) => g.name).join(', ') : null,
          releaseDate: music.release_date || null,
          // Store the full external metadata for reference
          externalMetadata: music.external_metadata || {},
          // Store the full raw music object
          raw: music
        };
        
        // Reset album art error state
        albumArtLoadError = false;
        
        // Create an array of possible album art URLs to try
        const possibleArtUrls = [];
        
        // Check for album_art from our enhanced backend response
        if (music.album_art) {
          console.log('Adding album_art from enhanced response:', music.album_art);
          possibleArtUrls.push(music.album_art);
        }
        
        // Add potential URLs from external metadata services
        if (music.external_metadata) {
          // Add Spotify URLs if available
          if (music.external_metadata.spotify && 
              music.external_metadata.spotify.album && 
              music.external_metadata.spotify.album.images && 
              music.external_metadata.spotify.album.images.length > 0) {
            
            // Add all available image sizes from largest to smallest
            music.external_metadata.spotify.album.images.forEach((img: any) => {
              possibleArtUrls.push(img.url);
            });
            console.log('Added Spotify album art URLs');
          }
          
          // Add Deezer URLs if available
          if (music.external_metadata.deezer && 
              music.external_metadata.deezer.album) {
            
            const deezerAlbum = music.external_metadata.deezer.album;
            
            // Add direct cover URLs if available
            if (deezerAlbum.cover_xl) possibleArtUrls.push(deezerAlbum.cover_xl);
            if (deezerAlbum.cover_big) possibleArtUrls.push(deezerAlbum.cover_big);
            if (deezerAlbum.cover) possibleArtUrls.push(deezerAlbum.cover);
            
            // Try alternative format with cover_small (md5 hash sometimes works better)
            if (deezerAlbum.cover_small) {
              // Extract the hash from cover_small URL
              const coverSmallUrl = deezerAlbum.cover_small;
              const hashMatch = coverSmallUrl.match(/\/([a-zA-Z0-9]+)\/cover\.jpg$/);
              if (hashMatch && hashMatch[1]) {
                const coverHash = hashMatch[1];
                possibleArtUrls.push(`https://e-cdns-images.dzcdn.net/images/cover/${coverHash}/500x500-000000-80-0-0.jpg`);
                console.log('Added Deezer album art URL with hash:', coverHash);
              }
            }
          }
          
          // Add YouTube thumbnail if available
          if (music.external_metadata.youtube && 
              music.external_metadata.youtube.thumbnail) {
            possibleArtUrls.push(music.external_metadata.youtube.thumbnail);
            console.log('Added YouTube thumbnail URL');
          }
        }
        
        // Try to fetch from iTunes as a fallback if we have no URLs yet
        if (possibleArtUrls.length === 0) {
          try {
            console.log('Attempting to fetch album art from iTunes');
            const query = encodeURIComponent(`${musicInfo.title} ${musicInfo.artists}`);
            const iTunesUrl = `https://itunes.apple.com/search?term=${query}&limit=1&entity=musicTrack`;
            
            const iTunesResponse = await fetch(iTunesUrl);
            const iTunesData = await iTunesResponse.json();
            
            if (iTunesData.results && iTunesData.results.length > 0) {
              possibleArtUrls.push(iTunesData.results[0].artworkUrl100.replace('100x100', '600x600'));
              console.log('Added iTunes album art URL');
            }
          } catch (fetchErr) {
            console.error('Error fetching iTunes album art:', fetchErr);
          }
        }
        
        // Store URLs for fallback
        musicInfo.albumArtUrls = possibleArtUrls;
        musicInfo.currentArtUrlIndex = 0;
        
        console.log('Album art URLs to try:', possibleArtUrls);
        
        // Use our proxy for the first image URL
        if (possibleArtUrls.length > 0) {
          await loadImageViaProxy(possibleArtUrls[0]);
        } else {
          albumArtUrl = null;
          albumArtLoadError = true;
        }
        
        musicRecognized = true;
      } else if (response && response.error) {
        // Handle structured error responses from our backend
        error = response.errorDetails || response.status?.msg || 'Recognition failed';
        console.error('Recognition error:', error);
      } else {
        error = 'No music was recognized in this audio file';
      }
    } catch (err) {
      console.error('Error processing file for music recognition:', err);
      error = err instanceof Error ? err.message : 'Unknown error during music recognition';
    } finally {
      processing = false;
    }
  }
  
  // Try the next album art URL when an image fails to load
  async function tryNextAlbumArt() {
    if (!musicInfo || !musicInfo.albumArtUrls || musicInfo.albumArtUrls.length <= 1) {
      albumArtLoadError = true;
      return;
    }
    
    musicInfo.currentArtUrlIndex = (musicInfo.currentArtUrlIndex + 1) % musicInfo.albumArtUrls.length;
    const originalUrl = musicInfo.albumArtUrls[musicInfo.currentArtUrlIndex];
    console.log(`Trying next album art URL (${musicInfo.currentArtUrlIndex + 1}/${musicInfo.albumArtUrls.length}):`, originalUrl);
    
    // Use our proxy to fetch the image
    await loadImageViaProxy(originalUrl);
  }
  
  async function loadImageViaProxy(url: string) {
    try {
      // Pass the image URL to our main process proxy
      const result = await window.api.invoke('fetch-image', url);
      
      if (result.error) {
        console.error('Error fetching image via proxy:', result.error);
        albumArtLoadError = true;
        return false;
      }
      
      // Use the data URL returned by our proxy
      albumArtUrl = result.url;
      console.log(`Image ${result.cached ? 'loaded from cache' : 'fetched and cached'}`);
      return true;
    } catch (err) {
      console.error('Error using image proxy:', err);
      albumArtLoadError = true;
      return false;
    }
  }
  
  // Apply proxy to the first image URL when we get results
  async function setupInitialAlbumArt() {
    if (musicInfo && musicInfo.albumArtUrls && musicInfo.albumArtUrls.length > 0) {
      const originalUrl = musicInfo.albumArtUrls[0];
      await loadImageViaProxy(originalUrl);
    }
  }
</script>

<div class="music-recognition-container w-full mb-6">
  {#if processing}
    <div class="processing-container bg-gray-800 bg-opacity-30 rounded-lg p-4 text-center">
      <div class="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white mb-2"></div>
      <p class="text-white">Identifying song...</p>
    </div>
  {:else if error}
    <div class="error-container bg-red-500 bg-opacity-20 border border-red-600 rounded-lg p-4">
      <p class="text-white text-center">{error}</p>
    </div>
  {:else if musicRecognized && musicInfo}
    <div class="song-info-container bg-gray-800 bg-opacity-30 rounded-lg p-4">
      <div class="flex">
        <!-- Album art section -->
        {#if albumArtUrl && !albumArtLoadError}
          <div class="album-art-container mr-4 relative">
            <img 
              src={albumArtUrl} 
              alt="Album Cover" 
              class="w-24 h-24 md:w-32 md:h-32 rounded-md object-cover" 
              on:error={handleImageError}
              on:load={handleImageLoad}
            />
            {#if musicInfo && musicInfo.albumArtUrls && musicInfo.albumArtUrls.length > 1 && musicInfo.currentArtUrlIndex > 0}
              <div class="absolute bottom-0 right-0 bg-black bg-opacity-70 text-white text-xs px-1 rounded-tl-md rounded-br-md">
                {musicInfo.currentArtUrlIndex + 1}/{musicInfo.albumArtUrls.length}
              </div>
            {/if}
          </div>
        {:else}
          <div class="album-art-placeholder mr-4 w-24 h-24 md:w-32 md:h-32 bg-gray-700 rounded-md flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
        {/if}
        
        <!-- Basic info section -->
        <div class="song-details flex-1 flex flex-col justify-start">
          <h3 class="text-white text-lg font-bold leading-tight">{musicInfo.title}</h3>
          <p class="text-gray-300 text-sm">{musicInfo.artists}</p>
          <p class="text-gray-400 text-xs mt-1">{musicInfo.album}</p>
        </div>
      </div>
      
      <!-- Extended metadata section -->
      <div class="additional-info mt-4 pt-3 border-t border-gray-700">
        <!-- Genre and release date in a row -->
        <div class="flex flex-wrap gap-2 mb-2">
          {#if musicInfo.genres}
            <div class="metadata-tag bg-gray-700 px-2 py-0.5 rounded text-xs text-gray-300">
              <span class="font-medium">Genre:</span> {musicInfo.genres}
            </div>
          {/if}
          
          {#if musicInfo.releaseDate}
            <div class="metadata-tag bg-gray-700 px-2 py-0.5 rounded text-xs text-gray-300">
              <span class="font-medium">Released:</span> {musicInfo.releaseDate}
            </div>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .album-art-container img {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }
  
  .external-link {
    transition: all 0.2s ease;
  }
  
  .metadata-tag, .artist-tag {
    transition: background-color 0.2s ease;
  }
  
  .metadata-tag:hover, .artist-tag:hover {
    background-color: rgba(75, 85, 99, 0.7);
  }
</style> 