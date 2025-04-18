import { g as m } from "./main-DaEVnNa3.js";
import u from "os";
import g from "path";
function b(n, s) {
  for (var a = 0; a < s.length; a++) {
    const e = s[a];
    if (typeof e != "string" && !Array.isArray(e)) {
      for (const t in e)
        if (t !== "default" && !(t in n)) {
          const r = Object.getOwnPropertyDescriptor(e, t);
          r && Object.defineProperty(n, t, r.get ? r : {
            enumerable: !0,
            get: () => e[t]
          });
        }
    }
  }
  return Object.freeze(Object.defineProperty(n, Symbol.toStringTag, { value: "Module" }));
}
var i = { exports: {} };
const d = "ffmpeg-static", v = "5.2.0", x = "ffmpeg binaries for macOS, Linux and Windows", h = { install: "node install.js", prepublishOnly: "npm run install" }, y = { type: "git", url: "https://github.com/eugeneware/ffmpeg-static" }, _ = ["ffmpeg", "static", "binary", "binaries", "mac", "linux", "windows"], j = ["Eugene Ware <eugene@noblesamurai.com>", "Jannis R <mail@jannisr.de>"], E = ["Thefrank (https://github.com/Thefrank)", "Emil Sivervik <emil@sivervik.com>"], w = "GPL-3.0-or-later", O = { url: "https://github.com/eugeneware/ffmpeg-static/issues" }, S = { node: ">=16" }, F = { "@derhuerst/http-basic": "^8.2.0", "env-paths": "^2.2.0", "https-proxy-agent": "^5.0.0", progress: "^2.0.3" }, P = { "any-shell-escape": "^0.1.1" }, A = "index.js", R = ["index.js", "install.js", "example.js", "types"], k = "types/index.d.ts", N = {
  name: d,
  version: v,
  description: x,
  scripts: h,
  "ffmpeg-static": { "binary-path-env-var": "FFMPEG_BIN", "binary-release-tag-env-var": "FFMPEG_BINARY_RELEASE", "binary-release-tag": "b6.0", "binaries-url-env-var": "FFMPEG_BINARIES_URL", "executable-base-name": "ffmpeg" },
  repository: y,
  keywords: _,
  authors: j,
  contributors: E,
  license: w,
  bugs: O,
  engines: S,
  dependencies: F,
  devDependencies: P,
  main: A,
  files: R,
  types: k
};
var p;
function B() {
  if (p) return i.exports;
  p = 1;
  const n = N, {
    "binary-path-env-var": s,
    "executable-base-name": a
  } = n[n.name];
  if (process.env[s])
    i.exports = process.env[s];
  else {
    var e = u, t = g, r = Object.assign(/* @__PURE__ */ Object.create(null), {
      darwin: ["x64", "arm64"],
      freebsd: ["x64"],
      linux: ["x64", "ia32", "arm64", "arm"],
      win32: ["x64", "ia32"]
    }), o = process.env.npm_config_platform || e.platform(), l = process.env.npm_config_arch || e.arch();
    let c = t.join(
      __dirname,
      a + (o === "win32" ? ".exe" : "")
    );
    (!r[o] || r[o].indexOf(l) === -1) && (c = null), i.exports = c;
  }
  return i.exports;
}
var f = B();
const I = /* @__PURE__ */ m(f), L = /* @__PURE__ */ b({
  __proto__: null,
  default: I
}, [f]);
export {
  L as i
};
