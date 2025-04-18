const { contextBridge, ipcRenderer, webFrame } = require("electron");
const validSendChannels = ["toMain", "requestData", "logEvent", "openExternalLink"];
const validReceiveChannels = ["fromMain", "responseData", "appUpdate"];
const validInvokeChannels = [
  "download-youtube-audio",
  "read-audio-file",
  "toggle-enabled",
  "recognize-music",
  "save-temp-file",
  "fetch-image",
  "cleanup-temp-files",
  "getData",
  "performAction",
  "checkStatus",
  "demucs:separate",
  "electron:showItemInFolder",
  "check-demucs-installed",
  "electron:readAudioFile",
  "demucs:cancelSeparation"
];
contextBridge.exposeInMainWorld("api", {
  // Invoke methods and get responses (Promise)
  invoke: async (channel, data) => {
    if (validInvokeChannels.includes(channel)) {
      return await ipcRenderer.invoke(channel, data);
    }
    throw new Error(`Invalid invoke channel: ${channel}`);
  },
  // Send messages to main process
  send: (channel, data) => {
    if (validSendChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  // Receive messages from main process
  receive: (channel, func) => {
    if (validReceiveChannels.includes(channel)) {
      ipcRenderer.on(channel, (_event, ...args) => func(...args));
    }
  },
  // Helper to open external links
  openExternal: (url) => {
    ipcRenderer.send("openExternalLink", url);
  }
});
contextBridge.exposeInMainWorld("appInfo", {
  version: process.env.APP_VERSION || "1.0.0",
  platform: process.platform
});
contextBridge.exposeInMainWorld("secureEval", {
  safeEval: (code) => {
    console.warn("Eval attempt blocked for security reasons");
    return null;
  }
});
const initOptimizations = () => {
  if (webFrame) {
    webFrame.setZoomFactor(1);
    webFrame.setVisualZoomLevelLimits(1, 1);
  }
};
initOptimizations();
document.addEventListener("DOMContentLoaded", () => {
  document.addEventListener("click", (event) => {
    const element = event.target;
    const linkElement = element.closest("a");
    if (linkElement && linkElement.href && linkElement.href.startsWith("http")) {
      event.preventDefault();
      ipcRenderer.send("openExternalLink", linkElement.href);
    }
  });
});
let cancelCallback = null;
contextBridge.exposeInMainWorld("demucsAPI", {
  separate: (filePath) => ipcRenderer.invoke("demucs:separate", filePath),
  checkInstalled: () => ipcRenderer.invoke("check-demucs-installed"),
  // Add cancellation support
  cancelSeparation: (separationId) => ipcRenderer.invoke("demucs:cancelSeparation", separationId),
  // Register callback for when the app is about to reload/close
  registerCancelCallback: (callback) => {
    cancelCallback = callback;
  },
  // Add progress listener
  onProgress: (progressChannel, callback) => {
    const listener = (_, data) => {
      callback(data.progress);
    };
    ipcRenderer.on(progressChannel, listener);
    return () => {
      ipcRenderer.removeListener(progressChannel, listener);
    };
  }
});
window.addEventListener("unload", () => {
  if (cancelCallback) {
    cancelCallback();
  }
});
contextBridge.exposeInMainWorld("electron", {
  showItemInFolder: (filePath) => ipcRenderer.invoke("electron:showItemInFolder", filePath),
  readAudioFile: (filePath) => ipcRenderer.invoke("electron:readAudioFile", filePath)
});
//# sourceMappingURL=preload.js.map
