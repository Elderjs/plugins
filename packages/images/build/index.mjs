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
var __objRest = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/index.ts
import glob from "glob";
import path from "path";
import sharp from "sharp";
import fs from "fs-extra";

// src/utils/helpers.ts
var helpers_exports = {};
__export(helpers_exports, {
  getLargest: () => getLargest,
  getSmallest: () => getSmallest,
  getSources: () => getSources,
  getSrcsets: () => getSrcsets
});
function getSrcsets({
  maxWidth,
  fileSizes,
  key = "relative"
}) {
  const sizes = [];
  const srcsets = fileSizes.reduce((out, cv) => {
    if (cv.width > maxWidth)
      return out;
    if (!sizes.includes(cv.width))
      sizes.push(cv.width);
    let thisSrcSet = out[cv.format][cv.width] || "";
    if (cv.scale === 1)
      thisSrcSet = `${cv[key]}${thisSrcSet}`;
    if (cv.scale === 2 && thisSrcSet.length)
      thisSrcSet = `${thisSrcSet}, ${cv[key]} 2x`;
    out[cv.format][cv.width] = thisSrcSet;
    return out;
  }, {
    webp: {},
    jpeg: {},
    png: {}
  });
  return {
    sizes: sizes.sort((a, b) => b - a),
    srcsets
  };
}
function getSources(sizes, srcsets) {
  const sources = {
    webp: [],
    jpeg: [],
    png: []
  };
  sizes.forEach((size, i, arr) => {
    Object.keys(srcsets).forEach((type) => {
      if (!srcsets[type][size])
        return;
      let source = `<source `;
      if (type === "webp")
        source += `type="image/webp" `;
      if (type === "png")
        source += `type="image/png" `;
      source += `data-srcset="${srcsets[type][size]}" `;
      if (i + 1 < arr.length) {
        source += `media="(min-width: ${sizes[i + 1]}px)" `;
      }
      source += `/>`;
      sources[type].push(source);
    });
  });
  return sources;
}
function getLargest(fileSizes, orgFormat, maxWidth) {
  return fileSizes.filter((p) => p.format === orgFormat).find((p, _i, arr) => {
    let largest = true;
    arr.forEach((a) => {
      if (a.width > maxWidth)
        return;
      if (a.width > p.width)
        largest = false;
    });
    return largest;
  });
}
function getSmallest(fileSizes, orgFormat) {
  return fileSizes.filter((p) => p.format === orgFormat).find((p, _i, arr) => {
    let smallest = true;
    arr.forEach((a) => {
      if (a.width < p.width)
        smallest = false;
    });
    return smallest;
  });
}

// src/utils/imageStore.ts
function imageStore_default(manifest, plugin2) {
  return {
    src: function src(path2) {
      return manifest[path2];
    },
    largest: function largest(path2, opts) {
      const { maxWidth } = __spreadValues({ maxWidth: 2e3 }, opts);
      const file = manifest[path2];
      return getLargest(file.sizes, file.format, maxWidth);
    },
    picture: function picture(path2, opts = {}) {
      try {
        const { maxWidth, class: classStr, alt, wrap } = __spreadValues({ maxWidth: 2e3, class: "", alt: "" }, opts);
        const file = manifest[path2];
        plugin2.internal.shouldAddCodeDependencies = true;
        const { sizes, srcsets } = getSrcsets({
          maxWidth,
          fileSizes: file.sizes,
          key: plugin2.config.s3 && plugin2.config.s3.USE_S3_HOSTING ? "s3" : "relative"
        });
        const sources = getSources(sizes, srcsets);
        let picture2 = `<picture class="${classStr ? ` ${classStr}` : ""}">`;
        picture2 += sources.webp.reduce((out, cv) => `${out}${cv}`, "");
        if (file.format === "jpeg")
          picture2 += sources.jpeg.reduce((out, cv) => `${out}${cv}`, "");
        if (file.format === "png")
          picture2 += sources.png.reduce((out, cv) => `${out}${cv}`, "");
        picture2 += `<img src="${file.placeholder}"${alt.length > 0 ? ` alt="${alt}"` : ""} class="lazy blur-up">`;
        picture2 += `</picture>`;
        let pictureWithWrap = `<div class="${opts.ignoreCssString ? "custom-ejs" : "ejs"}" ${plugin2.internal.addStyles && !opts.ignoreCssString ? `style="padding-bottom: ${Math.round(file.height / file.width * 1e4) / 100}%;"` : ""}>`;
        if (plugin2.config.placeholder) {
          pictureWithWrap += `<div class="placeholder" style="background-image: url('${file.placeholder}')"></div>`;
        }
        pictureWithWrap += `${picture2}</div>`;
        if (wrap) {
          return `<div class="${wrap}">${pictureWithWrap}</div>`;
        }
        return pictureWithWrap;
      } catch (e) {
        if (e.message.includes("'sizes' of undefined")) {
          console.log("manifest keys", Object.keys(manifest));
          throw new Error(`Cannot find source image with ${path2} in manifest. (logged above)`);
        } else {
          throw e;
        }
      }
    }
  };
}

// src/index.ts
import WorkerNodes from "worker-nodes";
var imageFileTypes = ["jpg", "jpeg", "png"];
var defaultWidths = [1280, 992, 768, 576, 400, 350, 200];
var defaultScales = [1, 2];
var config = {
  debug: false,
  s3: void 0,
  folders: [
    {
      src: "/images/*",
      output: "/images/"
    }
  ],
  widths: [],
  fileTypes: ["webp"],
  imageManifest: "/images/ejs-image-manifest.json",
  cacheFolder: "/images/sizes/",
  scales: [],
  placeholder: {
    resize: {
      width: 10,
      fit: sharp.fit.cover
    },
    jpeg: {
      quality: 50,
      progressive: true,
      optimizeScans: true,
      chromaSubsampling: "4:2:0",
      trellisQuantisation: true,
      quantisationTable: 2
    }
  },
  quality: 70,
  cssString: `.ejs {display: block;position: relative;height: 0;width: 100%;}
  .ejs img.lazy{position: absolute;top: 0;left: 0;width: 100%;height: 100%;display: block;}
  .ejs .placeholder{
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: block;
    z-index:9;
    background-repeat: no-repeat;
    background-size: cover;
    background-color: white;
  }
  .blur-up {
    -webkit-filter: blur(1px);
    filter: blur(1px);
    transition: filter 400ms, -webkit-filter 400ms;
  }
  .blur-up.loaded {
    -webkit-filter: blur(0);
    filter: blur(0);
  }
  .placeholder {
    transition: opacity 400ms;
    opacity: 1;
  }
  .placeholder.loaded {
    opacity:0;
  }
  `,
  addVanillaLazy: true,
  vanillaLazyLocation: "/static/vanillaLazy.min.js"
};
var processImages = async ({
  manifest = {},
  images = [],
  widths = defaultWidths,
  scales = defaultScales,
  plugin: plugin2 = {
    config
  },
  s3,
  debug
}) => {
  try {
    const workerSettings = {
      maxTasksPerWorker: 5
    };
    const placeholderWorker = new WorkerNodes(path.resolve(__dirname, "./workers/placeholder.js"), workerSettings);
    const originalS3Worker = new WorkerNodes(path.resolve(__dirname, "./workers/saveOriginalToS3.js"), __spreadProps(__spreadValues({}, workerSettings), {
      autoStart: false
    }));
    const resizeWorker = new WorkerNodes(path.resolve(__dirname, "./workers/resize.js"), workerSettings);
    const largestWidth = Math.max.apply(Math, widths);
    const toProcess = [];
    const toProcessPlaceholders = [];
    if (debug)
      console.log(`s3 settings`, s3);
    for (const file of images) {
      if (!s3) {
        const publicFolderDest = `${file.publicPrefix}.${file.ext}`;
        if (!fs.existsSync(publicFolderDest)) {
          fs.copyFileSync(file.src, publicFolderDest);
        }
      }
      if (!manifest[file.rel]) {
        const original = await sharp(file.src).toBuffer({ resolveWithObject: true });
        let s3Rel;
        if (s3) {
          s3Rel = await originalS3Worker.call({ rel: file.rel, src: original.data, s3, debug });
        }
        if (debug)
          console.log("s3Rel", s3Rel);
        manifest[file.rel] = {
          width: original.info.width,
          height: original.info.height,
          format: original.info.format,
          original: s3Rel || file.rel,
          rel: file.rel,
          sizes: [],
          placeholder: ""
        };
      }
      const fileTypes = [...plugin2.config.fileTypes];
      if (file.ext === "png") {
        fileTypes.push(file.ext);
      } else if (file.ext === "jpeg" || file.ext === "jpg") {
        fileTypes.push("jpeg");
      }
      const widthsToProcess = [...widths];
      if (manifest[file.rel].width < largestWidth) {
        widthsToProcess.push(manifest[file.rel].width);
      }
      for (const width of widthsToProcess) {
        if (manifest[file.rel].width < width)
          continue;
        for (const scale of scales) {
          if (manifest[file.rel].width < width * scale)
            continue;
          for (const fileType of fileTypes) {
            toProcess.push(resizeWorker.call(__spreadProps(__spreadValues({}, file), { width, scale, fileType, quality: plugin2.config.quality, s3, debug })));
          }
        }
      }
      if (plugin2.config.placeholder) {
        if (!manifest[file.rel].placeholder) {
          toProcessPlaceholders.push(placeholderWorker.call(__spreadProps(__spreadValues({}, file), { options: plugin2.config.placeholder, debug })));
        }
      }
    }
    const processed = await Promise.all(toProcess);
    const placeholders = await Promise.all(toProcessPlaceholders);
    await placeholderWorker.terminate();
    await originalS3Worker.terminate();
    await resizeWorker.terminate();
    processed.forEach((_a) => {
      var _b = _a, { rel } = _b, resize = __objRest(_b, ["rel"]);
      if (!manifest[rel].sizes.find((size) => size.relative === resize.relative)) {
        manifest[rel].sizes.push(resize);
      }
    });
    placeholders.forEach(({ rel, placeholder, error }) => {
      if (error)
        throw error;
      manifest[rel].placeholder = placeholder;
    });
    if (debug)
      console.log("Generated Manifest", manifest);
    return manifest;
  } catch (e) {
    console.error(e);
    return {};
  }
};
var plugin = {
  name: "@elderjs/plugin-images",
  description: "Resizes images. ",
  config,
  init: async (plugin2) => {
    if (config.widths.length === 0) {
      plugin2.config.widths = defaultWidths;
    }
    if (plugin2.config.scales.length === 0) {
      plugin2.config.scales = defaultScales;
    }
    const internal = {
      addStyles: typeof plugin2.config.cssString === "string" && plugin2.config.cssString.length > 0,
      imagesToProcess: [],
      manifest: {},
      crossPlatformRoot: plugin2.settings.rootDir.replace(/\\/gim, "/"),
      shouldAddCodeDependencies: false,
      externalManifest: false
    };
    if (typeof plugin2.config.imageManifest === "function") {
      internal.externalManifest = true;
      internal.manifest = await plugin2.config.imageManifest(plugin2.config);
      console.log(`elderjs-plugin-images: loaded external manifest`);
    } else {
      const manifestLoc = path.join(plugin2.settings.rootDir, plugin2.config.imageManifest);
      if (fs.existsSync(manifestLoc)) {
        try {
          const manifest = fs.readFileSync(manifestLoc, { encoding: "utf-8" });
          internal.manifest = JSON.parse(manifest);
        } catch (e) {
          console.log(e);
        }
      } else {
        console.log(`elderjs-plugin-images: no manifest found at ${manifestLoc}`);
      }
    }
    return __spreadProps(__spreadValues({}, plugin2), { internal });
  },
  shortcodes: [
    {
      shortcode: "picture",
      run: (payload) => {
        const plugin2 = payload.plugin;
        const { props, request } = payload;
        const _a = props, { src } = _a, options = __objRest(_a, ["src"]);
        if (!src) {
          throw new Error(`elderjs-plugin-images: picture shortcode requires src. ${JSON.stringify(request)}`);
        }
        if (!options.title && options.alt) {
          options.title = options.alt;
        }
        return plugin2.internal.imageStore.picture(src, options);
      }
    }
  ],
  hooks: [
    {
      hook: "bootstrap",
      name: "processImages",
      description: "Process images and update manifest if not using an external manifest.",
      priority: 100,
      run: async (payload) => {
        const settings = payload.settings;
        const plugin2 = payload.plugin;
        let folders = config.folders;
        if (folders.length > 0) {
          folders.forEach((folder) => {
            if (!folder.src || !folder.output) {
              throw new Error(`elderjs-plugin-images: Both src and output keys are required for the 'folders' object or array.`);
            }
          });
          plugin2.internal.imagesToProcess = folders.reduce((out, folder) => {
            fs.ensureDirSync(path.join(settings.distDir, folder.output));
            const files = glob.sync(path.join(settings.rootDir, folder.src + `.{${imageFileTypes.join(",")}}`));
            if (Array.isArray(files)) {
              files.filter((file) => !file.split("/").pop().includes("-ejs")).forEach((file) => {
                const relGlob = file.replace(plugin2.internal.crossPlatformRoot, "").replace(file.split("/").pop(), "");
                const crossPlatformFile = file.replace(plugin2.internal.crossPlatformRoot, "");
                const name = crossPlatformFile.replace(relGlob, "");
                const rel = crossPlatformFile.replace(settings.rootDir, "").replace(relGlob, folder.output);
                const [nameNoExt, ext] = name.split(".");
                const [relNameNoExt] = rel.split(".");
                const baseDir = path.join(settings.distDir, folder.output);
                fs.ensureDirSync(baseDir);
                out.push({
                  src: file,
                  rel,
                  ext,
                  publicPrefix: path.join(baseDir, nameNoExt),
                  cachePrefix: config.cacheFolder && path.join(settings.rootDir, relNameNoExt.replace(folder.output, config.cacheFolder))
                });
              });
            }
            return out;
          }, []);
        }
        if (plugin2.internal.imagesToProcess && Array.isArray(plugin2.internal.imagesToProcess) && plugin2.internal.imagesToProcess.length > 0) {
          console.log(`elderjs-plugin-images: Processing ${plugin2.internal.imagesToProcess.length} local source images.`);
          const { scales, widths } = plugin2.config;
          plugin2.internal.manifest = await processImages({
            manifest: plugin2.internal.manifest,
            images: plugin2.internal.imagesToProcess,
            widths,
            scales,
            plugin: plugin2,
            s3: plugin2.config.s3,
            debug: plugin2.config.debug
          });
          if (!plugin2.debug && typeof plugin2.config.imageManifest === "string") {
            fs.writeJsonSync(path.join(settings.rootDir, plugin2.config.imageManifest), plugin2.internal.manifest);
            console.log(`elderjs-plugin-images: Updated manifest.`);
          }
          return {
            plugin: plugin2
          };
        }
      }
    },
    {
      hook: "bootstrap",
      name: "processImages",
      description: "Populate image store and make it available on the plugin. Also make plugin internal helpers available.",
      priority: 99,
      run: async (payload) => {
        const helpers = payload.helpers;
        const plugin2 = payload.plugin;
        if (plugin2.internal.manifest) {
          plugin2.internal.imageStore = imageStore_default(plugin2.internal.manifest, plugin2);
          console.log(`elderjs-plugin-images: Done.`);
          return {
            helpers: __spreadProps(__spreadValues(__spreadValues({}, helpers), helpers_exports), {
              images: plugin2.imageStore
            })
          };
        }
      }
    },
    {
      hook: "bootstrap",
      name: "processImages",
      description: "Populate image store and make it available on the plugin. Also make plugin internal helpers available.",
      priority: 99,
      run: async (payload) => {
        const settings = payload.settings;
        const plugin2 = payload.plugin;
        if (plugin2.config.addVanillaLazy) {
          const vanillaLazyNodeModules = path.join(settings.rootDir, "node_modules", "vanilla-lazyload", "dist", "lazyload.min.js");
          const vanillaLazyPublic = path.join(settings.distDir, plugin2.config.vanillaLazyLocation);
          if (!fs.existsSync(vanillaLazyPublic)) {
            if (fs.existsSync(vanillaLazyNodeModules)) {
              fs.outputFileSync(vanillaLazyPublic, fs.readFileSync(vanillaLazyNodeModules, { encoding: "utf-8" }));
            } else {
              throw new Error(`Unable to add vanillaLazy to public. Not found at ${vanillaLazyNodeModules}`);
            }
          }
        }
      }
    },
    {
      hook: "request",
      name: "resetPluginUsed",
      description: "The plugin maintains a state that needs to be reset each request in order to intelligently add css/js.",
      priority: 50,
      run: async (payload) => {
        const plugin2 = payload.plugin;
        plugin2.internal.shouldAddCodeDependencies = false;
        return {
          plugin: plugin2
        };
      }
    },
    {
      hook: "stacks",
      name: "addElderPluginImagesCss",
      description: "Adds default css to the css stack",
      priority: 50,
      run: async (payload) => {
        const cssStack = payload.cssStack;
        const plugin2 = payload.plugin;
        if (plugin2.internal.shouldAddCodeDependencies && plugin2.internal.addStyles && typeof plugin2.config.cssString === "string") {
          cssStack.push({
            source: "elderPluginImages",
            string: plugin2.config.cssString
          });
          return {
            cssStack
          };
        }
      }
    },
    {
      hook: "stacks",
      name: "elderPluginImagesManagevanillaLazy",
      description: "Adds vanillaLazy and makes sure it is in the public folder if requested by plugin.",
      priority: 99,
      run: async (payload) => {
        const plugin2 = payload.plugin;
        const customJsStack = payload.customJsStack;
        if (config.addVanillaLazy && plugin2.internal.shouldAddCodeDependencies) {
          customJsStack.push({
            source: "elderjs-plugin-images",
            string: `<script>

            function findAncestor (el, cls) {
              if(!cls) return false;
              while ((el = el.parentElement) && !el.classList.contains(cls));
              return el;
            }

          var vanillaLazyLoad = document.createElement("script");
          vanillaLazyLoad.src = "${config.vanillaLazyLocation}";
          vanillaLazyLoad.rel = "preload";
          vanillaLazyLoad.onload = function() {
            var ll = new LazyLoad({
              callback_loaded: function (element) {
                var ejsEl = findAncestor(element, 'ejsEl');
                if(ejsEl){
                  var elements = ejsEl.getElementsByClassName("placeholder");
                  if(elements.length > 0){
                    elements[0].classList.add('loaded');
                  }
                }
              }
            });
          };
          document.getElementsByTagName('head')[0].appendChild(vanillaLazyLoad);
          
          <\/script>`,
            priority: 1
          });
          return {
            customJsStack
          };
        }
      }
    }
  ],
  processImages
};
var src_default = plugin;
export {
  src_default as default,
  processImages
};
