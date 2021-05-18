const { Tester } = require('@nickreese/seo-lint');

const notProd = process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'PRODUCTION';

const plugin = {
  name: 'elderjs-plugin-seo-check',
  description: 'Checks Elder.js generated HTML for common SEO issues.',
  init: (plugin) => {
    // used to store the data in the plugin's closure so it is persisted between loads

    plugin.tester = new Tester({
      display: plugin.config.display,
      siteWide: plugin.settings.context === 'build',
    });

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
          const results = await plugin.tester.folder(settings.distDir);
          plugin.config.handleSiteResults(results);
        }
      },
    },
  ],
};

module.exports = plugin;
