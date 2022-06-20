var __create = Object.create;
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __getProtoOf = Object.getPrototypeOf;
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
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target, mod));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  default: () => src_default
});
module.exports = __toCommonJS(src_exports);
var import_fs_extra = __toESM(require("fs-extra"));
var import_path = __toESM(require("path"));
var import_critical = __toESM(require("critical"));
var import_clean_css = __toESM(require("clean-css"));
var config = {
  disable: false,
  rebuild: false,
  folder: `./src/assets/critical/`,
  requests: false,
  critical: {
    penthouse: {
      forceInclude: [],
      keepLargerMediaQueries: true
    },
    dimensions: [
      {
        height: 500,
        width: 300
      },
      {
        height: 900,
        width: 1280
      }
    ]
  },
  cssFile: void 0
};
var plugin = {
  name: "elderjs-plugin-critical-path-css",
  description: `Easily generate critical path css for your Elder.js websites using [critical](https://github.com/addyosmani/critical).

  While Svelte does a great job of scoping CSS usually you'll have a site wide css file to hold common styles.
  
  If you're using a common css file and are optimizing for load speed, you'll want to defer the common css file and include critical path css. 
  
  This plugin generates the critical path css for each of your templates and automatically includes it in the head when generating the page.`,
  minimumElderjsVersion: "1.7.5",
  init: (plugin2) => {
    const internal = {
      cssFile: "",
      css: {},
      writeFolder: plugin2.config.writeFolder || "",
      criticalPathCss: {},
      disable: plugin2.config.disable,
      cssLocations: [],
      counts: {}
    };
    if (!plugin2.config.disable) {
      if (process.env.ELDER_REBUILD_CRITICAL_PATH && String(process.env.ELDER_REBUILD_CRITICAL_PATH).toLowerCase() === "true") {
        plugin2.config.rebuild = true;
        plugin2.config.rebuilding = true;
      }
      if (plugin2.config.rebuilding === true) {
        if (plugin2.settings.build && !plugin2.settings.worker) {
          console.log(`Force rebuilding of critical path css because elder-plugin-critical-path-css.config.rebuilding = true in your elder.config.js`);
          plugin2.config.rebuilding = true;
        } else {
          console.warn(`Cannot force rebuild critical path css in server mode.`);
          plugin2.config.rebuilding = false;
        }
      } else {
        plugin2.config.rebuilding = false;
      }
      if (plugin2.config.rebuild === true && !plugin2.settings.build) {
        console.log(`Disabling elder-plugin-critical-path-css rebuild as it can only be used in build mode.`);
      }
      if (plugin2.config.cssFile) {
        if (Array.isArray(plugin2.config.cssFile)) {
          for (const file of plugin2.config.cssFile) {
            const cssLocation = import_path.default.resolve(plugin2.settings.rootDir, file);
            if (import_fs_extra.default.existsSync(cssLocation)) {
              internal.cssLocations.push(cssLocation);
            } else {
              console.log(`elder-plugin-critical-path-css could not find your css at ${cssLocation}.`);
              plugin2.config.rebuilding = false;
            }
          }
        } else {
          const cssLocation = import_path.default.resolve(plugin2.settings.rootDir, plugin2.config.cssFile);
          if (import_fs_extra.default.existsSync(cssLocation)) {
            internal.cssLocations.push(cssLocation);
          } else {
            console.log(`elder-plugin-critical-path-css could not find your css at ${cssLocation}.`);
            plugin2.config.rebuilding = false;
          }
        }
      }
      if (plugin2.config.rebuild === true && plugin2.settings.build) {
        plugin2.config.rebuilding = true;
        if (plugin2.settings && plugin2.settings.$$internal && plugin2.settings.$$internal.files.publicCssFile) {
          const elderJsCss = import_path.default.resolve(plugin2.settings.distDir, `.${plugin2.settings.$$internal.files.publicCssFile}`);
          if (import_fs_extra.default.existsSync(elderJsCss)) {
            internal.cssLocations.push(elderJsCss);
          }
        }
      }
      if (plugin2.config.rebuilding) {
        if (!plugin2.config.writeFolder) {
          internal.writeFolder = import_path.default.resolve(plugin2.settings.rootDir, plugin2.config.folder);
        }
        import_fs_extra.default.ensureDirSync(internal.writeFolder);
        if (!plugin2.settings.worker) {
          console.warn(`
      ------------- elder-plugin-critical-path-css ------------------
      REBUILDING CRITICAL PATH CSS, allRequests are being overwritten. PARTIAL BUILD/SERVER.
      --
      If you are intending for a full build:
      1 - make sure process.env.ELDER_REBUILD_CRITICAL_PATH is not true
      2 - make sure elder-plugin-critical-path-css.config.rebuilding is not true in your elder.config.js.
      3 - make sure elder-plugin-critical-path-css.config.rebuild is not true in your elder.config.js.
      --
      REBUILDING CRITICAL PATH CSS, allRequests are being overwritten. PARTIAL BUILD/SERVER.
      ---------------------------------------------------------------`);
        }
      }
    }
    return __spreadProps(__spreadValues({}, plugin2), { internal });
  },
  hooks: [
    {
      hook: "bootstrap",
      name: "collectCriticalPathCssForRoutes",
      description: `Collects the critical path css files that exist for routes.`,
      priority: 50,
      run: async (payload) => {
        const { routes, settings } = payload;
        const plugin2 = payload.plugin;
        if (!plugin2.internal.disable) {
          let collectedCssFiles = 0;
          plugin2.internal.criticalPathCss = Object.keys(routes).reduce((out, cv) => {
            const file = import_path.default.resolve(settings.rootDir, plugin2.config.folder, `./${cv}.css`);
            if (import_fs_extra.default.existsSync(file)) {
              collectedCssFiles += 1;
              out[cv] = import_fs_extra.default.readFileSync(file);
            }
            return out;
          }, {});
          if (collectedCssFiles > 0) {
            return {
              plugin: plugin2
            };
          }
        }
      }
    },
    {
      hook: "stacks",
      name: "addCriticalPathCssToHeadStack",
      description: `If a route has a critical path css file it adds it to the headStack so it is included. Highest priority because css after it will overwrite the critical path css.`,
      priority: 100,
      run: async (payload) => {
        const { request, headStack } = payload;
        const plugin2 = payload.plugin;
        if (!plugin2.internal.disable || !plugin2.config.rebuilding) {
          const critCss = plugin2.internal.criticalPathCss[request.route];
          if (critCss) {
            headStack.push({
              source: "criticalPathCss",
              string: `<style type="text/css">${critCss}</style>`,
              priority: 40
            });
            return { headStack };
          } else {
            console.error(`No critical path for ${request.route}`);
          }
        }
      }
    },
    {
      hook: "allRequests",
      name: "modifyAllRequestsForCriticalPath",
      description: "Collects the routes that Elder.js is aware of so that critical path css and rewrites the allRequests object so that only requests needed are built..",
      priority: 40,
      run: async (payload) => {
        const { routes, allRequests } = payload;
        const plugin2 = payload.plugin;
        let requestsForCritical = [];
        if (plugin2.config.rebuilding && !plugin2.internal.disable) {
          plugin2.internal.css = Object.keys(routes).reduce((out, cv) => {
            out[cv] = [];
            return out;
          }, {});
          if (plugin2.config.requests) {
            requestsForCritical = Object.keys(plugin2.config.requests).reduce((out, cv) => {
              const arrWithRoute = plugin2.config.requests[cv].map((r) => __spreadProps(__spreadValues({}, r), { route: cv }));
              out = out.concat(arrWithRoute);
              return out;
            }, []);
          } else {
            requestsForCritical = Object.keys(routes).reduce((out, cv) => {
              const request = allRequests.find((r) => r.route === cv);
              if (request) {
                out.push(request);
              }
              return out;
            }, []);
          }
          plugin2.internal.counts = requestsForCritical.reduce((out, cv) => {
            if (!{}.hasOwnProperty.call(out, cv.route))
              out[cv.route] = 0;
            out[cv.route] += 1;
            return out;
          }, {});
          return {
            allRequests: requestsForCritical,
            plugin: plugin2
          };
        }
      }
    },
    {
      hook: "requestComplete",
      name: "extractCriticalPathCssForRoute",
      description: "Regenerates critical path css for a route and saves it for inclusion in templates.",
      priority: 100,
      run: async (payload) => {
        const { htmlString, request, settings } = payload;
        const plugin2 = payload.plugin;
        if (plugin2.config.rebuilding === true && settings.worker && !plugin2.internal.disable) {
          const crit = await import_critical.default.generate(__spreadProps(__spreadValues({}, plugin2.config.critical), {
            inline: false,
            html: htmlString,
            css: plugin2.internal.cssLocations
          }));
          plugin2.internal.css[request.route].push(crit.css);
          if (plugin2.internal.counts[request.route] === plugin2.internal.css[request.route].length) {
            const routeCss = plugin2.internal.css[request.route].reduce((out, cv) => out + cv, "");
            const routeCritical = new import_clean_css.default({ level: 2 }).minify(routeCss);
            import_fs_extra.default.outputFileSync(import_path.default.join(plugin2.internal.writeFolder, `${request.route}.css`), routeCritical.styles, {
              encoding: "utf-8"
            });
          }
          return {
            plugin: plugin2
          };
        }
      }
    },
    {
      hook: "buildComplete",
      name: "killBuild",
      description: `The critical doesn't doesn't clean up it's child processes, so we need to exit them.`,
      priority: 100,
      run: async (payload) => {
        const plugin2 = payload.plugin;
        if (plugin2.config.rebuilding === true && !plugin2.internal.disable) {
        }
      }
    }
  ],
  config
};
var src_default = plugin;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
