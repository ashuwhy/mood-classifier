/// <reference types="svelte" />
/// <reference types="vite/client" />

interface Window {
  api: {
    invoke: (channel: string, data?: any) => Promise<any>;
    send: (channel: string, data?: any) => void;
    receive: (channel: string, func: (...args: any[]) => void) => void;
    openExternal: (url: string) => void;
  };
  appInfo: {
    version: string;
    platform: string;
  };
  EssentiaWASM: () => Promise<any>;
}
