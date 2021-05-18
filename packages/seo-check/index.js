const path = require('path');
const fs = require('fs');
const { totalist } = require('totalist/sync');

const Tester = require('./Tester');
const rules = require('./rules');

const notProd = process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'PRODUCTION';

const getHtmlFiles = (path) => {
  const html = new Set();
  totalist(path, (name, abs, stats) => {
    if (/\.html$/.test(name)) {
      html.add(abs);
    }
  });
  return [...html];
};

const plugin = {
  name: 'elderjs-plugin-seo-check',
  description: 'Checks Elder.js generated HTML for common SEO issues.',
  init: (plugin) => {
    // used to store the data in the plugin's closure so it is persisted between loads

    plugin.tester = new Tester(rules, plugin.config.display, plugin.settings.context === 'build');

    return plugin;
  },
  config: {
    display: ['errors', 'warnings'], // what level of reporting would you like.
    handleSiteResults: async (results) => {
      // 'results' represents all of the issues found for the site wide build.
      // power users can use this async function to post the issues to an endpoint or send an email
      // so that the content or marketing team can address the issues.
      if (Object.keys(results).length > 0) {
        console.log(results);
      } else {
        console.log(`No SEO issues detected.`);
      }
    },
  },
  hooks: [
    {
      hook: 'html',
      name: 'evaluateHtml',
      description: 'Check the elder.js response html for common SEO issues.',
      run: async ({ request, plugin, htmlString, settings }) => {
        if (notProd && settings.context !== 'build') {
          await plugin.tester.test(htmlString, request.permalink);
        }
      },
    },
    {
      hook: 'buildComplete',
      name: 'siteWideSeoCheck',
      description: 'test',
      run: async ({ settings, plugin, allRequests }) => {
        if (settings.context === 'build') {
          const files = getHtmlFiles(`${settings.distDir}`);

          for (let i = 0; i < files.length; i++) {
            const file = files[i];

            const html = fs.readFileSync(path.resolve(file), { encoding: 'utf-8' });

            const relPermalink = file.replace('index.html', '').replace(settings.distDir, '');
            await plugin.tester.test(html, relPermalink);
          }

          const results = await plugin.tester.siteResults();

          plugin.config.handleSiteResults(results);
        }
      },
    },
  ],
};

module.exports = plugin;
