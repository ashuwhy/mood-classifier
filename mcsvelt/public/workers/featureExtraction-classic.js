// Feature extraction worker - Classic version

// Import Essentia libraries locally
importScripts('./lib/essentia.js-model.umd.js');
importScripts('./lib/essentia-wasm.module.js');

// Using modified version of ES6 essentia WASM, so that it can be loaded with importScripts
const EssentiaWASM = Module;

const extractor = new EssentiaModel.EssentiaTFInputExtractor(EssentiaWASM, 'musicnn', false);

function outputFeatures(f) {
  postMessage({
    features: f
  });
}

function computeFeatures(audioData) {
  const featuresStart = Date.now();
  
  const features = extractor.computeFrameWise(audioData, 256);

  console.info(`Feature extraction took: ${Date.now() - featuresStart}`);

  return features;
}

self.onmessage = function(msg) {
  if (msg.data.audio) {
    console.log("From feature extraction worker: I've got audio!");
    const audio = new Float32Array(msg.data.audio);
    const features = computeFeatures(audio);
    outputFeatures(features);
  }
}; 