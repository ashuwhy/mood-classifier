declare module 'wavesurfer.js' {
  interface WaveSurferOptions {
    container: HTMLElement | string;
    waveColor?: string;
    progressColor?: string;
    cursorColor?: string;
    barWidth?: number;
    barRadius?: number;
    cursorWidth?: number;
    height?: number;
    barGap?: number;
    responsive?: boolean;
    normalize?: boolean;
    pixelRatio?: number;
    fillParent?: boolean;
    minPxPerSec?: number;
    scrollParent?: boolean;
    hideScrollbar?: boolean;
    audioRate?: number;
    autoCenter?: boolean;
    partialRender?: boolean;
    interact?: boolean;
    splitChannels?: boolean;
    mediaControls?: boolean;
    backend?: string;
  }

  interface WaveSurferEvents {
    'ready': [];
    'play': [];
    'pause': [];
    'finish': [];
    'seek': [number];
    'interaction': [];
    'loading': [number];
    'waveform-ready': [];
    'destroy': [];
    'audioprocess': [number];
    'error': [Error];
  }
  
  type WaveSurferCallback<T extends keyof WaveSurferEvents> = (...args: WaveSurferEvents[T]) => void;

  class WaveSurfer {
    static create(options: WaveSurferOptions): WaveSurfer;
    
    on<T extends keyof WaveSurferEvents>(event: T, callback: WaveSurferCallback<T>): this;
    un<T extends keyof WaveSurferEvents>(event: T, callback: WaveSurferCallback<T>): this;
    
    load(url: string): this;
    loadBlob(blob: Blob): this;
    play(start?: number, end?: number): this;
    pause(): this;
    stop(): this;
    playPause(): this;
    skip(offset: number): this;
    skipBackward(): this;
    skipForward(): this;
    seek(progress: number): this;
    setVolume(newVolume: number): this;
    setMuted(muted: boolean): this;
    getVolume(): number;
    getMuted(): boolean;
    getCurrentTime(): number;
    getDuration(): number;
    zoom(pxPerSec: number): this;
    exportImage(format?: string, quality?: number, type?: string): string;
    destroy(): void;
  }

  export default WaveSurfer;
} 