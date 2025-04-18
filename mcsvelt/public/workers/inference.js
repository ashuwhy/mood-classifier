// Inference worker for TensorFlow.js audio models
// Optimize loading - reduce imports to essentials
// Measure performance
const workerStartTime = self.performance ? self.performance.now() : Date.now();

// Import TensorFlow.js and Essentia.js libraries
importScripts('./lib/tf.min.js');
importScripts('./lib/essentia.js-model.umd.js');

// Model-specific variables with optimization flags
let model = null;
let modelName = '';
let modelLoaded = false;
let modelReady = false;
let tensorflowReady = false;
let processingFeatures = false;

// Model paths - direct references
const modelPaths = {
  'mood_happy': '/models/mood_happy-musicnn-msd-2/model.json',
  'mood_sad': '/models/mood_sad-musicnn-msd-2/model.json',
  'mood_relaxed': '/models/mood_relaxed-musicnn-msd-2/model.json',
  'mood_aggressive': '/models/mood_aggressive-musicnn-msd-2/model.json',
  'danceability': '/models/danceability-musicnn-msd-2/model.json'
};

const modelTagOrder = {
  'mood_happy': [true, false],
  'mood_sad': [false, true],
  'mood_relaxed': [false, true],
  'mood_aggressive': [true, false],
  'danceability': [true, false]
};

// Precomputed arrays to avoid allocations during inference
const resultArrays = {
  firstValues: [],
  secondValues: []
};

// Initialize the worker when a message is received with the model name
self.onmessage = async function(msg) {
  if (msg.data.name) {
    // Set model name and load model immediately
    modelName = msg.data.name;
    
    try {
      if (!tensorflowReady) {
        await initTensorflowWASM();
        tensorflowReady = true;
      }
      
      // Initialize model immediately after TF is ready
      if (!modelLoaded) {
        initModel();
      }
    } catch (error) {
      self.postMessage({
        error: error.message
      });
    }
  } else if (msg.data.features && modelReady && !processingFeatures) {
    // Process features with the loaded model - add lock to prevent concurrent processing
    processingFeatures = true;
    try {
      modelPredict(msg.data.features);
    } catch (error) {
      processingFeatures = false;
      self.postMessage({
        error: error.message
      });
    }
  }
};

// Optimized WASM initialization - only essential steps
async function initTensorflowWASM() {
  try {
    // Try to use WebGL (GPU) first for best performance
    // Some browsers might need a preflight check for WebGL availability
    let preferredBackend = 'webgl';
    
    // Configure WebGL for best performance
    if (tf.getBackend() !== preferredBackend) {
      // Set configurations for GPU acceleration
      tf.env().set('WEBGL_FORCE_F16_TEXTURES', true); // Use F16 textures for performance
      tf.env().set('WEBGL_RENDER_FLOAT32_ENABLED', true); // Ensure F32 render support
      tf.env().set('WEBGL_FLUSH_THRESHOLD', 2); // Optimize memory usage 
      tf.env().set('WEBGL_PACK', true); // Pack operations for better throughput
      tf.env().set('WEBGL_USE_SHAPES_UNIFORMS', true); // Use uniforms for shapes
      tf.env().set('WEBGL_PACK_DEPTHWISECONV', true); // Pack depthwise convolutions
      
      try {
        // Try GPU first
        await tf.setBackend(preferredBackend);
        console.log('Using WebGL GPU acceleration');
        await tf.ready();
        return; // Successfully initialized GPU backend
      } catch (webglError) {
        console.log('WebGL backend failed, falling back to WASM');
        // Continue to WASM initialization
      }
    }
    
    // Fall back to WASM if WebGL isn't available or failed
    if (tf.getBackend() !== 'wasm') {
      // Load the TF WASM backend script
      importScripts('./lib/tf-backend-wasm-3.5.0.js');

      // Direct WASM path for faster loading
      tf.wasm.setWasmPaths({
        'tfjs-backend-wasm.wasm': '/wasm/tfjs-backend-wasm.wasm',
        'tfjs-backend-wasm-simd.wasm': '/wasm/tfjs-backend-wasm-simd.wasm',
        'tfjs-backend-wasm-threaded-simd.wasm': '/wasm/tfjs-backend-wasm-threaded-simd.wasm'
      });

      // Only set essential flags
      tf.env().set('WASM_HAS_SIMD_SUPPORT', self.crossOriginIsolated);
      tf.env().set('WASM_HAS_MULTITHREAD_SUPPORT', self.crossOriginIsolated);
      
      await tf.setBackend('wasm');
      await tf.ready();
    }
  } catch (error) {
    // Fallback to CPU with minimal logging
    await tf.setBackend('cpu');
    await tf.ready();
  }
  
  // Check which backend we're using
  console.log(`TensorFlow.js using backend: ${tf.getBackend()}`);
}

// Optimize model initialization
function initModel() {
  // Create model with direct path reference
  model = new EssentiaModel.TensorflowMusiCNN(tf, modelPaths[modelName]);
  
  loadModel().then((isLoaded) => {
    if (isLoaded) {
      modelLoaded = true;
      // Run warm-up inference on a small tensor to compile operations
      warmUp();
    }
  });
}

async function loadModel() {
  try {
    await model.initialize();
    return true;
  } catch (error) {
    self.postMessage({
      error: `Failed to initialize model ${modelName}: ${error.message}`
    });
    return false;
  }
}

// Minimal warm-up - just enough to compile operations
function warmUp() {
  // Create minimal-sized feature for warm-up
  const fakeFeatures = {
    melSpectrum: getZeroMatrix(187, 96), // Must use 187x96 - model requires this exact shape
    frameSize: 187,
    melBandsSize: 96,
    patchSize: 187
  };

  // Run prediction without logging
  model.predict(fakeFeatures, false).then(() => {
    modelReady = true;
  });
}

// Optimized zero matrix creation with typed arrays
function getZeroMatrix(x, y) {
  const matrix = new Array(x);
  const zeroRow = new Float32Array(y); // Typed array for better performance
  
  for (let f = 0; f < x; f++) {
    // Use slice for efficient copying
    matrix[f] = zeroRow.slice();
  }
  return matrix;
}

// Optimized model prediction
function modelPredict(features) {
  if (!modelReady) {
    processingFeatures = false;
    return;
  }
  
  model.predict(features, true)
    .then((predictions) => {
      // Get the simplified prediction directly
      const result = getAveragedPrediction(predictions);
      
      // Just post the result directly
      self.postMessage({
        predictions: result
      });
      
      // Free memory and resources
      tf.disposeVariables();
      
      // Reset processing flag
      processingFeatures = false;
    })
    .catch(error => {
      processingFeatures = false;
      self.postMessage({
        error: `Error in model prediction: ${error.message}`
      });
    });
}

// Optimized averaging function - no intermediate arrays
function getAveragedPrediction(arrayOfArrays) {
  const len = arrayOfArrays.length;
  let sum1 = 0, sum2 = 0;
  
  // Direct summation without intermediate arrays
  for (let i = 0; i < len; i++) {
    sum1 += arrayOfArrays[i][0];
    sum2 += arrayOfArrays[i][1];
  }
  
  // Get averages
  const avg1 = sum1 / len;
  const avg2 = sum2 / len;
  
  // Return the value representing the positive class based on model type
  return modelTagOrder[modelName][0] ? avg1 : avg2;
} 