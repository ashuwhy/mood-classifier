import {
  DIRTY,
  FILENAME,
  HEAD_EFFECT,
  HYDRATION_END,
  HYDRATION_ERROR,
  HYDRATION_START,
  LEGACY_PROPS,
  MAYBE_DIRTY,
  TEMPLATE_FRAGMENT,
  TEMPLATE_USE_IMPORT_NODE,
  active_effect,
  all_registered_events,
  array_from,
  block,
  branch,
  clear_text_content,
  component_context,
  component_root,
  create_text,
  define_property,
  dev_current_component_function,
  flushSync,
  get,
  get_first_child,
  get_next_sibling,
  handle_event_propagation,
  hydrate_next,
  hydrate_node,
  hydrating,
  hydration_failed,
  init_operations,
  is_array,
  is_firefox,
  lifecycle_outside_component,
  mutable_source,
  noop,
  on,
  pop,
  push,
  root_event_handles,
  set,
  set_hydrate_node,
  set_hydrating,
  set_signal_status,
  user_pre_effect
} from "./chunk-VGTFYHM7.js";
import {
  hydration_mismatch,
  legacy_recursive_reactive_block,
  lifecycle_double_unmount,
  true_default
} from "./chunk-NE7JA6SP.js";

// node_modules/svelte/src/internal/client/dom/blocks/svelte-head.js
var head_anchor;
function reset_head_anchor() {
  head_anchor = void 0;
}
function head(render_fn) {
  let previous_hydrate_node = null;
  let was_hydrating = hydrating;
  var anchor;
  if (hydrating) {
    previous_hydrate_node = hydrate_node;
    if (head_anchor === void 0) {
      head_anchor = /** @type {TemplateNode} */
      get_first_child(document.head);
    }
    while (head_anchor !== null && (head_anchor.nodeType !== 8 || /** @type {Comment} */
    head_anchor.data !== HYDRATION_START)) {
      head_anchor = /** @type {TemplateNode} */
      get_next_sibling(head_anchor);
    }
    if (head_anchor === null) {
      set_hydrating(false);
    } else {
      head_anchor = set_hydrate_node(
        /** @type {TemplateNode} */
        get_next_sibling(head_anchor)
      );
    }
  }
  if (!hydrating) {
    anchor = document.head.appendChild(create_text());
  }
  try {
    block(() => render_fn(anchor), HEAD_EFFECT);
  } finally {
    if (was_hydrating) {
      set_hydrating(true);
      head_anchor = hydrate_node;
      set_hydrate_node(
        /** @type {TemplateNode} */
        previous_hydrate_node
      );
    }
  }
}

// node_modules/svelte/src/internal/client/dom/reconciler.js
function create_fragment_from_html(html) {
  var elem = document.createElement("template");
  elem.innerHTML = html;
  return elem.content;
}

// node_modules/svelte/src/internal/client/dom/template.js
function assign_nodes(start, end) {
  var effect = (
    /** @type {Effect} */
    active_effect
  );
  if (effect.nodes_start === null) {
    effect.nodes_start = start;
    effect.nodes_end = end;
  }
}
function template(content, flags) {
  var is_fragment = (flags & TEMPLATE_FRAGMENT) !== 0;
  var use_import_node = (flags & TEMPLATE_USE_IMPORT_NODE) !== 0;
  var node;
  var has_start = !content.startsWith("<!>");
  return () => {
    if (hydrating) {
      assign_nodes(hydrate_node, null);
      return hydrate_node;
    }
    if (node === void 0) {
      node = create_fragment_from_html(has_start ? content : "<!>" + content);
      if (!is_fragment) node = /** @type {Node} */
      get_first_child(node);
    }
    var clone = (
      /** @type {TemplateNode} */
      use_import_node || is_firefox ? document.importNode(node, true) : node.cloneNode(true)
    );
    if (is_fragment) {
      var start = (
        /** @type {TemplateNode} */
        get_first_child(clone)
      );
      var end = (
        /** @type {TemplateNode} */
        clone.lastChild
      );
      assign_nodes(start, end);
    } else {
      assign_nodes(clone, clone);
    }
    return clone;
  };
}
function template_with_script(content, flags) {
  var fn = template(content, flags);
  return () => run_scripts(
    /** @type {Element | DocumentFragment} */
    fn()
  );
}
function ns_template(content, flags, ns = "svg") {
  var has_start = !content.startsWith("<!>");
  var is_fragment = (flags & TEMPLATE_FRAGMENT) !== 0;
  var wrapped = `<${ns}>${has_start ? content : "<!>" + content}</${ns}>`;
  var node;
  return () => {
    if (hydrating) {
      assign_nodes(hydrate_node, null);
      return hydrate_node;
    }
    if (!node) {
      var fragment = (
        /** @type {DocumentFragment} */
        create_fragment_from_html(wrapped)
      );
      var root = (
        /** @type {Element} */
        get_first_child(fragment)
      );
      if (is_fragment) {
        node = document.createDocumentFragment();
        while (get_first_child(root)) {
          node.appendChild(
            /** @type {Node} */
            get_first_child(root)
          );
        }
      } else {
        node = /** @type {Element} */
        get_first_child(root);
      }
    }
    var clone = (
      /** @type {TemplateNode} */
      node.cloneNode(true)
    );
    if (is_fragment) {
      var start = (
        /** @type {TemplateNode} */
        get_first_child(clone)
      );
      var end = (
        /** @type {TemplateNode} */
        clone.lastChild
      );
      assign_nodes(start, end);
    } else {
      assign_nodes(clone, clone);
    }
    return clone;
  };
}
function svg_template_with_script(content, flags) {
  var fn = ns_template(content, flags);
  return () => run_scripts(
    /** @type {Element | DocumentFragment} */
    fn()
  );
}
function mathml_template(content, flags) {
  return ns_template(content, flags, "math");
}
function run_scripts(node) {
  if (hydrating) return node;
  const is_fragment = node.nodeType === 11;
  const scripts = (
    /** @type {HTMLElement} */
    node.tagName === "SCRIPT" ? [
      /** @type {HTMLScriptElement} */
      node
    ] : node.querySelectorAll("script")
  );
  const effect = (
    /** @type {Effect} */
    active_effect
  );
  for (const script of scripts) {
    const clone = document.createElement("script");
    for (var attribute of script.attributes) {
      clone.setAttribute(attribute.name, attribute.value);
    }
    clone.textContent = script.textContent;
    if (is_fragment ? node.firstChild === script : node === script) {
      effect.nodes_start = clone;
    }
    if (is_fragment ? node.lastChild === script : node === script) {
      effect.nodes_end = clone;
    }
    script.replaceWith(clone);
  }
  return node;
}
function text(value = "") {
  if (!hydrating) {
    var t = create_text(value + "");
    assign_nodes(t, t);
    return t;
  }
  var node = hydrate_node;
  if (node.nodeType !== 3) {
    node.before(node = create_text());
    set_hydrate_node(node);
  }
  assign_nodes(node, node);
  return node;
}
function comment() {
  if (hydrating) {
    assign_nodes(hydrate_node, null);
    return hydrate_node;
  }
  var frag = document.createDocumentFragment();
  var start = document.createComment("");
  var anchor = create_text();
  frag.append(start, anchor);
  assign_nodes(start, anchor);
  return frag;
}
function append(anchor, dom) {
  if (hydrating) {
    active_effect.nodes_end = hydrate_node;
    hydrate_next();
    return;
  }
  if (anchor === null) {
    return;
  }
  anchor.before(
    /** @type {Node} */
    dom
  );
}
function props_id() {
  if (hydrating && hydrate_node && hydrate_node.nodeType === 8 && hydrate_node.textContent?.startsWith(`#`)) {
    const id = hydrate_node.textContent.substring(1);
    hydrate_next();
    return id;
  }
  (window.__svelte ??= {}).uid ??= 1;
  return `c${window.__svelte.uid++}`;
}

// node_modules/svelte/src/utils.js
var regex_return_characters = /\r/g;
function hash(str) {
  str = str.replace(regex_return_characters, "");
  let hash2 = 5381;
  let i = str.length;
  while (i--) hash2 = (hash2 << 5) - hash2 ^ str.charCodeAt(i);
  return (hash2 >>> 0).toString(36);
}
var VOID_ELEMENT_NAMES = [
  "area",
  "base",
  "br",
  "col",
  "command",
  "embed",
  "hr",
  "img",
  "input",
  "keygen",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr"
];
function is_void(name) {
  return VOID_ELEMENT_NAMES.includes(name) || name.toLowerCase() === "!doctype";
}
function is_capture_event(name) {
  return name.endsWith("capture") && name !== "gotpointercapture" && name !== "lostpointercapture";
}
var DELEGATED_EVENTS = [
  "beforeinput",
  "click",
  "change",
  "dblclick",
  "contextmenu",
  "focusin",
  "focusout",
  "input",
  "keydown",
  "keyup",
  "mousedown",
  "mousemove",
  "mouseout",
  "mouseover",
  "mouseup",
  "pointerdown",
  "pointermove",
  "pointerout",
  "pointerover",
  "pointerup",
  "touchend",
  "touchmove",
  "touchstart"
];
function is_delegated(event_name) {
  return DELEGATED_EVENTS.includes(event_name);
}
var DOM_BOOLEAN_ATTRIBUTES = [
  "allowfullscreen",
  "async",
  "autofocus",
  "autoplay",
  "checked",
  "controls",
  "default",
  "disabled",
  "formnovalidate",
  "hidden",
  "indeterminate",
  "inert",
  "ismap",
  "loop",
  "multiple",
  "muted",
  "nomodule",
  "novalidate",
  "open",
  "playsinline",
  "readonly",
  "required",
  "reversed",
  "seamless",
  "selected",
  "webkitdirectory",
  "defer",
  "disablepictureinpicture",
  "disableremoteplayback"
];
var ATTRIBUTE_ALIASES = {
  // no `class: 'className'` because we handle that separately
  formnovalidate: "formNoValidate",
  ismap: "isMap",
  nomodule: "noModule",
  playsinline: "playsInline",
  readonly: "readOnly",
  defaultvalue: "defaultValue",
  defaultchecked: "defaultChecked",
  srcobject: "srcObject",
  novalidate: "noValidate",
  allowfullscreen: "allowFullscreen",
  disablepictureinpicture: "disablePictureInPicture",
  disableremoteplayback: "disableRemotePlayback"
};
function normalize_attribute(name) {
  name = name.toLowerCase();
  return ATTRIBUTE_ALIASES[name] ?? name;
}
var DOM_PROPERTIES = [
  ...DOM_BOOLEAN_ATTRIBUTES,
  "formNoValidate",
  "isMap",
  "noModule",
  "playsInline",
  "readOnly",
  "value",
  "volume",
  "defaultValue",
  "defaultChecked",
  "srcObject",
  "noValidate",
  "allowFullscreen",
  "disablePictureInPicture",
  "disableRemotePlayback"
];
var PASSIVE_EVENTS = ["touchstart", "touchmove"];
function is_passive_event(name) {
  return PASSIVE_EVENTS.includes(name);
}
var RAW_TEXT_ELEMENTS = (
  /** @type {const} */
  ["textarea", "script", "style", "title"]
);
function is_raw_text_element(name) {
  return RAW_TEXT_ELEMENTS.includes(
    /** @type {RAW_TEXT_ELEMENTS[number]} */
    name
  );
}
function sanitize_location(location) {
  return (
    /** @type {T} */
    location?.replace(/\//g, "/​")
  );
}

// node_modules/svelte/src/internal/client/render.js
var should_intro = true;
function set_should_intro(value) {
  should_intro = value;
}
function set_text(text2, value) {
  var str = value == null ? "" : typeof value === "object" ? value + "" : value;
  if (str !== (text2.__t ??= text2.nodeValue)) {
    text2.__t = str;
    text2.nodeValue = str + "";
  }
}
function mount(component, options) {
  return _mount(component, options);
}
function hydrate(component, options) {
  init_operations();
  options.intro = options.intro ?? false;
  const target = options.target;
  const was_hydrating = hydrating;
  const previous_hydrate_node = hydrate_node;
  try {
    var anchor = (
      /** @type {TemplateNode} */
      get_first_child(target)
    );
    while (anchor && (anchor.nodeType !== 8 || /** @type {Comment} */
    anchor.data !== HYDRATION_START)) {
      anchor = /** @type {TemplateNode} */
      get_next_sibling(anchor);
    }
    if (!anchor) {
      throw HYDRATION_ERROR;
    }
    set_hydrating(true);
    set_hydrate_node(
      /** @type {Comment} */
      anchor
    );
    hydrate_next();
    const instance = _mount(component, { ...options, anchor });
    if (hydrate_node === null || hydrate_node.nodeType !== 8 || /** @type {Comment} */
    hydrate_node.data !== HYDRATION_END) {
      hydration_mismatch();
      throw HYDRATION_ERROR;
    }
    set_hydrating(false);
    return (
      /**  @type {Exports} */
      instance
    );
  } catch (error) {
    if (error === HYDRATION_ERROR) {
      if (options.recover === false) {
        hydration_failed();
      }
      init_operations();
      clear_text_content(target);
      set_hydrating(false);
      return mount(component, options);
    }
    throw error;
  } finally {
    set_hydrating(was_hydrating);
    set_hydrate_node(previous_hydrate_node);
    reset_head_anchor();
  }
}
var document_listeners = /* @__PURE__ */ new Map();
function _mount(Component, { target, anchor, props = {}, events, context, intro = true }) {
  init_operations();
  var registered_events = /* @__PURE__ */ new Set();
  var event_handle = (events2) => {
    for (var i = 0; i < events2.length; i++) {
      var event_name = events2[i];
      if (registered_events.has(event_name)) continue;
      registered_events.add(event_name);
      var passive2 = is_passive_event(event_name);
      target.addEventListener(event_name, handle_event_propagation, { passive: passive2 });
      var n = document_listeners.get(event_name);
      if (n === void 0) {
        document.addEventListener(event_name, handle_event_propagation, { passive: passive2 });
        document_listeners.set(event_name, 1);
      } else {
        document_listeners.set(event_name, n + 1);
      }
    }
  };
  event_handle(array_from(all_registered_events));
  root_event_handles.add(event_handle);
  var component = void 0;
  var unmount2 = component_root(() => {
    var anchor_node = anchor ?? target.appendChild(create_text());
    branch(() => {
      if (context) {
        push({});
        var ctx = (
          /** @type {ComponentContext} */
          component_context
        );
        ctx.c = context;
      }
      if (events) {
        props.$$events = events;
      }
      if (hydrating) {
        assign_nodes(
          /** @type {TemplateNode} */
          anchor_node,
          null
        );
      }
      should_intro = intro;
      component = Component(anchor_node, props) || {};
      should_intro = true;
      if (hydrating) {
        active_effect.nodes_end = hydrate_node;
      }
      if (context) {
        pop();
      }
    });
    return () => {
      for (var event_name of registered_events) {
        target.removeEventListener(event_name, handle_event_propagation);
        var n = (
          /** @type {number} */
          document_listeners.get(event_name)
        );
        if (--n === 0) {
          document.removeEventListener(event_name, handle_event_propagation);
          document_listeners.delete(event_name);
        } else {
          document_listeners.set(event_name, n);
        }
      }
      root_event_handles.delete(event_handle);
      if (anchor_node !== anchor) {
        anchor_node.parentNode?.removeChild(anchor_node);
      }
    };
  });
  mounted_components.set(component, unmount2);
  return component;
}
var mounted_components = /* @__PURE__ */ new WeakMap();
function unmount(component, options) {
  const fn = mounted_components.get(component);
  if (fn) {
    mounted_components.delete(component);
    return fn(options);
  }
  if (true_default) {
    lifecycle_double_unmount();
  }
  return Promise.resolve();
}

// node_modules/svelte/src/internal/client/dom/legacy/event-modifiers.js
function trusted(fn) {
  return function(...args) {
    var event = (
      /** @type {Event} */
      args[0]
    );
    if (event.isTrusted) {
      fn?.apply(this, args);
    }
  };
}
function self(fn) {
  return function(...args) {
    var event = (
      /** @type {Event} */
      args[0]
    );
    if (event.target === this) {
      fn?.apply(this, args);
    }
  };
}
function stopPropagation(fn) {
  return function(...args) {
    var event = (
      /** @type {Event} */
      args[0]
    );
    event.stopPropagation();
    return fn?.apply(this, args);
  };
}
function once(fn) {
  var ran = false;
  return function(...args) {
    if (ran) return;
    ran = true;
    return fn?.apply(this, args);
  };
}
function stopImmediatePropagation(fn) {
  return function(...args) {
    var event = (
      /** @type {Event} */
      args[0]
    );
    event.stopImmediatePropagation();
    return fn?.apply(this, args);
  };
}
function preventDefault(fn) {
  return function(...args) {
    var event = (
      /** @type {Event} */
      args[0]
    );
    event.preventDefault();
    return fn?.apply(this, args);
  };
}
function passive(node, [event, handler]) {
  user_pre_effect(() => {
    return on(node, event, handler() ?? noop, {
      passive: true
    });
  });
}
function nonpassive(node, [event, handler]) {
  user_pre_effect(() => {
    return on(node, event, handler() ?? noop, {
      passive: false
    });
  });
}

// node_modules/svelte/src/legacy/legacy-client.js
function createClassComponent(options) {
  return new Svelte4Component(options);
}
function asClassComponent(component) {
  return class extends Svelte4Component {
    /** @param {any} options */
    constructor(options) {
      super({
        component,
        ...options
      });
    }
  };
}
var Svelte4Component = class {
  /** @type {any} */
  #events;
  /** @type {Record<string, any>} */
  #instance;
  /**
   * @param {ComponentConstructorOptions & {
   *  component: any;
   * }} options
   */
  constructor(options) {
    var sources = /* @__PURE__ */ new Map();
    var add_source = (key, value) => {
      var s = mutable_source(value);
      sources.set(key, s);
      return s;
    };
    const props = new Proxy(
      { ...options.props || {}, $$events: {} },
      {
        get(target, prop) {
          return get(sources.get(prop) ?? add_source(prop, Reflect.get(target, prop)));
        },
        has(target, prop) {
          if (prop === LEGACY_PROPS) return true;
          get(sources.get(prop) ?? add_source(prop, Reflect.get(target, prop)));
          return Reflect.has(target, prop);
        },
        set(target, prop, value) {
          set(sources.get(prop) ?? add_source(prop, value), value);
          return Reflect.set(target, prop, value);
        }
      }
    );
    this.#instance = (options.hydrate ? hydrate : mount)(options.component, {
      target: options.target,
      anchor: options.anchor,
      props,
      context: options.context,
      intro: options.intro ?? false,
      recover: options.recover
    });
    if (!options?.props?.$$host || options.sync === false) {
      flushSync();
    }
    this.#events = props.$$events;
    for (const key of Object.keys(this.#instance)) {
      if (key === "$set" || key === "$destroy" || key === "$on") continue;
      define_property(this, key, {
        get() {
          return this.#instance[key];
        },
        /** @param {any} value */
        set(value) {
          this.#instance[key] = value;
        },
        enumerable: true
      });
    }
    this.#instance.$set = /** @param {Record<string, any>} next */
    (next) => {
      Object.assign(props, next);
    };
    this.#instance.$destroy = () => {
      unmount(this.#instance);
    };
  }
  /** @param {Record<string, any>} props */
  $set(props) {
    this.#instance.$set(props);
  }
  /**
   * @param {string} event
   * @param {(...args: any[]) => any} callback
   * @returns {any}
   */
  $on(event, callback) {
    this.#events[event] = this.#events[event] || [];
    const cb = (...args) => callback.call(this, ...args);
    this.#events[event].push(cb);
    return () => {
      this.#events[event] = this.#events[event].filter(
        /** @param {any} fn */
        (fn) => fn !== cb
      );
    };
  }
  $destroy() {
    this.#instance.$destroy();
  }
};
function run(fn) {
  user_pre_effect(() => {
    fn();
    var effect = (
      /** @type {import('#client').Effect} */
      active_effect
    );
    if ((effect.f & DIRTY) !== 0) {
      let filename = "a file (we can't know which one)";
      if (true_default) {
        filename = dev_current_component_function?.[FILENAME] ?? filename;
      }
      legacy_recursive_reactive_block(filename);
      set_signal_status(effect, MAYBE_DIRTY);
    }
  });
}
function handlers(...handlers2) {
  return function(event) {
    const { stopImmediatePropagation: stopImmediatePropagation2 } = event;
    let stopped = false;
    event.stopImmediatePropagation = () => {
      stopped = true;
      stopImmediatePropagation2.call(event);
    };
    const errors = [];
    for (const handler of handlers2) {
      try {
        handler?.call(this, event);
      } catch (e) {
        errors.push(e);
      }
      if (stopped) {
        break;
      }
    }
    for (let error of errors) {
      queueMicrotask(() => {
        throw error;
      });
    }
  };
}
function createBubbler() {
  const active_component_context = component_context;
  if (active_component_context === null) {
    lifecycle_outside_component("createBubbler");
  }
  return (type) => (event) => {
    const events = (
      /** @type {Record<string, Function | Function[]>} */
      active_component_context.s.$$events?.[
        /** @type {any} */
        type
      ]
    );
    if (events) {
      const callbacks = is_array(events) ? events.slice() : [events];
      for (const fn of callbacks) {
        fn.call(active_component_context.x, event);
      }
      return !event.defaultPrevented;
    }
    return true;
  };
}

export {
  hash,
  is_void,
  is_capture_event,
  is_delegated,
  normalize_attribute,
  is_raw_text_element,
  sanitize_location,
  head,
  create_fragment_from_html,
  assign_nodes,
  template,
  template_with_script,
  ns_template,
  svg_template_with_script,
  mathml_template,
  text,
  comment,
  append,
  props_id,
  should_intro,
  set_should_intro,
  set_text,
  mount,
  hydrate,
  unmount,
  trusted,
  self,
  stopPropagation,
  once,
  stopImmediatePropagation,
  preventDefault,
  passive,
  nonpassive,
  createClassComponent,
  asClassComponent,
  run,
  handlers,
  createBubbler
};
//# sourceMappingURL=chunk-7ZRJNXJN.js.map
