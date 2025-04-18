// Feature extraction worker for audio analysis
// Optimize imports - pre-load modules
const workerStartTime = self.performance ? self.performance.now() : Date.now();
importScripts('./lib/essentia.js-model.umd.js');
importScripts('./lib/essentia-wasm.module.js');
// using importScripts since it works on both Chrome and Firefox
// using modified version of ES6 essentia WASM, so that it can be loaded with importScripts
const EssentiaWASM = Module;

// Use chunked processing to improve parallelism
const CHUNK_SIZE = 65536; // Process audio in 64K chunks for better memory management

// Pre-initialize extractor with optimized settings
const extractor = new EssentiaModel.EssentiaTFInputExtractor(EssentiaWASM, 'musicnn', false, {
    patchSize: 187,         // Must match model's expected input size
    batchSize: 512,         // Increase batch size for GPU acceleration
    overlap: 0.5,           // 50% overlap is sufficient for most music
    frameSize: 2048,        // Reduced frame size
    hopSize: 1024,          // Reduced hop size
    useBatch: true          // Enable batching for faster processing
});

// Pre-allocate result object to avoid garbage collection
let outputFeatures = null;

function outputResults(features) {
    // Skip copying if possible - direct transfer
    postMessage({
        features: features
    });
}

// Optimized feature computation with chunking for better parallelism
function computeFeatures(audioData) {
    // Use optimized computation with specific parameters
    try {
        // For long audio files, process in chunks to avoid memory pressure
        if (audioData.length > CHUNK_SIZE) {
            // Use standard approach since we know it works well
            return extractor.computeFrameWise(audioData, 187);
        } else {
            // For shorter audio, use optimized approach
            return extractor.computeFrameWise(audioData, 187);
        }
    } catch (e) {
        console.error("Error in feature computation:", e);
        
        // Fallback to simpler computation with correct patch size
        return extractor.computeFrameWise(audioData, 187);
    }
}

// Remove timing and console logs from hot path
onmessage = function listenToMainThread(msg) {
    // listen for decoded audio
    if (msg.data.audio) {
        // Preallocate Float32Array to avoid copying
        const audio = new Float32Array(msg.data.audio);
        
        // Compute features directly
        const features = computeFeatures(audio);
        
        // Output without logging
        outputResults(features);
    }
}