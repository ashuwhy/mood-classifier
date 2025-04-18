<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  
  export let currentFile: File | null;
  export let wavesurfer: any = null;
  
  let isPlaying = false;
  let isMuted = false;
  let volume = 0.5;
  let waveformElement: HTMLElement;
  
  onMount(async () => {
    if (!currentFile) return;
    
    // Dynamically import WaveSurfer to ensure it only loads in browser
    const WaveSurfer = (await import('wavesurfer.js')).default;
    
    wavesurfer = WaveSurfer.create({
      container: waveformElement,
      waveColor: 'rgba(255, 255, 255, 0.5)',
      progressColor: 'rgba(255, 255, 255, 0.8)',
      cursorColor: '#ffffff',
      barWidth: 2,
      barRadius: 2,
      cursorWidth: 1,
      height: 80,
      barGap: 1,
      responsive: true,
      normalize: true,
    });
    
    wavesurfer.on('ready', () => {
      wavesurfer.setVolume(volume);
    });
    
    wavesurfer.on('play', () => {
      isPlaying = true;
    });
    
    wavesurfer.on('pause', () => {
      isPlaying = false;
    });
    
    // Load the audio file
    if (currentFile) {
      wavesurfer.loadBlob(currentFile);
    }
  });
  
  onDestroy(() => {
    if (wavesurfer) {
      wavesurfer.destroy();
    }
  });
  
  function togglePlay() {
    if (wavesurfer) {
      wavesurfer.playPause();
    }
  }
  
  function skipBackward() {
    if (wavesurfer) {
      const currentTime = wavesurfer.getCurrentTime();
      wavesurfer.seekTo(Math.max(0, (currentTime - 10) / wavesurfer.getDuration()));
    }
  }
  
  function skipForward() {
    if (wavesurfer) {
      const currentTime = wavesurfer.getCurrentTime();
      wavesurfer.seekTo(Math.min(1, (currentTime + 10) / wavesurfer.getDuration()));
    }
  }
  
  function toggleMute() {
    if (wavesurfer) {
      isMuted = !isMuted;
      wavesurfer.setMuted(isMuted);
    }
  }
  
  function updateVolume() {
    if (wavesurfer) {
      wavesurfer.setVolume(volume);
      if (volume > 0 && isMuted) {
        isMuted = false;
        wavesurfer.setMuted(false);
      }
    }
  }
</script>

<div class="controls-panel w-full max-w-3xl mx-auto my-8">
  <!-- Waveform display -->
  <div class="waveform bg-gray-800 bg-opacity-30 rounded-lg p-4 mb-4" bind:this={waveformElement}></div>
  
  <!-- Playback controls -->
  <div class="playback-controls flex justify-center items-center gap-4">
    <button 
      on:click={skipBackward}
      class="btn-control rounded-full w-12 h-12 flex items-center justify-center bg-gray-800 bg-opacity-50 text-white hover:bg-opacity-70 transition-all"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
      </svg>
    </button>
    
    <button 
      on:click={togglePlay}
      class="btn-play rounded-full w-14 h-14 flex items-center justify-center bg-purple-600 text-white hover:bg-purple-700 transition-all"
    >
      {#if isPlaying}
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      {:else}
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      {/if}
    </button>
    
    <button 
      on:click={skipForward}
      class="btn-control rounded-full w-12 h-12 flex items-center justify-center bg-gray-800 bg-opacity-50 text-white hover:bg-opacity-70 transition-all"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
      </svg>
    </button>
    
    <button 
      on:click={toggleMute}
      class="btn-control rounded-full w-12 h-12 flex items-center justify-center bg-gray-800 bg-opacity-50 text-white hover:bg-opacity-70 transition-all"
    >
      {#if isMuted}
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clip-rule="evenodd" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
        </svg>
      {:else}
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        </svg>
      {/if}
    </button>
  </div>
  
  <!-- Volume slider -->
  <div class="volume-slider mt-4 flex items-center justify-center">
    <input 
      type="range" 
      min="0" 
      max="1" 
      step="0.01" 
      bind:value={volume} 
      on:input={updateVolume}
      class="w-48 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
    />
  </div>
</div> 