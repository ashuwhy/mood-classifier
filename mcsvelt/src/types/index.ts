export interface AudioAnalysisResults {
  moods: {
    happy: number;
    sad: number;
    relaxed: number;
    aggressive: number;
  };
  danceability: number;
  metadata: {
    bpm: number[];
    key: string;
    scale: string;
  };
}

export interface EssentiaAnalysis {
  keyData: {
    key: string;
    scale: string;
    strength: number;
  };
  bpm: number[];
}

export interface PredictionResults {
  [key: string]: number;
}

export interface AppState {
  fileLoaded: boolean;
  analyzing: boolean;
  currentFile: File | null;
  analysisResults: AudioAnalysisResults | null;
} 