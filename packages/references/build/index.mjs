var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));

// src/index.ts
var config = {
  referenceListLabel: "References: "
};
var plugin = {
  name: "@elderjs/plugin-references",
  minimumElderjsVersion: "1.7.5",
  description: "Adds {{ref}} and {{referenceList}} shortcodes to Elder.js allowing you to add wikipedia style references to your content.",
  init: (plugin2) => {
    const internal = {
      references: {},
      config: plugin2.config
    };
    return __spreadProps(__spreadValues({}, plugin2), { internal });
  },
  config,
  shortcodes: [
    {
      shortcode: "ref",
      run: ({ content, request, plugin: plugin2 }) => {
        const internal = plugin2.internal;
        const count = internal.references[request.permalink].length + 1;
        internal.references[request.permalink].push(`
        <li id='cite_note-${count}'>
        <cite>${content}</cite>
        <a href='#cite_ref-${count}' class='cite-ref-backlink' aria-label='Jump up to reference' title='Jump up to reference'>^</a>
      </li>`);
        return `<sup id='cite_ref-${count}' class='reference'><a href='#cite_note-${count}'>[${count}]</a></sup>`;
      }
    },
    {
      shortcode: "referenceList",
      run: ({ props, request, plugin: plugin2 }) => {
        const internal = plugin2.internal;
        if (internal.references[request.permalink] && internal.references[request.permalink].length > 0) {
          return `<div class="references"><h4>${props.label || internal.config.referenceListLabel}</h4><ol>${internal.references[request.permalink].join("")}</ol></div>`;
        }
      }
    }
  ],
  hooks: [
    {
      hook: "request",
      name: "resetReferencesOnRequest",
      description: `If references aren't reset, the plugin will collect references between page loads.`,
      run: async ({ request, plugin: plugin2 }) => {
        const internal = plugin2.internal;
        internal.references[request.permalink] = [];
        return { plugin: plugin2 };
      }
    }
  ]
};
var src_default = plugin;
export {
  src_default as default
};
