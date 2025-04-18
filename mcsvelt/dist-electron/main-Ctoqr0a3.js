import { app, ipcMain, shell, dialog, BrowserWindow, session } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import require$$1 from "os";
import require$$3 from "crypto";
var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
var main = { exports: {} };
const version = "16.5.0";
const require$$4 = {
  version
};
var hasRequiredMain;
function requireMain() {
  if (hasRequiredMain) return main.exports;
  hasRequiredMain = 1;
  const fs$1 = fs;
  const path$1 = path;
  const os = require$$1;
  const crypto = require$$3;
  const packageJson = require$$4;
  const version2 = packageJson.version;
  const LINE = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg;
  function parse(src) {
    const obj = {};
    let lines = src.toString();
    lines = lines.replace(/\r\n?/mg, "\n");
    let match;
    while ((match = LINE.exec(lines)) != null) {
      const key = match[1];
      let value = match[2] || "";
      value = value.trim();
      const maybeQuote = value[0];
      value = value.replace(/^(['"`])([\s\S]*)\1$/mg, "$2");
      if (maybeQuote === '"') {
        value = value.replace(/\\n/g, "\n");
        value = value.replace(/\\r/g, "\r");
      }
      obj[key] = value;
    }
    return obj;
  }
  function _parseVault(options) {
    const vaultPath = _vaultPath(options);
    const result = DotenvModule.configDotenv({ path: vaultPath });
    if (!result.parsed) {
      const err = new Error(`MISSING_DATA: Cannot parse ${vaultPath} for an unknown reason`);
      err.code = "MISSING_DATA";
      throw err;
    }
    const keys = _dotenvKey(options).split(",");
    const length = keys.length;
    let decrypted;
    for (let i = 0; i < length; i++) {
      try {
        const key = keys[i].trim();
        const attrs = _instructions(result, key);
        decrypted = DotenvModule.decrypt(attrs.ciphertext, attrs.key);
        break;
      } catch (error) {
        if (i + 1 >= length) {
          throw error;
        }
      }
    }
    return DotenvModule.parse(decrypted);
  }
  function _warn(message) {
    console.log(`[dotenv@${version2}][WARN] ${message}`);
  }
  function _debug(message) {
    console.log(`[dotenv@${version2}][DEBUG] ${message}`);
  }
  function _dotenvKey(options) {
    if (options && options.DOTENV_KEY && options.DOTENV_KEY.length > 0) {
      return options.DOTENV_KEY;
    }
    if (process.env.DOTENV_KEY && process.env.DOTENV_KEY.length > 0) {
      return process.env.DOTENV_KEY;
    }
    return "";
  }
  function _instructions(result, dotenvKey) {
    let uri;
    try {
      uri = new URL(dotenvKey);
    } catch (error) {
      if (error.code === "ERR_INVALID_URL") {
        const err = new Error("INVALID_DOTENV_KEY: Wrong format. Must be in valid uri format like dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=development");
        err.code = "INVALID_DOTENV_KEY";
        throw err;
      }
      throw error;
    }
    const key = uri.password;
    if (!key) {
      const err = new Error("INVALID_DOTENV_KEY: Missing key part");
      err.code = "INVALID_DOTENV_KEY";
      throw err;
    }
    const environment = uri.searchParams.get("environment");
    if (!environment) {
      const err = new Error("INVALID_DOTENV_KEY: Missing environment part");
      err.code = "INVALID_DOTENV_KEY";
      throw err;
    }
    const environmentKey = `DOTENV_VAULT_${environment.toUpperCase()}`;
    const ciphertext = result.parsed[environmentKey];
    if (!ciphertext) {
      const err = new Error(`NOT_FOUND_DOTENV_ENVIRONMENT: Cannot locate environment ${environmentKey} in your .env.vault file.`);
      err.code = "NOT_FOUND_DOTENV_ENVIRONMENT";
      throw err;
    }
    return { ciphertext, key };
  }
  function _vaultPath(options) {
    let possibleVaultPath = null;
    if (options && options.path && options.path.length > 0) {
      if (Array.isArray(options.path)) {
        for (const filepath of options.path) {
          if (fs$1.existsSync(filepath)) {
            possibleVaultPath = filepath.endsWith(".vault") ? filepath : `${filepath}.vault`;
          }
        }
      } else {
        possibleVaultPath = options.path.endsWith(".vault") ? options.path : `${options.path}.vault`;
      }
    } else {
      possibleVaultPath = path$1.resolve(process.cwd(), ".env.vault");
    }
    if (fs$1.existsSync(possibleVaultPath)) {
      return possibleVaultPath;
    }
    return null;
  }
  function _resolveHome(envPath) {
    return envPath[0] === "~" ? path$1.join(os.homedir(), envPath.slice(1)) : envPath;
  }
  function _configVault(options) {
    const debug = Boolean(options && options.debug);
    if (debug) {
      _debug("Loading env from encrypted .env.vault");
    }
    const parsed = DotenvModule._parseVault(options);
    let processEnv = process.env;
    if (options && options.processEnv != null) {
      processEnv = options.processEnv;
    }
    DotenvModule.populate(processEnv, parsed, options);
    return { parsed };
  }
  function configDotenv(options) {
    const dotenvPath = path$1.resolve(process.cwd(), ".env");
    let encoding = "utf8";
    const debug = Boolean(options && options.debug);
    if (options && options.encoding) {
      encoding = options.encoding;
    } else {
      if (debug) {
        _debug("No encoding is specified. UTF-8 is used by default");
      }
    }
    let optionPaths = [dotenvPath];
    if (options && options.path) {
      if (!Array.isArray(options.path)) {
        optionPaths = [_resolveHome(options.path)];
      } else {
        optionPaths = [];
        for (const filepath of options.path) {
          optionPaths.push(_resolveHome(filepath));
        }
      }
    }
    let lastError;
    const parsedAll = {};
    for (const path2 of optionPaths) {
      try {
        const parsed = DotenvModule.parse(fs$1.readFileSync(path2, { encoding }));
        DotenvModule.populate(parsedAll, parsed, options);
      } catch (e) {
        if (debug) {
          _debug(`Failed to load ${path2} ${e.message}`);
        }
        lastError = e;
      }
    }
    let processEnv = process.env;
    if (options && options.processEnv != null) {
      processEnv = options.processEnv;
    }
    DotenvModule.populate(processEnv, parsedAll, options);
    if (lastError) {
      return { parsed: parsedAll, error: lastError };
    } else {
      return { parsed: parsedAll };
    }
  }
  function config(options) {
    if (_dotenvKey(options).length === 0) {
      return DotenvModule.configDotenv(options);
    }
    const vaultPath = _vaultPath(options);
    if (!vaultPath) {
      _warn(`You set DOTENV_KEY but you are missing a .env.vault file at ${vaultPath}. Did you forget to build it?`);
      return DotenvModule.configDotenv(options);
    }
    return DotenvModule._configVault(options);
  }
  function decrypt(encrypted, keyStr) {
    const key = Buffer.from(keyStr.slice(-64), "hex");
    let ciphertext = Buffer.from(encrypted, "base64");
    const nonce = ciphertext.subarray(0, 12);
    const authTag = ciphertext.subarray(-16);
    ciphertext = ciphertext.subarray(12, -16);
    try {
      const aesgcm = crypto.createDecipheriv("aes-256-gcm", key, nonce);
      aesgcm.setAuthTag(authTag);
      return `${aesgcm.update(ciphertext)}${aesgcm.final()}`;
    } catch (error) {
      const isRange = error instanceof RangeError;
      const invalidKeyLength = error.message === "Invalid key length";
      const decryptionFailed = error.message === "Unsupported state or unable to authenticate data";
      if (isRange || invalidKeyLength) {
        const err = new Error("INVALID_DOTENV_KEY: It must be 64 characters long (or more)");
        err.code = "INVALID_DOTENV_KEY";
        throw err;
      } else if (decryptionFailed) {
        const err = new Error("DECRYPTION_FAILED: Please check your DOTENV_KEY");
        err.code = "DECRYPTION_FAILED";
        throw err;
      } else {
        throw error;
      }
    }
  }
  function populate(processEnv, parsed, options = {}) {
    const debug = Boolean(options && options.debug);
    const override = Boolean(options && options.override);
    if (typeof parsed !== "object") {
      const err = new Error("OBJECT_REQUIRED: Please check the processEnv argument being passed to populate");
      err.code = "OBJECT_REQUIRED";
      throw err;
    }
    for (const key of Object.keys(parsed)) {
      if (Object.prototype.hasOwnProperty.call(processEnv, key)) {
        if (override === true) {
          processEnv[key] = parsed[key];
        }
        if (debug) {
          if (override === true) {
            _debug(`"${key}" is already defined and WAS overwritten`);
          } else {
            _debug(`"${key}" is already defined and was NOT overwritten`);
          }
        }
      } else {
        processEnv[key] = parsed[key];
      }
    }
  }
  const DotenvModule = {
    configDotenv,
    _configVault,
    _parseVault,
    config,
    decrypt,
    parse,
    populate
  };
  main.exports.configDotenv = DotenvModule.configDotenv;
  main.exports._configVault = DotenvModule._configVault;
  main.exports._parseVault = DotenvModule._parseVault;
  main.exports.config = DotenvModule.config;
  main.exports.decrypt = DotenvModule.decrypt;
  main.exports.parse = DotenvModule.parse;
  main.exports.populate = DotenvModule.populate;
  main.exports = DotenvModule;
  return main.exports;
}
var mainExports = requireMain();
const dotenv = /* @__PURE__ */ getDefaultExportFromCjs(mainExports);
dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV === "development" && process.argv.indexOf("--dev") !== -1;
if (process.platform === "win32") {
  app.setAppUserModelId(app.getName());
}
let mainWindow = null;
function getAppDataPath() {
  const appName = "MoodClassifier";
  switch (process.platform) {
    case "darwin": {
      return path.join(process.env.HOME || "", "Library", "Application Support", appName);
    }
    case "win32": {
      return path.join(process.env.APPDATA || "", appName);
    }
    case "linux": {
      return path.join(process.env.HOME || "", `.${appName}`);
    }
    default: {
      console.log("Unsupported platform!");
      process.exit(1);
      return "";
    }
  }
}
const appDataPath = getAppDataPath();
if (!fs.existsSync(appDataPath)) {
  fs.mkdirSync(appDataPath, { recursive: true });
}
let youtubeDlExec;
let ffmpeg;
async function createWindow() {
  console.log("Creating window...");
  console.log("Development mode:", isDev);
  app.commandLine.appendSwitch("enable-zero-copy");
  app.commandLine.appendSwitch("enable-gpu-rasterization");
  app.commandLine.appendSwitch("enable-native-gpu-memory-buffers");
  app.commandLine.appendSwitch("canvas-msaa-sample-count", "0");
  app.commandLine.appendSwitch("disable-smooth-scrolling");
  app.commandLine.appendSwitch("ignore-gpu-blocklist");
  const preloadScriptPath = path.join(__dirname, "preload.js");
  console.log("Preload script path:", preloadScriptPath);
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    // Start hidden for performance
    backgroundColor: "#0a0a0a",
    // Set background color to reduce flicker
    webPreferences: {
      nodeIntegration: false,
      // Disable node integration for security
      contextIsolation: true,
      // Enable context isolation for security
      sandbox: true,
      // Enable sandbox for additional security
      preload: preloadScriptPath,
      // Use preload script for safe API exposure
      disableBlinkFeatures: "Auxclick",
      // Disable potentially dangerous features
      webSecurity: true,
      // Ensure web security is enabled
      allowRunningInsecureContent: false,
      // Prevent loading of insecure content
      backgroundThrottling: false,
      // Prevent throttling when in background
      enableWebSQL: false,
      // Disable deprecated WebSQL
      spellcheck: false,
      // Disable spellcheck for performance
      v8CacheOptions: "code"
      // Enable V8 code caching for better JS performance
    },
    autoHideMenuBar: true,
    // Hide menu bar for cleaner UI
    frame: true,
    titleBarStyle: "default"
  });
  session.defaultSession.webRequest.onHeadersReceived({ urls: ["*://*/*"] }, (details, callback) => {
    const headers = { ...details.responseHeaders };
    Object.keys(headers).forEach((key) => {
      if (key.toLowerCase() === "content-security-policy") {
        delete headers[key];
      }
    });
    headers["Content-Security-Policy"] = [
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net blob:; script-src-elem 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net blob:; object-src 'none'; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; img-src 'self' data: https://*; media-src 'self' blob:; connect-src 'self' https://*; worker-src 'self' blob:; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; frame-src 'none';"
    ];
    callback({ responseHeaders: headers });
  });
  mainWindow.webContents.on("will-navigate", (event, url) => {
    const parsedUrl = new URL(url);
    const validOrigins = ["localhost", "127.0.0.1"];
    if (!isDev && !validOrigins.includes(parsedUrl.hostname)) {
      event.preventDefault();
      shell.openExternal(url);
      console.log(`External navigation to ${url} opened in default browser`);
    }
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
  try {
    if (isDev) {
      console.log("Loading from dev server: http://localhost:5173");
      await mainWindow.loadURL("http://localhost:5173");
    } else {
      const filePath = path.join(__dirname, "../dist/index.html");
      console.log("Loading from file:", filePath);
      await mainWindow.loadFile(filePath);
    }
  } catch (error) {
    console.error("Error loading content:", error);
  }
  mainWindow.once("ready-to-show", () => {
    console.log("Window ready to show");
    mainWindow == null ? void 0 : mainWindow.show();
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}
async function optimizeStartup() {
  console.log("Starting application initialization...");
  ipcMain.handle("openExternalLink", (event, url) => {
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") {
        shell.openExternal(url);
        console.log(`Opened external URL: ${url}`);
        return { success: true };
      } else {
        console.warn(`Blocked opening non-HTTP URL: ${url}`);
        return { error: "Invalid URL protocol" };
      }
    } catch (error) {
      console.error(`Invalid URL received: ${url}`);
      return { error: "Invalid URL format" };
    }
  });
  ipcMain.handle("download-youtube-audio", async (event, url) => {
    try {
      console.log("Downloading YouTube audio...");
      return await downloadWithYtDlp(url);
    } catch (error) {
      console.error("Error downloading with yt-dlp:", error.message);
      throw new Error(`Failed to download YouTube audio: ${error.message}`);
    }
  });
  ipcMain.handle("read-audio-file", async (event, filePath) => {
    try {
      if (typeof filePath === "object") {
        if (filePath.filePath) {
          filePath = filePath.filePath;
        } else {
          throw new Error("Invalid file path object provided");
        }
      }
      if (typeof filePath !== "string") {
        throw new Error("Invalid file path provided");
      }
      const buffer = await fs.promises.readFile(filePath);
      return buffer;
    } catch (error) {
      console.error("Error reading audio file:", error);
      throw error;
    }
  });
  ipcMain.handle("toggle-enabled", async (event, enabled) => {
    try {
      return { success: true, enabled };
    } catch (error) {
      console.error("Error toggling enabled state:", error);
      throw error;
    }
  });
  app.commandLine.appendSwitch("enable-features", "CalculateNativeWinOcclusion");
  app.commandLine.appendSwitch("js-flags", "--max-old-space-size=512");
  app.on("browser-window-blur", () => {
    if (mainWindow && !isDev) {
      mainWindow.webContents.setBackgroundThrottling(true);
    }
  });
  app.on("browser-window-focus", () => {
    if (mainWindow && !isDev) {
      mainWindow.webContents.setBackgroundThrottling(false);
    }
  });
  const gotTheLock = app.requestSingleInstanceLock();
  if (!gotTheLock) {
    console.log("Another instance is already running. Quitting...");
    app.quit();
    return;
  }
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
  await app.whenReady();
  console.log("Electron app ready, creating window...");
  createWindow();
  app.on("activate", () => {
    if (mainWindow === null) createWindow();
  });
}
async function downloadWithYtDlp(url) {
  if (!youtubeDlExec) {
    try {
      const ytdlModule = await import("./index-rlNZRyja.js").then((n) => n.i);
      youtubeDlExec = {
        default: ytdlModule.default
      };
    } catch (error) {
      console.error("Failed to load youtube-dl-exec:", error);
      throw new Error("youtube-dl-exec is not installed. Run: npm install youtube-dl-exec --save");
    }
  }
  if (!ffmpeg) {
    try {
      const ffmpegImport = await import("./index-DGnylqWe.js").then((n) => n.i);
      ffmpeg = ffmpegImport.default;
      try {
        const ffmpegStaticImport = await import("./index-lbOhBgDR.js").then((n) => n.i);
        ffmpeg.setFfmpegPath(ffmpegStaticImport.default);
      } catch (err) {
        console.warn("Could not load ffmpeg-static, using system ffmpeg");
      }
    } catch (error) {
      console.error("Failed to load fluent-ffmpeg:", error);
      throw new Error("fluent-ffmpeg is not installed. Run: npm install fluent-ffmpeg --save");
    }
  }
  const videoInfo = await youtubeDlExec.default(url, {
    dumpSingleJson: true,
    noCheckCertificates: true,
    noWarnings: true,
    preferFreeFormats: true,
    addHeader: [
      "referer:youtube.com",
      "user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
    ]
  });
  const { filePath, canceled } = await dialog.showSaveDialog({
    title: "Save Audio File",
    defaultPath: `${videoInfo.title.replace(/[/\\?%*:|"<>]/g, "-")}.wav`,
    filters: [{ name: "Audio Files", extensions: ["wav"] }]
  });
  if (canceled || !filePath) {
    throw new Error("Save operation was canceled.");
  }
  const tempFile = path.join(appDataPath, `${Date.now()}.m4a`);
  console.log("Downloading with yt-dlp to:", tempFile);
  await youtubeDlExec.default(url, {
    output: tempFile,
    extractAudio: true,
    audioFormat: "m4a",
    // Using m4a instead of webm
    audioQuality: "0",
    // Best quality - must be a string
    format: "bestaudio",
    // Get best audio quality
    noCheckCertificates: true,
    noWarnings: true,
    preferFreeFormats: true,
    addHeader: [
      "referer:youtube.com",
      "user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
    ]
  });
  if (!fs.existsSync(tempFile)) {
    throw new Error("Failed to download the audio file");
  }
  console.log("Downloaded audio to temp file:", tempFile);
  return new Promise((resolve, reject) => {
    ffmpeg(tempFile).toFormat("wav").audioCodec("pcm_s16le").audioChannels(2).audioFrequency(44100).on("progress", (progress) => {
      console.log("FFmpeg processing progress:", progress.percent, "%");
    }).on("end", () => {
      console.log("FFmpeg conversion complete");
      fs.unlink(tempFile, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });
      resolve({
        filePath,
        videoDetails: {
          title: videoInfo.title,
          author: videoInfo.uploader
        }
      });
    }).on("error", (error) => {
      fs.unlink(tempFile, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });
      console.error("FFmpeg error:", error);
      reject(error);
    }).save(filePath);
  });
}
try {
  optimizeStartup();
} catch (error) {
  console.error("Error during startup:", error);
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
export {
  commonjsGlobal as c,
  getDefaultExportFromCjs as g
};
//# sourceMappingURL=main-Ctoqr0a3.js.map
