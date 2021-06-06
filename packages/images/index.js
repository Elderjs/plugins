/* eslint-disable node/no-unsupported-features/es-syntax */
const glob = require('glob');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs-extra');
const imageStore = require('./utils/imageStore');
const pluginHelpers = require('./utils/helpers');

const imageFileTypes = ['jpg', 'jpeg', 'png'];
const defaultWidths = [1280, 992, 768, 576, 400, 350, 200];
const defaultScales = [1, 2];

// images = [
// {
//     src,           // file path or buffer
//     rel,           // the relative url where the image will be found on the site.
//     ext,           // extension
//     publicPrefix,  // used for writing/reading to the public folder.
//     cachePrefix,   // used for writing/reading to the cache folder.
//   }
// ]

// allows for processImages to be used by other packages to upload to s3 and still get Elder.js Image support.
// s3: {
//   AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
//   AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
//   S3_BUCKET: process.env.S3_BUCKET,
//   S3_BUCKET_URL: process.env.S3_BUCKET_URL,
// },

// extracted so that it can accept a buffer and be used in other contexts via importing.
const processImages = async ({
  manifest = {},
  images = [],
  widths = defaultWidths,
  scales = defaultScales,
  s3,
  debug,
}) => {
  try {
    const WorkerNodes = require('worker-nodes');

    const workerSettings = {
      maxTasksPerWorker: 5,
    };

    const svgWorker = new WorkerNodes(path.resolve(__dirname, './workers/svg.js'), workerSettings);
    const placeholderWorker = new WorkerNodes(path.resolve(__dirname, './workers/placeholder.js'), workerSettings);
    const originalS3Worker = new WorkerNodes(path.resolve(__dirname, './workers/saveOriginalToS3.js'), {
      ...workerSettings,
      autoStart: false,
    });
    const resizeWorker = new WorkerNodes(path.resolve(__dirname, './workers/resize.js'), workerSettings);

    const largestWidth = Math.max.apply(Math, widths);

    const toProcess = [];
    const toProcessPlaceholders = [];
    const toProcessSvgs = [];

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
        if (plugin.config.svg && !manifest[file.rel].svg) {
          toProcessSvgs.push(svgWorker.call({ ...file, options: plugin.config.svg, debug }));
        }
      }
    }

    const processed = await Promise.all(toProcess);
    const placeholders = await Promise.all(toProcessPlaceholders);
    const svgs = await Promise.all(toProcessSvgs);

    await svgWorker.terminate();
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

    svgs.forEach(({ rel, svg, error }) => {
      if (error) throw error;
      manifest[rel].svg = svg;
    });

    if (debug) console.log('Generated Manifest', manifest);

    return manifest;
  } catch (e) {
    console.error(e);
    return {};
  }
};

const plugin = {
  name: '@elderjs/plugin-images',
  description: 'Resizes images. ',
  config: {
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
    svg: false,
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
  },
  init: async (plugin) => {
    plugin.externalManifest = false;

    if (plugin.config.widths.length === 0) {
      plugin.config.widths = defaultWidths;
    }

    if (plugin.config.scales.length === 0) {
      plugin.config.scales = defaultScales;
    }

    // if false the plugin shouldn't add any of it's own styles.
    plugin.addStyles = typeof plugin.cssString === 'string' && plugin.cssString.length > 0;

    plugin.imagesToProcess = []; // no images to process by default
    plugin.manifest = {};

    if (typeof plugin.config.imageManifest === 'function' || (plugin.init && typeof plugin.init.then === 'function')) {
      // fetch the external manifest
      plugin.externalManifest = true;
      plugin.manifest = await plugin.config.imageManifest(plugin.config);
      console.log(`elderjs-plugin-images: loaded external manifest`);
    } else {
      const manifestLoc = path.join(plugin.settings.rootDir, plugin.config.imageManifest);
      if (fs.existsSync(manifestLoc)) {
        try {
          const manifest = fs.readFileSync(manifestLoc, { encoding: 'utf-8' });
          plugin.manifest = JSON.parse(manifest);
        } catch (e) {
          console.log(e);
        }
      } else {
        console.log(`elderjs-plugin-images: no manifest found at ${manifestLoc}`);
      }

      let folders = plugin.config.folders;
      if (folders.length > 0) {
        folders.forEach((folder) => {
          if (!folder.src || !folder.output) {
            throw new Error(
              `elderjs-plugin-images: Both src and output keys are required for the 'folders' object or array.`,
            );
          }
        });
        plugin.crossPlatformRoot = plugin.settings.rootDir.replace(/\\/gim, '/');

        const imagesToProcess = folders.reduce((out, folder) => {
          const relGlob = folder.src.replace('.', '').replace(/\*/g, '');

          fs.ensureDirSync(path.join(plugin.settings.distDir, folder.output));
          const files = glob.sync(path.join(plugin.settings.rootDir, folder.src));
          if (Array.isArray(files)) {
            files
              .filter((file) => imageFileTypes.includes(file.split('.').pop().toLowerCase()))
              .filter((file) => !file.split('/').pop().includes('-ejs'))
              .forEach((file) => {
                const crossPlatformFile = file.replace(plugin.crossPlatformRoot, '');

                const name = crossPlatformFile.replace(relGlob, '');

                const rel = crossPlatformFile.replace(plugin.settings.rootDir, '').replace(relGlob, folder.output);

                const [nameNoExt, ext] = name.split('.');

                const [relNameNoExt] = rel.split('.');

                const baseDir = path.join(plugin.settings.distDir, folder.output);
                fs.ensureDirSync(baseDir);
                out.push({
                  src: file,
                  rel,
                  ext,
                  publicPrefix: path.join(baseDir, nameNoExt),
                  cachePrefix:
                    plugin.config.cacheFolder &&
                    path.join(plugin.settings.rootDir, relNameNoExt.replace(folder.output, plugin.config.cacheFolder)),
                });
              });
          }
          return out;
        }, []);

        plugin.imagesToProcess = imagesToProcess;
      }
    }

    plugin.shouldAddCodeDependencies = false;

    return plugin;
  },

  shortcodes: [
    {
      shortcode: 'picture',
      run: ({ props, plugin, request }) => {
        const { src, ...options } = props;

        if (!src) {
          throw new Error(`elderjs-plugin-images: picture shortcode requires src. ${JSON.stringify(request)}`);
        }

        if (!options.title && options.alt) {
          options.title = options.alt;
        }

        return plugin.imageStore.picture(src, options);
      },
    },
  ],
  hooks: [
    {
      hook: 'bootstrap',
      name: 'processImages',
      description: 'Process images and update manifest if not using an external manifest.',
      priority: 100,
      run: async ({ plugin, settings }) => {
        if (plugin.imagesToProcess && Array.isArray(plugin.imagesToProcess) && plugin.imagesToProcess.length > 0) {
          console.log(`elderjs-plugin-images: Processing ${plugin.imagesToProcess.length} local source images.`);

          const { scales, widths } = plugin.config;
          plugin.manifest = await processImages({
            manifest: plugin.manifest,
            images: plugin.imagesToProcess,
            widths,
            scales,
            s3: plugin.config.s3,
            debug: plugin.config.debug,
          });

          if (!plugin.debug) {
            fs.writeJsonSync(path.join(settings.rootDir, plugin.config.imageManifest), plugin.manifest);
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
      run: async ({ plugin, helpers }) => {
        if (plugin.manifest) {
          plugin.imageStore = imageStore(plugin.manifest, plugin);
          console.log(`elderjs-plugin-images: Done.`);

          return {
            helpers: {
              ...helpers,
              ...pluginHelpers,
              images: plugin.imageStore,
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
      run: async ({ plugin, settings }) => {
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
      run: async ({ plugin }) => {
        plugin.shouldAddCodeDependencies = false;
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

      run: async ({ cssStack, plugin }) => {
        if (plugin.shouldAddCodeDependencies && plugin.addStyles) {
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
      run: async ({ customJsStack, plugin, settings }) => {
        if (plugin.config.addVanillaLazy && plugin.shouldAddCodeDependencies) {
          customJsStack.push({
            source: 'elderjs-plugin-images',
            string: `<script>

            function findAncestor (el, cls) {
              if(!cls) return false;
              while ((el = el.parentElement) && !el.classList.contains(cls));
              return el;
            }

            // window.lazyLoadOptions ={}
          var vanillaLazyLoad = document.createElement("script");
          vanillaLazyLoad.src = "${plugin.config.vanillaLazyLocation}";
          vanillaLazyLoad.rel = "preload";
          vanillaLazyLoad.onload = function() {
            var ll = new LazyLoad({
              callback_loaded: function (element) {
                var ejs = findAncestor(element, 'ejs');
                if(ejs){
                  var elements = ejs.getElementsByClassName("placeholder");
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
  processImages,
};

module.exports = plugin;
exports.default = plugin;
