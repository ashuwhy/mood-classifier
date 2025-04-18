import {
  ReactiveValue
} from "./chunk-RWEADT42.js";
import "./chunk-7SPCLOOJ.js";
import "./chunk-7RQDXF5S.js";
import "./chunk-MAW5ZYTO.js";
import "./chunk-7ZRJNXJN.js";
import {
  get,
  on,
  set,
  source
} from "./chunk-VGTFYHM7.js";
import {
  true_default
} from "./chunk-NE7JA6SP.js";
import "./chunk-OKMPZSYG.js";
import "./chunk-G3PMV62Z.js";

// node_modules/svelte/src/reactivity/window/index.js
var scrollX = new ReactiveValue(
  true_default ? () => window.scrollX : () => void 0,
  (update) => on(window, "scroll", update)
);
var scrollY = new ReactiveValue(
  true_default ? () => window.scrollY : () => void 0,
  (update) => on(window, "scroll", update)
);
var innerWidth = new ReactiveValue(
  true_default ? () => window.innerWidth : () => void 0,
  (update) => on(window, "resize", update)
);
var innerHeight = new ReactiveValue(
  true_default ? () => window.innerHeight : () => void 0,
  (update) => on(window, "resize", update)
);
var outerWidth = new ReactiveValue(
  true_default ? () => window.outerWidth : () => void 0,
  (update) => on(window, "resize", update)
);
var outerHeight = new ReactiveValue(
  true_default ? () => window.outerHeight : () => void 0,
  (update) => on(window, "resize", update)
);
var screenLeft = new ReactiveValue(
  true_default ? () => window.screenLeft : () => void 0,
  (update) => {
    let value = window.screenLeft;
    let frame = requestAnimationFrame(function check() {
      frame = requestAnimationFrame(check);
      if (value !== (value = window.screenLeft)) {
        update();
      }
    });
    return () => {
      cancelAnimationFrame(frame);
    };
  }
);
var screenTop = new ReactiveValue(
  true_default ? () => window.screenTop : () => void 0,
  (update) => {
    let value = window.screenTop;
    let frame = requestAnimationFrame(function check() {
      frame = requestAnimationFrame(check);
      if (value !== (value = window.screenTop)) {
        update();
      }
    });
    return () => {
      cancelAnimationFrame(frame);
    };
  }
);
var online = new ReactiveValue(
  true_default ? () => navigator.onLine : () => void 0,
  (update) => {
    const unsub_online = on(window, "online", update);
    const unsub_offline = on(window, "offline", update);
    return () => {
      unsub_online();
      unsub_offline();
    };
  }
);
var devicePixelRatio = new class DevicePixelRatio {
  #dpr = source(true_default ? window.devicePixelRatio : void 0);
  #update() {
    const off = on(
      window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`),
      "change",
      () => {
        set(this.#dpr, window.devicePixelRatio);
        off();
        this.#update();
      }
    );
  }
  constructor() {
    if (true_default) {
      this.#update();
    }
  }
  get current() {
    get(this.#dpr);
    return true_default ? window.devicePixelRatio : void 0;
  }
}();
export {
  devicePixelRatio,
  innerHeight,
  innerWidth,
  online,
  outerHeight,
  outerWidth,
  screenLeft,
  screenTop,
  scrollX,
  scrollY
};
//# sourceMappingURL=svelte_reactivity_window.js.map
