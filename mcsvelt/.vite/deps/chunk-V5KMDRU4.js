import {
  ReactiveValue
} from "./chunk-RWEADT42.js";
import {
  increment
} from "./chunk-7SPCLOOJ.js";
import {
  active_reaction,
  get,
  on,
  set,
  set_active_reaction,
  source,
  user_derived
} from "./chunk-VGTFYHM7.js";
import {
  true_default
} from "./chunk-NE7JA6SP.js";

// node_modules/svelte/src/reactivity/date.js
var inited = false;
var SvelteDate = class _SvelteDate extends Date {
  #time = source(super.getTime());
  /** @type {Map<keyof Date, Source<unknown>>} */
  #deriveds = /* @__PURE__ */ new Map();
  #reaction = active_reaction;
  /** @param {any[]} params */
  constructor(...params) {
    super(...params);
    if (!inited) this.#init();
  }
  #init() {
    inited = true;
    var proto = _SvelteDate.prototype;
    var date_proto = Date.prototype;
    var methods = (
      /** @type {Array<keyof Date & string>} */
      Object.getOwnPropertyNames(date_proto)
    );
    for (const method of methods) {
      if (method.startsWith("get") || method.startsWith("to") || method === "valueOf") {
        proto[method] = function(...args) {
          if (args.length > 0) {
            get(this.#time);
            return date_proto[method].apply(this, args);
          }
          var d = this.#deriveds.get(method);
          if (d === void 0) {
            const reaction = active_reaction;
            set_active_reaction(this.#reaction);
            d = user_derived(() => {
              get(this.#time);
              return date_proto[method].apply(this, args);
            });
            this.#deriveds.set(method, d);
            set_active_reaction(reaction);
          }
          return get(d);
        };
      }
      if (method.startsWith("set")) {
        proto[method] = function(...args) {
          var result = date_proto[method].apply(this, args);
          set(this.#time, date_proto.getTime.call(this));
          return result;
        };
      }
    }
  }
};

// node_modules/svelte/src/reactivity/set.js
var read_methods = ["forEach", "isDisjointFrom", "isSubsetOf", "isSupersetOf"];
var set_like_methods = ["difference", "intersection", "symmetricDifference", "union"];
var inited2 = false;
var SvelteSet = class _SvelteSet extends Set {
  /** @type {Map<T, Source<boolean>>} */
  #sources = /* @__PURE__ */ new Map();
  #version = source(0);
  #size = source(0);
  /**
   * @param {Iterable<T> | null | undefined} [value]
   */
  constructor(value) {
    super();
    if (true_default) value = new Set(value);
    if (value) {
      for (var element of value) {
        super.add(element);
      }
      this.#size.v = super.size;
    }
    if (!inited2) this.#init();
  }
  // We init as part of the first instance so that we can treeshake this class
  #init() {
    inited2 = true;
    var proto = _SvelteSet.prototype;
    var set_proto = Set.prototype;
    for (const method of read_methods) {
      proto[method] = function(...v) {
        get(this.#version);
        return set_proto[method].apply(this, v);
      };
    }
    for (const method of set_like_methods) {
      proto[method] = function(...v) {
        get(this.#version);
        var set2 = (
          /** @type {Set<T>} */
          set_proto[method].apply(this, v)
        );
        return new _SvelteSet(set2);
      };
    }
  }
  /** @param {T} value */
  has(value) {
    var has = super.has(value);
    var sources = this.#sources;
    var s = sources.get(value);
    if (s === void 0) {
      if (!has) {
        get(this.#version);
        return false;
      }
      s = source(true);
      sources.set(value, s);
    }
    get(s);
    return has;
  }
  /** @param {T} value */
  add(value) {
    if (!super.has(value)) {
      super.add(value);
      set(this.#size, super.size);
      increment(this.#version);
    }
    return this;
  }
  /** @param {T} value */
  delete(value) {
    var deleted = super.delete(value);
    var sources = this.#sources;
    var s = sources.get(value);
    if (s !== void 0) {
      sources.delete(value);
      set(s, false);
    }
    if (deleted) {
      set(this.#size, super.size);
      increment(this.#version);
    }
    return deleted;
  }
  clear() {
    if (super.size === 0) {
      return;
    }
    super.clear();
    var sources = this.#sources;
    for (var s of sources.values()) {
      set(s, false);
    }
    sources.clear();
    set(this.#size, 0);
    increment(this.#version);
  }
  keys() {
    return this.values();
  }
  values() {
    get(this.#version);
    return super.values();
  }
  entries() {
    get(this.#version);
    return super.entries();
  }
  [Symbol.iterator]() {
    return this.keys();
  }
  get size() {
    return get(this.#size);
  }
};

// node_modules/svelte/src/reactivity/map.js
var SvelteMap = class extends Map {
  /** @type {Map<K, Source<number>>} */
  #sources = /* @__PURE__ */ new Map();
  #version = source(0);
  #size = source(0);
  /**
   * @param {Iterable<readonly [K, V]> | null | undefined} [value]
   */
  constructor(value) {
    super();
    if (true_default) value = new Map(value);
    if (value) {
      for (var [key, v] of value) {
        super.set(key, v);
      }
      this.#size.v = super.size;
    }
  }
  /** @param {K} key */
  has(key) {
    var sources = this.#sources;
    var s = sources.get(key);
    if (s === void 0) {
      var ret = super.get(key);
      if (ret !== void 0) {
        s = source(0);
        sources.set(key, s);
      } else {
        get(this.#version);
        return false;
      }
    }
    get(s);
    return true;
  }
  /**
   * @param {(value: V, key: K, map: Map<K, V>) => void} callbackfn
   * @param {any} [this_arg]
   */
  forEach(callbackfn, this_arg) {
    this.#read_all();
    super.forEach(callbackfn, this_arg);
  }
  /** @param {K} key */
  get(key) {
    var sources = this.#sources;
    var s = sources.get(key);
    if (s === void 0) {
      var ret = super.get(key);
      if (ret !== void 0) {
        s = source(0);
        sources.set(key, s);
      } else {
        get(this.#version);
        return void 0;
      }
    }
    get(s);
    return super.get(key);
  }
  /**
   * @param {K} key
   * @param {V} value
   * */
  set(key, value) {
    var sources = this.#sources;
    var s = sources.get(key);
    var prev_res = super.get(key);
    var res = super.set(key, value);
    var version = this.#version;
    if (s === void 0) {
      sources.set(key, source(0));
      set(this.#size, super.size);
      increment(version);
    } else if (prev_res !== value) {
      increment(s);
      var v_reactions = version.reactions === null ? null : new Set(version.reactions);
      var needs_version_increase = v_reactions === null || !s.reactions?.every(
        (r) => (
          /** @type {NonNullable<typeof v_reactions>} */
          v_reactions.has(r)
        )
      );
      if (needs_version_increase) {
        increment(version);
      }
    }
    return res;
  }
  /** @param {K} key */
  delete(key) {
    var sources = this.#sources;
    var s = sources.get(key);
    var res = super.delete(key);
    if (s !== void 0) {
      sources.delete(key);
      set(this.#size, super.size);
      set(s, -1);
      increment(this.#version);
    }
    return res;
  }
  clear() {
    if (super.size === 0) {
      return;
    }
    super.clear();
    var sources = this.#sources;
    set(this.#size, 0);
    for (var s of sources.values()) {
      set(s, -1);
    }
    increment(this.#version);
    sources.clear();
  }
  #read_all() {
    get(this.#version);
    var sources = this.#sources;
    if (this.#size.v !== sources.size) {
      for (var key of super.keys()) {
        if (!sources.has(key)) {
          sources.set(key, source(0));
        }
      }
    }
    for (var [, s] of this.#sources) {
      get(s);
    }
  }
  keys() {
    get(this.#version);
    return super.keys();
  }
  values() {
    this.#read_all();
    return super.values();
  }
  entries() {
    this.#read_all();
    return super.entries();
  }
  [Symbol.iterator]() {
    return this.entries();
  }
  get size() {
    get(this.#size);
    return super.size;
  }
};

// node_modules/svelte/src/reactivity/url-search-params.js
var REPLACE = Symbol();
var SvelteURLSearchParams = class extends URLSearchParams {
  #version = source(0);
  #url = get_current_url();
  #updating = false;
  #update_url() {
    if (!this.#url || this.#updating) return;
    this.#updating = true;
    const search = this.toString();
    this.#url.search = search && `?${search}`;
    this.#updating = false;
  }
  /**
   * @param {URLSearchParams} params
   * @internal
   */
  [REPLACE](params) {
    if (this.#updating) return;
    this.#updating = true;
    for (const key of [...super.keys()]) {
      super.delete(key);
    }
    for (const [key, value] of params) {
      super.append(key, value);
    }
    increment(this.#version);
    this.#updating = false;
  }
  /**
   * @param {string} name
   * @param {string} value
   * @returns {void}
   */
  append(name, value) {
    super.append(name, value);
    this.#update_url();
    increment(this.#version);
  }
  /**
   * @param {string} name
   * @param {string=} value
   * @returns {void}
   */
  delete(name, value) {
    var has_value = super.has(name, value);
    super.delete(name, value);
    if (has_value) {
      this.#update_url();
      increment(this.#version);
    }
  }
  /**
   * @param {string} name
   * @returns {string|null}
   */
  get(name) {
    get(this.#version);
    return super.get(name);
  }
  /**
   * @param {string} name
   * @returns {string[]}
   */
  getAll(name) {
    get(this.#version);
    return super.getAll(name);
  }
  /**
   * @param {string} name
   * @param {string=} value
   * @returns {boolean}
   */
  has(name, value) {
    get(this.#version);
    return super.has(name, value);
  }
  keys() {
    get(this.#version);
    return super.keys();
  }
  /**
   * @param {string} name
   * @param {string} value
   * @returns {void}
   */
  set(name, value) {
    var previous = super.getAll(name).join("");
    super.set(name, value);
    if (previous !== super.getAll(name).join("")) {
      this.#update_url();
      increment(this.#version);
    }
  }
  sort() {
    super.sort();
    this.#update_url();
    increment(this.#version);
  }
  toString() {
    get(this.#version);
    return super.toString();
  }
  values() {
    get(this.#version);
    return super.values();
  }
  entries() {
    get(this.#version);
    return super.entries();
  }
  [Symbol.iterator]() {
    return this.entries();
  }
  get size() {
    get(this.#version);
    return super.size;
  }
};

// node_modules/svelte/src/reactivity/url.js
var current_url = null;
function get_current_url() {
  return current_url;
}
var SvelteURL = class extends URL {
  #protocol = source(super.protocol);
  #username = source(super.username);
  #password = source(super.password);
  #hostname = source(super.hostname);
  #port = source(super.port);
  #pathname = source(super.pathname);
  #hash = source(super.hash);
  #search = source(super.search);
  #searchParams;
  /**
   * @param {string | URL} url
   * @param {string | URL} [base]
   */
  constructor(url, base) {
    url = new URL(url, base);
    super(url);
    current_url = this;
    this.#searchParams = new SvelteURLSearchParams(url.searchParams);
    current_url = null;
  }
  get hash() {
    return get(this.#hash);
  }
  set hash(value) {
    super.hash = value;
    set(this.#hash, super.hash);
  }
  get host() {
    get(this.#hostname);
    get(this.#port);
    return super.host;
  }
  set host(value) {
    super.host = value;
    set(this.#hostname, super.hostname);
    set(this.#port, super.port);
  }
  get hostname() {
    return get(this.#hostname);
  }
  set hostname(value) {
    super.hostname = value;
    set(this.#hostname, super.hostname);
  }
  get href() {
    get(this.#protocol);
    get(this.#username);
    get(this.#password);
    get(this.#hostname);
    get(this.#port);
    get(this.#pathname);
    get(this.#hash);
    get(this.#search);
    return super.href;
  }
  set href(value) {
    super.href = value;
    set(this.#protocol, super.protocol);
    set(this.#username, super.username);
    set(this.#password, super.password);
    set(this.#hostname, super.hostname);
    set(this.#port, super.port);
    set(this.#pathname, super.pathname);
    set(this.#hash, super.hash);
    set(this.#search, super.search);
    this.#searchParams[REPLACE](super.searchParams);
  }
  get password() {
    return get(this.#password);
  }
  set password(value) {
    super.password = value;
    set(this.#password, super.password);
  }
  get pathname() {
    return get(this.#pathname);
  }
  set pathname(value) {
    super.pathname = value;
    set(this.#pathname, super.pathname);
  }
  get port() {
    return get(this.#port);
  }
  set port(value) {
    super.port = value;
    set(this.#port, super.port);
  }
  get protocol() {
    return get(this.#protocol);
  }
  set protocol(value) {
    super.protocol = value;
    set(this.#protocol, super.protocol);
  }
  get search() {
    return get(this.#search);
  }
  set search(value) {
    super.search = value;
    set(this.#search, value);
    this.#searchParams[REPLACE](super.searchParams);
  }
  get username() {
    return get(this.#username);
  }
  set username(value) {
    super.username = value;
    set(this.#username, super.username);
  }
  get origin() {
    get(this.#protocol);
    get(this.#hostname);
    get(this.#port);
    return super.origin;
  }
  get searchParams() {
    return this.#searchParams;
  }
  toString() {
    return this.href;
  }
  toJSON() {
    return this.href;
  }
};

// node_modules/svelte/src/reactivity/media-query.js
var parenthesis_regex = /\(.+\)/;
var MediaQuery = class extends ReactiveValue {
  /**
   * @param {string} query A media query string
   * @param {boolean} [fallback] Fallback value for the server
   */
  constructor(query, fallback) {
    let final_query = parenthesis_regex.test(query) ? query : `(${query})`;
    const q = window.matchMedia(final_query);
    super(
      () => q.matches,
      (update) => on(q, "change", update)
    );
  }
};

export {
  SvelteDate,
  SvelteSet,
  SvelteMap,
  SvelteURLSearchParams,
  SvelteURL,
  MediaQuery
};
//# sourceMappingURL=chunk-V5KMDRU4.js.map
