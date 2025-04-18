declare module 'fluent-ffmpeg' {
  interface FFmpeg {
    setFfmpegPath(path: string): void;
    toFormat(format: string): FFmpeg;
    audioCodec(codec: string): FFmpeg;
    audioChannels(channels: number): FFmpeg;
    audioFrequency(frequency: number): FFmpeg;
    on(event: 'progress', callback: (progress: FFmpegProgress) => void): FFmpeg;
    on(event: 'end', callback: () => void): FFmpeg;
    on(event: 'error', callback: (error: Error) => void): FFmpeg;
    save(outputPath: string): FFmpeg;
  }

  interface FFmpegProgress {
    frames: number;
    currentFps: number;
    currentKbps: number;
    targetSize: number;
    timemark: string;
    percent?: number;
  }

  export default function(): FFmpeg;
}

declare module 'ffmpeg-static' {
  const path: string;
  export default path;
}

declare module 'youtube-dl-exec' {
  interface YoutubeDlOptions {
    dumpSingleJson?: boolean;
    noCheckCertificates?: boolean;
    noWarnings?: boolean;
    preferFreeFormats?: boolean;
    addHeader?: string[];
    output?: string;
    extractAudio?: boolean;
    audioFormat?: string;
    audioQuality?: string;
    format?: string;
  }

  interface VideoInfo {
    title: string;
    uploader: string;
    [key: string]: any;
  }

  function exec(url: string, options: YoutubeDlOptions): Promise<VideoInfo>;

  const youtubeDl = {
    default: exec
  };

  export default youtubeDl;
} 