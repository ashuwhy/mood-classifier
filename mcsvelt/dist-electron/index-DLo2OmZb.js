import { c as be, g as ze } from "./main-DaEVnNa3.js";
import C from "path";
import Ne from "util";
import qe from "events";
import ie from "child_process";
import $e from "os";
import L from "fs";
import Ce from "stream";
function Re(S, e) {
  for (var i = 0; i < e.length; i++) {
    const x = e[i];
    if (typeof x != "string" && !Array.isArray(x)) {
      for (const h in x)
        if (h !== "default" && !(h in S)) {
          const n = Object.getOwnPropertyDescriptor(x, h);
          n && Object.defineProperty(S, h, n.get ? n : {
            enumerable: !0,
            get: () => x[h]
          });
        }
    }
  }
  return Object.freeze(Object.defineProperty(S, Symbol.toStringTag, { value: "Module" }));
}
var M = { exports: {} }, V, oe;
function Le() {
  if (oe) return V;
  oe = 1, V = x, x.sync = h;
  var S = L;
  function e(n, p) {
    var o = p.pathExt !== void 0 ? p.pathExt : process.env.PATHEXT;
    if (!o || (o = o.split(";"), o.indexOf("") !== -1))
      return !0;
    for (var u = 0; u < o.length; u++) {
      var l = o[u].toLowerCase();
      if (l && n.substr(-l.length).toLowerCase() === l)
        return !0;
    }
    return !1;
  }
  function i(n, p, o) {
    return !n.isSymbolicLink() && !n.isFile() ? !1 : e(p, o);
  }
  function x(n, p, o) {
    S.stat(n, function(u, l) {
      o(u, u ? !1 : i(l, n, p));
    });
  }
  function h(n, p) {
    return i(S.statSync(n), n, p);
  }
  return V;
}
var k, ce;
function De() {
  if (ce) return k;
  ce = 1, k = e, e.sync = i;
  var S = L;
  function e(n, p, o) {
    S.stat(n, function(u, l) {
      o(u, u ? !1 : x(l, p));
    });
  }
  function i(n, p) {
    return x(S.statSync(n), p);
  }
  function x(n, p) {
    return n.isFile() && h(n, p);
  }
  function h(n, p) {
    var o = n.mode, u = n.uid, l = n.gid, f = p.uid !== void 0 ? p.uid : process.getuid && process.getuid(), g = p.gid !== void 0 ? p.gid : process.getgid && process.getgid(), m = parseInt("100", 8), I = parseInt("010", 8), E = parseInt("001", 8), _ = m | I, w = o & E || o & I && l === g || o & m && u === f || o & _ && f === 0;
    return w;
  }
  return k;
}
var j, le;
function Me() {
  if (le) return j;
  le = 1;
  var S;
  process.platform === "win32" || be.TESTING_WINDOWS ? S = Le() : S = De(), j = e, e.sync = i;
  function e(x, h, n) {
    if (typeof h == "function" && (n = h, h = {}), !n) {
      if (typeof Promise != "function")
        throw new TypeError("callback not provided");
      return new Promise(function(p, o) {
        e(x, h || {}, function(u, l) {
          u ? o(u) : p(l);
        });
      });
    }
    S(x, h || {}, function(p, o) {
      p && (p.code === "EACCES" || h && h.ignoreErrors) && (p = null, o = !1), n(p, o);
    });
  }
  function i(x, h) {
    try {
      return S.sync(x, h || {});
    } catch (n) {
      if (h && h.ignoreErrors || n.code === "EACCES")
        return !1;
      throw n;
    }
  }
  return j;
}
var H, pe;
function Ve() {
  if (pe) return H;
  pe = 1, H = p, p.sync = o;
  var S = process.platform === "win32" || process.env.OSTYPE === "cygwin" || process.env.OSTYPE === "msys", e = C, i = S ? ";" : ":", x = Me();
  function h(u) {
    var l = new Error("not found: " + u);
    return l.code = "ENOENT", l;
  }
  function n(u, l) {
    var f = l.colon || i, g = l.path || process.env.PATH || "", m = [""];
    g = g.split(f);
    var I = "";
    return S && (g.unshift(process.cwd()), I = l.pathExt || process.env.PATHEXT || ".EXE;.CMD;.BAT;.COM", m = I.split(f), u.indexOf(".") !== -1 && m[0] !== "" && m.unshift("")), (u.match(/\//) || S && u.match(/\\/)) && (g = [""]), {
      env: g,
      ext: m,
      extExe: I
    };
  }
  function p(u, l, f) {
    typeof l == "function" && (f = l, l = {});
    var g = n(u, l), m = g.env, I = g.ext, E = g.extExe, _ = [];
    (function w(P, O) {
      if (P === O)
        return l.all && _.length ? f(null, _) : f(h(u));
      var F = m[P];
      F.charAt(0) === '"' && F.slice(-1) === '"' && (F = F.slice(1, -1));
      var y = e.join(F, u);
      !F && /^\.[\\\/]/.test(u) && (y = u.slice(0, 2) + y), function v(t, r) {
        if (t === r) return w(P + 1, O);
        var s = I[t];
        x(y + s, { pathExt: E }, function(a, c) {
          if (!a && c)
            if (l.all)
              _.push(y + s);
            else
              return f(null, y + s);
          return v(t + 1, r);
        });
      }(0, I.length);
    })(0, m.length);
  }
  function o(u, l) {
    l = l || {};
    for (var f = n(u, l), g = f.env, m = f.ext, I = f.extExe, E = [], _ = 0, w = g.length; _ < w; _++) {
      var P = g[_];
      P.charAt(0) === '"' && P.slice(-1) === '"' && (P = P.slice(1, -1));
      var O = e.join(P, u);
      !P && /^\.[\\\/]/.test(u) && (O = u.slice(0, 2) + O);
      for (var F = 0, y = m.length; F < y; F++) {
        var v = O + m[F], t;
        try {
          if (t = x.sync(v, { pathExt: I }), t)
            if (l.all)
              E.push(v);
            else
              return v;
        } catch {
        }
      }
    }
    if (l.all && E.length)
      return E;
    if (l.nothrow)
      return null;
    throw h(u);
  }
  return H;
}
var he;
function N() {
  if (he) return M.exports;
  he = 1, ie.exec;
  var S = $e.platform().match(/win(32|64)/), e = Ve(), i = /\r\n|\r|\n/g, x = /^\[?(.*?)\]?$/, h = /[,]/, n = {};
  function p(u) {
    var l = {};
    u = u.replace(/=\s+/g, "=").trim();
    for (var f = u.split(" "), g = 0; g < f.length; g++) {
      var m = f[g].split("=", 2), I = m[0], E = m[1];
      if (typeof E > "u")
        return null;
      l[I] = E;
    }
    return l;
  }
  var o = M.exports = {
    isWindows: S,
    streamRegexp: x,
    /**
     * Copy an object keys into another one
     *
     * @param {Object} source source object
     * @param {Object} dest destination object
     * @private
     */
    copy: function(u, l) {
      Object.keys(u).forEach(function(f) {
        l[f] = u[f];
      });
    },
    /**
     * Create an argument list
     *
     * Returns a function that adds new arguments to the list.
     * It also has the following methods:
     * - clear() empties the argument list
     * - get() returns the argument list
     * - find(arg, count) finds 'arg' in the list and return the following 'count' items, or undefined if not found
     * - remove(arg, count) remove 'arg' in the list as well as the following 'count' items
     *
     * @private
     */
    args: function() {
      var u = [], l = function() {
        arguments.length === 1 && Array.isArray(arguments[0]) ? u = u.concat(arguments[0]) : u = u.concat([].slice.call(arguments));
      };
      return l.clear = function() {
        u = [];
      }, l.get = function() {
        return u;
      }, l.find = function(f, g) {
        var m = u.indexOf(f);
        if (m !== -1)
          return u.slice(m + 1, m + 1 + (g || 0));
      }, l.remove = function(f, g) {
        var m = u.indexOf(f);
        m !== -1 && u.splice(m, (g || 0) + 1);
      }, l.clone = function() {
        var f = o.args();
        return f(u), f;
      }, l;
    },
    /**
     * Generate filter strings
     *
     * @param {String[]|Object[]} filters filter specifications. When using objects,
     *   each must have the following properties:
     * @param {String} filters.filter filter name
     * @param {String|Array} [filters.inputs] (array of) input stream specifier(s) for the filter,
     *   defaults to ffmpeg automatically choosing the first unused matching streams
     * @param {String|Array} [filters.outputs] (array of) output stream specifier(s) for the filter,
     *   defaults to ffmpeg automatically assigning the output to the output file
     * @param {Object|String|Array} [filters.options] filter options, can be omitted to not set any options
     * @return String[]
     * @private
     */
    makeFilterStrings: function(u) {
      return u.map(function(l) {
        if (typeof l == "string")
          return l;
        var f = "";
        return Array.isArray(l.inputs) ? f += l.inputs.map(function(g) {
          return g.replace(x, "[$1]");
        }).join("") : typeof l.inputs == "string" && (f += l.inputs.replace(x, "[$1]")), f += l.filter, l.options && (typeof l.options == "string" || typeof l.options == "number" ? f += "=" + l.options : Array.isArray(l.options) ? f += "=" + l.options.map(function(g) {
          return typeof g == "string" && g.match(h) ? "'" + g + "'" : g;
        }).join(":") : Object.keys(l.options).length && (f += "=" + Object.keys(l.options).map(function(g) {
          var m = l.options[g];
          return typeof m == "string" && m.match(h) && (m = "'" + m + "'"), g + "=" + m;
        }).join(":"))), Array.isArray(l.outputs) ? f += l.outputs.map(function(g) {
          return g.replace(x, "[$1]");
        }).join("") : typeof l.outputs == "string" && (f += l.outputs.replace(x, "[$1]")), f;
      });
    },
    /**
     * Search for an executable
     *
     * Uses 'which' or 'where' depending on platform
     *
     * @param {String} name executable name
     * @param {Function} callback callback with signature (err, path)
     * @private
     */
    which: function(u, l) {
      if (u in n)
        return l(null, n[u]);
      e(u, function(f, g) {
        if (f)
          return l(null, n[u] = "");
        l(null, n[u] = g);
      });
    },
    /**
     * Convert a [[hh:]mm:]ss[.xxx] timemark into seconds
     *
     * @param {String} timemark timemark string
     * @return Number
     * @private
     */
    timemarkToSeconds: function(u) {
      if (typeof u == "number")
        return u;
      if (u.indexOf(":") === -1 && u.indexOf(".") >= 0)
        return Number(u);
      var l = u.split(":"), f = Number(l.pop());
      return l.length && (f += Number(l.pop()) * 60), l.length && (f += Number(l.pop()) * 3600), f;
    },
    /**
     * Extract codec data from ffmpeg stderr and emit 'codecData' event if appropriate
     * Call it with an initially empty codec object once with each line of stderr output until it returns true
     *
     * @param {FfmpegCommand} command event emitter
     * @param {String} stderrLine ffmpeg stderr output line
     * @param {Object} codecObject object used to accumulate codec data between calls
     * @return {Boolean} true if codec data is complete (and event was emitted), false otherwise
     * @private
     */
    extractCodecData: function(u, l, f) {
      var g = /Input #[0-9]+, ([^ ]+),/, m = /Duration\: ([^,]+)/, I = /Audio\: (.*)/, E = /Video\: (.*)/;
      "inputStack" in f || (f.inputStack = [], f.inputIndex = -1, f.inInput = !1);
      var _ = f.inputStack, w = f.inputIndex, P = f.inInput, O, F, y, v;
      if (O = l.match(g))
        P = f.inInput = !0, w = f.inputIndex = f.inputIndex + 1, _[w] = { format: O[1], audio: "", video: "", duration: "" };
      else if (P && (F = l.match(m)))
        _[w].duration = F[1];
      else if (P && (y = l.match(I)))
        y = y[1].split(", "), _[w].audio = y[0], _[w].audio_details = y;
      else if (P && (v = l.match(E)))
        v = v[1].split(", "), _[w].video = v[0], _[w].video_details = v;
      else if (/Output #\d+/.test(l))
        P = f.inInput = !1;
      else if (/Stream mapping:|Press (\[q\]|ctrl-c) to stop/.test(l))
        return u.emit.apply(u, ["codecData"].concat(_)), !0;
      return !1;
    },
    /**
     * Extract progress data from ffmpeg stderr and emit 'progress' event if appropriate
     *
     * @param {FfmpegCommand} command event emitter
     * @param {String} stderrLine ffmpeg stderr data
     * @private
     */
    extractProgress: function(u, l) {
      var f = p(l);
      if (f) {
        var g = {
          frames: parseInt(f.frame, 10),
          currentFps: parseInt(f.fps, 10),
          currentKbps: f.bitrate ? parseFloat(f.bitrate.replace("kbits/s", "")) : 0,
          targetSize: parseInt(f.size || f.Lsize, 10),
          timemark: f.time
        };
        if (u._ffprobeData && u._ffprobeData.format && u._ffprobeData.format.duration) {
          var m = Number(u._ffprobeData.format.duration);
          isNaN(m) || (g.percent = o.timemarkToSeconds(g.timemark) / m * 100);
        }
        u.emit("progress", g);
      }
    },
    /**
     * Extract error message(s) from ffmpeg stderr
     *
     * @param {String} stderr ffmpeg stderr data
     * @return {String}
     * @private
     */
    extractError: function(u) {
      return u.split(i).reduce(function(l, f) {
        return f.charAt(0) === " " || f.charAt(0) === "[" ? [] : (l.push(f), l);
      }, []).join(`
`);
    },
    /**
     * Creates a line ring buffer object with the following methods:
     * - append(str) : appends a string or buffer
     * - get() : returns the whole string
     * - close() : prevents further append() calls and does a last call to callbacks
     * - callback(cb) : calls cb for each line (incl. those already in the ring)
     *
     * @param {Number} maxLines maximum number of lines to store (<= 0 for unlimited)
     */
    linesRing: function(u) {
      var l = [], f = [], g = null, m = !1, I = u - 1;
      function E(_) {
        l.forEach(function(w) {
          w(_);
        });
      }
      return {
        callback: function(_) {
          f.forEach(function(w) {
            _(w);
          }), l.push(_);
        },
        append: function(_) {
          if (!m && (_ instanceof Buffer && (_ = "" + _), !(!_ || _.length === 0))) {
            var w = _.split(i);
            w.length === 1 ? g !== null ? g = g + w.shift() : g = w.shift() : (g !== null && (g = g + w.shift(), E(g), f.push(g)), g = w.pop(), w.forEach(function(P) {
              E(P), f.push(P);
            }), I > -1 && f.length > I && f.splice(0, f.length - I));
          }
        },
        get: function() {
          return g !== null ? f.concat([g]).join(`
`) : f.join(`
`);
        },
        close: function() {
          m || (g !== null && (E(g), f.push(g), I > -1 && f.length > I && f.shift(), g = null), m = !0);
        }
      };
    }
  };
  return M.exports;
}
var W, ve;
function ke() {
  if (ve) return W;
  ve = 1;
  var S = N();
  return W = function(e) {
    e.mergeAdd = e.addInput = e.input = function(i) {
      var x = !1, h = !1;
      if (typeof i != "string") {
        if (!("readable" in i) || !i.readable)
          throw new Error("Invalid input");
        var n = this._inputs.some(function(o) {
          return o.isStream;
        });
        if (n)
          throw new Error("Only one input stream is supported");
        h = !0, i.pause();
      } else {
        var p = i.match(/^([a-z]{2,}):/i);
        x = !p || p[0] === "file";
      }
      return this._inputs.push(this._currentInput = {
        source: i,
        isFile: x,
        isStream: h,
        options: S.args()
      }), this;
    }, e.withInputFormat = e.inputFormat = e.fromFormat = function(i) {
      if (!this._currentInput)
        throw new Error("No input specified");
      return this._currentInput.options("-f", i), this;
    }, e.withInputFps = e.withInputFPS = e.withFpsInput = e.withFPSInput = e.inputFPS = e.inputFps = e.fpsInput = e.FPSInput = function(i) {
      if (!this._currentInput)
        throw new Error("No input specified");
      return this._currentInput.options("-r", i), this;
    }, e.nativeFramerate = e.withNativeFramerate = e.native = function() {
      if (!this._currentInput)
        throw new Error("No input specified");
      return this._currentInput.options("-re"), this;
    }, e.setStartTime = e.seekInput = function(i) {
      if (!this._currentInput)
        throw new Error("No input specified");
      return this._currentInput.options("-ss", i), this;
    }, e.loop = function(i) {
      if (!this._currentInput)
        throw new Error("No input specified");
      return this._currentInput.options("-loop", "1"), typeof i < "u" && this.duration(i), this;
    };
  }, W;
}
var G, de;
function je() {
  if (de) return G;
  de = 1;
  var S = N();
  return G = function(e) {
    e.withNoAudio = e.noAudio = function() {
      return this._currentOutput.audio.clear(), this._currentOutput.audioFilters.clear(), this._currentOutput.audio("-an"), this;
    }, e.withAudioCodec = e.audioCodec = function(i) {
      return this._currentOutput.audio("-acodec", i), this;
    }, e.withAudioBitrate = e.audioBitrate = function(i) {
      return this._currentOutput.audio("-b:a", ("" + i).replace(/k?$/, "k")), this;
    }, e.withAudioChannels = e.audioChannels = function(i) {
      return this._currentOutput.audio("-ac", i), this;
    }, e.withAudioFrequency = e.audioFrequency = function(i) {
      return this._currentOutput.audio("-ar", i), this;
    }, e.withAudioQuality = e.audioQuality = function(i) {
      return this._currentOutput.audio("-aq", i), this;
    }, e.withAudioFilter = e.withAudioFilters = e.audioFilter = e.audioFilters = function(i) {
      return arguments.length > 1 && (i = [].slice.call(arguments)), Array.isArray(i) || (i = [i]), this._currentOutput.audioFilters(S.makeFilterStrings(i)), this;
    };
  }, G;
}
var B, me;
function He() {
  if (me) return B;
  me = 1;
  var S = N();
  return B = function(e) {
    e.withNoVideo = e.noVideo = function() {
      return this._currentOutput.video.clear(), this._currentOutput.videoFilters.clear(), this._currentOutput.video("-vn"), this;
    }, e.withVideoCodec = e.videoCodec = function(i) {
      return this._currentOutput.video("-vcodec", i), this;
    }, e.withVideoBitrate = e.videoBitrate = function(i, x) {
      return i = ("" + i).replace(/k?$/, "k"), this._currentOutput.video("-b:v", i), x && this._currentOutput.video(
        "-maxrate",
        i,
        "-minrate",
        i,
        "-bufsize",
        "3M"
      ), this;
    }, e.withVideoFilter = e.withVideoFilters = e.videoFilter = e.videoFilters = function(i) {
      return arguments.length > 1 && (i = [].slice.call(arguments)), Array.isArray(i) || (i = [i]), this._currentOutput.videoFilters(S.makeFilterStrings(i)), this;
    }, e.withOutputFps = e.withOutputFPS = e.withFpsOutput = e.withFPSOutput = e.withFps = e.withFPS = e.outputFPS = e.outputFps = e.fpsOutput = e.FPSOutput = e.fps = e.FPS = function(i) {
      return this._currentOutput.video("-r", i), this;
    }, e.takeFrames = e.withFrames = e.frames = function(i) {
      return this._currentOutput.video("-vframes", i), this;
    };
  }, B;
}
var U, ge;
function We() {
  if (ge) return U;
  ge = 1;
  function S(i, x, h, n) {
    return [
      /*
        In both cases, we first have to scale the input to match the requested size.
        When using computed width/height, we truncate them to multiples of 2
       */
      {
        filter: "scale",
        options: {
          w: "if(gt(a," + h + ")," + i + ",trunc(" + x + "*a/2)*2)",
          h: "if(lt(a," + h + ")," + x + ",trunc(" + i + "/a/2)*2)"
        }
      },
      /*
        Then we pad the scaled input to match the target size
        (here iw and ih refer to the padding input, i.e the scaled output)
       */
      {
        filter: "pad",
        options: {
          w: i,
          h: x,
          x: "if(gt(a," + h + "),0,(" + i + "-iw)/2)",
          y: "if(lt(a," + h + "),0,(" + x + "-ih)/2)",
          color: n
        }
      }
    ];
  }
  function e(i, x, h) {
    var n = i.sizeData = i.sizeData || {};
    if (n[x] = h, !("size" in n))
      return [];
    var p = n.size.match(/([0-9]+)x([0-9]+)/), o = n.size.match(/([0-9]+)x\?/), u = n.size.match(/\?x([0-9]+)/), l = n.size.match(/\b([0-9]{1,3})%/), f, g, m;
    if (l) {
      var I = Number(l[1]) / 100;
      return [{
        filter: "scale",
        options: {
          w: "trunc(iw*" + I + "/2)*2",
          h: "trunc(ih*" + I + "/2)*2"
        }
      }];
    } else {
      if (p)
        return f = Math.round(Number(p[1]) / 2) * 2, g = Math.round(Number(p[2]) / 2) * 2, m = f / g, n.pad ? S(f, g, m, n.pad) : [{ filter: "scale", options: { w: f, h: g } }];
      if (o || u)
        return "aspect" in n ? (f = o ? o[1] : Math.round(Number(u[1]) * n.aspect), g = u ? u[1] : Math.round(Number(o[1]) / n.aspect), f = Math.round(f / 2) * 2, g = Math.round(g / 2) * 2, n.pad ? S(f, g, n.aspect, n.pad) : [{ filter: "scale", options: { w: f, h: g } }]) : o ? [{
          filter: "scale",
          options: {
            w: Math.round(Number(o[1]) / 2) * 2,
            h: "trunc(ow/a/2)*2"
          }
        }] : [{
          filter: "scale",
          options: {
            w: "trunc(oh*a/2)*2",
            h: Math.round(Number(u[1]) / 2) * 2
          }
        }];
      throw new Error("Invalid size specified: " + n.size);
    }
  }
  return U = function(i) {
    i.keepPixelAspect = // Only for compatibility, this is not about keeping _pixel_ aspect ratio
    i.keepDisplayAspect = i.keepDisplayAspectRatio = i.keepDAR = function() {
      return this.videoFilters([
        {
          filter: "scale",
          options: {
            w: "if(gt(sar,1),iw*sar,iw)",
            h: "if(lt(sar,1),ih/sar,ih)"
          }
        },
        {
          filter: "setsar",
          options: "1"
        }
      ]);
    }, i.withSize = i.setSize = i.size = function(x) {
      var h = e(this._currentOutput, "size", x);
      return this._currentOutput.sizeFilters.clear(), this._currentOutput.sizeFilters(h), this;
    }, i.withAspect = i.withAspectRatio = i.setAspect = i.setAspectRatio = i.aspect = i.aspectRatio = function(x) {
      var h = Number(x);
      if (isNaN(h)) {
        var n = x.match(/^(\d+):(\d+)$/);
        if (n)
          h = Number(n[1]) / Number(n[2]);
        else
          throw new Error("Invalid aspect ratio: " + x);
      }
      var p = e(this._currentOutput, "aspect", h);
      return this._currentOutput.sizeFilters.clear(), this._currentOutput.sizeFilters(p), this;
    }, i.applyAutopadding = i.applyAutoPadding = i.applyAutopad = i.applyAutoPad = i.withAutopadding = i.withAutoPadding = i.withAutopad = i.withAutoPad = i.autoPad = i.autopad = function(x, h) {
      typeof x == "string" && (h = x, x = !0), typeof x > "u" && (x = !0);
      var n = e(this._currentOutput, "pad", x ? h || "black" : !1);
      return this._currentOutput.sizeFilters.clear(), this._currentOutput.sizeFilters(n), this;
    };
  }, U;
}
var X, we;
function Ge() {
  if (we) return X;
  we = 1;
  var S = N();
  return X = function(e) {
    e.addOutput = e.output = function(i, x) {
      var h = !1;
      if (!i && this._currentOutput)
        throw new Error("Invalid output");
      if (i && typeof i != "string") {
        if (!("writable" in i) || !i.writable)
          throw new Error("Invalid output");
      } else if (typeof i == "string") {
        var n = i.match(/^([a-z]{2,}):/i);
        h = !n || n[0] === "file";
      }
      if (i && !("target" in this._currentOutput))
        this._currentOutput.target = i, this._currentOutput.isFile = h, this._currentOutput.pipeopts = x || {};
      else {
        if (i && typeof i != "string") {
          var p = this._outputs.some(function(u) {
            return typeof u.target != "string";
          });
          if (p)
            throw new Error("Only one output stream is supported");
        }
        this._outputs.push(this._currentOutput = {
          target: i,
          isFile: h,
          flags: {},
          pipeopts: x || {}
        });
        var o = this;
        ["audio", "audioFilters", "video", "videoFilters", "sizeFilters", "options"].forEach(function(u) {
          o._currentOutput[u] = S.args();
        }), i || delete this._currentOutput.target;
      }
      return this;
    }, e.seekOutput = e.seek = function(i) {
      return this._currentOutput.options("-ss", i), this;
    }, e.withDuration = e.setDuration = e.duration = function(i) {
      return this._currentOutput.options("-t", i), this;
    }, e.toFormat = e.withOutputFormat = e.outputFormat = e.format = function(i) {
      return this._currentOutput.options("-f", i), this;
    }, e.map = function(i) {
      return this._currentOutput.options("-map", i.replace(S.streamRegexp, "[$1]")), this;
    }, e.updateFlvMetadata = e.flvmeta = function() {
      return this._currentOutput.flags.flvmeta = !0, this;
    };
  }, X;
}
var Q, ye;
function Be() {
  if (ye) return Q;
  ye = 1;
  var S = N();
  return Q = function(e) {
    e.addInputOption = e.addInputOptions = e.withInputOption = e.withInputOptions = e.inputOption = e.inputOptions = function(i) {
      if (!this._currentInput)
        throw new Error("No input specified");
      var x = !0;
      return arguments.length > 1 && (i = [].slice.call(arguments), x = !1), Array.isArray(i) || (i = [i]), this._currentInput.options(i.reduce(function(h, n) {
        var p = String(n).split(" ");
        return x && p.length === 2 ? h.push(p[0], p[1]) : h.push(n), h;
      }, [])), this;
    }, e.addOutputOption = e.addOutputOptions = e.addOption = e.addOptions = e.withOutputOption = e.withOutputOptions = e.withOption = e.withOptions = e.outputOption = e.outputOptions = function(i) {
      var x = !0;
      return arguments.length > 1 && (i = [].slice.call(arguments), x = !1), Array.isArray(i) || (i = [i]), this._currentOutput.options(i.reduce(function(h, n) {
        var p = String(n).split(" ");
        return x && p.length === 2 ? h.push(p[0], p[1]) : h.push(n), h;
      }, [])), this;
    }, e.filterGraph = e.complexFilter = function(i, x) {
      if (this._complexFilters.clear(), Array.isArray(i) || (i = [i]), this._complexFilters("-filter_complex", S.makeFilterStrings(i).join(";")), Array.isArray(x)) {
        var h = this;
        x.forEach(function(n) {
          h._complexFilters("-map", n.replace(S.streamRegexp, "[$1]"));
        });
      } else typeof x == "string" && this._complexFilters("-map", x.replace(S.streamRegexp, "[$1]"));
      return this;
    };
  }, Q;
}
function Ue(S) {
  throw new Error('Could not dynamically require "' + S + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');
}
var Y, _e;
function Xe() {
  if (_e) return Y;
  _e = 1;
  var S = C;
  return Y = function(e) {
    e.usingPreset = e.preset = function(i) {
      if (typeof i == "function")
        i(this);
      else
        try {
          var x = S.join(this.options.presets, i), h = Ue(x);
          if (typeof h.load == "function")
            h.load(this);
          else
            throw new Error("preset " + x + " has no load() function");
        } catch (n) {
          throw new Error("preset " + x + " could not be loaded: " + n.message);
        }
      return this;
    };
  }, Y;
}
var J = { exports: {} }, Fe;
function ue() {
  return Fe || (Fe = 1, function(S) {
    (function() {
      var e = {}, i, x;
      i = this, i != null && (x = i.async), e.noConflict = function() {
        return i.async = x, e;
      };
      function h(t) {
        var r = !1;
        return function() {
          if (r) throw new Error("Callback was already called.");
          r = !0, t.apply(i, arguments);
        };
      }
      var n = function(t, r) {
        if (t.forEach)
          return t.forEach(r);
        for (var s = 0; s < t.length; s += 1)
          r(t[s], s, t);
      }, p = function(t, r) {
        if (t.map)
          return t.map(r);
        var s = [];
        return n(t, function(a, c, d) {
          s.push(r(a, c, d));
        }), s;
      }, o = function(t, r, s) {
        return t.reduce ? t.reduce(r, s) : (n(t, function(a, c, d) {
          s = r(s, a, c, d);
        }), s);
      }, u = function(t) {
        if (Object.keys)
          return Object.keys(t);
        var r = [];
        for (var s in t)
          t.hasOwnProperty(s) && r.push(s);
        return r;
      };
      typeof process > "u" || !process.nextTick ? typeof setImmediate == "function" ? (e.nextTick = function(t) {
        setImmediate(t);
      }, e.setImmediate = e.nextTick) : (e.nextTick = function(t) {
        setTimeout(t, 0);
      }, e.setImmediate = e.nextTick) : (e.nextTick = process.nextTick, typeof setImmediate < "u" ? e.setImmediate = function(t) {
        setImmediate(t);
      } : e.setImmediate = e.nextTick), e.each = function(t, r, s) {
        if (s = s || function() {
        }, !t.length)
          return s();
        var a = 0;
        n(t, function(c) {
          r(c, h(function(d) {
            d ? (s(d), s = function() {
            }) : (a += 1, a >= t.length && s(null));
          }));
        });
      }, e.forEach = e.each, e.eachSeries = function(t, r, s) {
        if (s = s || function() {
        }, !t.length)
          return s();
        var a = 0, c = function() {
          r(t[a], function(d) {
            d ? (s(d), s = function() {
            }) : (a += 1, a >= t.length ? s(null) : c());
          });
        };
        c();
      }, e.forEachSeries = e.eachSeries, e.eachLimit = function(t, r, s, a) {
        var c = l(r);
        c.apply(null, [t, s, a]);
      }, e.forEachLimit = e.eachLimit;
      var l = function(t) {
        return function(r, s, a) {
          if (a = a || function() {
          }, !r.length || t <= 0)
            return a();
          var c = 0, d = 0, A = 0;
          (function T() {
            if (c >= r.length)
              return a();
            for (; A < t && d < r.length; )
              d += 1, A += 1, s(r[d - 1], function(b) {
                b ? (a(b), a = function() {
                }) : (c += 1, A -= 1, c >= r.length ? a() : T());
              });
          })();
        };
      }, f = function(t) {
        return function() {
          var r = Array.prototype.slice.call(arguments);
          return t.apply(null, [e.each].concat(r));
        };
      }, g = function(t, r) {
        return function() {
          var s = Array.prototype.slice.call(arguments);
          return r.apply(null, [l(t)].concat(s));
        };
      }, m = function(t) {
        return function() {
          var r = Array.prototype.slice.call(arguments);
          return t.apply(null, [e.eachSeries].concat(r));
        };
      }, I = function(t, r, s, a) {
        var c = [];
        r = p(r, function(d, A) {
          return { index: A, value: d };
        }), t(r, function(d, A) {
          s(d.value, function(T, b) {
            c[d.index] = b, A(T);
          });
        }, function(d) {
          a(d, c);
        });
      };
      e.map = f(I), e.mapSeries = m(I), e.mapLimit = function(t, r, s, a) {
        return E(r)(t, s, a);
      };
      var E = function(t) {
        return g(t, I);
      };
      e.reduce = function(t, r, s, a) {
        e.eachSeries(t, function(c, d) {
          s(r, c, function(A, T) {
            r = T, d(A);
          });
        }, function(c) {
          a(c, r);
        });
      }, e.inject = e.reduce, e.foldl = e.reduce, e.reduceRight = function(t, r, s, a) {
        var c = p(t, function(d) {
          return d;
        }).reverse();
        e.reduce(c, r, s, a);
      }, e.foldr = e.reduceRight;
      var _ = function(t, r, s, a) {
        var c = [];
        r = p(r, function(d, A) {
          return { index: A, value: d };
        }), t(r, function(d, A) {
          s(d.value, function(T) {
            T && c.push(d), A();
          });
        }, function(d) {
          a(p(c.sort(function(A, T) {
            return A.index - T.index;
          }), function(A) {
            return A.value;
          }));
        });
      };
      e.filter = f(_), e.filterSeries = m(_), e.select = e.filter, e.selectSeries = e.filterSeries;
      var w = function(t, r, s, a) {
        var c = [];
        r = p(r, function(d, A) {
          return { index: A, value: d };
        }), t(r, function(d, A) {
          s(d.value, function(T) {
            T || c.push(d), A();
          });
        }, function(d) {
          a(p(c.sort(function(A, T) {
            return A.index - T.index;
          }), function(A) {
            return A.value;
          }));
        });
      };
      e.reject = f(w), e.rejectSeries = m(w);
      var P = function(t, r, s, a) {
        t(r, function(c, d) {
          s(c, function(A) {
            A ? (a(c), a = function() {
            }) : d();
          });
        }, function(c) {
          a();
        });
      };
      e.detect = f(P), e.detectSeries = m(P), e.some = function(t, r, s) {
        e.each(t, function(a, c) {
          r(a, function(d) {
            d && (s(!0), s = function() {
            }), c();
          });
        }, function(a) {
          s(!1);
        });
      }, e.any = e.some, e.every = function(t, r, s) {
        e.each(t, function(a, c) {
          r(a, function(d) {
            d || (s(!1), s = function() {
            }), c();
          });
        }, function(a) {
          s(!0);
        });
      }, e.all = e.every, e.sortBy = function(t, r, s) {
        e.map(t, function(a, c) {
          r(a, function(d, A) {
            d ? c(d) : c(null, { value: a, criteria: A });
          });
        }, function(a, c) {
          if (a)
            return s(a);
          var d = function(A, T) {
            var b = A.criteria, z = T.criteria;
            return b < z ? -1 : b > z ? 1 : 0;
          };
          s(null, p(c.sort(d), function(A) {
            return A.value;
          }));
        });
      }, e.auto = function(t, r) {
        r = r || function() {
        };
        var s = u(t);
        if (!s.length)
          return r(null);
        var a = {}, c = [], d = function(b) {
          c.unshift(b);
        }, A = function(b) {
          for (var z = 0; z < c.length; z += 1)
            if (c[z] === b) {
              c.splice(z, 1);
              return;
            }
        }, T = function() {
          n(c.slice(0), function(b) {
            b();
          });
        };
        d(function() {
          u(a).length === s.length && (r(null, a), r = function() {
          });
        }), n(s, function(b) {
          var z = t[b] instanceof Function ? [t[b]] : t[b], q = function(R) {
            var $ = Array.prototype.slice.call(arguments, 1);
            if ($.length <= 1 && ($ = $[0]), R) {
              var D = {};
              n(u(a), function(fe) {
                D[fe] = a[fe];
              }), D[b] = $, r(R, D), r = function() {
              };
            } else
              a[b] = $, e.setImmediate(T);
          }, Te = z.slice(0, Math.abs(z.length - 1)) || [], se = function() {
            return o(Te, function(R, $) {
              return R && a.hasOwnProperty($);
            }, !0) && !a.hasOwnProperty(b);
          };
          if (se())
            z[z.length - 1](q, a);
          else {
            var ae = function() {
              se() && (A(ae), z[z.length - 1](q, a));
            };
            d(ae);
          }
        });
      }, e.waterfall = function(t, r) {
        if (r = r || function() {
        }, t.constructor !== Array) {
          var s = new Error("First argument to waterfall must be an array of functions");
          return r(s);
        }
        if (!t.length)
          return r();
        var a = function(c) {
          return function(d) {
            if (d)
              r.apply(null, arguments), r = function() {
              };
            else {
              var A = Array.prototype.slice.call(arguments, 1), T = c.next();
              T ? A.push(a(T)) : A.push(r), e.setImmediate(function() {
                c.apply(null, A);
              });
            }
          };
        };
        a(e.iterator(t))();
      };
      var O = function(t, r, s) {
        if (s = s || function() {
        }, r.constructor === Array)
          t.map(r, function(c, d) {
            c && c(function(A) {
              var T = Array.prototype.slice.call(arguments, 1);
              T.length <= 1 && (T = T[0]), d.call(null, A, T);
            });
          }, s);
        else {
          var a = {};
          t.each(u(r), function(c, d) {
            r[c](function(A) {
              var T = Array.prototype.slice.call(arguments, 1);
              T.length <= 1 && (T = T[0]), a[c] = T, d(A);
            });
          }, function(c) {
            s(c, a);
          });
        }
      };
      e.parallel = function(t, r) {
        O({ map: e.map, each: e.each }, t, r);
      }, e.parallelLimit = function(t, r, s) {
        O({ map: E(r), each: l(r) }, t, s);
      }, e.series = function(t, r) {
        if (r = r || function() {
        }, t.constructor === Array)
          e.mapSeries(t, function(a, c) {
            a && a(function(d) {
              var A = Array.prototype.slice.call(arguments, 1);
              A.length <= 1 && (A = A[0]), c.call(null, d, A);
            });
          }, r);
        else {
          var s = {};
          e.eachSeries(u(t), function(a, c) {
            t[a](function(d) {
              var A = Array.prototype.slice.call(arguments, 1);
              A.length <= 1 && (A = A[0]), s[a] = A, c(d);
            });
          }, function(a) {
            r(a, s);
          });
        }
      }, e.iterator = function(t) {
        var r = function(s) {
          var a = function() {
            return t.length && t[s].apply(null, arguments), a.next();
          };
          return a.next = function() {
            return s < t.length - 1 ? r(s + 1) : null;
          }, a;
        };
        return r(0);
      }, e.apply = function(t) {
        var r = Array.prototype.slice.call(arguments, 1);
        return function() {
          return t.apply(
            null,
            r.concat(Array.prototype.slice.call(arguments))
          );
        };
      };
      var F = function(t, r, s, a) {
        var c = [];
        t(r, function(d, A) {
          s(d, function(T, b) {
            c = c.concat(b || []), A(T);
          });
        }, function(d) {
          a(d, c);
        });
      };
      e.concat = f(F), e.concatSeries = m(F), e.whilst = function(t, r, s) {
        t() ? r(function(a) {
          if (a)
            return s(a);
          e.whilst(t, r, s);
        }) : s();
      }, e.doWhilst = function(t, r, s) {
        t(function(a) {
          if (a)
            return s(a);
          r() ? e.doWhilst(t, r, s) : s();
        });
      }, e.until = function(t, r, s) {
        t() ? s() : r(function(a) {
          if (a)
            return s(a);
          e.until(t, r, s);
        });
      }, e.doUntil = function(t, r, s) {
        t(function(a) {
          if (a)
            return s(a);
          r() ? s() : e.doUntil(t, r, s);
        });
      }, e.queue = function(t, r) {
        r === void 0 && (r = 1);
        function s(d, A, T, b) {
          A.constructor !== Array && (A = [A]), n(A, function(z) {
            var q = {
              data: z,
              callback: typeof b == "function" ? b : null
            };
            T ? d.tasks.unshift(q) : d.tasks.push(q), d.saturated && d.tasks.length === r && d.saturated(), e.setImmediate(d.process);
          });
        }
        var a = 0, c = {
          tasks: [],
          concurrency: r,
          saturated: null,
          empty: null,
          drain: null,
          push: function(d, A) {
            s(c, d, !1, A);
          },
          unshift: function(d, A) {
            s(c, d, !0, A);
          },
          process: function() {
            if (a < c.concurrency && c.tasks.length) {
              var d = c.tasks.shift();
              c.empty && c.tasks.length === 0 && c.empty(), a += 1;
              var A = function() {
                a -= 1, d.callback && d.callback.apply(d, arguments), c.drain && c.tasks.length + a === 0 && c.drain(), c.process();
              }, T = h(A);
              t(d.data, T);
            }
          },
          length: function() {
            return c.tasks.length;
          },
          running: function() {
            return a;
          }
        };
        return c;
      }, e.cargo = function(t, r) {
        var s = !1, a = [], c = {
          tasks: a,
          payload: r,
          saturated: null,
          empty: null,
          drain: null,
          push: function(d, A) {
            d.constructor !== Array && (d = [d]), n(d, function(T) {
              a.push({
                data: T,
                callback: typeof A == "function" ? A : null
              }), c.saturated && a.length === r && c.saturated();
            }), e.setImmediate(c.process);
          },
          process: function d() {
            if (!s) {
              if (a.length === 0) {
                c.drain && c.drain();
                return;
              }
              var A = typeof r == "number" ? a.splice(0, r) : a.splice(0), T = p(A, function(b) {
                return b.data;
              });
              c.empty && c.empty(), s = !0, t(T, function() {
                s = !1;
                var b = arguments;
                n(A, function(z) {
                  z.callback && z.callback.apply(null, b);
                }), d();
              });
            }
          },
          length: function() {
            return a.length;
          },
          running: function() {
            return s;
          }
        };
        return c;
      };
      var y = function(t) {
        return function(r) {
          var s = Array.prototype.slice.call(arguments, 1);
          r.apply(null, s.concat([function(a) {
            var c = Array.prototype.slice.call(arguments, 1);
            typeof console < "u" && (a ? console.error && console.error(a) : console[t] && n(c, function(d) {
              console[t](d);
            }));
          }]));
        };
      };
      e.log = y("log"), e.dir = y("dir"), e.memoize = function(t, r) {
        var s = {}, a = {};
        r = r || function(d) {
          return d;
        };
        var c = function() {
          var d = Array.prototype.slice.call(arguments), A = d.pop(), T = r.apply(null, d);
          T in s ? A.apply(null, s[T]) : T in a ? a[T].push(A) : (a[T] = [A], t.apply(null, d.concat([function() {
            s[T] = arguments;
            var b = a[T];
            delete a[T];
            for (var z = 0, q = b.length; z < q; z++)
              b[z].apply(null, arguments);
          }])));
        };
        return c.memo = s, c.unmemoized = t, c;
      }, e.unmemoize = function(t) {
        return function() {
          return (t.unmemoized || t).apply(null, arguments);
        };
      }, e.times = function(t, r, s) {
        for (var a = [], c = 0; c < t; c++)
          a.push(c);
        return e.map(a, r, s);
      }, e.timesSeries = function(t, r, s) {
        for (var a = [], c = 0; c < t; c++)
          a.push(c);
        return e.mapSeries(a, r, s);
      }, e.compose = function() {
        var t = Array.prototype.reverse.call(arguments);
        return function() {
          var r = this, s = Array.prototype.slice.call(arguments), a = s.pop();
          e.reduce(
            t,
            s,
            function(c, d, A) {
              d.apply(r, c.concat([function() {
                var T = arguments[0], b = Array.prototype.slice.call(arguments, 1);
                A(T, b);
              }]));
            },
            function(c, d) {
              a.apply(r, [c].concat(d));
            }
          );
        };
      };
      var v = function(t, r) {
        var s = function() {
          var c = this, d = Array.prototype.slice.call(arguments), A = d.pop();
          return t(
            r,
            function(T, b) {
              T.apply(c, d.concat([b]));
            },
            A
          );
        };
        if (arguments.length > 2) {
          var a = Array.prototype.slice.call(arguments, 2);
          return s.apply(this, a);
        } else
          return s;
      };
      e.applyEach = f(v), e.applyEachSeries = m(v), e.forever = function(t, r) {
        function s(a) {
          if (a) {
            if (r)
              return r(a);
            throw a;
          }
          t(s);
        }
        s();
      }, S.exports ? S.exports = e : i.async = e;
    })();
  }(J)), J.exports;
}
var Z, Ee;
function Qe() {
  if (Ee) return Z;
  Ee = 1;
  var S = ie.spawn, e = ue(), i = N();
  function x(h) {
    h._inputs[0].isStream || h.ffprobe(0, function(p, o) {
      h._ffprobeData = o;
    });
  }
  return Z = function(h) {
    h._spawnFfmpeg = function(n, p, o, u) {
      typeof p == "function" && (u = o, o = p, p = {}), typeof u > "u" && (u = o, o = function() {
      });
      var l = "stdoutLines" in p ? p.stdoutLines : this.options.stdoutLines;
      this._getFfmpegPath(function(f, g) {
        if (f)
          return u(f);
        if (!g || g.length === 0)
          return u(new Error("Cannot find ffmpeg"));
        p.niceness && p.niceness !== 0 && !i.isWindows && (n.unshift("-n", p.niceness, g), g = "nice");
        var m = i.linesRing(l), I = !1, E = i.linesRing(l), _ = !1, w = S(g, n, p);
        w.stderr && w.stderr.setEncoding("utf8"), w.on("error", function(y) {
          u(y);
        });
        var P = null;
        function O(y) {
          y && (P = y), F && (I || !p.captureStdout) && _ && u(P, m, E);
        }
        var F = !1;
        w.on("exit", function(y, v) {
          F = !0, v ? O(new Error("ffmpeg was killed with signal " + v)) : y ? O(new Error("ffmpeg exited with code " + y)) : O();
        }), p.captureStdout && (w.stdout.on("data", function(y) {
          m.append(y);
        }), w.stdout.on("close", function() {
          m.close(), I = !0, O();
        })), w.stderr.on("data", function(y) {
          E.append(y);
        }), w.stderr.on("close", function() {
          E.close(), _ = !0, O();
        }), o(w, m, E);
      });
    }, h._getArguments = function() {
      var n = this._complexFilters.get(), p = this._outputs.some(function(o) {
        return o.isFile;
      });
      return [].concat(
        // Inputs and input options
        this._inputs.reduce(function(o, u) {
          var l = typeof u.source == "string" ? u.source : "pipe:0";
          return o.concat(
            u.options.get(),
            ["-i", l]
          );
        }, []),
        // Global options
        this._global.get(),
        // Overwrite if we have file outputs
        p ? ["-y"] : [],
        // Complex filters
        n,
        // Outputs, filters and output options
        this._outputs.reduce(function(o, u) {
          var l = i.makeFilterStrings(u.sizeFilters.get()), f = u.audioFilters.get(), g = u.videoFilters.get().concat(l), m;
          return u.target ? typeof u.target == "string" ? m = [u.target] : m = ["pipe:1"] : m = [], o.concat(
            u.audio.get(),
            f.length ? ["-filter:a", f.join(",")] : [],
            u.video.get(),
            g.length ? ["-filter:v", g.join(",")] : [],
            u.options.get(),
            m
          );
        }, [])
      );
    }, h._prepare = function(n, p) {
      var o = this;
      e.waterfall([
        // Check codecs and formats
        function(u) {
          o._checkCapabilities(u);
        },
        // Read metadata if required
        function(u) {
          if (!p)
            return u();
          o.ffprobe(0, function(l, f) {
            l || (o._ffprobeData = f), u();
          });
        },
        // Check for flvtool2/flvmeta if necessary
        function(u) {
          var l = o._outputs.some(function(f) {
            return f.flags.flvmeta && !f.isFile && (o.logger.warn("Updating flv metadata is only supported for files"), f.flags.flvmeta = !1), f.flags.flvmeta;
          });
          l ? o._getFlvtoolPath(function(f) {
            u(f);
          }) : u();
        },
        // Build argument list
        function(u) {
          var l;
          try {
            l = o._getArguments();
          } catch (f) {
            return u(f);
          }
          u(null, l);
        },
        // Add "-strict experimental" option where needed
        function(u, l) {
          o.availableEncoders(function(f, g) {
            for (var m = 0; m < u.length; m++)
              (u[m] === "-acodec" || u[m] === "-vcodec") && (m++, u[m] in g && g[u[m]].experimental && (u.splice(m + 1, 0, "-strict", "experimental"), m += 2));
            l(null, u);
          });
        }
      ], n), p || (this.listeners("progress").length > 0 ? x(this) : this.once("newListener", function(u) {
        u === "progress" && x(this);
      }));
    }, h.exec = h.execute = h.run = function() {
      var n = this, p = this._outputs.some(function(g) {
        return "target" in g;
      });
      if (!p)
        throw new Error("No output specified");
      var o = this._outputs.filter(function(g) {
        return typeof g.target != "string";
      })[0], u = this._inputs.filter(function(g) {
        return typeof g.source != "string";
      })[0], l = !1;
      function f(g, m, I) {
        l || (l = !0, g ? n.emit("error", g, m, I) : n.emit("end", m, I));
      }
      return n._prepare(function(g, m) {
        if (g)
          return f(g);
        n._spawnFfmpeg(
          m,
          {
            captureStdout: !o,
            niceness: n.options.niceness,
            cwd: n.options.cwd,
            windowsHide: !0
          },
          function(E, _, w) {
            if (n.ffmpegProc = E, n.emit("start", "ffmpeg " + m.join(" ")), u && (u.source.on("error", function(F) {
              var y = new Error("Input stream error: " + F.message);
              y.inputStreamError = F, f(y), E.kill();
            }), u.source.resume(), u.source.pipe(E.stdin), E.stdin.on("error", function() {
            })), n.options.timeout && (n.processTimer = setTimeout(function() {
              var F = "process ran into a timeout (" + n.options.timeout + "s)";
              f(new Error(F), _.get(), w.get()), E.kill();
            }, n.options.timeout * 1e3)), o && (E.stdout.pipe(o.target, o.pipeopts), o.target.on("close", function() {
              n.logger.debug("Output stream closed, scheduling kill for ffmpeg process"), setTimeout(function() {
                f(new Error("Output stream closed")), E.kill();
              }, 20);
            }), o.target.on("error", function(F) {
              n.logger.debug("Output stream error, killing ffmpeg process");
              var y = new Error("Output stream error: " + F.message);
              y.outputStreamError = F, f(y, _.get(), w.get()), E.kill("SIGKILL");
            })), w) {
              if (n.listeners("stderr").length && w.callback(function(F) {
                n.emit("stderr", F);
              }), n.listeners("codecData").length) {
                var P = !1, O = {};
                w.callback(function(F) {
                  P || (P = i.extractCodecData(n, F, O));
                });
              }
              n.listeners("progress").length && w.callback(function(F) {
                i.extractProgress(n, F);
              });
            }
          },
          function(E, _, w) {
            if (clearTimeout(n.processTimer), delete n.ffmpegProc, E)
              E.message.match(/ffmpeg exited with code/) && (E.message += ": " + i.extractError(w.get())), f(E, _.get(), w.get());
            else {
              var P = n._outputs.filter(function(O) {
                return O.flags.flvmeta;
              });
              P.length ? n._getFlvtoolPath(function(O, F) {
                if (O)
                  return f(O);
                e.each(
                  P,
                  function(y, v) {
                    S(F, ["-U", y.target], { windowsHide: !0 }).on("error", function(t) {
                      v(new Error("Error running " + F + " on " + y.target + ": " + t.message));
                    }).on("exit", function(t, r) {
                      t !== 0 || r ? v(
                        new Error(F + " " + (r ? "received signal " + r : "exited with code " + t)) + " when running on " + y.target
                      ) : v();
                    });
                  },
                  function(y) {
                    y ? f(y) : f(null, _.get(), w.get());
                  }
                );
              }) : f(null, _.get(), w.get());
            }
          }
        );
      }), this;
    }, h.renice = function(n) {
      if (!i.isWindows && (n = n || 0, (n < -20 || n > 20) && this.logger.warn("Invalid niceness value: " + n + ", must be between -20 and 20"), n = Math.min(20, Math.max(-20, n)), this.options.niceness = n, this.ffmpegProc)) {
        var p = this.logger, o = this.ffmpegProc.pid, u = S("renice", [n, "-p", o], { windowsHide: !0 });
        u.on("error", function(l) {
          p.warn("could not renice process " + o + ": " + l.message);
        }), u.on("exit", function(l, f) {
          f ? p.warn("could not renice process " + o + ": renice was killed by signal " + f) : l ? p.warn("could not renice process " + o + ": renice exited with " + l) : p.info("successfully reniced process " + o + " to " + n + " niceness");
        });
      }
      return this;
    }, h.kill = function(n) {
      return this.ffmpegProc ? this.ffmpegProc.kill(n || "SIGKILL") : this.logger.warn("No running ffmpeg process, cannot send signal"), this;
    };
  }, Z;
}
var K, xe;
function Ye() {
  if (xe) return K;
  xe = 1;
  var S = L, e = C, i = ue(), x = N(), h = /^\s*([D ])([E ])([VAS])([S ])([D ])([T ]) ([^ ]+) +(.*)$/, n = /^\s*([D\.])([E\.])([VAS])([I\.])([L\.])([S\.]) ([^ ]+) +(.*)$/, p = /\(encoders:([^\)]+)\)/, o = /\(decoders:([^\)]+)\)/, u = /^\s*([VAS\.])([F\.])([S\.])([X\.])([B\.])([D\.]) ([^ ]+) +(.*)$/, l = /^\s*([D ])([E ])\s+([^ ]+)\s+(.*)$/, f = /\r\n|\r|\n/, g = /^(?: [T\.][S\.][C\.] )?([^ ]+) +(AA?|VV?|\|)->(AA?|VV?|\|) +(.*)$/, m = {};
  return K = function(I) {
    I.setFfmpegPath = function(E) {
      return m.ffmpegPath = E, this;
    }, I.setFfprobePath = function(E) {
      return m.ffprobePath = E, this;
    }, I.setFlvtoolPath = function(E) {
      return m.flvtoolPath = E, this;
    }, I._forgetPaths = function() {
      delete m.ffmpegPath, delete m.ffprobePath, delete m.flvtoolPath;
    }, I._getFfmpegPath = function(E) {
      if ("ffmpegPath" in m)
        return E(null, m.ffmpegPath);
      i.waterfall([
        // Try FFMPEG_PATH
        function(_) {
          process.env.FFMPEG_PATH ? S.exists(process.env.FFMPEG_PATH, function(w) {
            w ? _(null, process.env.FFMPEG_PATH) : _(null, "");
          }) : _(null, "");
        },
        // Search in the PATH
        function(_, w) {
          if (_.length)
            return w(null, _);
          x.which("ffmpeg", function(P, O) {
            w(P, O);
          });
        }
      ], function(_, w) {
        _ ? E(_) : E(null, m.ffmpegPath = w || "");
      });
    }, I._getFfprobePath = function(E) {
      var _ = this;
      if ("ffprobePath" in m)
        return E(null, m.ffprobePath);
      i.waterfall([
        // Try FFPROBE_PATH
        function(w) {
          process.env.FFPROBE_PATH ? S.exists(process.env.FFPROBE_PATH, function(P) {
            w(null, P ? process.env.FFPROBE_PATH : "");
          }) : w(null, "");
        },
        // Search in the PATH
        function(w, P) {
          if (w.length)
            return P(null, w);
          x.which("ffprobe", function(O, F) {
            P(O, F);
          });
        },
        // Search in the same directory as ffmpeg
        function(w, P) {
          if (w.length)
            return P(null, w);
          _._getFfmpegPath(function(O, F) {
            if (O)
              P(O);
            else if (F.length) {
              var y = x.isWindows ? "ffprobe.exe" : "ffprobe", v = e.join(e.dirname(F), y);
              S.exists(v, function(t) {
                P(null, t ? v : "");
              });
            } else
              P(null, "");
          });
        }
      ], function(w, P) {
        w ? E(w) : E(null, m.ffprobePath = P || "");
      });
    }, I._getFlvtoolPath = function(E) {
      if ("flvtoolPath" in m)
        return E(null, m.flvtoolPath);
      i.waterfall([
        // Try FLVMETA_PATH
        function(_) {
          process.env.FLVMETA_PATH ? S.exists(process.env.FLVMETA_PATH, function(w) {
            _(null, w ? process.env.FLVMETA_PATH : "");
          }) : _(null, "");
        },
        // Try FLVTOOL2_PATH
        function(_, w) {
          if (_.length)
            return w(null, _);
          process.env.FLVTOOL2_PATH ? S.exists(process.env.FLVTOOL2_PATH, function(P) {
            w(null, P ? process.env.FLVTOOL2_PATH : "");
          }) : w(null, "");
        },
        // Search for flvmeta in the PATH
        function(_, w) {
          if (_.length)
            return w(null, _);
          x.which("flvmeta", function(P, O) {
            w(P, O);
          });
        },
        // Search for flvtool2 in the PATH
        function(_, w) {
          if (_.length)
            return w(null, _);
          x.which("flvtool2", function(P, O) {
            w(P, O);
          });
        }
      ], function(_, w) {
        _ ? E(_) : E(null, m.flvtoolPath = w || "");
      });
    }, I.availableFilters = I.getAvailableFilters = function(E) {
      if ("filters" in m)
        return E(null, m.filters);
      this._spawnFfmpeg(["-filters"], { captureStdout: !0, stdoutLines: 0 }, function(_, w) {
        if (_)
          return E(_);
        var P = w.get(), O = P.split(`
`), F = {}, y = { A: "audio", V: "video", "|": "none" };
        O.forEach(function(v) {
          var t = v.match(g);
          t && (F[t[1]] = {
            description: t[4],
            input: y[t[2].charAt(0)],
            multipleInputs: t[2].length > 1,
            output: y[t[3].charAt(0)],
            multipleOutputs: t[3].length > 1
          });
        }), E(null, m.filters = F);
      });
    }, I.availableCodecs = I.getAvailableCodecs = function(E) {
      if ("codecs" in m)
        return E(null, m.codecs);
      this._spawnFfmpeg(["-codecs"], { captureStdout: !0, stdoutLines: 0 }, function(_, w) {
        if (_)
          return E(_);
        var P = w.get(), O = P.split(f), F = {};
        O.forEach(function(y) {
          var v = y.match(h);
          if (v && v[7] !== "=" && (F[v[7]] = {
            type: { V: "video", A: "audio", S: "subtitle" }[v[3]],
            description: v[8],
            canDecode: v[1] === "D",
            canEncode: v[2] === "E",
            drawHorizBand: v[4] === "S",
            directRendering: v[5] === "D",
            weirdFrameTruncation: v[6] === "T"
          }), v = y.match(n), v && v[7] !== "=") {
            var t = F[v[7]] = {
              type: { V: "video", A: "audio", S: "subtitle" }[v[3]],
              description: v[8],
              canDecode: v[1] === "D",
              canEncode: v[2] === "E",
              intraFrameOnly: v[4] === "I",
              isLossy: v[5] === "L",
              isLossless: v[6] === "S"
            }, r = t.description.match(p);
            r = r ? r[1].trim().split(" ") : [];
            var s = t.description.match(o);
            if (s = s ? s[1].trim().split(" ") : [], r.length || s.length) {
              var a = {};
              x.copy(t, a), delete a.canEncode, delete a.canDecode, r.forEach(function(c) {
                F[c] = {}, x.copy(a, F[c]), F[c].canEncode = !0;
              }), s.forEach(function(c) {
                c in F || (F[c] = {}, x.copy(a, F[c])), F[c].canDecode = !0;
              });
            }
          }
        }), E(null, m.codecs = F);
      });
    }, I.availableEncoders = I.getAvailableEncoders = function(E) {
      if ("encoders" in m)
        return E(null, m.encoders);
      this._spawnFfmpeg(["-encoders"], { captureStdout: !0, stdoutLines: 0 }, function(_, w) {
        if (_)
          return E(_);
        var P = w.get(), O = P.split(f), F = {};
        O.forEach(function(y) {
          var v = y.match(u);
          v && v[7] !== "=" && (F[v[7]] = {
            type: { V: "video", A: "audio", S: "subtitle" }[v[1]],
            description: v[8],
            frameMT: v[2] === "F",
            sliceMT: v[3] === "S",
            experimental: v[4] === "X",
            drawHorizBand: v[5] === "B",
            directRendering: v[6] === "D"
          });
        }), E(null, m.encoders = F);
      });
    }, I.availableFormats = I.getAvailableFormats = function(E) {
      if ("formats" in m)
        return E(null, m.formats);
      this._spawnFfmpeg(["-formats"], { captureStdout: !0, stdoutLines: 0 }, function(_, w) {
        if (_)
          return E(_);
        var P = w.get(), O = P.split(f), F = {};
        O.forEach(function(y) {
          var v = y.match(l);
          v && v[3].split(",").forEach(function(t) {
            t in F || (F[t] = {
              description: v[4],
              canDemux: !1,
              canMux: !1
            }), v[1] === "D" && (F[t].canDemux = !0), v[2] === "E" && (F[t].canMux = !0);
          });
        }), E(null, m.formats = F);
      });
    }, I._checkCapabilities = function(E) {
      var _ = this;
      i.waterfall([
        // Get available formats
        function(w) {
          _.availableFormats(w);
        },
        // Check whether specified formats are available
        function(w, P) {
          var O;
          if (O = _._outputs.reduce(function(F, y) {
            var v = y.options.find("-f", 1);
            return v && (!(v[0] in w) || !w[v[0]].canMux) && F.push(v), F;
          }, []), O.length === 1)
            return P(new Error("Output format " + O[0] + " is not available"));
          if (O.length > 1)
            return P(new Error("Output formats " + O.join(", ") + " are not available"));
          if (O = _._inputs.reduce(function(F, y) {
            var v = y.options.find("-f", 1);
            return v && (!(v[0] in w) || !w[v[0]].canDemux) && F.push(v[0]), F;
          }, []), O.length === 1)
            return P(new Error("Input format " + O[0] + " is not available"));
          if (O.length > 1)
            return P(new Error("Input formats " + O.join(", ") + " are not available"));
          P();
        },
        // Get available codecs
        function(w) {
          _.availableEncoders(w);
        },
        // Check whether specified codecs are available and add strict experimental options if needed
        function(w, P) {
          var O;
          if (O = _._outputs.reduce(function(F, y) {
            var v = y.audio.find("-acodec", 1);
            return v && v[0] !== "copy" && (!(v[0] in w) || w[v[0]].type !== "audio") && F.push(v[0]), F;
          }, []), O.length === 1)
            return P(new Error("Audio codec " + O[0] + " is not available"));
          if (O.length > 1)
            return P(new Error("Audio codecs " + O.join(", ") + " are not available"));
          if (O = _._outputs.reduce(function(F, y) {
            var v = y.video.find("-vcodec", 1);
            return v && v[0] !== "copy" && (!(v[0] in w) || w[v[0]].type !== "video") && F.push(v[0]), F;
          }, []), O.length === 1)
            return P(new Error("Video codec " + O[0] + " is not available"));
          if (O.length > 1)
            return P(new Error("Video codecs " + O.join(", ") + " are not available"));
          P();
        }
      ], E);
    };
  }, K;
}
var ee, Ae;
function Je() {
  if (Ae) return ee;
  Ae = 1;
  var S = ie.spawn;
  function e(h) {
    return h.match(/^TAG:/);
  }
  function i(h) {
    return h.match(/^DISPOSITION:/);
  }
  function x(h) {
    var n = h.split(/\r\n|\r|\n/);
    n = n.filter(function(g) {
      return g.length > 0;
    });
    var p = {
      streams: [],
      format: {},
      chapters: []
    };
    function o(g) {
      for (var m = {}, I = n.shift(); typeof I < "u"; ) {
        if (I.toLowerCase() == "[/" + g + "]")
          return m;
        if (I.match(/^\[/)) {
          I = n.shift();
          continue;
        }
        var E = I.match(/^([^=]+)=(.*)$/);
        E && (!E[1].match(/^TAG:/) && E[2].match(/^[0-9]+(\.[0-9]+)?$/) ? m[E[1]] = Number(E[2]) : m[E[1]] = E[2]), I = n.shift();
      }
      return m;
    }
    for (var u = n.shift(); typeof u < "u"; ) {
      if (u.match(/^\[stream/i)) {
        var l = o("stream");
        p.streams.push(l);
      } else if (u.match(/^\[chapter/i)) {
        var f = o("chapter");
        p.chapters.push(f);
      } else u.toLowerCase() === "[format]" && (p.format = o("format"));
      u = n.shift();
    }
    return p;
  }
  return ee = function(h) {
    h.ffprobe = function() {
      var n, p = null, o = [], u, u = arguments[arguments.length - 1], l = !1;
      function f(g, m) {
        l || (l = !0, u(g, m));
      }
      switch (arguments.length) {
        case 3:
          p = arguments[0], o = arguments[1];
          break;
        case 2:
          typeof arguments[0] == "number" ? p = arguments[0] : Array.isArray(arguments[0]) && (o = arguments[0]);
          break;
      }
      if (p === null) {
        if (!this._currentInput)
          return f(new Error("No input specified"));
        n = this._currentInput;
      } else if (n = this._inputs[p], !n)
        return f(new Error("Invalid input index"));
      this._getFfprobePath(function(g, m) {
        if (g)
          return f(g);
        if (!m)
          return f(new Error("Cannot find ffprobe"));
        var I = "", E = !1, _ = "", w = !1, P = n.isStream ? "pipe:0" : n.source, O = S(m, ["-show_streams", "-show_format"].concat(o, P), { windowsHide: !0 });
        n.isStream && (O.stdin.on("error", function(t) {
          ["ECONNRESET", "EPIPE", "EOF"].indexOf(t.code) >= 0 || f(t);
        }), O.stdin.on("close", function() {
          n.source.pause(), n.source.unpipe(O.stdin);
        }), n.source.pipe(O.stdin)), O.on("error", u);
        var F = null;
        function y(t) {
          if (t && (F = t), v && E && w) {
            if (F)
              return _ && (F.message += `
` + _), f(F);
            var r = x(I);
            [r.format].concat(r.streams).forEach(function(s) {
              if (s) {
                var a = Object.keys(s).filter(e);
                a.length && (s.tags = s.tags || {}, a.forEach(function(d) {
                  s.tags[d.substr(4)] = s[d], delete s[d];
                }));
                var c = Object.keys(s).filter(i);
                c.length && (s.disposition = s.disposition || {}, c.forEach(function(d) {
                  s.disposition[d.substr(12)] = s[d], delete s[d];
                }));
              }
            }), f(null, r);
          }
        }
        var v = !1;
        O.on("exit", function(t, r) {
          v = !0, t ? y(new Error("ffprobe exited with code " + t)) : r ? y(new Error("ffprobe was killed with signal " + r)) : y();
        }), O.stdout.on("data", function(t) {
          I += t;
        }), O.stdout.on("close", function() {
          E = !0, y();
        }), O.stderr.on("data", function(t) {
          _ += t;
        }), O.stderr.on("close", function() {
          w = !0, y();
        });
      });
    };
  }, ee;
}
var te, Oe;
function Ze() {
  if (Oe) return te;
  Oe = 1;
  var S = L, e = C, i = Ce.PassThrough, x = ue(), h = N();
  return te = function(p) {
    p.saveToFile = p.save = function(o) {
      return this.output(o).run(), this;
    }, p.writeToStream = p.pipe = p.stream = function(o, u) {
      if (o && !("writable" in o) && (u = o, o = void 0), !o) {
        if (process.version.match(/v0\.8\./))
          throw new Error("PassThrough stream is not supported on node v0.8");
        o = new i();
      }
      return this.output(o, u).run(), o;
    }, p.takeScreenshots = p.thumbnail = p.thumbnails = p.screenshot = p.screenshots = function(o, u) {
      var l = this, f = this._currentInput.source;
      if (o = o || { count: 1 }, typeof o == "number" && (o = {
        count: o
      }), "folder" in o || (o.folder = u || "."), "timestamps" in o && (o.timemarks = o.timestamps), !("timemarks" in o)) {
        if (!o.count)
          throw new Error("Cannot take screenshots: neither a count nor a timemark list are specified");
        var g = 100 / (1 + o.count);
        o.timemarks = [];
        for (var m = 0; m < o.count; m++)
          o.timemarks.push(g * (m + 1) + "%");
      }
      if ("size" in o) {
        var I = o.size.match(/^(\d+)x(\d+)$/), E = o.size.match(/^(\d+)x\?$/), _ = o.size.match(/^\?x(\d+)$/), w = o.size.match(/^(\d+)%$/);
        if (!I && !E && !_ && !w)
          throw new Error("Invalid size parameter: " + o.size);
      }
      var P;
      function O(F) {
        P ? F(null, P) : l.ffprobe(function(y, v) {
          P = v, F(y, v);
        });
      }
      return x.waterfall([
        // Compute percent timemarks if any
        function(y) {
          if (o.timemarks.some(function(v) {
            return ("" + v).match(/^[\d.]+%$/);
          })) {
            if (typeof f != "string")
              return y(new Error("Cannot compute screenshot timemarks with an input stream, please specify fixed timemarks"));
            O(function(v, t) {
              if (v)
                y(v);
              else {
                var r = t.streams.reduce(function(a, c) {
                  return c.codec_type === "video" && c.width * c.height > a.width * a.height ? c : a;
                }, { width: 0, height: 0 });
                if (r.width === 0)
                  return y(new Error("No video stream in input, cannot take screenshots"));
                var s = Number(r.duration);
                if (isNaN(s) && (s = Number(t.format.duration)), isNaN(s))
                  return y(new Error("Could not get input duration, please specify fixed timemarks"));
                o.timemarks = o.timemarks.map(function(a) {
                  return ("" + a).match(/^([\d.]+)%$/) ? s * parseFloat(a) / 100 : a;
                }), y();
              }
            });
          } else
            y();
        },
        // Turn all timemarks into numbers and sort them
        function(y) {
          o.timemarks = o.timemarks.map(function(v) {
            return h.timemarkToSeconds(v);
          }).sort(function(v, t) {
            return v - t;
          }), y();
        },
        // Add '_%i' to pattern when requesting multiple screenshots and no variable token is present
        function(y) {
          var v = o.filename || "tn.png";
          if (v.indexOf(".") === -1 && (v += ".png"), o.timemarks.length > 1 && !v.match(/%(s|0*i)/)) {
            var t = e.extname(v);
            v = e.join(e.dirname(v), e.basename(v, t) + "_%i" + t);
          }
          y(null, v);
        },
        // Replace filename tokens (%f, %b) in pattern
        function(y, v) {
          if (y.match(/%[bf]/)) {
            if (typeof f != "string")
              return v(new Error("Cannot replace %f or %b when using an input stream"));
            y = y.replace(/%f/g, e.basename(f)).replace(/%b/g, e.basename(f, e.extname(f)));
          }
          v(null, y);
        },
        // Compute size if needed
        function(y, v) {
          if (y.match(/%[whr]/)) {
            if (I)
              return v(null, y, I[1], I[2]);
            O(function(t, r) {
              if (t)
                return v(new Error("Could not determine video resolution to replace %w, %h or %r"));
              var s = r.streams.reduce(function(d, A) {
                return A.codec_type === "video" && A.width * A.height > d.width * d.height ? A : d;
              }, { width: 0, height: 0 });
              if (s.width === 0)
                return v(new Error("No video stream in input, cannot replace %w, %h or %r"));
              var a = s.width, c = s.height;
              E ? (c = c * Number(E[1]) / a, a = Number(E[1])) : _ ? (a = a * Number(_[1]) / c, c = Number(_[1])) : w && (a = a * Number(w[1]) / 100, c = c * Number(w[1]) / 100), v(null, y, Math.round(a / 2) * 2, Math.round(c / 2) * 2);
            });
          } else
            v(null, y, -1, -1);
        },
        // Replace size tokens (%w, %h, %r) in pattern
        function(y, v, t, r) {
          y = y.replace(/%r/g, "%wx%h").replace(/%w/g, v).replace(/%h/g, t), r(null, y);
        },
        // Replace variable tokens in pattern (%s, %i) and generate filename list
        function(y, v) {
          var t = o.timemarks.map(function(r, s) {
            return y.replace(/%s/g, h.timemarkToSeconds(r)).replace(/%(0*)i/g, function(a, c) {
              var d = "" + (s + 1);
              return c.substr(0, Math.max(0, c.length + 1 - d.length)) + d;
            });
          });
          l.emit("filenames", t), v(null, t);
        },
        // Create output directory
        function(y, v) {
          S.exists(o.folder, function(t) {
            t ? v(null, y) : S.mkdir(o.folder, function(r) {
              r ? v(r) : v(null, y);
            });
          });
        }
      ], function(y, v) {
        if (y)
          return l.emit("error", y);
        var t = o.timemarks.length, r, s = [r = {
          filter: "split",
          options: t,
          outputs: []
        }];
        if ("size" in o) {
          l.size(o.size);
          var a = l._currentOutput.sizeFilters.get().map(function(T, b) {
            return b > 0 && (T.inputs = "size" + (b - 1)), T.outputs = "size" + b, T;
          });
          r.inputs = "size" + (a.length - 1), s = a.concat(s), l._currentOutput.sizeFilters.clear();
        }
        for (var c = 0, d = 0; d < t; d++) {
          var A = "screen" + d;
          r.outputs.push(A), d === 0 && (c = o.timemarks[d], l.seekInput(c)), l.output(e.join(o.folder, v[d])).frames(1).map(A), d > 0 && l.seek(o.timemarks[d] - c);
        }
        l.complexFilter(s), l.run();
      }), this;
    }, p.mergeToFile = p.concatenate = p.concat = function(o, u) {
      var l = this._inputs.filter(function(g) {
        return !g.isStream;
      })[0], f = this;
      return this.ffprobe(this._inputs.indexOf(l), function(g, m) {
        if (g)
          return f.emit("error", g);
        var I = m.streams.some(function(_) {
          return _.codec_type === "audio";
        }), E = m.streams.some(function(_) {
          return _.codec_type === "video";
        });
        f.output(o, u).complexFilter({
          filter: "concat",
          options: {
            n: f._inputs.length,
            v: E ? 1 : 0,
            a: I ? 1 : 0
          }
        }).run();
      }), this;
    };
  }, te;
}
var ne, Pe;
function Ke() {
  if (Pe) return ne;
  Pe = 1;
  var S = C, e = Ne, i = qe.EventEmitter, x = N();
  function h(n, p) {
    if (!(this instanceof h))
      return new h(n, p);
    i.call(this), typeof n == "object" && !("readable" in n) ? p = n : (p = p || {}, p.source = n), this._inputs = [], p.source && this.input(p.source), this._outputs = [], this.output();
    var o = this;
    ["_global", "_complexFilters"].forEach(function(u) {
      o[u] = x.args();
    }), p.stdoutLines = "stdoutLines" in p ? p.stdoutLines : 100, p.presets = p.presets || p.preset || S.join(__dirname, "presets"), p.niceness = p.niceness || p.priority || 0, this.options = p, this.logger = p.logger || {
      debug: function() {
      },
      info: function() {
      },
      warn: function() {
      },
      error: function() {
      }
    };
  }
  return e.inherits(h, i), ne = h, h.prototype.clone = function() {
    var n = new h(), p = this;
    return n.options = this.options, n.logger = this.logger, n._inputs = this._inputs.map(function(o) {
      return {
        source: o.source,
        options: o.options.clone()
      };
    }), "target" in this._outputs[0] ? (n._outputs = [], n.output()) : (n._outputs = [
      n._currentOutput = {
        flags: {}
      }
    ], ["audio", "audioFilters", "video", "videoFilters", "sizeFilters", "options"].forEach(function(o) {
      n._currentOutput[o] = p._currentOutput[o].clone();
    }), this._currentOutput.sizeData && (n._currentOutput.sizeData = {}, x.copy(this._currentOutput.sizeData, n._currentOutput.sizeData)), x.copy(this._currentOutput.flags, n._currentOutput.flags)), ["_global", "_complexFilters"].forEach(function(o) {
      n[o] = p[o].clone();
    }), n;
  }, ke()(h.prototype), je()(h.prototype), He()(h.prototype), We()(h.prototype), Ge()(h.prototype), Be()(h.prototype), Xe()(h.prototype), Qe()(h.prototype), Ye()(h.prototype), h.setFfmpegPath = function(n) {
    new h().setFfmpegPath(n);
  }, h.setFfprobePath = function(n) {
    new h().setFfprobePath(n);
  }, h.setFlvtoolPath = function(n) {
    new h().setFlvtoolPath(n);
  }, h.availableFilters = h.getAvailableFilters = function(n) {
    new h().availableFilters(n);
  }, h.availableCodecs = h.getAvailableCodecs = function(n) {
    new h().availableCodecs(n);
  }, h.availableFormats = h.getAvailableFormats = function(n) {
    new h().availableFormats(n);
  }, h.availableEncoders = h.getAvailableEncoders = function(n) {
    new h().availableEncoders(n);
  }, Je()(h.prototype), h.ffprobe = function(n) {
    var p = new h(n);
    p.ffprobe.apply(p, Array.prototype.slice.call(arguments, 1));
  }, Ze()(h.prototype), ne;
}
var re, Ie;
function et() {
  return Ie || (Ie = 1, re = Ke()), re;
}
var Se = et();
const tt = /* @__PURE__ */ ze(Se), ct = /* @__PURE__ */ Re({
  __proto__: null,
  default: tt
}, [Se]);
export {
  ct as i
};
