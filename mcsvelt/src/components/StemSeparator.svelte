<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  // Define a type for Files that includes the Electron path property
  interface ElectronFile extends File {
    path: string;
  }

  // Use the built-in File type if no custom type exists
  // import type { File } from '../types'; 
  export let currentFile: ElectronFile | null;

  let separating = false;
  let separationProgress = 0; // Track progress
  let separationError: string | null = null;
  let stemDirectory: string | null = null;
  let stems: string[] = []; // To hold names like 'vocals.wav', 'drums.wav' etc.
  let demucsInstalled = false;
  let checkingDemucs = true;
  let separationStartTime = 0;
  let separationElapsedTime = 0;
  let separationTimer: number | null = null;
  let progressChannel: string | null = null;
  let progressUnsubscribe: (() => void) | null = null;
  let draggingStem: string | null = null;
  let currentSeparationId: string | null = null; // Track current separation ID

  // Define expected stem names (Demucs outputs WAV by default)
  const expectedStems = ['bass.wav', 'drums.wav', 'other.wav', 'vocals.wav'];
  
  // For audio playback
  let audioElement: HTMLAudioElement | null = null;
  let currentPlayingStem: string | null = null;

  // Check if Demucs is installed when component mounts
  onMount(async () => {
    if ((window as any).demucsAPI) {
      try {
        checkingDemucs = true;
        demucsInstalled = await (window as any).demucsAPI.checkInstalled();
        console.log('Demucs installed:', demucsInstalled);
      } catch (error) {
        console.error('Error checking Demucs installation:', error);
        demucsInstalled = false;
      } finally {
        checkingDemucs = false;
      }
    } else {
      checkingDemucs = false;
      console.error('demucsAPI is not available');
    }

    // Set up beforeunload handler to cancel any ongoing separation
    window.addEventListener('beforeunload', cancelSeparationOnExit);

    // Enable cancellation on navigation
    if ((window as any).demucsAPI && (window as any).demucsAPI.registerCancelCallback) {
      (window as any).demucsAPI.registerCancelCallback(() => {
        if (separating && currentSeparationId) {
          cancelSeparation();
        }
      });
    }
  });

  function startSeparationTimer() {
    separationStartTime = Date.now();
    separationElapsedTime = 0;
    
    if (separationTimer) {
      clearInterval(separationTimer);
    }
    
    separationTimer = setInterval(() => {
      separationElapsedTime = Math.floor((Date.now() - separationStartTime) / 1000);
    }, 1000) as unknown as number;
  }
  
  function stopSeparationTimer() {
    if (separationTimer) {
      clearInterval(separationTimer);
      separationTimer = null;
    }
  }

  // Clean up the progress listener
  function cleanupProgressListener() {
    if (progressUnsubscribe) {
      progressUnsubscribe();
      progressUnsubscribe = null;
    }
    progressChannel = null;
  }

  // Function to handle cancellation before app exits
  function cancelSeparationOnExit(event: BeforeUnloadEvent) {
    if (separating && currentSeparationId) {
      console.log('App exiting, cancelling stem separation process');
      cancelSeparation();
    }
  }

  // Function to cancel ongoing separation
  function cancelSeparation() {
    if (!currentSeparationId) return;
    
    console.log('Cancelling stem separation:', currentSeparationId);
    
    if ((window as any).demucsAPI && (window as any).demucsAPI.cancelSeparation) {
      (window as any).demucsAPI.cancelSeparation(currentSeparationId)
        .then(() => {
          console.log('Separation cancelled successfully');
        })
        .catch((err: any) => {
          console.error('Error cancelling separation:', err);
        })
        .finally(() => {
          resetSeparationState();
        });
    } else {
      console.error('cancelSeparation method not available');
      resetSeparationState();
    }
  }

  // Reset separation state
  function resetSeparationState() {
    separating = false;
    separationProgress = 0;
    cleanupProgressListener();
    stopSeparationTimer();
    currentSeparationId = null;
  }

  async function separateStems() {
    if (!currentFile) {
      separationError = 'Cannot separate stems: No file selected.';
      return;
    }
    
    if (!(window as any).demucsAPI) {
      separationError = 'Cannot separate stems: Demucs API is not available.';
      return;
    }

    if (!demucsInstalled) {
      separationError = 'Demucs is not installed. Please install it globally using "pip install demucs".';
      return;
    }

    separating = true;
    separationError = null;
    stemDirectory = null;
    stems = [];
    separationProgress = 0;
    cleanupProgressListener();
    startSeparationTimer();
    
    try {
      console.log('Starting stem separation for file:', currentFile.name);
      // Use the absolute path of the file for the main process
      const result = await (window as any).demucsAPI.separate(currentFile.path);
      
      console.log('Separation result:', result);
      
      // The result now includes the stemDirectory and progressChannel
      stemDirectory = result.stemDirectory;
      progressChannel = result.progressChannel;
      
      console.log('Setting up progress listener on channel:', progressChannel);
      
      // Set up the progress listener
      if (progressChannel && (window as any).demucsAPI.onProgress) {
        progressUnsubscribe = (window as any).demucsAPI.onProgress(
          progressChannel, 
          (progress: number) => {
            console.log('Progress update:', progress);
            separationProgress = progress;
          }
        );
      }
      
      // If we got a directory back, then the stems should be there
      if (stemDirectory) {
        console.log('Separation complete, stem directory:', stemDirectory);
        stems = expectedStems;
      } else {
        throw new Error('No stem directory returned from separation process');
      }
    } catch (err: any) {
      console.error('Stem separation error:', err);
      separationError = err.message || 'Failed to separate stems.';
      stemDirectory = null;
    } finally {
      cleanupProgressListener();
      stopSeparationTimer();
      separating = false;
    }
  }
  
  function playStem(stemName: string) {
    if (!stemDirectory) return;
    
    if (audioElement) {
      audioElement.pause();
      audioElement = null;
    }
    
    currentPlayingStem = stemName;
    
    // Create the full path
    const fullPath = `${stemDirectory}/${stemName}`;
    console.log('Playing stem:', fullPath);
    
    // Use an audio element
    audioElement = new Audio();
    
    // First try to load with file:// protocol
    audioElement.src = `file://${fullPath}`;
    
    // Add error handler to try alternative methods if default fails
    audioElement.onerror = async () => {
      console.error('Error playing stem with file:// protocol');
      
      // Try using electron API to read the file directly
      try {
        if ((window as any).electron?.readAudioFile) {
          const audioBuffer = await (window as any).electron.readAudioFile(fullPath);
          const blob = new Blob([audioBuffer], { type: 'audio/wav' });
          const url = URL.createObjectURL(blob);
          
          if (audioElement) {
            audioElement.src = url;
            audioElement.play().catch(err => {
              console.error('Error playing audio from blob:', err);
            });
          }
        } else {
          console.error('electron.readAudioFile not available');
        }
      } catch (err) {
        console.error('Failed to read audio file via electron API:', err);
      }
    };
    
    audioElement.play().catch(err => {
      console.error('Error playing audio with file:// protocol:', err);
    });
  }
  
  function stopPlayback() {
    if (audioElement) {
      audioElement.pause();
      audioElement = null;
      currentPlayingStem = null;
    }
  }
  
  // Handle drag start for better DAW integration
  function handleDragStart(e: DragEvent, stemName: string) {
    if (!stemDirectory) return;
    
    draggingStem = stemName;
    
    // Set the drag data
    if (e.dataTransfer) {
      const fullPath = `${stemDirectory}/${stemName}`;
      
      // Set the full file path for desktop apps
      e.dataTransfer.setData('text/plain', fullPath);
      e.dataTransfer.setData('text/uri-list', `file://${fullPath}`);
      
      // Allow both copy and move operations
      e.dataTransfer.effectAllowed = 'copyMove';
      
      // Try to set a custom drag image
      const dragImage = document.createElement('div');
      dragImage.textContent = stemName.replace('.wav', '');
      dragImage.style.backgroundColor = '#4F46E5';
      dragImage.style.color = 'white';
      dragImage.style.padding = '12px';
      dragImage.style.borderRadius = '4px';
      dragImage.style.fontWeight = 'bold';
      document.body.appendChild(dragImage);
      
      e.dataTransfer.setDragImage(dragImage, 0, 0);
      
      // Clean up after drag image is captured
      setTimeout(() => {
        document.body.removeChild(dragImage);
      }, 0);
    }
  }
  
  // Handle drag end
  function handleDragEnd() {
    draggingStem = null;
  }

  // Reset state if the main file changes
  $: if (currentFile && separating) {
      separating = false; // Cancel ongoing? Or just reset UI?
      separationError = null;
      stemDirectory = null;
      stems = [];
      cleanupProgressListener();
      stopSeparationTimer();
  }

  // Format elapsed time as mm:ss
  $: formattedElapsedTime = () => {
    const minutes = Math.floor(separationElapsedTime / 60);
    const seconds = separationElapsedTime % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  onDestroy(() => {
    stopPlayback();
    cleanupProgressListener();
    stopSeparationTimer();
  });

</script>

<div class="stem-separator bg-gray-800 bg-opacity-30 p-4 rounded-lg shadow-md w-full mt-4">
  <h3 class="text-lg font-semibold text-white mb-3 border-b border-gray-600 pb-2">Stem Separation (Demucs)</h3>

  {#if checkingDemucs}
    <div class="flex items-center justify-center text-white py-4">
      <div class="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-3"></div>
      <span>Checking Demucs installation...</span>
    </div>
  {:else if !demucsInstalled}
    <div class="bg-yellow-500 bg-opacity-20 border border-yellow-600 rounded-lg p-3 mb-3">
      <p class="text-white text-sm text-center">Demucs is not installed. Please install it globally:</p>
      <code class="block mt-2 bg-gray-900 p-2 rounded text-xs text-white">pip install demucs</code>
      <p class="text-xs text-gray-300 mt-2">After installation, restart the application.</p>
    </div>
  {:else if !currentFile}
    <p class="text-gray-400 text-sm">Load an audio file first to enable stem separation.</p>
  {:else if separating}
    <div class="flex flex-col items-center justify-center text-white py-4">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mb-3"></div>
      <span class="text-center">Separating stems... (this may take several minutes)</span>
      
      <!-- Progress bar with animation -->
      <div class="w-full max-w-md bg-gray-700 rounded-full h-2.5 mt-3 overflow-hidden">
        <div 
          class="bg-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-out" 
          style="width: {separationProgress}%"
        ></div>
      </div>
      <p class="text-xs text-gray-300 mt-1">Progress: {separationProgress}%</p>
      <p class="text-xs text-gray-300 mt-1">Processing time: {formattedElapsedTime()}</p>
      <p class="text-xs text-gray-300 mt-1">The app may appear frozen during processing. Please be patient.</p>
    </div>
  {:else}
    <button
      on:click={separateStems}
      disabled={separating || !currentFile || !demucsInstalled}
      class="w-full px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
    >
      {stemDirectory ? 'Re-Separate Stems' : 'Separate Stems (using htdemucs)'}
    </button>

    {#if separationError}
      <div class="error-container bg-red-500 bg-opacity-20 border border-red-600 rounded-lg p-3 mb-3">
        <p class="text-white text-sm text-center">{separationError}</p>
        <p class="text-xs text-gray-300 mt-2 text-center">If you're seeing this error, make sure Demucs is installed globally and properly working from the command line.</p>
        <code class="block mt-2 bg-gray-900 p-2 rounded text-xs text-white">demucs -h</code>
      </div>
    {/if}

    {#if stemDirectory && stems.length > 0}
      <div class="stems-output mt-4">
        <p class="text-gray-300 text-sm mb-2">Stems saved in: <code class="text-xs bg-gray-700 px-1 py-0.5 rounded">{stemDirectory}</code></p>
        <p class="text-gray-400 text-sm mb-3">Separated stems (drag stems to your DAW):</p>
        <ul class="space-y-2">
          {#each stems as stemName (stemName)}
            <li 
              class="flex items-center justify-between bg-gray-700 bg-opacity-50 p-2 rounded hover:bg-opacity-70 cursor-grab {draggingStem === stemName ? 'opacity-50' : ''}" 
              draggable="true" 
              on:dragstart={(e) => handleDragStart(e, stemName)}
              on:dragend={handleDragEnd}
            >
              <span class="text-white text-sm flex-1">{stemName.replace('.wav', '')}</span>
              <div class="flex space-x-2">
                <button 
                  class="text-gray-300 hover:text-white transition-colors p-1 rounded"
                  on:click={() => playStem(stemName)}
                  title="Play stem"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                <button 
                  class="text-gray-300 hover:text-white transition-colors p-1 rounded"
                  title="Open in file explorer"
                  on:click={() => {
                    if (stemDirectory && (window as any).electron) {
                      (window as any).electron.showItemInFolder(`${stemDirectory}/${stemName}`);
                    }
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                  </svg>
                </button>
              </div>
            </li>
          {/each}
        </ul>
        
        <div class="mt-4 p-3 bg-indigo-800 bg-opacity-20 rounded border border-indigo-600">
          <p class="text-white text-xs">
            <strong>TIP:</strong> You can drag and drop any stem directly into most DAWs or audio editors
            like Ableton, FL Studio, Logic Pro, or Reaper.
          </p>
        </div>
        
        {#if currentPlayingStem}
          <div class="flex items-center justify-center mt-4 p-2 bg-indigo-900 bg-opacity-30 rounded">
            <p class="text-white text-sm mr-2">Now playing: {currentPlayingStem.replace('.wav', '')}</p>
            <button 
              class="text-white bg-red-600 hover:bg-red-700 p-1 rounded" 
              on:click={stopPlayback}
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        {/if}
        
      </div>
    {/if}
  {/if}
</div>

<style>
  .stem-separator {
    font-family: 'Inter', sans-serif;
  }
  
  /* Enhanced drag style */
  li[draggable="true"] {
    user-select: none;
    transition: all 0.2s ease;
  }
  
  li[draggable="true"]:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  }
  
  li[draggable="true"]:active {
    cursor: grabbing;
  }
</style> 