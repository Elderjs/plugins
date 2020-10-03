const glob = require('glob');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs-extra');
const imageStore = require('./utils/imageStore');

const imageFileTypes = ['jpg', 'jpeg', 'png'];
const defaultWidths = [1280, 992, 768, 576, 400, 350, 200];
const defaultScales = [1, 2];

const plugin = {
  name: '@elderjs/plugin-images',
  description: 'Resizes images. ',
  init: (plugin) => {
    if (plugin.config.widths.length === 0) {
      plugin.config.widths = defaultWidths;
    }

    if (plugin.config.scales.length === 0) {
      plugin.config.scales = defaultScales;
    }

    // used to store the data in the plugin's closure so it is persisted between loads

    plugin.manifest = {};

    plugin.largestWidth = Math.max.apply(Math, plugin.config.widths);

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

      const requestedImages = folders.reduce((out, folder) => {
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

      plugin.requestedImages = requestedImages;
    }

    return plugin;
  },
  config: {
    folders: [
      {
        src: '/images/*', // where your original images are. Relative to rootDir/process.cwd() defined in your elder.config.js.
        output: '/images/', // where files should be put within the distDir defined in your elder.config.js.
      },
    ],
    widths: [], // Sizes the images will be resized to.
    fileTypes: ['webp'], // file types in addition to jpeg/png
    imageManifest: '/images/ejs-image-manifest.json', // relative to root dir
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
    .ejs .placeholder{position: absolute;top: 0;left: 0;width: 100%;height: 100%;display: block; z-index:9; background-repeat: no-repeat;
      background-size: cover;
    background-color: white;}x
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
  shortcodes: [
    {
      shortcode: 'picture',
      run: ({ props, plugin, request }) => {
        const { src, ...options } = {
          ...props,
        };

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
      description: 'Add parsed .md content and data to the data object',
      priority: 100,
      run: async ({ plugin, settings, helpers }) => {
        if (plugin.requestedImages) {
          const workerpool = require('workerpool');
          let resizeWorker = workerpool.pool(path.resolve(__dirname, './resizeWorker.js'));
          const { scales, widths } = plugin.config;

          console.log(`elderjs-plugin-image: Processing ${plugin.requestedImages.length} source images.`);

          let i = 0;

          const toProcess = [];
          const toProcessPlaceholders = [];
          const toProcessSvgs = [];

          for (const file of plugin.requestedImages) {
            const fileTypes = [...plugin.config.fileTypes];
            if (file.ext === 'png') {
              fileTypes.push(file.ext);
            } else if (file.ext === 'jpeg' || file.ext === 'jpg') {
              fileTypes.push('jpeg');
            }

            if (!plugin.manifest[file.rel]) {
              const original = await sharp(file.src).toBuffer({ resolveWithObject: true });
              plugin.manifest[file.rel] = {
                width: original.info.width,
                height: original.info.height,
                format: original.info.format,
                original: file.rel,
                sizes: [],
              };
            }

            // copy to public folder if it doesn't exist
            const publicFolderDest = `${file.publicPrefix}.${file.ext}`;
            if (!fs.existsSync(publicFolderDest)) {
              fs.copyFileSync(file.src, publicFolderDest);
            }

            const widthsToProcess = [...widths];

            // if original isn't wider, buid one with a max width of the original.
            if (plugin.manifest[file.rel].width < plugin.largestWidth) {
              widthsToProcess.push(plugin.manifest[file.rel].width);
            }

            for (const width of widthsToProcess) {
              if (plugin.manifest[file.rel].width < width) continue;
              for (const scale of scales) {
                if (plugin.manifest[file.rel].width < width * scale) continue;
                for (const fileType of fileTypes) {
                  // const resizeRelative = `${getPrefix(file.rel, file.publicPrefix)}${getSuffix(
                  //   width,
                  //   scale,
                  //   fileType,
                  // )}`;

                  // // check to make sure we don't need to resize this again.
                  // const sizeExsists = plugin.manifest[file.rel].sizes.find((size) => size.relative === resizeRelative);
                  // if (sizeExsists) continue;

                  const payload = [
                    file.rel,
                    file.src,
                    file.publicPrefix,
                    file.cachePrefix,
                    width,
                    scale,
                    fileType,
                    plugin.config.quality,
                  ];
                  toProcess.push(resizeWorker.exec('resize', payload));
                  i += 1;
                }
              }
            }

            if (plugin.config.placeholder) {
              if (!plugin.manifest[file.rel].placeholder) {
                const payload = [file.rel, file.src, JSON.stringify(plugin.config.placeholder)];
                toProcessPlaceholders.push(resizeWorker.exec('placeholder', payload));
              }
              if (plugin.config.svg && !plugin.manifest[file.rel].svg) {
                const payloadSvg = [
                  file.rel,
                  file.src,
                  file.publicPrefix,
                  file.cachePrefix,
                  JSON.stringify(plugin.config.svg),
                ];
                toProcessSvgs.push(resizeWorker.exec('svg', payloadSvg));
              }
            }
          }

          const processed = await Promise.all(toProcess);
          const placeholders = await Promise.all(toProcessPlaceholders);
          const svgs = await Promise.all(toProcessSvgs);

          await resizeWorker.terminate();
          processed.forEach(({ rel, ...resize }) => {
            if (!plugin.manifest[rel].sizes.find((size) => size.relative === resize.relative)) {
              plugin.manifest[rel].sizes.push(resize);
            }
          });

          placeholders.forEach(({ rel, placeholder, error }) => {
            if (error) throw error;
            plugin.manifest[rel].placeholder = placeholder;
          });

          svgs.forEach(({ rel, svg, error }) => {
            if (error) throw error;
            plugin.manifest[rel].svg = svg;
          });

          fs.writeJsonSync(path.join(settings.rootDir, plugin.config.imageManifest), plugin.manifest);
          console.log(`elderjs-plugin-image: Done. Updated manifest.`);

          plugin.imageStore = imageStore(plugin.manifest, plugin);
          return {
            helpers: {
              ...helpers,
              images: imageStore(plugin.manifest, plugin),
            },
            plugin,
          };
        }
      },
    },
    {
      hook: 'stacks',
      name: 'addElderPluginImagesCss',
      description: 'Adds default css to the css stack',
      priority: 50,

      run: async ({ cssStack, plugin }) => {
        cssStack.push({
          source: 'elderPluginImages',
          string: plugin.config.cssString,
        });
        return {
          cssStack,
        };
      },
    },
    {
      hook: 'stacks',
      name: 'elderPluginImagesManagevanillaLazy',
      description: 'Adds vanillaLazy and makes sure it is in the public folder if requested by plugin.',
      priority: 2, // we want it to be as soon as possible
      run: async ({ customJsStack, plugin, settings }) => {
        if (plugin.config.addVanillaLazy) {
          //node_modules/vanilla-lazyload/dist/lazyload.min.js
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
                if(ejs && ejs.childNodes[0] && ejs.childNodes[0].className.includes("placeholder")){
                  ejs.childNodes[0].classList.add('loaded');
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

module.exports = plugin;
exports.default = plugin;
