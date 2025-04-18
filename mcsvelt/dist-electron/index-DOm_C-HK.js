import { g as getDefaultExportFromCjs } from "./main-DemaRZFM.js";
import require$$0 from "child_process";
import require$$1 from "os";
import require$$2 from "events";
import path from "path";
function _mergeNamespaces(n, m) {
  for (var i = 0; i < m.length; i++) {
    const e = m[i];
    if (typeof e !== "string" && !Array.isArray(e)) {
      for (const k in e) {
        if (k !== "default" && !(k in n)) {
          const d = Object.getOwnPropertyDescriptor(e, k);
          if (d) {
            Object.defineProperty(n, k, d.get ? d : {
              enumerable: true,
              get: () => e[k]
            });
          }
        }
      }
    }
  }
  return Object.freeze(Object.defineProperty(n, Symbol.toStringTag, { value: "Module" }));
}
var src$1 = { exports: {} };
var dargs_1;
var hasRequiredDargs;
function requireDargs() {
  if (hasRequiredDargs) return dargs_1;
  hasRequiredDargs = 1;
  const match = (array, value) => array.some((x) => x instanceof RegExp ? x.test(value) : x === value);
  const dargs = (object, options) => {
    const arguments_ = [];
    let extraArguments = [];
    let separatedArguments = [];
    options = {
      useEquals: true,
      shortFlag: true,
      ...options
    };
    const makeArguments = (key, value) => {
      const prefix = options.shortFlag && key.length === 1 ? "-" : "--";
      const theKey = options.allowCamelCase ? key : key.replace(/[A-Z]/g, "-$&").toLowerCase();
      key = prefix + theKey;
      if (options.useEquals) {
        arguments_.push(key + (value ? `=${value}` : ""));
      } else {
        arguments_.push(key);
        if (value) {
          arguments_.push(value);
        }
      }
    };
    const makeAliasArg = (key, value) => {
      arguments_.push(`-${key}`);
      if (value) {
        arguments_.push(value);
      }
    };
    for (let [key, value] of Object.entries(object)) {
      let pushArguments = makeArguments;
      if (Array.isArray(options.excludes) && match(options.excludes, key)) {
        continue;
      }
      if (Array.isArray(options.includes) && !match(options.includes, key)) {
        continue;
      }
      if (typeof options.aliases === "object" && options.aliases[key]) {
        key = options.aliases[key];
        pushArguments = makeAliasArg;
      }
      if (key === "--") {
        if (!Array.isArray(value)) {
          throw new TypeError(
            `Expected key \`--\` to be Array, got ${typeof value}`
          );
        }
        separatedArguments = value;
        continue;
      }
      if (key === "_") {
        if (!Array.isArray(value)) {
          throw new TypeError(
            `Expected key \`_\` to be Array, got ${typeof value}`
          );
        }
        extraArguments = value;
        continue;
      }
      if (value === true) {
        pushArguments(key, "");
      }
      if (value === false && !options.ignoreFalse) {
        pushArguments(`no-${key}`);
      }
      if (typeof value === "string") {
        pushArguments(key, value);
      }
      if (typeof value === "number" && !Number.isNaN(value)) {
        pushArguments(key, String(value));
      }
      if (Array.isArray(value)) {
        for (const arrayValue of value) {
          pushArguments(key, arrayValue);
        }
      }
    }
    for (const argument of extraArguments) {
      arguments_.push(String(argument));
    }
    if (separatedArguments.length > 0) {
      arguments_.push("--");
    }
    for (const argument of separatedArguments) {
      arguments_.push(String(argument));
    }
    return arguments_;
  };
  dargs_1 = dargs;
  return dargs_1;
}
var src;
var hasRequiredSrc$1;
function requireSrc$1() {
  if (hasRequiredSrc$1) return src;
  hasRequiredSrc$1 = 1;
  const { spawn } = require$$0;
  const { EOL } = require$$1;
  const EE_PROPS = Object.getOwnPropertyNames(require$$2.EventEmitter.prototype).filter((name) => !name.startsWith("_")).concat(["kill", "ref", "unref"]);
  const eos = (stream, listener, buffer = []) => stream[listener] ? stream[listener].on("data", (data) => buffer.push(data)) && buffer : buffer;
  const createChildProcessError = ({ cmd, cmdArgs, exitCode, stderr, childProcess }) => {
    const command = `${cmd} ${cmdArgs.join(" ")}`;
    let message = `The command spawned as:${EOL}${EOL}`;
    message += `  ${command}${EOL}${EOL}`;
    message += `exited with \`{ code: ${exitCode} }\` and the following trace:${EOL}${EOL}`;
    message += String(stderr).split(EOL).map((line) => `  ${line}`).join(EOL);
    const error = new Error(message);
    error.command = command;
    error.name = "ChildProcessError";
    Object.keys(childProcess).forEach((key) => {
      error[key] = childProcess[key];
    });
    return error;
  };
  const clean = (str) => str.trim().replace(/\n$/, "");
  const parse = (buffer, { json } = {}) => (encoding, start, end) => {
    const data = clean(Buffer.concat(buffer).toString(encoding, start, end));
    return json ? JSON.parse(data) : data;
  };
  const extend = (defaults) => (input, args, options) => {
    if (!(args instanceof Array)) {
      options = args;
      args = [];
    }
    const [cmd, ...cmdArgs] = input.split(" ").concat(args).filter(Boolean);
    let childProcess;
    const promise = new Promise((resolve, reject) => {
      const opts = { ...defaults, ...options };
      childProcess = spawn(cmd, cmdArgs, opts);
      const stdout = eos(childProcess, "stdout");
      const stderr = eos(childProcess, "stderr");
      childProcess.on("error", reject).on("exit", (exitCode) => {
        Object.defineProperty(childProcess, "stdout", {
          get: parse(stdout, opts)
        });
        Object.defineProperty(childProcess, "stderr", { get: parse(stderr) });
        return exitCode === 0 ? resolve(childProcess) : reject(createChildProcessError({ cmd, cmdArgs, exitCode, stderr, childProcess }));
      });
    });
    const subprocess = Object.assign(promise, childProcess);
    if (childProcess) {
      EE_PROPS.forEach((name) => subprocess[name] = childProcess[name].bind(childProcess));
    }
    return subprocess;
  };
  const $ = extend();
  $.extend = extend;
  $.json = $.extend({ json: true });
  src = $;
  return src;
}
var isUnix;
var hasRequiredIsUnix;
function requireIsUnix() {
  if (hasRequiredIsUnix) return isUnix;
  hasRequiredIsUnix = 1;
  isUnix = (platform = "") => {
    platform = platform.toLowerCase();
    return [
      "aix",
      "android",
      "darwin",
      "freebsd",
      "linux",
      "openbsd",
      "sunos"
    ].indexOf(platform) !== -1;
  };
  return isUnix;
}
var constants;
var hasRequiredConstants;
function requireConstants() {
  if (hasRequiredConstants) return constants;
  hasRequiredConstants = 1;
  const isUnix2 = requireIsUnix();
  const path$1 = path;
  const PLATFORM_WIN = "win32";
  const PLATFORM_UNIX = "unix";
  function get(key) {
    if (!key) return void 0;
    return process.env[key] ?? process.env[`npm_config_${key.toLowerCase()}`] ?? process.env[`npm_config_${key.toUpperCase()}`];
  }
  const YOUTUBE_DL_HOST = get("YOUTUBE_DL_HOST") ?? "https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest";
  const YOUTUBE_DL_DIR = get("YOUTUBE_DL_DIR") ?? path$1.join(__dirname, "..", "bin");
  const YOUTUBE_DL_PLATFORM = get("YOUTUBE_DL_PLATFORM") ?? isUnix2(process.platform) ? PLATFORM_UNIX : PLATFORM_WIN;
  const YOUTUBE_DL_FILENAME = get("YOUTUBE_DL_FILENAME") || "yt-dlp";
  const YOUTUBE_DL_FILE = !YOUTUBE_DL_FILENAME.endsWith(".exe") && YOUTUBE_DL_PLATFORM === "win32" ? `${YOUTUBE_DL_FILENAME}.exe` : YOUTUBE_DL_FILENAME;
  const YOUTUBE_DL_PATH = path$1.join(YOUTUBE_DL_DIR, YOUTUBE_DL_FILE);
  const YOUTUBE_DL_SKIP_DOWNLOAD = get("YOUTUBE_DL_SKIP_DOWNLOAD");
  constants = {
    YOUTUBE_DL_DIR,
    YOUTUBE_DL_FILE,
    YOUTUBE_DL_FILENAME,
    YOUTUBE_DL_HOST,
    YOUTUBE_DL_PATH,
    YOUTUBE_DL_PLATFORM,
    YOUTUBE_DL_SKIP_DOWNLOAD
  };
  return constants;
}
var hasRequiredSrc;
function requireSrc() {
  if (hasRequiredSrc) return src$1.exports;
  hasRequiredSrc = 1;
  const dargs = requireDargs();
  const $ = requireSrc$1();
  const constants2 = requireConstants();
  const args = (flags = {}) => dargs(flags, { useEquals: false }).filter(Boolean);
  const isJSON = (str = "") => str.startsWith("{");
  const parse = ({ stdout, stderr, ...details }) => {
    if (stdout !== "" && stdout !== "null") return isJSON(stdout) ? JSON.parse(stdout) : stdout;
    throw Object.assign(new Error(stderr), { stderr, stdout }, details);
  };
  const create = (binaryPath) => {
    const fn = (...args2) => fn.exec(...args2).then(parse).catch(parse);
    fn.exec = (url, flags, opts) => $(binaryPath, [url].concat(args(flags)), opts);
    return fn;
  };
  src$1.exports = create(constants2.YOUTUBE_DL_PATH);
  src$1.exports.create = create;
  src$1.exports.args = args;
  src$1.exports.isJSON = isJSON;
  src$1.exports.constants = constants2;
  return src$1.exports;
}
var srcExports = requireSrc();
const index = /* @__PURE__ */ getDefaultExportFromCjs(srcExports);
const index$1 = /* @__PURE__ */ _mergeNamespaces({
  __proto__: null,
  default: index
}, [srcExports]);
export {
  index$1 as i
};
//# sourceMappingURL=index-DOm_C-HK.js.map
