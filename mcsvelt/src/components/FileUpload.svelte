<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  let youtubeUrl = '';
  let downloading = false;
  let dragOver = false;
  
  async function handleYoutubeDownload() {
    if (!youtubeUrl.trim()) {
      alert('Please enter a YouTube URL.');
      return;
    }
    
    downloading = true;
    
    try {
      // Using Electron API to download YouTube audio
      const result = await window.api.invoke('download-youtube-audio', youtubeUrl);
      const fileBuffer = await window.api.invoke('read-audio-file', result.filePath);
      
      // Convert ArrayBuffer to File
      const fileBlob = new Blob([fileBuffer], { type: 'audio/wav' });
      const file = new File([fileBlob], `${result.videoDetails.title}.wav`, { type: 'audio/wav' });
      
      dispatch('fileUploaded', { 
        file,
        metadata: {
          title: result.videoDetails.title,
          artist: result.videoDetails.author
        }
      });
    } catch (error: unknown) {
      console.error('Error processing YouTube download:', error);
      
      // Safe error message extraction
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String(error.message);
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      alert('Error processing YouTube download: ' + errorMessage);
      downloading = false;
    }
  }
  
  function handleDrop(event: DragEvent) {
    event.preventDefault();
    dragOver = false;
    
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      if (event.dataTransfer.files.length > 1) {
        alert("Only single-file uploads are supported currently");
        return;
      }
      
      const file = event.dataTransfer.files[0];
      processFile(file);
    }
  }
  
  function handleFileInput(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      processFile(input.files[0]);
    }
  }
  
  function processFile(file: File) {
    // Extract metadata from filename
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
    
    // Try to extract artist and title
    let title = filename;
    let artist = 'Unknown Artist';
    
    const separators = [' - ', ' – ', ' — ', ' -- '];
    for (const separator of separators) {
      if (filename.includes(separator)) {
        [artist, title] = filename.split(separator);
        break;
      }
    }
    
    dispatch('fileUploaded', { 
      file,
      metadata: {
        title: title.trim(),
        artist: artist.trim()
      }
    });
  }
</script>

<div class="upload-container flex flex-col items-center justify-center w-full max-w-xl mx-auto">
  <!-- YouTube URL input -->
  <div class="youtube-input w-full mb-8">
    <div class="flex items-center bg-gray-800 bg-opacity-50 rounded-lg overflow-hidden">
      <input 
        type="text" 
        bind:value={youtubeUrl}
        placeholder="Enter YouTube URL" 
        class="flex-grow bg-transparent text-white px-4 py-3 focus:outline-none"
      />
      <button 
        on:click={handleYoutubeDownload} 
        disabled={downloading}
        class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {#if downloading}
          <span class="inline-block animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></span>
        {/if}
        Download
      </button>
    </div>
  </div>
  
  <!-- File drop area -->
  <div 
    class="drop-area w-full h-40 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer transition-all"
    class:border-purple-400={dragOver}
    class:border-gray-500={!dragOver}
    class:bg-purple-900={dragOver}
    class:bg-opacity-20={dragOver}
    on:click={() => document.getElementById('file-input')?.click()}
    on:dragover|preventDefault={() => dragOver = true}
    on:dragleave|preventDefault={() => dragOver = false}
    on:drop={handleDrop}
  >
    <span class="text-white text-lg">Drop audio file here or click to browse</span>
  </div>
  
  <input 
    id="file-input" 
    type="file" 
    accept="audio/*" 
    on:change={handleFileInput}
    class="hidden" 
  />
</div> 