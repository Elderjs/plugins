const fs = require('fs-extra');
const path = require('path');

const plugin = {
  name: 'elderjs-plugin-critical-path-css',
  description: `Easily generate critical path css for your Elder.js websites using [critical](https://github.com/addyosmani/critical).

  While Svelte does a great job of scoping CSS usually you'll have a site wide css file to hold common styles.
  
  If you're using a common css file and are optimizing for load speed, you'll want to defer the common css file and include critical path css. 
  
  This plugin generates the critical path css for each of your templates and automatically includes it in the head when generating the page.`,
  init: (plugin) => {
    //  plugin.config.rebuilding = true means allRequests will be overwritten.
    // if plugin.config.rebuilding = true is passed in it will force building if in build mode.
    plugin.internal = {
      cssFile: '',
      css: {},
      writeFolder: plugin.config.writeFolder || '',
      criticalPathCss: {},
      disable: plugin.config.disable,
      cssLocations: [],
    };

    if (!plugin.config.disable) {
      if (
        process.env.ELDER_REBUILD_CRITICAL_PATH &&
        String(process.env.ELDER_REBUILD_CRITICAL_PATH).toLowerCase() === 'true'
      ) {
        plugin.config.rebuild = true;
        plugin.config.rebuilding = true;
      }

      if (plugin.config.rebuilding === true) {
        if (plugin.settings.build && !plugin.settings.worker) {
          console.log(
            `Force rebuilding of critical path css because elder-plugin-critical-path-css.config.rebuilding = true in your elder.config.js`,
          );
          plugin.config.rebuilding = true;
        } else {
          console.warn(`Cannot force rebuild critical path css in server mode.`);
          plugin.config.rebuilding = false;
        }
      } else {
        plugin.config.rebuilding = false;
      }

      if (plugin.config.rebuild === true && !plugin.settings.build) {
        console.log(`Disabling elder-plugin-critical-path-css rebuild as it can only be used in build mode.`);
      }

      if (plugin.config.cssFile) {
        if (Array.isArray(plugin.config.cssFile)) {
          for (const file of plugin.config.cssFile) {
            const cssLocation = path.resolve(process.cwd(), file);
            if (fs.existsSync(cssLocation)) {
              plugin.internal.cssLocations.push(cssLocation);
            } else {
              console.log(`elder-plugin-critical-path-css could not find your css at ${cssLocation}.`);
              plugin.config.rebuilding = false;
            }
          }
        } else {
          plugin.config.rebuild = false;
          console.log(
            `elder-plugin-critical-path-css.config.cssFile in your elder.config.js should be a path to all of the css on your site relative to the root of your project.`,
          );
        }
      } else {
        const cssLocation = path.resolve(process.cwd(), plugin.config.cssFile);
        if (fs.existsSync(cssLocation)) {
          plugin.internal.cssLocations.push(cssLocation);
        } else {
          console.log(`elder-plugin-critical-path-css could not find your css at ${cssLocation}.`);
          plugin.config.rebuilding = false;
        }
      }

      if (plugin.config.rebuild === true && plugin.settings.build) {
        plugin.config.rebuilding = true;
      }

      if (plugin.config.rebuilding) {
        if (!plugin.config.writeFolder) {
          plugin.internal.writeFolder = path.resolve(process.cwd(), plugin.config.folder);
        }

        // ensure the folder exists
        fs.ensureDirSync(plugin.internal.writeFolder);

        // only log on master
        if (!plugin.settings.worker) {
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

    return plugin;
  },
  hooks: [
    {
      hook: 'bootstrap',
      name: 'collectCriticalPathCssForRoutes',
      description: `Collects the critical path css files that exist for routes.`,
      priority: 50,
      run: async ({ plugin, routes }) => {
        if (!plugin.internal.disable) {
          let collectedCssFiles = 0;
          plugin.internal.criticalPathCss = Object.keys(routes).reduce((out, cv) => {
            const file = path.resolve(process.cwd(), plugin.config.folder, `./${cv}.css`);
            if (fs.existsSync(file)) {
              collectedCssFiles += 1;
              out[cv] = fs.readFileSync(file);
            }

            return out;
          }, {});
          if (collectedCssFiles > 0) {
            return {
              plugin,
            };
          }
        }
      },
    },

    {
      hook: 'stacks',
      name: 'addCriticalPathCssToCssStack',
      description: `If a route has a critical path css file it adds it to the cssStack so it is included. Highest priority because css after it will overwrite the critical path css.`,
      priority: 1,
      run: async ({ plugin, request, cssStack }) => {
        if (!plugin.internal.disable) {
          const critCss = plugin.internal.criticalPathCss[request.route];
          if (critCss) {
            cssStack.push({
              source: 'hooksjs',
              string: critCss,
              priority: 1,
            });

            return { cssStack };
          } else {
            console.error(`No critical path for ${request.route}`);
          }
        }
      },
    },

    // above for including critical path css

    // below if for generating the critical path css
    {
      hook: 'allRequests',
      name: 'modifyAllRequestsForCriticalPath',
      description:
        'Collects the routes that Elder.js is aware of so that critical path css and rewrites the allRequests object so that only requests needed are built..',
      priority: 40,
      run: async ({ plugin, routes, allRequests }) => {
        let requestsForCritical = [];
        if (plugin.config.rebuilding && !plugin.internal.disable) {
          plugin.internal.css = Object.keys(routes).reduce((out, cv) => {
            out[cv] = [];
            return out;
          }, {});

          if (plugin.config.requests) {
            requestsForCritical = Object.keys(plugin.config.requests).reduce((out, cv) => {
              const arrWithRoute = plugin.config.requests[cv].map((r) => ({ ...r, route: cv }));
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

          plugin.internal.counts = requestsForCritical.reduce((out, cv) => {
            if (!{}.hasOwnProperty.call(out, cv)) out[cv.route] = 0;
            out[cv.route] += 1;
            return out;
          }, {});

          return {
            allRequests: requestsForCritical,
            plugin,
          };
        }
      },
    },

    {
      hook: 'requestComplete',
      name: 'extractCriticalPathCssForRoute',
      description: 'Regenerates critical path css for a route and saves it for inclusion in templates.',
      priority: 100, // we want it to be last so we have final html.
      run: async ({ htmlString, request, plugin, settings }) => {
        if (plugin.config.rebuilding === true && settings.worker && !plugin.internal.disable) {
          const critical = require('critical');
          const CleanCSS = require('clean-css');
          const crit = await critical.generate({
            ...plugin.config.critical,
            inline: false,
            html: htmlString,
            minify: false,
            css: plugin.internal.cssLocations,
          });

          plugin.internal.css[request.route].push(crit.css);
          if (plugin.internal.counts[request.route] === plugin.internal.css[request.route].length) {
            const routeCss = plugin.internal.css[request.route].reduce((out, cv) => out + cv, '');
            const routeCritical = new CleanCSS({ level: 2 }).minify(routeCss);
            fs.outputFileSync(path.join(plugin.internal.writeFolder, `${request.route}.css`), routeCritical.styles, {
              encoding: 'utf-8',
            });
          }

          return {
            plugin,
          };
        }
      },
    },
    {
      hook: 'buildComplete',
      name: 'killBuild',
      description: `The critical doesn't doesn't clean up it's child processes, so we need to exit them.`,
      priority: 100, // we want it to be last so we don't kill early.
      run: async ({ plugin }) => {
        if (plugin.config.rebuilding === true && !plugin.internal.disable) {
          process.exit(0);
        }
      },
    },
  ],
  config: {
    disable: false, // if for some reason you don't want the critical path css added when the file exists. Also disables building.
    rebuild: false, // rebuilding completely overwrites requests.
    folder: `./src/assets/critical/`, // relative to root of the project.
    requests: false, // used to specify the specific requests you want used for critical path css generation.
    critical: {
      penthouse: {
        forceInclude: [], // you can force include styles here '.btn' for example
        keepLargerMediaQueries: true,
      },
      dimensions: [
        {
          height: 500,
          width: 300,
        },
        {
          height: 900,
          width: 1280,
        },
      ],
    },
    cssFile: './src/assets/style.css',
  },
};

module.exports = plugin;
