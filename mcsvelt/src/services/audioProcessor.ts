import type { AudioAnalysisResults, EssentiaAnalysis } from '../types';

// Constants
const KEEP_PERCENTAGE = 0.15; // keep only 15% of audio file for faster analysis
const MODEL_NAMES = ['mood_happy', 'mood_sad', 'mood_relaxed', 'mood_aggressive', 'danceability'];
// Cache for essentia
let essentiaCache: any = null;
const modelResultsCache = new Map<string, Record<string, number>>();

// Workers
let essentia: any = null;
let featureExtractionWorker: Worker | null = null;
let inferenceWorkers: Record<string, Worker> = {};
let workersInitialized = false;

// Check if mood classification is enabled
function isMoodClassificationEnabled(): boolean {
  try {
    const preference = localStorage.getItem('showMoodClassification');
    return preference === null || preference === 'true';
  } catch (err) {
    // Default to true if localStorage is not available
    return true;
  }
}

// Get required models based on user preferences
function getRequiredModels(): string[] {
  const showMoodClassification = isMoodClassificationEnabled();
  
  // If mood classification is disabled, only use danceability model
  // or don't use any mood models at all
  if (!showMoodClassification) {
    return []; // Return empty array to skip all mood models
  }
  
  // Otherwise use all models
  return MODEL_NAMES;
}

/**
 * Initialize TensorFlow GPU support if available
 */
export async function initializeGPUSupport(): Promise<void> {
  try {
    // Execute this in the main thread to preload GPU support
    const tf = (window as any).tf;
    if (tf) {
      // Check if WebGL is supported
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      const gpuSupported = !!gl;
      
      if (gpuSupported) {
        console.log('WebGL is supported, enabling GPU acceleration');
        
        // Configure TensorFlow.js for GPU acceleration
        tf.env().set('WEBGL_FORCE_F16_TEXTURES', true);
        tf.env().set('WEBGL_RENDER_FLOAT32_ENABLED', true);
        tf.env().set('WEBGL_FLUSH_THRESHOLD', 2);
        tf.env().set('WEBGL_PACK', true);
        
        // Attempt to initialize the WebGL backend
        await tf.setBackend('webgl');
        await tf.ready();
        console.log('TensorFlow.js using backend:', tf.getBackend());
      } else {
        console.log('WebGL not supported, will use WASM backend in workers');
      }
    }
  } catch (error) {
    console.log('Error initializing GPU support, will fall back to WASM/CPU');
  }
}

/**
 * Initialize Essentia.js - optimized with caching
 */
export async function initializeEssentia(): Promise<void> {
  try {
    // Use cached instance if available
    if (essentiaCache) {
      essentia = essentiaCache;
      return;
    }
    
    const essentiaModule = await (window as any).EssentiaWASM();
    essentia = new essentiaModule.EssentiaJS(false);
    essentia.arrayToVector = essentiaModule.arrayToVector;
    // Cache for future use
    essentiaCache = essentia;
    console.log('Essentia.js initialized successfully');
  } catch (error) {
    console.error('Error initializing Essentia.js:', error);
    throw new Error('Failed to initialize audio analysis. Please reload the page.');
  }
}

/**
 * Initialize all required components for audio processing
 */
export async function initializeAll(): Promise<void> {
  // First try to initialize GPU support
  await initializeGPUSupport();
  
  // Then initialize Essentia
  await initializeEssentia();
  
  // And finally initialize workers
  initializeWorkers();
}

/**
 * Initialize the workers for audio processing
 */
export function initializeWorkers(): void {
  if (workersInitialized) return;
  
  createInferenceWorkers();
  // Only create feature extraction worker when needed
  workersInitialized = true;
}

/**
 * Process audio file for analysis
 * @param file - The audio file to analyze
 * @returns Promise with analysis results
 */
export async function processAudioFile(file: File): Promise<AudioAnalysisResults> {
  return new Promise((resolve, reject) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      // Use lower sample rate for faster processing
      sampleRate: 22050
    });
    
    // Get required models based on user preference
    const requiredModels = getRequiredModels();
    const showMoodClassification = isMoodClassificationEnabled();
    
    // If mood classification is disabled, skip model loading and inference
    if (!showMoodClassification) {
      // Process the file only for key and BPM
      file.arrayBuffer()
        .then((arrayBuffer) => {
          audioContext.decodeAudioData(arrayBuffer)
            .then(async (audioBuffer) => {
              // Only compute key/BPM
              const preprocessedAudio = preprocess(audioBuffer);
              const essentiaAnalysis = await Promise.resolve().then(() => {
                if (essentia) {
                  return computeKeyBPM(preprocessedAudio);
                }
                return null;
              });
              
              // Create result with default mood values
              const results: AudioAnalysisResults = {
                moods: {
                  happy: 0,
                  sad: 0,
                  relaxed: 0,
                  aggressive: 0
                },
                danceability: 0,
                metadata: {
                  bpm: essentiaAnalysis?.bpm || [0],
                  key: essentiaAnalysis?.keyData?.key || 'C',
                  scale: essentiaAnalysis?.keyData?.scale || 'major'
                }
              };
              
              resolve(results);
            })
            .catch((error) => {
              console.error('Error decoding audio:', error);
              reject(error);
            });
        })
        .catch(reject);
      
      return;
    }
    
    // Set up analysis completion tracking
    let receivedResults = 0;
    const modelResults: Record<string, number> = {};
    let essentiaAnalysis: EssentiaAnalysis | null = null;
    
    // Function to collect all predictions when complete - optimized
    const collectPredictions = () => {
      if (receivedResults === requiredModels.length) {
        // Format the results in the way our app expects
        const results: AudioAnalysisResults = {
          moods: {
            happy: modelResults['mood_happy'] || 0,
            sad: modelResults['mood_sad'] || 0,
            relaxed: modelResults['mood_relaxed'] || 0,
            aggressive: modelResults['mood_aggressive'] || 0
          },
          danceability: modelResults['danceability'] || 0,
          metadata: {
            bpm: essentiaAnalysis?.bpm || [0],
            key: essentiaAnalysis?.keyData?.key || 'C',
            scale: essentiaAnalysis?.keyData?.scale || 'major'
          }
        };
        
        resolve(results);
      }
    };
    
    // Set up workers for prediction collection - simplified
    requiredModels.forEach((name) => {
      if (inferenceWorkers[name]) {
        inferenceWorkers[name].onmessage = function listenToWorker(msg) {
          if (msg.data.predictions) {
            modelResults[name] = msg.data.predictions;
            receivedResults++;
            collectPredictions();
          }
        };
      }
    });
    
    // Process the file - more efficient buffer handling
    file.arrayBuffer()
      .then((arrayBuffer) => {
        audioContext.decodeAudioData(arrayBuffer)
          .then(async (audioBuffer) => {
            // Parallelize processing - run key/BPM computation async with feature extraction
            const keyBpmPromise = Promise.resolve().then(() => {
              if (essentia) {
                // Convert to mono and analyze key/BPM
                const preprocessedAudio = preprocess(audioBuffer);
                return computeKeyBPM(preprocessedAudio);
              }
              return null;
            });
            
            // Create feature extraction worker early to overlap initialization
            createFeatureExtractionWorker();
            
            // Preprocessing and shortening
            const preprocessedAudio = preprocess(audioBuffer);
            let audioData = shortenAudio(preprocessedAudio, KEEP_PERCENTAGE, true);
            
            // Suspend audio context to free resources
            await audioContext.suspend();
            
            // Set up feature extraction worker handler
            if (featureExtractionWorker) {
              featureExtractionWorker.onmessage = function listenToFeatureExtractionWorker(msg) {
                if (msg.data.features) {
                  // Send to all models simultaneously
                  requiredModels.forEach((name) => {
                    if (inferenceWorkers[name]) {
                      inferenceWorkers[name].postMessage({
                        features: msg.data.features
                      });
                    }
                  });
                  
                  // Free worker resource
                  if (featureExtractionWorker) {
                    featureExtractionWorker.terminate();
                    featureExtractionWorker = null;
                  }
                }
              };
              
              // Wait for key/BPM result to complete before sending feature extraction
              keyBpmPromise.then(result => {
                essentiaAnalysis = result;
                
                // Transfer ownership of the buffer to avoid copy
                const transferableBuffer = audioData.buffer;
                featureExtractionWorker?.postMessage({
                  audio: audioData.buffer
                }, [transferableBuffer]);
                
                // Set to undefined to help garbage collection
                audioData = undefined as unknown as Float32Array;
              });
            } else {
              reject(new Error('Feature extraction worker could not be created.'));
            }
          })
          .catch((error) => {
            console.error('Error decoding audio:', error);
            reject(error);
          });
      })
      .catch(reject);
  });
}

/**
 * Create workers for model inference
 */
function createInferenceWorkers(): void {
  const requiredModels = getRequiredModels();
  
  // Create workers only for required models
  if (requiredModels.length === 0) {
    console.log('Mood classification is disabled, skipping model loading');
    // Terminate existing workers if they exist
    Object.keys(inferenceWorkers).forEach(name => {
      if (inferenceWorkers[name]) {
        inferenceWorkers[name].terminate();
        delete inferenceWorkers[name];
      }
    });
    return;
  }
  
  requiredModels.forEach((name) => {
    try {
      // Only create if not already created
      if (!inferenceWorkers[name]) {
        inferenceWorkers[name] = new Worker('/workers/inference.js');
        
        // Initialize the worker with the model name
        inferenceWorkers[name].postMessage({
          name: name
        });
      }
    } catch (error) {
      console.error(`Failed to create inference worker for ${name}:`, error);
    }
  });
}

/**
 * Create worker for feature extraction
 */
function createFeatureExtractionWorker(): void {
  try {
    // Skip feature extraction worker creation if mood classification is disabled
    if (!isMoodClassificationEnabled()) {
      return;
    }
    
    if (!featureExtractionWorker) {
      featureExtractionWorker = new Worker('/workers/featureExtraction.js');
    }
  } catch (error) {
    console.error('Failed to create feature extraction worker:', error);
  }
}

/**
 * Preprocess audio buffer to mono - optimized
 * @param audioBuffer - The decoded audio buffer
 * @returns Float32Array of mono audio data
 */
function preprocess(audioBuffer: AudioBuffer): Float32Array {
  // Convert to mono if not already
  let monoAudio: Float32Array;
  
  if (audioBuffer.numberOfChannels === 1) {
    monoAudio = audioBuffer.getChannelData(0);
  } else {
    // Mix down to mono - optimized loop
    monoAudio = new Float32Array(audioBuffer.length);
    const left = audioBuffer.getChannelData(0);
    const right = audioBuffer.getChannelData(1);
    
    // Process in chunks of 1024 samples for better cache utilization
    const chunkSize = 1024;
    const length = audioBuffer.length;
    
    for (let i = 0; i < length; i += chunkSize) {
      const end = Math.min(i + chunkSize, length);
      for (let j = i; j < end; j++) {
        monoAudio[j] = (left[j] + right[j]) * 0.5; // Multiply instead of divide for performance
      }
    }
  }
  
  return monoAudio;
}

/**
 * Shorten audio for analysis - optimized
 */
function shortenAudio(audioData: Float32Array, keepPercentage: number, randomizePosition: boolean): Float32Array {
  // Optimized to reduce processing - analyze middle section which often has more musical information
  const samplesToKeep = Math.floor(audioData.length * keepPercentage);
  let startIdx = 0;
  
  if (randomizePosition) {
    // Instead of fully random, bias toward the middle section where most musical info usually is
    const middleStart = Math.floor(audioData.length * 0.3); // 30% from start
    const middleRange = Math.floor(audioData.length * 0.4); // 40% of total length
    const maxStartIdx = Math.min(middleStart + middleRange, audioData.length - samplesToKeep);
    startIdx = Math.floor(middleStart + Math.random() * middleRange);
    if (startIdx > maxStartIdx) startIdx = maxStartIdx;
  } else {
    // Default to middle section if not randomizing
    startIdx = Math.floor((audioData.length - samplesToKeep) / 2);
  }
  
  return audioData.slice(startIdx, startIdx + samplesToKeep);
}

/**
 * Compute key and BPM using Essentia.js - optimized
 */
function computeKeyBPM(audioSignal: Float32Array): EssentiaAnalysis {
  // Convert to vector only once for both algorithms
  let vectorSignal = essentia.arrayToVector(audioSignal);
  
  // Use more efficient parameter settings
  const keyData = essentia.KeyExtractor(
    vectorSignal, true, 4096, 4096, 12, 3500, 60, 25, 0.2, 'bgate', 22050, 0.0001, 440, 'cosine', 'hann'
  );
  
  // Use default parameters with optimized frame/hop size for faster processing
  const bpmValue = essentia.PercivalBpmEstimator(
    vectorSignal, 1024, 1024, 128, 128, 210, 50, 22050
  ).bpm;
  
  // Round BPM and get a single best value to avoid additional processing
  const roundBpm = (v: number) => Math.round(v * 10) / 10;
  
  // Just return the most likely BPM value without additional calculation
  return {
    keyData: keyData,
    bpm: [roundBpm(bpmValue)]
  };
}

/**
 * Clean up any active workers
 */
export function cleanupWorkers(): void {
  // Clean up feature extraction worker
  if (featureExtractionWorker) {
    featureExtractionWorker.terminate();
    featureExtractionWorker = null;
  }
  
  // No need to terminate inference workers as they are persistent
  // and will be reused for the next analysis
} 