import { g as N } from "./main-DaEVnNa3.js";
import v from "child_process";
import R from "os";
import Y from "events";
import F from "path";
function I(f, a) {
  for (var p = 0; p < a.length; p++) {
    const t = a[p];
    if (typeof t != "string" && !Array.isArray(t)) {
      for (const n in t)
        if (n !== "default" && !(n in f)) {
          const l = Object.getOwnPropertyDescriptor(t, n);
          l && Object.defineProperty(f, n, l.get ? l : {
            enumerable: !0,
            get: () => t[n]
          });
        }
    }
  }
  return Object.freeze(Object.defineProperty(f, Symbol.toStringTag, { value: "Module" }));
}
var O = { exports: {} }, x, b;
function C() {
  if (b) return x;
  b = 1;
  const f = (p, t) => p.some((n) => n instanceof RegExp ? n.test(t) : n === t);
  return x = (p, t) => {
    const n = [];
    let l = [], d = [];
    t = {
      useEquals: !0,
      shortFlag: !0,
      ...t
    };
    const o = (r, e) => {
      const s = t.shortFlag && r.length === 1 ? "-" : "--", i = t.allowCamelCase ? r : r.replace(/[A-Z]/g, "-$&").toLowerCase();
      r = s + i, t.useEquals ? n.push(r + (e ? `=${e}` : "")) : (n.push(r), e && n.push(e));
    }, c = (r, e) => {
      n.push(`-${r}`), e && n.push(e);
    };
    for (let [r, e] of Object.entries(p)) {
      let s = o;
      if (!(Array.isArray(t.excludes) && f(t.excludes, r)) && !(Array.isArray(t.includes) && !f(t.includes, r))) {
        if (typeof t.aliases == "object" && t.aliases[r] && (r = t.aliases[r], s = c), r === "--") {
          if (!Array.isArray(e))
            throw new TypeError(
              `Expected key \`--\` to be Array, got ${typeof e}`
            );
          d = e;
          continue;
        }
        if (r === "_") {
          if (!Array.isArray(e))
            throw new TypeError(
              `Expected key \`_\` to be Array, got ${typeof e}`
            );
          l = e;
          continue;
        }
        if (e === !0 && s(r, ""), e === !1 && !t.ignoreFalse && s(`no-${r}`), typeof e == "string" && s(r, e), typeof e == "number" && !Number.isNaN(e) && s(r, String(e)), Array.isArray(e))
          for (const i of e)
            s(r, i);
      }
    }
    for (const r of l)
      n.push(String(r));
    d.length > 0 && n.push("--");
    for (const r of d)
      n.push(String(r));
    return n;
  }, x;
}
var $, w;
function M() {
  if (w) return $;
  w = 1;
  const { spawn: f } = v, { EOL: a } = R, p = Object.getOwnPropertyNames(Y.EventEmitter.prototype).filter((r) => !r.startsWith("_")).concat(["kill", "ref", "unref"]), t = (r, e, s = []) => r[e] ? r[e].on("data", (i) => s.push(i)) && s : s, n = ({ cmd: r, cmdArgs: e, exitCode: s, stderr: i, childProcess: _ }) => {
    const g = `${r} ${e.join(" ")}`;
    let u = `The command spawned as:${a}${a}`;
    u += `  ${g}${a}${a}`, u += `exited with \`{ code: ${s} }\` and the following trace:${a}${a}`, u += String(i).split(a).map((m) => `  ${m}`).join(a);
    const h = new Error(u);
    return h.command = g, h.name = "ChildProcessError", Object.keys(_).forEach((m) => {
      h[m] = _[m];
    }), h;
  }, l = (r) => r.trim().replace(/\n$/, ""), d = (r, { json: e } = {}) => (s, i, _) => {
    const g = l(Buffer.concat(r).toString(s, i, _));
    return e ? JSON.parse(g) : g;
  }, o = (r) => (e, s, i) => {
    s instanceof Array || (i = s, s = []);
    const [_, ...g] = e.split(" ").concat(s).filter(Boolean);
    let u;
    const h = new Promise((E, y) => {
      const L = { ...r, ...i };
      u = f(_, g, L);
      const B = t(u, "stdout"), T = t(u, "stderr");
      u.on("error", y).on("exit", (D) => (Object.defineProperty(u, "stdout", {
        get: d(B, L)
      }), Object.defineProperty(u, "stderr", { get: d(T) }), D === 0 ? E(u) : y(n({ cmd: _, cmdArgs: g, exitCode: D, stderr: T, childProcess: u }))));
    }), m = Object.assign(h, u);
    return u && p.forEach((E) => m[E] = u[E].bind(u)), m;
  }, c = o();
  return c.extend = o, c.json = c.extend({ json: !0 }), $ = c, $;
}
var A, S;
function W() {
  return S || (S = 1, A = (f = "") => (f = f.toLowerCase(), [
    "aix",
    "android",
    "darwin",
    "freebsd",
    "linux",
    "openbsd",
    "sunos"
  ].indexOf(f) !== -1)), A;
}
var U, P;
function H() {
  if (P) return U;
  P = 1;
  const f = W(), a = F, p = "win32", t = "unix";
  function n(i) {
    if (i)
      return process.env[i] ?? process.env[`npm_config_${i.toLowerCase()}`] ?? process.env[`npm_config_${i.toUpperCase()}`];
  }
  const l = n("YOUTUBE_DL_HOST") ?? "https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest", d = n("YOUTUBE_DL_DIR") ?? a.join(__dirname, "..", "bin"), o = n("YOUTUBE_DL_PLATFORM") ?? f(process.platform) ? t : p, c = n("YOUTUBE_DL_FILENAME") || "yt-dlp", r = !c.endsWith(".exe") && o === "win32" ? `${c}.exe` : c, e = a.join(d, r), s = n("YOUTUBE_DL_SKIP_DOWNLOAD");
  return U = {
    YOUTUBE_DL_DIR: d,
    YOUTUBE_DL_FILE: r,
    YOUTUBE_DL_FILENAME: c,
    YOUTUBE_DL_HOST: l,
    YOUTUBE_DL_PATH: e,
    YOUTUBE_DL_PLATFORM: o,
    YOUTUBE_DL_SKIP_DOWNLOAD: s
  }, U;
}
var j;
function J() {
  if (j) return O.exports;
  j = 1;
  const f = C(), a = M(), p = H(), t = (o = {}) => f(o, { useEquals: !1 }).filter(Boolean), n = (o = "") => o.startsWith("{"), l = ({ stdout: o, stderr: c, ...r }) => {
    if (o !== "" && o !== "null") return n(o) ? JSON.parse(o) : o;
    throw Object.assign(new Error(c), { stderr: c, stdout: o }, r);
  }, d = (o) => {
    const c = (...r) => c.exec(...r).then(l).catch(l);
    return c.exec = (r, e, s) => a(o, [r].concat(t(e)), s), c;
  };
  return O.exports = d(p.YOUTUBE_DL_PATH), O.exports.create = d, O.exports.args = t, O.exports.isJSON = n, O.exports.constants = p, O.exports;
}
var q = J();
const K = /* @__PURE__ */ N(q), Q = /* @__PURE__ */ I({
  __proto__: null,
  default: K
}, [q]);
export {
  Q as i
};
