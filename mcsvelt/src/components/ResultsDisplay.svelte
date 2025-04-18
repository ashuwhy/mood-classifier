<script lang="ts">
  import { onMount } from 'svelte';
  import type { AudioAnalysisResults } from '../types';
  
  export let results: AudioAnalysisResults;
  export let showMoodClassification: boolean = true;
  
  const emojis = {
    happy: '😊',
    sad: '😢',
    relaxed: '😌',
    aggressive: '😠',
    danceability: '💃🏻'
  };
  
  const labels = {
    happy: 'happy',
    sad: 'sad',
    relaxed: 'relaxed',
    aggressive: 'aggressive',
    danceability: 'danceability'
  };
  
  // Music theory helper functions
  
  // Map of notes for calculating relative keys and enharmonic equivalents
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const flatNotes = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  
  // Map of enharmonic equivalents
  const enharmonicMap = {
    'C#': 'Db',
    'D#': 'Eb',
    'F#': 'Gb',
    'G#': 'Ab',
    'A#': 'Bb',
    'Db': 'C#',
    'Eb': 'D#',
    'Gb': 'F#',
    'Ab': 'G#',
    'Bb': 'A#'
  };
  
  // Get the relative major/minor key based on current key
  function getRelativeKey(key: string, scale: string): string {
    // Try to find the key in our note arrays
    let keyIndex = notes.indexOf(key);
    let useSharpNotes = true;
    
    // If not found in sharp notes, try flat notes
    if (keyIndex === -1) {
      keyIndex = flatNotes.indexOf(key);
      if (keyIndex !== -1) {
        useSharpNotes = false;
      }
    }
    
    // Key still not found, could be an unusual key or format
    if (keyIndex === -1) return '?'; // Key not found, return placeholder
    
    // Calculate relative key index
    // For major, relative minor is 3 semitones below (or 9 semitones above)
    // For minor, relative major is 3 semitones above
    let relativeKeyIndex;
    if (scale.toLowerCase() === 'major') {
      relativeKeyIndex = (keyIndex + 9) % 12; // Calculate relative minor
      return (useSharpNotes ? notes[relativeKeyIndex] : flatNotes[relativeKeyIndex]) + ' minor';
    } else {
      relativeKeyIndex = (keyIndex + 3) % 12; // Calculate relative major
      return (useSharpNotes ? notes[relativeKeyIndex] : flatNotes[relativeKeyIndex]) + ' major';
    }
  }
  
  // Get the enharmonic equivalent of a key (if any)
  function getEnharmonicEquivalent(key: string): string | null {
    return key in enharmonicMap ? enharmonicMap[key as keyof typeof enharmonicMap] : null;
  }
  
  // Helper to format values nicely
  function formatValue(value: number): string {
    return (value * 100).toFixed(0) + '%';
  }
  
  // Format BPM values
  function formatBPM(bpmValues: number[]): string {
    if (!bpmValues || bpmValues.length === 0) return 'N/A';
    return bpmValues.map(bpm => Math.round(bpm)).join(' / ');
  }
  
  // Calculate additional key information
  const relativeKey = getRelativeKey(results.metadata.key, results.metadata.scale);
  const enharmonicKey = getEnharmonicEquivalent(results.metadata.key);
</script>

<div class="results-container w-full">
  <!-- Mood meters - only shown if mood classification is enabled -->
  {#if showMoodClassification}
    <div class="mood-meters grid grid-cols-1 md:grid-cols-5 gap-6 mb-10">
      <!-- Mood happy -->
      <div class="mood-meter bg-gray-800 bg-opacity-30 rounded-lg p-4 flex flex-col items-center">
        <span class="emoji text-3xl mb-2">{emojis.happy}</span>
        <div class="meter-container w-full bg-gray-700 rounded-full h-2 mb-2 overflow-hidden">
          <div class="meter-fill bg-yellow-400 h-full rounded-full" style="width: {results.moods.happy * 100}%"></div>
        </div>
        <div class="flex justify-between w-full">
          <span class="label text-white text-sm">{labels.happy}</span>
          <span class="value text-white text-sm font-bold">{formatValue(results.moods.happy)}</span>
        </div>
      </div>
      
      <!-- Mood sad -->
      <div class="mood-meter bg-gray-800 bg-opacity-30 rounded-lg p-4 flex flex-col items-center">
        <span class="emoji text-3xl mb-2">{emojis.sad}</span>
        <div class="meter-container w-full bg-gray-700 rounded-full h-2 mb-2 overflow-hidden">
          <div class="meter-fill bg-blue-400 h-full rounded-full" style="width: {results.moods.sad * 100}%"></div>
        </div>
        <div class="flex justify-between w-full">
          <span class="label text-white text-sm">{labels.sad}</span>
          <span class="value text-white text-sm font-bold">{formatValue(results.moods.sad)}</span>
        </div>
      </div>
      
      <!-- Mood relaxed -->
      <div class="mood-meter bg-gray-800 bg-opacity-30 rounded-lg p-4 flex flex-col items-center">
        <span class="emoji text-3xl mb-2">{emojis.relaxed}</span>
        <div class="meter-container w-full bg-gray-700 rounded-full h-2 mb-2 overflow-hidden">
          <div class="meter-fill bg-green-400 h-full rounded-full" style="width: {results.moods.relaxed * 100}%"></div>
        </div>
        <div class="flex justify-between w-full">
          <span class="label text-white text-sm">{labels.relaxed}</span>
          <span class="value text-white text-sm font-bold">{formatValue(results.moods.relaxed)}</span>
        </div>
      </div>
      
      <!-- Mood aggressive -->
      <div class="mood-meter bg-gray-800 bg-opacity-30 rounded-lg p-4 flex flex-col items-center">
        <span class="emoji text-3xl mb-2">{emojis.aggressive}</span>
        <div class="meter-container w-full bg-gray-700 rounded-full h-2 mb-2 overflow-hidden">
          <div class="meter-fill bg-red-500 h-full rounded-full" style="width: {results.moods.aggressive * 100}%"></div>
        </div>
        <div class="flex justify-between w-full">
          <span class="label text-white text-sm">{labels.aggressive}</span>
          <span class="value text-white text-sm font-bold">{formatValue(results.moods.aggressive)}</span>
        </div>
      </div>
      
      <!-- Danceability -->
      <div class="mood-meter bg-gray-800 bg-opacity-30 rounded-lg p-4 flex flex-col items-center">
        <span class="emoji text-3xl mb-2">{emojis.danceability}</span>
        <div class="meter-container w-full bg-gray-700 rounded-full h-2 mb-2 overflow-hidden">
          <div class="meter-fill bg-purple-400 h-full rounded-full" style="width: {results.danceability * 100}%"></div>
        </div>
        <div class="flex justify-between w-full">
          <span class="label text-white text-sm">{labels.danceability}</span>
          <span class="value text-white text-sm font-bold">{formatValue(results.danceability)}</span>
        </div>
      </div>
    </div>
  {/if}
  
  <!-- BPM and Key info -->
  <div class="metadata-section grid grid-cols-1 md:grid-cols-2 gap-6">
    <div class="bg-gray-800 bg-opacity-30 rounded-lg p-4">
      <div class="flex items-center justify-between">
        <span class="tag text-white text-sm uppercase tracking-wider">BPM</span>
        <span class="value-box text-white font-bold text-xl">{formatBPM(results.metadata.bpm)}</span>
      </div>
    </div>
    
    <div class="bg-gray-800 bg-opacity-30 rounded-lg p-4">
      <div class="flex flex-col">
        <div class="flex items-center justify-between">
          <span class="tag text-white text-sm uppercase tracking-wider">KEY</span>
          <span class="value-box text-white font-bold text-xl">{results.metadata.key} {results.metadata.scale}</span>
        </div>
        
        <div class="mt-3 border-t border-gray-700 pt-2">
          <div class="grid grid-cols-2 gap-2 text-gray-200 text-sm">
            {#if enharmonicKey}
              <div class="flex items-center gap-2">
                <span class="text-gray-400">Enharmonic:</span>
                <span class="font-medium">{enharmonicKey} {results.metadata.scale}</span>
              </div>
            {/if}
            
            <div class="flex items-center gap-2">
              <span class="text-gray-400">Relative:</span>
              <span class="font-medium">{relativeKey}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div> 