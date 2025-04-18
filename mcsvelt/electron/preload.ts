// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const { contextBridge, ipcRenderer, webFrame } = require('electron');

// Type definitions to help with TypeScript
interface IpcRendererEvent {
  sender: any;
  senderId: number;
}

// Define interface for exposed functions
interface ElectronAPI {
  invoke: (channel: string, data?: any) => Promise<any>;
  send: (channel: string, data?: any) => void;
  receive: (channel: string, func: (...args: any[]) => void) => void;
  openExternal: (url: string) => void;
}

// Define interface for app info
interface AppInfo {
  version: string;
  platform: string;
}

// Valid channels for send/receive/invoke operations
const validSendChannels = ['toMain', 'requestData', 'logEvent', 'openExternalLink'];
const validReceiveChannels = ['fromMain', 'responseData', 'appUpdate'];
const validInvokeChannels = [
  'download-youtube-audio',
  'read-audio-file',
  'toggle-enabled',
  'recognize-music',
  'save-temp-file',
  'fetch-image',
  'cleanup-temp-files',
  'getData',
  'performAction',
  'checkStatus',
  'demucs:separate',
  'electron:showItemInFolder',
  'check-demucs-installed',
  'electron:readAudioFile',
  'demucs:cancelSeparation'
];

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  // Invoke methods and get responses (Promise)
  invoke: async (channel: string, data?: any): Promise<any> => {
    if (validInvokeChannels.includes(channel)) {
      return await ipcRenderer.invoke(channel, data);
    }
    throw new Error(`Invalid invoke channel: ${channel}`);
  },
  
  // Send messages to main process
  send: (channel: string, data?: any): void => {
    if (validSendChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  
  // Receive messages from main process
  receive: (channel: string, func: (...args: any[]) => void): void => {
    if (validReceiveChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender` 
      ipcRenderer.on(channel, (_event: Electron.IpcRendererEvent, ...args: any[]) => func(...args));
    }
  },
  
  // Helper to open external links
  openExternal: (url: string): void => {
    ipcRenderer.send('openExternalLink', url);
  }
} as ElectronAPI);

// Expose app information 
contextBridge.exposeInMainWorld('appInfo', {
  version: process.env.APP_VERSION || '1.0.0',
  platform: process.platform
} as AppInfo);

// Prevent using eval() and new Function() for security reasons
contextBridge.exposeInMainWorld('secureEval', {
  safeEval: (code: string) => {
    // This is a stub that does nothing - eval is inherently unsafe
    console.warn('Eval attempt blocked for security reasons');
    return null;
  }
});

// Initialize performance optimization helpers when preload starts
// This runs before the renderer loads to prepare things
const initOptimizations = (): void => {
  // Disable zoom functionality for performance
  if (webFrame) {
    webFrame.setZoomFactor(1);
    webFrame.setVisualZoomLevelLimits(1, 1);
  }
};

initOptimizations();

// Setup link handling in the DOM
document.addEventListener('DOMContentLoaded', () => {
  // Handle all link clicks to open in external browser
  document.addEventListener('click', (event) => {
    const element = event.target as HTMLElement;
    const linkElement = element.closest('a') as HTMLAnchorElement;
    
    if (linkElement && linkElement.href && linkElement.href.startsWith('http')) {
      event.preventDefault();
      ipcRenderer.send('openExternalLink', linkElement.href);
    }
  });
});

// Store callback for cancellation
let cancelCallback: (() => void) | null = null;

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('demucsAPI', {
  separate: (filePath: string) => ipcRenderer.invoke('demucs:separate', filePath),
  checkInstalled: () => ipcRenderer.invoke('check-demucs-installed'),
  // Add cancellation support
  cancelSeparation: (separationId: string) => ipcRenderer.invoke('demucs:cancelSeparation', separationId),
  // Register callback for when the app is about to reload/close
  registerCancelCallback: (callback: () => void) => {
    cancelCallback = callback;
  },
  // Add progress listener
  onProgress: (progressChannel: string, callback: (progress: number) => void) => {
    const listener = (_: any, data: any) => {
      callback(data.progress);
    };
    ipcRenderer.on(progressChannel, listener);
    return () => {
      ipcRenderer.removeListener(progressChannel, listener);
    };
  }
});

// Listen for renderer process reloads to call the cancel callback
window.addEventListener('unload', () => {
  if (cancelCallback) {
    cancelCallback();
  }
});

// Add this API for file system operations
contextBridge.exposeInMainWorld('electron', {
  showItemInFolder: (filePath: string) => ipcRenderer.invoke('electron:showItemInFolder', filePath),
  readAudioFile: (filePath: string) => ipcRenderer.invoke('electron:readAudioFile', filePath),
}); 