import { app as p, ipcMain as L, shell as S, dialog as H, BrowserWindow as q, session as z } from "electron";
import b from "path";
import { fileURLToPath as G } from "url";
import D from "fs";
import Q from "os";
import J from "crypto";
var pe = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function X(c) {
  return c && c.__esModule && Object.prototype.hasOwnProperty.call(c, "default") ? c.default : c;
}
var E = { exports: {} };
const Z = "16.5.0", ee = {
  version: Z
};
var C;
function oe() {
  if (C) return E.exports;
  C = 1;
  const c = D, s = b, o = Q, l = J, v = ee.version, y = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg;
  function w(e) {
    const n = {};
    let r = e.toString();
    r = r.replace(/\r\n?/mg, `
`);
    let i;
    for (; (i = y.exec(r)) != null; ) {
      const h = i[1];
      let t = i[2] || "";
      t = t.trim();
      const a = t[0];
      t = t.replace(/^(['"`])([\s\S]*)\1$/mg, "$2"), a === '"' && (t = t.replace(/\\n/g, `
`), t = t.replace(/\\r/g, "\r")), n[h] = t;
    }
    return n;
  }
  function k(e) {
    const n = $(e), r = f.configDotenv({ path: n });
    if (!r.parsed) {
      const a = new Error(`MISSING_DATA: Cannot parse ${n} for an unknown reason`);
      throw a.code = "MISSING_DATA", a;
    }
    const i = F(e).split(","), h = i.length;
    let t;
    for (let a = 0; a < h; a++)
      try {
        const u = i[a].trim(), m = M(r, u);
        t = f.decrypt(m.ciphertext, m.key);
        break;
      } catch (u) {
        if (a + 1 >= h)
          throw u;
      }
    return f.parse(t);
  }
  function U(e) {
    console.log(`[dotenv@${v}][WARN] ${e}`);
  }
  function N(e) {
    console.log(`[dotenv@${v}][DEBUG] ${e}`);
  }
  function F(e) {
    return e && e.DOTENV_KEY && e.DOTENV_KEY.length > 0 ? e.DOTENV_KEY : process.env.DOTENV_KEY && process.env.DOTENV_KEY.length > 0 ? process.env.DOTENV_KEY : "";
  }
  function M(e, n) {
    let r;
    try {
      r = new URL(n);
    } catch (u) {
      if (u.code === "ERR_INVALID_URL") {
        const m = new Error("INVALID_DOTENV_KEY: Wrong format. Must be in valid uri format like dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=development");
        throw m.code = "INVALID_DOTENV_KEY", m;
      }
      throw u;
    }
    const i = r.password;
    if (!i) {
      const u = new Error("INVALID_DOTENV_KEY: Missing key part");
      throw u.code = "INVALID_DOTENV_KEY", u;
    }
    const h = r.searchParams.get("environment");
    if (!h) {
      const u = new Error("INVALID_DOTENV_KEY: Missing environment part");
      throw u.code = "INVALID_DOTENV_KEY", u;
    }
    const t = `DOTENV_VAULT_${h.toUpperCase()}`, a = e.parsed[t];
    if (!a) {
      const u = new Error(`NOT_FOUND_DOTENV_ENVIRONMENT: Cannot locate environment ${t} in your .env.vault file.`);
      throw u.code = "NOT_FOUND_DOTENV_ENVIRONMENT", u;
    }
    return { ciphertext: a, key: i };
  }
  function $(e) {
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
  function P(e) {
    !!(e && e.debug) && N("Loading env from encrypted .env.vault");
    const r = f._parseVault(e);
    let i = process.env;
    return e && e.processEnv != null && (i = e.processEnv), f.populate(i, r, e), { parsed: r };
  }
  function K(e) {
    const n = s.resolve(process.cwd(), ".env");
    let r = "utf8";
    const i = !!(e && e.debug);
    e && e.encoding ? r = e.encoding : i && N("No encoding is specified. UTF-8 is used by default");
    let h = [n];
    if (e && e.path)
      if (!Array.isArray(e.path))
        h = [R(e.path)];
      else {
        h = [];
        for (const m of e.path)
          h.push(R(m));
      }
    let t;
    const a = {};
    for (const m of h)
      try {
        const _ = f.parse(c.readFileSync(m, { encoding: r }));
        f.populate(a, _, e);
      } catch (_) {
        i && N(`Failed to load ${m} ${_.message}`), t = _;
      }
    let u = process.env;
    return e && e.processEnv != null && (u = e.processEnv), f.populate(u, a, e), t ? { parsed: a, error: t } : { parsed: a };
  }
  function Y(e) {
    if (F(e).length === 0)
      return f.configDotenv(e);
    const n = $(e);
    return n ? f._configVault(e) : (U(`You set DOTENV_KEY but you are missing a .env.vault file at ${n}. Did you forget to build it?`), f.configDotenv(e));
  }
  function W(e, n) {
    const r = Buffer.from(n.slice(-64), "hex");
    let i = Buffer.from(e, "base64");
    const h = i.subarray(0, 12), t = i.subarray(-16);
    i = i.subarray(12, -16);
    try {
      const a = l.createDecipheriv("aes-256-gcm", r, h);
      return a.setAuthTag(t), `${a.update(i)}${a.final()}`;
    } catch (a) {
      const u = a instanceof RangeError, m = a.message === "Invalid key length", _ = a.message === "Unsupported state or unable to authenticate data";
      if (u || m) {
        const T = new Error("INVALID_DOTENV_KEY: It must be 64 characters long (or more)");
        throw T.code = "INVALID_DOTENV_KEY", T;
      } else if (_) {
        const T = new Error("DECRYPTION_FAILED: Please check your DOTENV_KEY");
        throw T.code = "DECRYPTION_FAILED", T;
      } else
        throw a;
    }
  }
  function B(e, n, r = {}) {
    const i = !!(r && r.debug), h = !!(r && r.override);
    if (typeof n != "object") {
      const t = new Error("OBJECT_REQUIRED: Please check the processEnv argument being passed to populate");
      throw t.code = "OBJECT_REQUIRED", t;
    }
    for (const t of Object.keys(n))
      Object.prototype.hasOwnProperty.call(e, t) ? (h === !0 && (e[t] = n[t]), i && N(h === !0 ? `"${t}" is already defined and WAS overwritten` : `"${t}" is already defined and was NOT overwritten`)) : e[t] = n[t];
  }
  const f = {
    configDotenv: K,
    _configVault: P,
    _parseVault: k,
    config: Y,
    decrypt: W,
    parse: w,
    populate: B
  };
  return E.exports.configDotenv = f.configDotenv, E.exports._configVault = f._configVault, E.exports._parseVault = f._parseVault, E.exports.config = f.config, E.exports.decrypt = f.decrypt, E.exports.parse = f.parse, E.exports.populate = f.populate, E.exports = f, E.exports;
}
var te = oe();
const re = /* @__PURE__ */ X(te);
re.config();
const V = b.dirname(G(import.meta.url)), I = process.env.NODE_ENV === "development";
process.platform === "win32" && p.setAppUserModelId(p.getName());
let d = null;
function ne() {
  const c = "MoodClassifier";
  switch (process.platform) {
    case "darwin":
      return b.join(process.env.HOME || "", "Library", "Application Support", c);
    case "win32":
      return b.join(process.env.APPDATA || "", c);
    case "linux":
      return b.join(process.env.HOME || "", `.${c}`);
    default:
      return console.log("Unsupported platform!"), process.exit(1), "";
  }
}
const A = ne();
D.existsSync(A) || D.mkdirSync(A, { recursive: !0 });
let x, O;
async function j() {
  console.log("Creating window..."), console.log("Development mode:", I), p.commandLine.appendSwitch("enable-zero-copy"), p.commandLine.appendSwitch("enable-gpu-rasterization"), p.commandLine.appendSwitch("enable-native-gpu-memory-buffers"), p.commandLine.appendSwitch("canvas-msaa-sample-count", "0"), p.commandLine.appendSwitch("disable-smooth-scrolling"), p.commandLine.appendSwitch("ignore-gpu-blocklist");
  const c = b.join(V, "preload.js");
  console.log("Preload script path:", c), d = new q({
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
  }), z.defaultSession.webRequest.onHeadersReceived({ urls: ["*://*/*"] }, (s, o) => {
    const l = { ...s.responseHeaders };
    Object.keys(l).forEach((g) => {
      g.toLowerCase() === "content-security-policy" && delete l[g];
    }), l["Content-Security-Policy"] = [
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net blob:; script-src-elem 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net blob:; object-src 'none'; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; img-src 'self' data: https://*; media-src 'self' blob:; connect-src 'self' https://*; worker-src 'self' blob:; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; frame-src 'none';"
    ], o({ responseHeaders: l });
  }), d.webContents.on("will-navigate", (s, o) => {
    const l = new URL(o);
    !I && !["localhost", "127.0.0.1"].includes(l.hostname) && (s.preventDefault(), S.openExternal(o), console.log(`External navigation to ${o} opened in default browser`));
  }), d.webContents.setWindowOpenHandler(({ url: s }) => (S.openExternal(s), { action: "deny" }));
  try {
    if (I) {
      console.log("Loading from dev server: http://localhost:5173");
      try {
        await d.loadURL("http://localhost:5173"), console.log("Successfully loaded from dev server");
      } catch (s) {
        console.error("Failed to load from dev server:", s);
        try {
          const o = b.join(V, "../dist/index.html");
          if (D.existsSync(o))
            console.log("Trying fallback path:", o), await d.loadFile(o);
          else
            throw new Error("No fallback path available");
        } catch (o) {
          console.error("Failed to load fallback:", o), d.webContents.loadURL("data:text/html,<h1>Failed to load application</h1>");
        }
      }
    } else {
      const s = b.join(V, "../dist/index.html");
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
async function ae() {
  if (console.log("Starting application initialization..."), L.handle("openExternalLink", (s, o) => {
    try {
      const l = new URL(o);
      return l.protocol === "http:" || l.protocol === "https:" ? (S.openExternal(o), console.log(`Opened external URL: ${o}`), { success: !0 }) : (console.warn(`Blocked opening non-HTTP URL: ${o}`), { error: "Invalid URL protocol" });
    } catch {
      return console.error(`Invalid URL received: ${o}`), { error: "Invalid URL format" };
    }
  }), L.handle("download-youtube-audio", async (s, o) => {
    try {
      return console.log("Downloading YouTube audio..."), await se(o);
    } catch (l) {
      throw console.error("Error downloading with yt-dlp:", l.message), new Error(`Failed to download YouTube audio: ${l.message}`);
    }
  }), L.handle("read-audio-file", async (s, o) => {
    try {
      if (typeof o == "object")
        if (o.filePath)
          o = o.filePath;
        else
          throw new Error("Invalid file path object provided");
      if (typeof o != "string")
        throw new Error("Invalid file path provided");
      return await D.promises.readFile(o);
    } catch (l) {
      throw console.error("Error reading audio file:", l), l;
    }
  }), L.handle("toggle-enabled", async (s, o) => {
    try {
      return { success: !0, enabled: o };
    } catch (l) {
      throw console.error("Error toggling enabled state:", l), l;
    }
  }), p.commandLine.appendSwitch("enable-features", "CalculateNativeWinOcclusion"), p.commandLine.appendSwitch("js-flags", "--max-old-space-size=512"), p.on("browser-window-blur", () => {
    d && !I && d.webContents.setBackgroundThrottling(!0);
  }), p.on("browser-window-focus", () => {
    d && !I && d.webContents.setBackgroundThrottling(!1);
  }), !p.requestSingleInstanceLock()) {
    console.log("Another instance is already running. Quitting..."), p.quit();
    return;
  }
  p.on("second-instance", () => {
    d && (d.isMinimized() && d.restore(), d.focus());
  }), await p.whenReady(), console.log("Electron app ready, creating window..."), j(), p.on("activate", () => {
    d === null && j();
  });
}
async function se(c) {
  if (!x)
    try {
      x = {
        default: (await import("./index-aSy0xDuv.js").then((y) => y.i)).default
      };
    } catch (v) {
      throw console.error("Failed to load youtube-dl-exec:", v), new Error("youtube-dl-exec is not installed. Run: npm install youtube-dl-exec --save");
    }
  if (!O)
    try {
      O = (await import("./index-DLo2OmZb.js").then((y) => y.i)).default;
      try {
        const y = await import("./index-DxHKlPmg.js").then((w) => w.i);
        O.setFfmpegPath(y.default);
      } catch {
        console.warn("Could not load ffmpeg-static, using system ffmpeg");
      }
    } catch (v) {
      throw console.error("Failed to load fluent-ffmpeg:", v), new Error("fluent-ffmpeg is not installed. Run: npm install fluent-ffmpeg --save");
    }
  const s = await x.default(c, {
    dumpSingleJson: !0,
    noCheckCertificates: !0,
    noWarnings: !0,
    preferFreeFormats: !0,
    addHeader: [
      "referer:youtube.com",
      "user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
    ]
  }), { filePath: o, canceled: l } = await H.showSaveDialog({
    title: "Save Audio File",
    defaultPath: `${s.title.replace(/[/\\?%*:|"<>]/g, "-")}.wav`,
    filters: [{ name: "Audio Files", extensions: ["wav"] }]
  });
  if (l || !o)
    throw new Error("Save operation was canceled.");
  const g = b.join(A, `${Date.now()}.m4a`);
  if (console.log("Downloading with yt-dlp to:", g), await x.default(c, {
    output: g,
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
  }), !D.existsSync(g))
    throw new Error("Failed to download the audio file");
  return console.log("Downloaded audio to temp file:", g), new Promise((v, y) => {
    O(g).toFormat("wav").audioCodec("pcm_s16le").audioChannels(2).audioFrequency(44100).on("progress", (w) => {
      console.log("FFmpeg processing progress:", w.percent, "%");
    }).on("end", () => {
      console.log("FFmpeg conversion complete"), D.unlink(g, (w) => {
        w && console.error("Error deleting temp file:", w);
      }), v({
        filePath: o,
        videoDetails: {
          title: s.title,
          author: s.uploader
        }
      });
    }).on("error", (w) => {
      D.unlink(g, (k) => {
        k && console.error("Error deleting temp file:", k);
      }), console.error("FFmpeg error:", w), y(w);
    }).save(o);
  });
}
try {
  ae();
} catch (c) {
  console.error("Error during startup:", c);
}
p.on("window-all-closed", () => {
  process.platform !== "darwin" && p.quit();
});
export {
  pe as c,
  X as g
};
