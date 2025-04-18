import {
  MediaQuery
} from "./chunk-V5KMDRU4.js";
import "./chunk-RWEADT42.js";
import "./chunk-7SPCLOOJ.js";
import "./chunk-7RQDXF5S.js";
import {
  linear
} from "./chunk-7QVV7TAH.js";
import {
  loop,
  raf,
  writable
} from "./chunk-MAW5ZYTO.js";
import "./chunk-7ZRJNXJN.js";
import {
  deferred,
  get,
  noop,
  render_effect,
  set,
  source
} from "./chunk-VGTFYHM7.js";
import "./chunk-NE7JA6SP.js";
import "./chunk-OKMPZSYG.js";
import "./chunk-G3PMV62Z.js";

// node_modules/svelte/src/motion/utils.js
function is_date(obj) {
  return Object.prototype.toString.call(obj) === "[object Date]";
}

// node_modules/svelte/src/motion/spring.js
function tick_spring(ctx, last_value, current_value, target_value) {
  if (typeof current_value === "number" || is_date(current_value)) {
    const delta = target_value - current_value;
    const velocity = (current_value - last_value) / (ctx.dt || 1 / 60);
    const spring2 = ctx.opts.stiffness * delta;
    const damper = ctx.opts.damping * velocity;
    const acceleration = (spring2 - damper) * ctx.inv_mass;
    const d = (velocity + acceleration) * ctx.dt;
    if (Math.abs(d) < ctx.opts.precision && Math.abs(delta) < ctx.opts.precision) {
      return target_value;
    } else {
      ctx.settled = false;
      return is_date(current_value) ? new Date(current_value.getTime() + d) : current_value + d;
    }
  } else if (Array.isArray(current_value)) {
    return current_value.map(
      (_, i) => (
        // @ts-ignore
        tick_spring(ctx, last_value[i], current_value[i], target_value[i])
      )
    );
  } else if (typeof current_value === "object") {
    const next_value = {};
    for (const k in current_value) {
      next_value[k] = tick_spring(ctx, last_value[k], current_value[k], target_value[k]);
    }
    return next_value;
  } else {
    throw new Error(`Cannot spring ${typeof current_value} values`);
  }
}
function spring(value, opts = {}) {
  const store = writable(value);
  const { stiffness = 0.15, damping = 0.8, precision = 0.01 } = opts;
  let last_time;
  let task;
  let current_token;
  let last_value = (
    /** @type {T} */
    value
  );
  let target_value = (
    /** @type {T | undefined} */
    value
  );
  let inv_mass = 1;
  let inv_mass_recovery_rate = 0;
  let cancel_task = false;
  function set2(new_value, opts2 = {}) {
    target_value = new_value;
    const token = current_token = {};
    if (value == null || opts2.hard || spring2.stiffness >= 1 && spring2.damping >= 1) {
      cancel_task = true;
      last_time = raf.now();
      last_value = new_value;
      store.set(value = target_value);
      return Promise.resolve();
    } else if (opts2.soft) {
      const rate = opts2.soft === true ? 0.5 : +opts2.soft;
      inv_mass_recovery_rate = 1 / (rate * 60);
      inv_mass = 0;
    }
    if (!task) {
      last_time = raf.now();
      cancel_task = false;
      task = loop((now) => {
        if (cancel_task) {
          cancel_task = false;
          task = null;
          return false;
        }
        inv_mass = Math.min(inv_mass + inv_mass_recovery_rate, 1);
        const elapsed = Math.min(now - last_time, 1e3 / 30);
        const ctx = {
          inv_mass,
          opts: spring2,
          settled: true,
          dt: elapsed * 60 / 1e3
        };
        const next_value = tick_spring(ctx, last_value, value, target_value);
        last_time = now;
        last_value = /** @type {T} */
        value;
        store.set(value = /** @type {T} */
        next_value);
        if (ctx.settled) {
          task = null;
        }
        return !ctx.settled;
      });
    }
    return new Promise((fulfil) => {
      task.promise.then(() => {
        if (token === current_token) fulfil();
      });
    });
  }
  const spring2 = {
    set: set2,
    update: (fn, opts2) => set2(fn(
      /** @type {T} */
      target_value,
      /** @type {T} */
      value
    ), opts2),
    subscribe: store.subscribe,
    stiffness,
    damping,
    precision
  };
  return spring2;
}
var Spring = class _Spring {
  #stiffness = source(0.15);
  #damping = source(0.8);
  #precision = source(0.01);
  #current = source(
    /** @type {T} */
    void 0
  );
  #target = source(
    /** @type {T} */
    void 0
  );
  #last_value = (
    /** @type {T} */
    void 0
  );
  #last_time = 0;
  #inverse_mass = 1;
  #momentum = 0;
  /** @type {import('../internal/client/types').Task | null} */
  #task = null;
  /** @type {ReturnType<typeof deferred> | null} */
  #deferred = null;
  /**
   * @param {T} value
   * @param {SpringOpts} [options]
   */
  constructor(value, options = {}) {
    this.#current.v = this.#target.v = value;
    if (typeof options.stiffness === "number") this.#stiffness.v = clamp(options.stiffness, 0, 1);
    if (typeof options.damping === "number") this.#damping.v = clamp(options.damping, 0, 1);
    if (typeof options.precision === "number") this.#precision.v = options.precision;
  }
  /**
   * Create a spring whose value is bound to the return value of `fn`. This must be called
   * inside an effect root (for example, during component initialisation).
   *
   * ```svelte
   * <script>
   * 	import { Spring } from 'svelte/motion';
   *
   * 	let { number } = $props();
   *
   * 	const spring = Spring.of(() => number);
   * <\/script>
   * ```
   * @template U
   * @param {() => U} fn
   * @param {SpringOpts} [options]
   */
  static of(fn, options) {
    const spring2 = new _Spring(fn(), options);
    render_effect(() => {
      spring2.set(fn());
    });
    return spring2;
  }
  /** @param {T} value */
  #update(value) {
    set(this.#target, value);
    this.#current.v ??= value;
    this.#last_value ??= this.#current.v;
    if (!this.#task) {
      this.#last_time = raf.now();
      var inv_mass_recovery_rate = 1e3 / (this.#momentum * 60);
      this.#task ??= loop((now) => {
        this.#inverse_mass = Math.min(this.#inverse_mass + inv_mass_recovery_rate, 1);
        const elapsed = Math.min(now - this.#last_time, 1e3 / 30);
        const ctx = {
          inv_mass: this.#inverse_mass,
          opts: {
            stiffness: this.#stiffness.v,
            damping: this.#damping.v,
            precision: this.#precision.v
          },
          settled: true,
          dt: elapsed * 60 / 1e3
        };
        var next = tick_spring(ctx, this.#last_value, this.#current.v, this.#target.v);
        this.#last_value = this.#current.v;
        this.#last_time = now;
        set(this.#current, next);
        if (ctx.settled) {
          this.#task = null;
        }
        return !ctx.settled;
      });
    }
    return this.#task.promise;
  }
  /**
   * Sets `spring.target` to `value` and returns a `Promise` that resolves if and when `spring.current` catches up to it.
   *
   * If `options.instant` is `true`, `spring.current` immediately matches `spring.target`.
   *
   * If `options.preserveMomentum` is provided, the spring will continue on its current trajectory for
   * the specified number of milliseconds. This is useful for things like 'fling' gestures.
   *
   * @param {T} value
   * @param {SpringUpdateOpts} [options]
   */
  set(value, options) {
    this.#deferred?.reject(new Error("Aborted"));
    if (options?.instant || this.#current.v === void 0) {
      this.#task?.abort();
      this.#task = null;
      set(this.#current, set(this.#target, value));
      this.#last_value = value;
      return Promise.resolve();
    }
    if (options?.preserveMomentum) {
      this.#inverse_mass = 0;
      this.#momentum = options.preserveMomentum;
    }
    var d = this.#deferred = deferred();
    d.promise.catch(noop);
    this.#update(value).then(() => {
      if (d !== this.#deferred) return;
      d.resolve(void 0);
    });
    return d.promise;
  }
  get current() {
    return get(this.#current);
  }
  get damping() {
    return get(this.#damping);
  }
  set damping(v) {
    set(this.#damping, clamp(v, 0, 1));
  }
  get precision() {
    return get(this.#precision);
  }
  set precision(v) {
    set(this.#precision, v);
  }
  get stiffness() {
    return get(this.#stiffness);
  }
  set stiffness(v) {
    set(this.#stiffness, clamp(v, 0, 1));
  }
  get target() {
    return get(this.#target);
  }
  set target(v) {
    this.set(v);
  }
};
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

// node_modules/svelte/src/motion/tweened.js
function get_interpolator(a, b) {
  if (a === b || a !== a) return () => a;
  const type = typeof a;
  if (type !== typeof b || Array.isArray(a) !== Array.isArray(b)) {
    throw new Error("Cannot interpolate values of different type");
  }
  if (Array.isArray(a)) {
    const arr = (
      /** @type {Array<any>} */
      b.map((bi, i) => {
        return get_interpolator(
          /** @type {Array<any>} */
          a[i],
          bi
        );
      })
    );
    return (t) => arr.map((fn) => fn(t));
  }
  if (type === "object") {
    if (!a || !b) {
      throw new Error("Object cannot be null");
    }
    if (is_date(a) && is_date(b)) {
      const an = a.getTime();
      const bn = b.getTime();
      const delta = bn - an;
      return (t) => new Date(an + t * delta);
    }
    const keys = Object.keys(b);
    const interpolators = {};
    keys.forEach((key) => {
      interpolators[key] = get_interpolator(a[key], b[key]);
    });
    return (t) => {
      const result = {};
      keys.forEach((key) => {
        result[key] = interpolators[key](t);
      });
      return result;
    };
  }
  if (type === "number") {
    const delta = (
      /** @type {number} */
      b - /** @type {number} */
      a
    );
    return (t) => a + t * delta;
  }
  return () => b;
}
function tweened(value, defaults = {}) {
  const store = writable(value);
  let task;
  let target_value = value;
  function set2(new_value, opts) {
    target_value = new_value;
    if (value == null) {
      store.set(value = new_value);
      return Promise.resolve();
    }
    let previous_task = task;
    let started = false;
    let {
      delay = 0,
      duration = 400,
      easing = linear,
      interpolate = get_interpolator
    } = { ...defaults, ...opts };
    if (duration === 0) {
      if (previous_task) {
        previous_task.abort();
        previous_task = null;
      }
      store.set(value = target_value);
      return Promise.resolve();
    }
    const start = raf.now() + delay;
    let fn;
    task = loop((now) => {
      if (now < start) return true;
      if (!started) {
        fn = interpolate(
          /** @type {any} */
          value,
          new_value
        );
        if (typeof duration === "function")
          duration = duration(
            /** @type {any} */
            value,
            new_value
          );
        started = true;
      }
      if (previous_task) {
        previous_task.abort();
        previous_task = null;
      }
      const elapsed = now - start;
      if (elapsed > /** @type {number} */
      duration) {
        store.set(value = new_value);
        return false;
      }
      store.set(value = fn(easing(elapsed / duration)));
      return true;
    });
    return task.promise;
  }
  return {
    set: set2,
    update: (fn, opts) => set2(fn(
      /** @type {any} */
      target_value,
      /** @type {any} */
      value
    ), opts),
    subscribe: store.subscribe
  };
}
var Tween = class _Tween {
  #current = source(
    /** @type {T} */
    void 0
  );
  #target = source(
    /** @type {T} */
    void 0
  );
  /** @type {TweenedOptions<T>} */
  #defaults;
  /** @type {import('../internal/client/types').Task | null} */
  #task = null;
  /**
   * @param {T} value
   * @param {TweenedOptions<T>} options
   */
  constructor(value, options = {}) {
    this.#current.v = this.#target.v = value;
    this.#defaults = options;
  }
  /**
   * Create a tween whose value is bound to the return value of `fn`. This must be called
   * inside an effect root (for example, during component initialisation).
   *
   * ```svelte
   * <script>
   * 	import { Tween } from 'svelte/motion';
   *
   * 	let { number } = $props();
   *
   * 	const tween = Tween.of(() => number);
   * <\/script>
   * ```
   * @template U
   * @param {() => U} fn
   * @param {TweenedOptions<U>} [options]
   */
  static of(fn, options) {
    const tween = new _Tween(fn(), options);
    render_effect(() => {
      tween.set(fn());
    });
    return tween;
  }
  /**
   * Sets `tween.target` to `value` and returns a `Promise` that resolves if and when `tween.current` catches up to it.
   *
   * If `options` are provided, they will override the tween's defaults.
   * @param {T} value
   * @param {TweenedOptions<T>} [options]
   * @returns
   */
  set(value, options) {
    set(this.#target, value);
    let {
      delay = 0,
      duration = 400,
      easing = linear,
      interpolate = get_interpolator
    } = { ...this.#defaults, ...options };
    if (duration === 0) {
      this.#task?.abort();
      set(this.#current, value);
      return Promise.resolve();
    }
    const start = raf.now() + delay;
    let fn;
    let started = false;
    let previous_task = this.#task;
    this.#task = loop((now) => {
      if (now < start) {
        return true;
      }
      if (!started) {
        started = true;
        const prev = this.#current.v;
        fn = interpolate(prev, value);
        if (typeof duration === "function") {
          duration = duration(prev, value);
        }
        previous_task?.abort();
      }
      const elapsed = now - start;
      if (elapsed > /** @type {number} */
      duration) {
        set(this.#current, value);
        return false;
      }
      set(this.#current, fn(easing(elapsed / /** @type {number} */
      duration)));
      return true;
    });
    return this.#task.promise;
  }
  get current() {
    return get(this.#current);
  }
  get target() {
    return get(this.#target);
  }
  set target(v) {
    this.set(v);
  }
};

// node_modules/svelte/src/motion/index.js
var prefersReducedMotion = new MediaQuery(
  "(prefers-reduced-motion: reduce)"
);
export {
  Spring,
  Tween,
  prefersReducedMotion,
  spring,
  tweened
};
//# sourceMappingURL=svelte_motion.js.map
