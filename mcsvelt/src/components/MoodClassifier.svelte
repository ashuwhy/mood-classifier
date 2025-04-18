<script lang="ts">
  import { onMount } from 'svelte';
  import FileUpload from './FileUpload.svelte';
  import ResultsDisplay from './ResultsDisplay.svelte';
  import ControlsPanel from './ControlsPanel.svelte';
  import MusicRecognizer from './MusicRecognizer.svelte';
  import StemSeparator from './StemSeparator.svelte';
  import type { AudioAnalysisResults } from '../types/index';
  import { initializeAll } from '../services/audioProcessor';
  
  // Define a type for Files that includes the Electron path property
  interface ElectronFile extends File {
    path: string;
  }
  
  let fileLoaded = false;
  let analyzing = false;
  let musicRecognizing = false;
  let currentFile: ElectronFile | null = null;
  let wavesurfer: any = null;
  let analysisResults: AudioAnalysisResults | null = null;
  let error: string | null = null;
  let gpuAccelerated = false;
  let showMoodClassification = true; // State for mood classification toggle
  
  // Function to toggle mood classification visibility and save to localStorage
  async function toggleMoodClassification() {
    showMoodClassification = !showMoodClassification;
    
    try {
      localStorage.setItem('showMoodClassification', showMoodClassification.toString());
      
      // If we already have analysis results and we're toggling the mood display
      // We don't need to reload anything if we're just hiding the display
      
      // If we have a file loaded but no results yet, or we're toggling ON mood classification,
      // we should reinitialize the workers for the next analysis
      if (fileLoaded) {
        try {
          // Reinitialize the workers with the new setting
          const { cleanupWorkers, initializeWorkers } = await import('../services/audioProcessor');
          cleanupWorkers();
          initializeWorkers();
        } catch (err) {
          // Error reinitializing workers
        }
      }
    } catch (err) {
      // Error saving preference
    }
  }
  
  onMount(async () => {
    // Load user preference for mood classification if available
    try {
      const savedPreference = localStorage.getItem('showMoodClassification');
      if (savedPreference !== null) {
        showMoodClassification = savedPreference === 'true';
      }
    } catch (err) {
      // Error loading preference
    }
    
    try {
      // Load required scripts in optimal order for GPU support
      await loadExternalScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@3.11.0/dist/tf.min.js');
      await loadExternalScript('https://cdn.jsdelivr.net/npm/essentia.js@0.1.0/dist/essentia-wasm.web.js');
      await loadExternalScript('https://cdn.jsdelivr.net/npm/essentia.js@0.1.0/dist/essentia.js-core.js');
      
      // Initialize all components including GPU support
      await initializeAll();
      
      // Check if GPU is being used
      const tf = (window as any).tf;
      if (tf && tf.getBackend() === 'webgl') {
        gpuAccelerated = true;
      }
      
    } catch (err) {
      error = 'Failed to initialize audio analysis components. Please reload the page.';
    }
  });
  
  // Helper function to load external scripts
  function loadExternalScript(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
      document.head.appendChild(script);
    });
  }
  
  async function handleFileUploaded(event: CustomEvent) {
    currentFile = event.detail.file;
    fileLoaded = true;
    analyzing = true;
    error = null;
    
    if (!currentFile) {
      error = "No file was provided for analysis";
      analyzing = false;
      return;
    }
    
    try {
      // Process the audio file with our audio processor service
      // Import inside the function to ensure it's initialized
      const { processAudioFile } = await import('../services/audioProcessor');
      const results = await processAudioFile(currentFile);
      analysisResults = results;
    } catch (err) {
      console.error('Error analyzing audio:', err);
      error = err instanceof Error ? err.message : 'Unknown error occurred during analysis';
    } finally {
      analyzing = false;
    }
  }
  
  async function handleReset() {
    if (!fileLoaded || confirm("Are you sure you want to reset? This will clear the current audio.")) {
      fileLoaded = false;
      analyzing = false;
      currentFile = null;
      analysisResults = null;
      error = null;
      
      if (wavesurfer) {
        wavesurfer.destroy();
        wavesurfer = null;
      }
      
      // Clean up any active workers
      try {
        const { cleanupWorkers } = await import('../services/audioProcessor');
        cleanupWorkers();
      } catch (err) {
        console.error('Error cleaning up workers:', err);
      }
    }
  }
</script>

<div class="mood-classifier relative z-10 w-full h-full flex flex-col items-center justify-center p-4">
  <!-- Reset Button -->
  <button 
    on:click={handleReset}
    class="absolute top-4 right-4 px-3 py-2 rounded-lg bg-gray-800 bg-opacity-40 hover:bg-opacity-60 text-white text-sm transition-all flex items-center gap-2"
    title="Reset"
  >
    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
    Reset
  </button>
  
  <!-- Mood Classification Toggle Button -->
  <button 
    on:click={toggleMoodClassification}
    class="absolute top-4 right-28 px-3 py-2 rounded-lg bg-gray-800 bg-opacity-40 hover:bg-opacity-60 text-white text-sm transition-all flex items-center gap-2"
    title="{showMoodClassification ? 'Hide mood classification (faster analysis)' : 'Show mood classification (slower analysis)'}"
  >
    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="{showMoodClassification ? 'M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905a3.61 3.61 0 01-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5' : 'M14 14h4.764a2 2 0 001.789-2.894l-3.5-7A2 2 0 0015.263 3h-4.017c-.163 0-.326.02-.485.06L7 4m7 10v5a2 2 0 01-2 2h-.095c-.5 0-.905-.405-.905-.905a3.61 3.61 0 00-.608-2.006L7 13v-9m7 10h-2M7 4H5a2 2 0 00-2 2v6a2 2 0 002 2h2.5'}" />
    </svg>
    {showMoodClassification ? 'Hide Moods' : 'Show Moods'}
  </button>
  
  {#if gpuAccelerated}
    <div class="gpu-indicator absolute top-4 left-4 flex items-center gap-1 bg-green-900 bg-opacity-40 rounded-full px-3 py-1 text-xs text-white">
      <span class="inline-block w-2 h-2 rounded-full bg-green-400"></span>
      GPU Accelerated
    </div>
  {/if}
  
  {#if error}
    <div class="error-container bg-red-500 bg-opacity-20 border border-red-600 rounded-lg p-4 mb-6">
      <p class="text-white text-center">{error}</p>
    </div>
  {/if}
  
  {#if !fileLoaded}
    <FileUpload on:fileUploaded={handleFileUploaded} />
  {:else}
    <div class="w-full max-w-4xl flex flex-col items-center">
      {#if analyzing}
        <div class="loader-container w-full text-center py-16">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
          <p class="text-white mt-4">
            Analyzing track{gpuAccelerated ? ' with GPU acceleration' : ''}{!showMoodClassification ? ' (basic mode)' : ''}...
          </p>
        </div>
      {:else if analysisResults}
        <!-- Two-column layout with left and right panels -->
        <div class="w-full flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <!-- Left panel: Music Recognizer, Results, Controls -->
          <div class="w-full md:w-3/5 flex flex-col space-y-4">
            <MusicRecognizer {currentFile} bind:processing={musicRecognizing} />
            <ResultsDisplay results={analysisResults} {showMoodClassification} />
            <ControlsPanel {currentFile} bind:wavesurfer />
          </div>
          
          <!-- Right panel: Stem Separator -->
          <div class="w-full md:w-2/5">
            <StemSeparator {currentFile} />
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .mood-classifier {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }
  
  .gpu-indicator {
    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
  }
</style> 