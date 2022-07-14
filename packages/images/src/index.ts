import glob from 'glob';
import path from 'path';
import sharp from 'sharp';
import fs from 'fs-extra';
import imageStore from './utils/imageStore.js';
import * as pluginHelpers from './utils/helpers.js';
import WorkerNodes from 'worker-nodes';

import { PluginOptions, PluginInitPayload } from '@elderjs/elderjs';
import { ResizeWorker } from './workers/resize.js';
import { PlaceholderWorker } from './workers/placeholder.js';
import { SaveOriginalToS3Worker } from './workers/saveOriginalToS3.js';

const imageFileTypes = ['jpg', 'jpeg', 'png'];
const defaultWidths = [1280, 992, 768, 576, 400, 350, 200];
const defaultScales = [1, 2];

export interface ElderjsImageSize {
  width: number;
  height: number;
  format: string;
  relative: string;
  scale: number;
  cache: string;
  public: string;
  s3?: string;
  rel?: string;
}

export interface ElderjsImageEntry {
  width: number;
  height: number;
  format: string;
  original: string;
  rel: string;
  sizes: ElderjsImageSize[];
  placeholder: string;
}

export type ElderjsImageManifest = Record<string, ElderjsImageEntry>;

type ImageToProcess = {
  src: string | Buffer; // file path or buffer
  rel: string; // the relative url where the image will be found on the site.
  ext: string; // extension
  publicPrefix: string; // used for writing/reading to the public folder.
  cachePrefix: string; // used for writing/reading to the cache folder.
};

// extracted so that it can accept a buffer and be used in other contexts via importing.

export type ElderjsImagesS3Config = {
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  S3_BUCKET: string;
  S3_BUCKET_URL: string;
  USE_S3_HOSTING: boolean;
};

export interface ElderjsImagesConfig {
  debug: boolean;
  s3: ElderjsImagesS3Config;
  folders: { src: string; output: string }[];
  widths: number[];
  fileTypes: string[];
  imageManifest: string | ((x: ElderjsImagesConfig) => ElderjsImageManifest);
  cacheFolder: string;
  scales: number[];
  placeholder: any;
  quality: number;
  cssString: string | boolean;
  addVanillaLazy: boolean;
  vanillaLazyLocation: string;
}

const config = {
  debug: false,
  s3: undefined,
  folders: [
    {
      src: '/images/*', // where your original images are. Relative to rootDir/process.cwd() defined in your elder.config.js.
      output: '/images/', // where files should be put within the distDir defined in your elder.config.js.
    },
  ],
  widths: [], // Sizes the images will be resized to.
  fileTypes: ['webp'], // file types in addition to jpeg/png
  imageManifest: '/images/ejs-image-manifest.json', // relative to root dir or can be an async function to pull a manifest from a db.
  cacheFolder: '/images/sizes/', // relative to root dir
  scales: [],
  placeholder: {
    resize: {
      width: 10,
      fit: sharp.fit.cover,
    },
    jpeg: {
      quality: 50,
      progressive: true,
      optimizeScans: true,
      chromaSubsampling: '4:2:0',
      trellisQuantisation: true,
      quantisationTable: 2,
    },
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
  vanillaLazyLocation: '/static/vanillaLazy.min.js', // vanillaLazy's location relative to the root of the site. The plugin will move it to your public folder for you.
};

type InitFn = PluginInitPayload & { config: ElderjsImagesConfig };

export type InitReturn = InitFn & { internal: ElderjsImagesPluginInternal };

export interface ProcessImage {
  widths: number[];
  scales: number[];
  manifest: ElderjsImageManifest;
  images: ImageToProcess[];
  plugin: {
    config: {
      quality: number;
      placeholder: any;
      fileTypes: string[];
    };
  };
  s3: ElderjsImagesS3Config;
  debug: boolean;
}

export type ElderjsImagesPluginInternal = {
  addStyles: boolean;
  imagesToProcess: ImageToProcess[];
  manifest: ElderjsImageManifest;
  crossPlatformRoot: string;
  shouldAddCodeDependencies: boolean;
  externalManifest: boolean;
  imageStore?: ReturnType<typeof imageStore>;
};

export interface GenericWorker<T> {
  call: T;
  terminate: (...p: any) => void;
}

export const processImages = async ({
  manifest = {},
  images = [],
  widths = defaultWidths,
  scales = defaultScales,
  plugin = {
    config: config,
  },
  s3,
  debug,
}: ProcessImage) => {
  try {
    const workerSettings = {
      maxTasksPerWorker: 5,
    };

    const placeholderWorker = new WorkerNodes(
      path.resolve(__dirname, './workers/placeholder.js'),
      workerSettings,
    ) as PlaceholderWorker;
    const originalS3Worker = new WorkerNodes(path.resolve(__dirname, './workers/saveOriginalToS3.js'), {
      ...workerSettings,
      autoStart: false,
    }) as SaveOriginalToS3Worker;
    const resizeWorker = new WorkerNodes(
      path.resolve(__dirname, './workers/resize.js'),
      workerSettings,
    ) as ResizeWorker;

    // eslint-disable-next-line prefer-spread
    const largestWidth = Math.max.apply(Math, widths);

    const toProcess = [];
    const toProcessPlaceholders = [];

    if (debug) console.log(`s3 settings`, s3);

    for (const file of images) {
      if (!s3) {
        // copy to public folder if it doesn't exist and we're not uploading to s3.
        const publicFolderDest = `${file.publicPrefix}.${file.ext}`;
        if (!fs.existsSync(publicFolderDest)) {
          fs.copyFileSync(file.src, publicFolderDest);
        }
      }

      if (!manifest[file.rel]) {
        // imageLocation
        const original = await sharp(file.src).toBuffer({ resolveWithObject: true });

        // if uploading to s3
        let s3Rel;
        if (s3) {
          s3Rel = await originalS3Worker.call({ rel: file.rel, src: original.data, s3, debug });
        }

        if (debug) console.log('s3Rel', s3Rel);

        manifest[file.rel] = {
          width: original.info.width,
          height: original.info.height,
          format: original.info.format,
          original: s3Rel || file.rel, // if original is on s3 log it.
          rel: file.rel,
          sizes: [],
          placeholder: '',
        };
        // imageBuffer
      }

      const fileTypes = [...plugin.config.fileTypes];
      if (file.ext === 'png') {
        fileTypes.push(file.ext);
      } else if (file.ext === 'jpeg' || file.ext === 'jpg') {
        fileTypes.push('jpeg');
      }

      const widthsToProcess = [...widths];

      // if original isn't wider, add one with a max width desired.
      if (manifest[file.rel].width < largestWidth) {
        widthsToProcess.push(manifest[file.rel].width);
      }

      for (const width of widthsToProcess) {
        if (manifest[file.rel].width < width) continue; //skip if original is smaller.
        for (const scale of scales) {
          if (manifest[file.rel].width < width * scale) continue; // skip if original is smaller.
          for (const fileType of fileTypes) {
            // const resizeRelative = `${getPrefix(file.rel, file.publicPrefix)}${getSuffix(
            //   width,
            //   scale,
            //   fileType,
            // )}`;

            // check to make sure we don't need to resize this again.
            // const sizeExsists = manifest[file.rel].sizes.find((size) => size.relative === resizeRelative);
            // if (sizeExsists) continue;

            toProcess.push(
              resizeWorker.call({ ...file, width, scale, fileType, quality: plugin.config.quality, s3, debug }),
            );
          }
        }
      }

      if (plugin.config.placeholder) {
        if (!manifest[file.rel].placeholder) {
          toProcessPlaceholders.push(placeholderWorker.call({ ...file, options: plugin.config.placeholder, debug }));
        }
      }
    }

    const processed = await Promise.all(toProcess);
    const placeholders = await Promise.all(toProcessPlaceholders);

    await placeholderWorker.terminate();
    await originalS3Worker.terminate();
    await resizeWorker.terminate();

    processed.forEach(({ rel, ...resize }) => {
      if (!manifest[rel].sizes.find((size) => size.relative === resize.relative)) {
        manifest[rel].sizes.push(resize);
      }
    });

    placeholders.forEach(({ rel, placeholder, error }) => {
      if (error) throw error;
      manifest[rel].placeholder = placeholder;
    });

    if (debug) console.log('Generated Manifest', manifest);

    return manifest;
  } catch (e) {
    console.error(e);
    return {};
  }
};

const plugin: PluginOptions = {
  name: '@elderjs/plugin-images',
  description: 'Resizes images. ',
  config,
  init: async (plugin: InitFn): Promise<InitReturn> => {
    if (config.widths.length === 0) {
      plugin.config.widths = defaultWidths;
    }

    if (plugin.config.scales.length === 0) {
      plugin.config.scales = defaultScales;
    }

    const internal: ElderjsImagesPluginInternal = {
      addStyles: typeof plugin.config.cssString === 'string' && plugin.config.cssString.length > 0,
      imagesToProcess: [],
      manifest: {},
      crossPlatformRoot: plugin.settings.rootDir.replace(/\\/gim, '/'),
      shouldAddCodeDependencies: false,
      externalManifest: false,
    };

    // if false the plugin shouldn't add any of it's own styles.

    if (typeof plugin.config.imageManifest === 'function') {
      // fetch the external manifest
      internal.externalManifest = true;
      internal.manifest = await plugin.config.imageManifest(plugin.config);
      console.log(`elderjs-plugin-images: loaded external manifest`);
    } else {
      const manifestLoc = path.join(plugin.settings.rootDir, plugin.config.imageManifest);
      if (fs.existsSync(manifestLoc)) {
        try {
          const manifest = fs.readFileSync(manifestLoc, { encoding: 'utf-8' });
          internal.manifest = JSON.parse(manifest);
        } catch (e) {
          console.log(e);
        }
      } else {
        console.log(`elderjs-plugin-images: no manifest found at ${manifestLoc}`);
      }
    }

    return { ...plugin, internal };
  },

  shortcodes: [
    {
      shortcode: 'picture',
      run: (payload) => {
        const plugin = payload.plugin as InitReturn;
        const { props, request } = payload;
        const { src, ...options } = props;

        if (!src) {
          throw new Error(`elderjs-plugin-images: picture shortcode requires src. ${JSON.stringify(request)}`);
        }

        if (!options.title && options.alt) {
          options.title = options.alt;
        }

        return plugin.internal.imageStore.picture(src, options);
      },
    },
  ],
  hooks: [
    {
      hook: 'bootstrap',
      name: 'processImages',
      description: 'Process images and update manifest if not using an external manifest.',
      priority: 100,
      run: async (payload) => {
        const settings = payload.settings;
        const plugin = payload.plugin as InitReturn;

        const folders = config.folders;
        if (folders.length > 0) {
          folders.forEach((folder) => {
            if (!folder.src || !folder.output) {
              throw new Error(
                `elderjs-plugin-images: Both src and output keys are required for the 'folders' object or array.`,
              );
            }
          });

          plugin.internal.imagesToProcess = folders.reduce((out, folder) => {
            fs.ensureDirSync(path.join(settings.distDir, folder.output));
            const files = glob.sync(path.join(settings.rootDir, folder.src + `.{${imageFileTypes.join(',')}}`));
            if (Array.isArray(files)) {
              files
                .filter((file) => !file.split('/').pop().includes('-ejs'))
                .forEach((file) => {
                  // fix manifest not found and wrong output folder when using **/*
                  const relGlob = file
                    .replace(plugin.internal.crossPlatformRoot, '')
                    .replace(file.split('/').pop(), '');

                  const crossPlatformFile = file.replace(plugin.internal.crossPlatformRoot, '');

                  const name = crossPlatformFile.replace(relGlob, '');

                  const rel = crossPlatformFile.replace(settings.rootDir, '').replace(relGlob, folder.output);

                  const [nameNoExt, ext] = name.split('.');

                  const [relNameNoExt] = rel.split('.');

                  const baseDir = path.join(settings.distDir, folder.output);
                  fs.ensureDirSync(baseDir);
                  out.push({
                    src: file,
                    rel,
                    ext,
                    publicPrefix: path.join(baseDir, nameNoExt),
                    cachePrefix:
                      config.cacheFolder &&
                      path.join(settings.rootDir, relNameNoExt.replace(folder.output, config.cacheFolder)),
                  });
                });
            }
            return out;
          }, []);
        }

        if (
          plugin.internal.imagesToProcess &&
          Array.isArray(plugin.internal.imagesToProcess) &&
          plugin.internal.imagesToProcess.length > 0
        ) {
          console.log(
            `elderjs-plugin-images: Processing ${plugin.internal.imagesToProcess.length} local source images.`,
          );

          const { scales, widths } = plugin.config;
          plugin.internal.manifest = await processImages({
            manifest: plugin.internal.manifest,
            images: plugin.internal.imagesToProcess,
            widths,
            scales,
            plugin,
            s3: plugin.config.s3,
            debug: plugin.config.debug,
          });

          if (!plugin.debug && typeof plugin.config.imageManifest === 'string') {
            fs.writeJsonSync(path.join(settings.rootDir, plugin.config.imageManifest), plugin.internal.manifest);
            console.log(`elderjs-plugin-images: Updated manifest.`);
          }

          return {
            plugin,
          };
        }
      },
    },
    {
      hook: 'bootstrap',
      name: 'processImages',
      description:
        'Populate image store and make it available on the plugin. Also make plugin internal helpers available.',
      priority: 99,
      run: async (payload) => {
        const helpers = payload.helpers;
        const plugin = payload.plugin as InitReturn;
        if (plugin.internal.manifest) {
          plugin.internal.imageStore = imageStore(plugin.internal.manifest, plugin);
          console.log(`elderjs-plugin-images: Done.`);

          return {
            helpers: {
              ...helpers,
              ...pluginHelpers,
              images: plugin.internal.imageStore,
            },
          };
        }
      },
    },
    {
      hook: 'bootstrap',
      name: 'processImages',
      description:
        'Populate image store and make it available on the plugin. Also make plugin internal helpers available.',
      priority: 99,
      run: async (payload) => {
        const settings = payload.settings;
        const plugin = payload.plugin as InitReturn;
        if (plugin.config.addVanillaLazy) {
          const vanillaLazyNodeModules = path.join(
            settings.rootDir,
            'node_modules',
            'vanilla-lazyload',
            'dist',
            'lazyload.min.js',
          );
          const vanillaLazyPublic = path.join(settings.distDir, plugin.config.vanillaLazyLocation);
          if (!fs.existsSync(vanillaLazyPublic)) {
            if (fs.existsSync(vanillaLazyNodeModules)) {
              fs.outputFileSync(vanillaLazyPublic, fs.readFileSync(vanillaLazyNodeModules, { encoding: 'utf-8' }));
            } else {
              throw new Error(`Unable to add vanillaLazy to public. Not found at ${vanillaLazyNodeModules}`);
            }
          }
        }
      },
    },
    {
      hook: 'request',
      name: 'resetPluginUsed',
      description:
        'The plugin maintains a state that needs to be reset each request in order to intelligently add css/js.',
      priority: 50,
      run: async (payload) => {
        const plugin = payload.plugin as InitReturn;
        plugin.internal.shouldAddCodeDependencies = false;
        return {
          plugin,
        };
      },
    },
    {
      hook: 'stacks',
      name: 'addElderPluginImagesCss',
      description: 'Adds default css to the css stack',
      priority: 50,

      run: async (payload) => {
        const cssStack = payload.cssStack;
        const plugin = payload.plugin as InitReturn;
        if (
          plugin.internal.shouldAddCodeDependencies &&
          plugin.internal.addStyles &&
          typeof plugin.config.cssString === 'string'
        ) {
          cssStack.push({
            source: 'elderPluginImages',
            string: plugin.config.cssString,
          });
          return {
            cssStack,
          };
        }
      },
    },
    {
      hook: 'stacks',
      name: 'elderPluginImagesManagevanillaLazy',
      description: 'Adds vanillaLazy and makes sure it is in the public folder if requested by plugin.',
      priority: 99, // we want it to be as soon as possible
      run: async (payload) => {
        const plugin = payload.plugin as InitReturn;
        const customJsStack = payload.customJsStack;
        if (config.addVanillaLazy && plugin.internal.shouldAddCodeDependencies) {
          customJsStack.push({
            source: 'elderjs-plugin-images',
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
                var ejsEl = findAncestor(element, 'ejs');
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
          
          </script>`,
            priority: 1,
          });
          return {
            customJsStack,
          };
        }
      },
    },
  ],
};

export default plugin;
