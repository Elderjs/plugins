/* eslint-disable node/no-unsupported-features/es-syntax */
const { Tester, defaultPreferences, rules } = require('@nickreese/seo-lint');
const fs = require('fs');
const path = require('path');
const url = require('url');

const notProd = process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'PRODUCTION';

const plugin = {
  name: 'elderjs-plugin-seo-check',
  description: 'Checks Elder.js generated HTML for common SEO issues.',
  init: (plugin) => {
    // used to store the data in the plugin's closure so it is persisted between loads
    let host;
    try {
      const parsed = new url.URL(plugin.settings.origin);
      if (parsed) {
        host = parsed.hostname;
      }
    } catch (e) {
      // invalid url.
    }

    plugin.tester = new Tester({
      display: plugin.config.display,
      siteWide: plugin.settings.context === 'build',
      host,
      preferences: plugin.config.preferences,
      rules: plugin.config.rules,
    });

    return plugin;
  },
  config: {
    display: ['errors', 'warnings'], // what level of reporting would you like.
    handleSiteResults: async ({ meta, ...results }) => {
      // 'results' represents all of the issues found for the site wide build.
      // power users can use this async function to post the issues to an endpoint or send an email
      // so that the content or marketing team can address the issues.
      if (Object.keys(results).length > 0) {
        console.log(results);
      } else {
        console.log(`No SEO issues detected.`);
      }
    },
    preferences: defaultPreferences, // define your own preferences.
    rules: rules, // define your own rules. This overwrites existing rules.
    // writeLocation: './report.json' // used to write a JSON report. Relative to the root.
  },
  hooks: [
    {
      hook: 'html',
      name: 'evaluateHtml',
      description: 'Check the elder.js response html for common SEO issues.',
      run: async ({ request, plugin, htmlString, settings }) => {
        if (notProd && settings.context !== 'build') {
          plugin.tester.reset();
          const results = await plugin.tester.test(htmlString, request.permalink);
          if (results.length > 0) {
            // eslint-disable-next-line node/no-unsupported-features/node-builtins
            console.table(results);
          }
        }
      },
    },
    {
      hook: 'buildComplete',
      name: 'siteWideSeoCheck',
      description: 'test',
      run: async ({ settings, plugin }) => {
        if (settings.context === 'build') {
          // destructure for below
          const { meta, ...results } = await plugin.tester.folder(settings.distDir);
          plugin.config.handleSiteResults({ meta, ...results });

          if (plugin.config.writeLocation && plugin.config.writeLocation.length > 0) {
            const parsedWL = path.parse(plugin.config.writeLocation);
            if (parsedWL.ext !== '.json') {
              throw new Error('writeLocation in config must write to a .json file.');
            }

            // make dir
            if (!fs.existsSync(parsedWL.dir)) {
              fs.mkdirSync(parsedWL.dir, { recursive: true });
            }

            if (Object.keys(results).length > 0) {
              fs.writeFileSync(
                plugin.config.writeLocation,
                JSON.stringify({ success: false, meta, results }, null, 2),
                {
                  encoding: 'utf-8',
                },
              );
            } else {
              fs.writeFileSync(plugin.config.writeLocation, JSON.stringify({ success: true, meta, results }, null, 2), {
                encoding: 'utf-8',
              });
            }
          }
        }
      },
    },
  ],
  defaultPreferences,
  rules,
};

module.exports = plugin;
