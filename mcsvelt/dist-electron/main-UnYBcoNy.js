import { app as p, ipcMain as F, shell as A, dialog as z, BrowserWindow as G, session as Q } from "electron";
import h from "path";
import { fileURLToPath as $ } from "url";
import E from "fs";
import J from "os";
import X from "crypto";
import { createRequire as U } from "module";
var me = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function Z(c) {
  return c && c.__esModule && Object.prototype.hasOwnProperty.call(c, "default") ? c.default : c;
}
var x = { exports: {} };
const ee = "16.5.0", oe = {
  version: ee
};
var j;
function te() {
  if (j) return x.exports;
  j = 1;
  const c = E, s = h, o = J, l = X, _ = oe.version, b = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg;
  function w(e) {
    const n = {};
    let r = e.toString();
    r = r.replace(/\r\n?/mg, `
`);
    let i;
    for (; (i = b.exec(r)) != null; ) {
      const m = i[1];
      let t = i[2] || "";
      t = t.trim();
      const a = t[0];
      t = t.replace(/^(['"`])([\s\S]*)\1$/mg, "$2"), a === '"' && (t = t.replace(/\\n/g, `
`), t = t.replace(/\\r/g, "\r")), n[m] = t;
    }
    return n;
  }
  function N(e) {
    const n = C(e), r = f.configDotenv({ path: n });
    if (!r.parsed) {
      const a = new Error(`MISSING_DATA: Cannot parse ${n} for an unknown reason`);
      throw a.code = "MISSING_DATA", a;
    }
    const i = S(e).split(","), m = i.length;
    let t;
    for (let a = 0; a < m; a++)
      try {
        const u = i[a].trim(), y = M(r, u);
        t = f.decrypt(y.ciphertext, y.key);
        break;
      } catch (u) {
        if (a + 1 >= m)
          throw u;
      }
    return f.parse(t);
  }
  function v(e) {
    console.log(`[dotenv@${_}][WARN] ${e}`);
  }
  function g(e) {
    console.log(`[dotenv@${_}][DEBUG] ${e}`);
  }
  function S(e) {
    return e && e.DOTENV_KEY && e.DOTENV_KEY.length > 0 ? e.DOTENV_KEY : process.env.DOTENV_KEY && process.env.DOTENV_KEY.length > 0 ? process.env.DOTENV_KEY : "";
  }
  function M(e, n) {
    let r;
    try {
      r = new URL(n);
    } catch (u) {
      if (u.code === "ERR_INVALID_URL") {
        const y = new Error("INVALID_DOTENV_KEY: Wrong format. Must be in valid uri format like dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=development");
        throw y.code = "INVALID_DOTENV_KEY", y;
      }
      throw u;
    }
    const i = r.password;
    if (!i) {
      const u = new Error("INVALID_DOTENV_KEY: Missing key part");
      throw u.code = "INVALID_DOTENV_KEY", u;
    }
    const m = r.searchParams.get("environment");
    if (!m) {
      const u = new Error("INVALID_DOTENV_KEY: Missing environment part");
      throw u.code = "INVALID_DOTENV_KEY", u;
    }
    const t = `DOTENV_VAULT_${m.toUpperCase()}`, a = e.parsed[t];
    if (!a) {
      const u = new Error(`NOT_FOUND_DOTENV_ENVIRONMENT: Cannot locate environment ${t} in your .env.vault file.`);
      throw u.code = "NOT_FOUND_DOTENV_ENVIRONMENT", u;
    }
    return { ciphertext: a, key: i };
  }
  function C(e) {
    let n = null;
    if (e && e.path && e.path.length > 0)
      if (Array.isArray(e.path))
        for (const r of e.path)
          c.existsSync(r) && (n = r.endsWith(".vault") ? r : `${r}.vault`);
      else
        n = e.path.endsWith(".vault") ? e.path : `${e.path}.vault`;
    else
      n = s.resolve(process.cwd(), ".env.vault");
    return c.existsSync(n) ? n : null;
  }
  function R(e) {
    return e[0] === "~" ? s.join(o.homedir(), e.slice(1)) : e;
  }
  function Y(e) {
    !!(e && e.debug) && g("Loading env from encrypted .env.vault");
    const r = f._parseVault(e);
    let i = process.env;
    return e && e.processEnv != null && (i = e.processEnv), f.populate(i, r, e), { parsed: r };
  }
  function B(e) {
    const n = s.resolve(process.cwd(), ".env");
    let r = "utf8";
    const i = !!(e && e.debug);
    e && e.encoding ? r = e.encoding : i && g("No encoding is specified. UTF-8 is used by default");
    let m = [n];
    if (e && e.path)
      if (!Array.isArray(e.path))
        m = [R(e.path)];
      else {
        m = [];
        for (const y of e.path)
          m.push(R(y));
      }
    let t;
    const a = {};
    for (const y of m)
      try {
        const T = f.parse(c.readFileSync(y, { encoding: r }));
        f.populate(a, T, e);
      } catch (T) {
        i && g(`Failed to load ${y} ${T.message}`), t = T;
      }
    let u = process.env;
    return e && e.processEnv != null && (u = e.processEnv), f.populate(u, a, e), t ? { parsed: a, error: t } : { parsed: a };
  }
  function W(e) {
    if (S(e).length === 0)
      return f.configDotenv(e);
    const n = C(e);
    return n ? f._configVault(e) : (v(`You set DOTENV_KEY but you are missing a .env.vault file at ${n}. Did you forget to build it?`), f.configDotenv(e));
  }
  function q(e, n) {
    const r = Buffer.from(n.slice(-64), "hex");
    let i = Buffer.from(e, "base64");
    const m = i.subarray(0, 12), t = i.subarray(-16);
    i = i.subarray(12, -16);
    try {
      const a = l.createDecipheriv("aes-256-gcm", r, m);
      return a.setAuthTag(t), `${a.update(i)}${a.final()}`;
    } catch (a) {
      const u = a instanceof RangeError, y = a.message === "Invalid key length", T = a.message === "Unsupported state or unable to authenticate data";
      if (u || y) {
        const k = new Error("INVALID_DOTENV_KEY: It must be 64 characters long (or more)");
        throw k.code = "INVALID_DOTENV_KEY", k;
      } else if (T) {
        const k = new Error("DECRYPTION_FAILED: Please check your DOTENV_KEY");
        throw k.code = "DECRYPTION_FAILED", k;
      } else
        throw a;
    }
  }
  function H(e, n, r = {}) {
    const i = !!(r && r.debug), m = !!(r && r.override);
    if (typeof n != "object") {
      const t = new Error("OBJECT_REQUIRED: Please check the processEnv argument being passed to populate");
      throw t.code = "OBJECT_REQUIRED", t;
    }
    for (const t of Object.keys(n))
      Object.prototype.hasOwnProperty.call(e, t) ? (m === !0 && (e[t] = n[t]), i && g(m === !0 ? `"${t}" is already defined and WAS overwritten` : `"${t}" is already defined and was NOT overwritten`)) : e[t] = n[t];
  }
  const f = {
    configDotenv: B,
    _configVault: Y,
    _parseVault: N,
    config: W,
    decrypt: q,
    parse: w,
    populate: H
  };
  return x.exports.configDotenv = f.configDotenv, x.exports._configVault = f._configVault, x.exports._parseVault = f._parseVault, x.exports.config = f.config, x.exports.decrypt = f.decrypt, x.exports.parse = f.parse, x.exports.populate = f.populate, x.exports = f, x.exports;
}
var re = te();
const ne = /* @__PURE__ */ Z(re);
ne.config();
const V = h.dirname($(import.meta.url)), O = process.env.NODE_ENV === "development";
process.platform === "win32" && p.setAppUserModelId(p.getName());
let d = null;
function ae() {
  const c = "MoodClassifier";
  switch (process.platform) {
    case "darwin":
      return h.join(process.env.HOME || "", "Library", "Application Support", c);
    case "win32":
      return h.join(process.env.APPDATA || "", c);
    case "linux":
      return h.join(process.env.HOME || "", `.${c}`);
    default:
      return console.log("Unsupported platform!"), process.exit(1), "";
  }
}
const P = ae();
E.existsSync(P) || E.mkdirSync(P, { recursive: !0 });
let I, L;
async function K() {
  console.log("Creating window..."), console.log("Development mode:", O), p.commandLine.appendSwitch("enable-zero-copy"), p.commandLine.appendSwitch("enable-gpu-rasterization"), p.commandLine.appendSwitch("enable-native-gpu-memory-buffers"), p.commandLine.appendSwitch("canvas-msaa-sample-count", "0"), p.commandLine.appendSwitch("disable-smooth-scrolling"), p.commandLine.appendSwitch("ignore-gpu-blocklist");
  const c = h.join(V, "preload.js");
  console.log("Preload script path:", c), d = new G({
    width: 1200,
    height: 800,
    show: !0,
    // Show immediately to better debug startup issues
    backgroundColor: "#0a0a0a",
    // Set background color to reduce flicker
    webPreferences: {
      nodeIntegration: !1,
      // Disable node integration for security
      contextIsolation: !0,
      // Enable context isolation for security
      sandbox: !0,
      // Enable sandbox for additional security
      preload: c,
      // Use preload script for safe API exposure
      disableBlinkFeatures: "Auxclick",
      // Disable potentially dangerous features
      webSecurity: !0,
      // Ensure web security is enabled
      allowRunningInsecureContent: !1,
      // Prevent loading of insecure content
      backgroundThrottling: !1,
      // Prevent throttling when in background
      enableWebSQL: !1,
      // Disable deprecated WebSQL
      spellcheck: !1,
      // Disable spellcheck for performance
      v8CacheOptions: "code"
      // Enable V8 code caching for better JS performance
    },
    autoHideMenuBar: !0,
    // Hide menu bar for cleaner UI
    frame: !0,
    titleBarStyle: "default"
  }), Q.defaultSession.webRequest.onHeadersReceived({ urls: ["*://*/*"] }, (s, o) => {
    const l = { ...s.responseHeaders };
    Object.keys(l).forEach((D) => {
      D.toLowerCase() === "content-security-policy" && delete l[D];
    }), l["Content-Security-Policy"] = [
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net blob:; script-src-elem 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net blob:; object-src 'none'; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; img-src 'self' data: https://*; media-src 'self' blob:; connect-src 'self' https://*; worker-src 'self' blob:; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; frame-src 'none';"
    ], o({ responseHeaders: l });
  }), d.webContents.on("will-navigate", (s, o) => {
    const l = new URL(o);
    !O && !["localhost", "127.0.0.1"].includes(l.hostname) && (s.preventDefault(), A.openExternal(o), console.log(`External navigation to ${o} opened in default browser`));
  }), d.webContents.setWindowOpenHandler(({ url: s }) => (A.openExternal(s), { action: "deny" }));
  try {
    if (O) {
      console.log("Loading from dev server: http://localhost:5173");
      try {
        await d.loadURL("http://localhost:5173"), console.log("Successfully loaded from dev server");
      } catch (s) {
        console.error("Failed to load from dev server:", s);
        try {
          const o = h.join(V, "../dist/index.html");
          if (E.existsSync(o))
            console.log("Trying fallback path:", o), await d.loadFile(o);
          else
            throw new Error("No fallback path available");
        } catch (o) {
          console.error("Failed to load fallback:", o), d.webContents.loadURL("data:text/html,<h1>Failed to load application</h1>");
        }
      }
    } else {
      const s = h.join(V, "../dist/index.html");
      console.log("Loading from file:", s), await d.loadFile(s);
    }
  } catch (s) {
    console.error("Error loading content:", s);
  }
  d.once("ready-to-show", () => {
    console.log("Window ready to show"), d == null || d.show();
  }), d.on("closed", () => {
    d = null;
  });
}
async function se() {
  if (console.log("Starting application initialization..."), F.handle("openExternalLink", (s, o) => {
    try {
      const l = new URL(o);
      return l.protocol === "http:" || l.protocol === "https:" ? (A.openExternal(o), console.log(`Opened external URL: ${o}`), { success: !0 }) : (console.warn(`Blocked opening non-HTTP URL: ${o}`), { error: "Invalid URL protocol" });
    } catch {
      return console.error(`Invalid URL received: ${o}`), { error: "Invalid URL format" };
    }
  }), F.handle("download-youtube-audio", async (s, o) => {
    try {
      return console.log("Downloading YouTube audio..."), await le(o);
    } catch (l) {
      throw console.error("Error downloading with yt-dlp:", l.message), new Error(`Failed to download YouTube audio: ${l.message}`);
    }
  }), F.handle("read-audio-file", async (s, o) => {
    try {
      if (typeof o == "object")
        if (o.filePath)
          o = o.filePath;
        else
          throw new Error("Invalid file path object provided");
      if (typeof o != "string")
        throw new Error("Invalid file path provided");
      return await E.promises.readFile(o);
    } catch (l) {
      throw console.error("Error reading audio file:", l), l;
    }
  }), F.handle("toggle-enabled", async (s, o) => {
    try {
      return { success: !0, enabled: o };
    } catch (l) {
      throw console.error("Error toggling enabled state:", l), l;
    }
  }), p.commandLine.appendSwitch("enable-features", "CalculateNativeWinOcclusion"), p.commandLine.appendSwitch("js-flags", "--max-old-space-size=512"), p.on("browser-window-blur", () => {
    d && !O && d.webContents.setBackgroundThrottling(!0);
  }), p.on("browser-window-focus", () => {
    d && !O && d.webContents.setBackgroundThrottling(!1);
  }), !p.requestSingleInstanceLock()) {
    console.log("Another instance is already running. Quitting..."), p.quit();
    return;
  }
  p.on("second-instance", () => {
    d && (d.isMinimized() && d.restore(), d.focus());
  }), await p.whenReady(), console.log("Electron app ready, creating window..."), K(), p.on("activate", () => {
    d === null && K();
  });
}
async function le(c) {
  if (!I)
    try {
      const b = U(import.meta.url)("youtube-dl-exec"), w = process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp", N = [
        // Check in dist-electron/bin first (our copied binary)
        h.resolve(h.join(h.dirname($(import.meta.url)), "bin", w)),
        // Check in node_modules
        h.resolve(h.join(
          h.dirname($(import.meta.url)),
          "../node_modules/youtube-dl-exec/bin",
          w
        )),
        // Check system location on macOS
        process.platform === "darwin" ? "/usr/local/bin/yt-dlp" : null,
        // Other possible locations
        process.platform === "win32" ? "C:\\Program Files\\yt-dlp\\yt-dlp.exe" : null,
        process.platform === "linux" ? "/usr/bin/yt-dlp" : null
      ].filter(Boolean);
      let v = null;
      for (const g of N)
        if (console.log("Checking for yt-dlp at:", g), E.existsSync(g)) {
          v = g, console.log("Found yt-dlp at:", v);
          break;
        }
      v ? (console.log("Using custom binary path for youtube-dl-exec:", v), I = b.create(v)) : (console.log("Binary not found at any expected path, using default"), I = b);
    } catch (_) {
      throw console.error("Failed to load youtube-dl-exec:", _), new Error("youtube-dl-exec is not installed. Run: npm install youtube-dl-exec --save");
    }
  if (!L)
    try {
      L = (await import("./index-yHl5tcjf.js").then((b) => b.i)).default;
      try {
        const w = U(import.meta.url)("ffmpeg-static");
        if (E.existsSync(w))
          console.log("Using ffmpeg-static path:", w), L.setFfmpegPath(w);
        else {
          const N = [
            process.platform === "darwin" ? "/opt/homebrew/bin/ffmpeg" : null,
            process.platform === "darwin" ? "/usr/local/bin/ffmpeg" : null,
            process.platform === "win32" ? "C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe" : null,
            process.platform === "linux" ? "/usr/bin/ffmpeg" : null
          ].filter(Boolean);
          for (const v of N)
            if (v && E.existsSync(v)) {
              console.log("Found system ffmpeg at:", v), L.setFfmpegPath(v);
              break;
            }
        }
      } catch {
        console.warn("Could not load ffmpeg-static, using system ffmpeg");
      }
    } catch (_) {
      throw console.error("Failed to load fluent-ffmpeg:", _), new Error("fluent-ffmpeg is not installed. Run: npm install fluent-ffmpeg --save");
    }
  const s = await I(c, {
    dumpSingleJson: !0,
    noCheckCertificates: !0,
    noWarnings: !0,
    preferFreeFormats: !0,
    addHeader: [
      "referer:youtube.com",
      "user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
    ]
  }), { filePath: o, canceled: l } = await z.showSaveDialog({
    title: "Save Audio File",
    defaultPath: `${s.title.replace(/[/\\?%*:|"<>]/g, "-")}.wav`,
    filters: [{ name: "Audio Files", extensions: ["wav"] }]
  });
  if (l || !o)
    throw new Error("Save operation was canceled.");
  const D = h.join(P, `${Date.now()}.m4a`);
  if (console.log("Downloading with yt-dlp to:", D), await I(c, {
    output: D,
    extractAudio: !0,
    audioFormat: "m4a",
    // Using m4a instead of webm
    audioQuality: "0",
    // Best quality - must be a string
    format: "bestaudio",
    // Get best audio quality
    noCheckCertificates: !0,
    noWarnings: !0,
    preferFreeFormats: !0,
    addHeader: [
      "referer:youtube.com",
      "user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
    ]
  }), !E.existsSync(D))
    throw new Error("Failed to download the audio file");
  return console.log("Downloaded audio to temp file:", D), new Promise((_, b) => {
    try {
      const w = h.resolve(D), N = h.resolve(String(o));
      console.log("Converting from:", w), console.log("Converting to:", N), L(w).outputOptions([
        "-f wav",
        "-acodec pcm_s16le",
        "-ac 2",
        "-ar 44100"
      ]).on("progress", (g) => {
        g && g.percent && console.log("FFmpeg processing progress:", g.percent.toFixed(1), "%");
      }).on("end", () => {
        console.log("FFmpeg conversion complete");
        try {
          E.unlinkSync(w);
        } catch (g) {
          console.error("Error deleting temp file:", g);
        }
        _({
          filePath: N,
          videoDetails: {
            title: s.title,
            author: s.uploader
          }
        });
      }).on("error", (g) => {
        console.error("FFmpeg error:", g);
        try {
          E.unlinkSync(w);
        } catch (S) {
          console.error("Error deleting temp file:", S);
        }
        b(g);
      }).save(N);
    } catch (w) {
      console.error("Error during ffmpeg setup:", w), b(w);
    }
  });
}
try {
  se();
} catch (c) {
  console.error("Error during startup:", c);
}
p.on("window-all-closed", () => {
  process.platform !== "darwin" && p.quit();
});
export {
  me as c,
  Z as g
};
