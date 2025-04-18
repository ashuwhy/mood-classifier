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

      // First, we need a file path to send to the main process
      // If the file was already saved (like from the YouTube downloader), use that path
      if (currentFile.filePath) {
        await processFile(currentFile.filePath);
      } else {
        // Otherwise, we need to save the file temporarily
        // This would need more implementation in a real app
        error = "Cannot analyze this file directly. Please use a file from disk.";
        processing = false;
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
      
      if (response && response.status && response.status.code === 0 && 
          response.metadata && response.metadata.music && response.metadata.music.length > 0) {
        
        const music = response.metadata.music[0];
        musicInfo = {
          title: music.title || 'Unknown Title',
          artist: music.artists ? music.artists[0]?.name || 'Unknown Artist' : 'Unknown Artist',
          album: music.album ? music.album.name || 'Unknown Album' : 'Unknown Album'
        };
        
        // Try to get album art from external services
        if (music.external_metadata) {
          // Try Spotify first
          if (music.external_metadata.spotify && 
              music.external_metadata.spotify.album && 
              music.external_metadata.spotify.album.id) {
            albumArtUrl = `https://i.scdn.co/image/${music.external_metadata.spotify.album.id}`;
          }
          // Then try other services if needed
          else if (music.external_metadata.deezer && 
                  music.external_metadata.deezer.album && 
                  music.external_metadata.deezer.album.id) {
            albumArtUrl = `https://e-cdns-images.dzcdn.net/images/cover/${music.external_metadata.deezer.album.id}/500x500-000000-80-0-0.jpg`;
          }
        }
        
        musicRecognized = true;
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
    <div class="song-info-container bg-gray-800 bg-opacity-30 rounded-lg p-4 flex">
      {#if albumArtUrl}
        <div class="album-art-container mr-4">
          <img src={albumArtUrl} alt="Album Cover" class="w-24 h-24 rounded-md object-cover" />
        </div>
      {:else}
        <div class="album-art-placeholder mr-4 w-24 h-24 bg-gray-700 rounded-md flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        </div>
      {/if}
      
      <div class="song-details flex-1 flex flex-col justify-center">
        <h3 class="text-white text-lg font-bold leading-tight">{musicInfo.title}</h3>
        <p class="text-gray-300 text-sm">{musicInfo.artist}</p>
        <!-- <p class="text-gray-400 text-xs mt-1">{musicInfo.album}</p> -->
      </div>
    </div>
  {/if}
</div>

<style>
  .album-art-container img {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }
</style> 