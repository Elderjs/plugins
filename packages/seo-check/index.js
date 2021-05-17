const Tester = require('./Tester');
const rules = require('./rules');

const notProd = process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'PRODUCTION';
const plugin = {
  name: 'elderjs-plugin-seo-check',
  description: 'Checks Elder.js generated HTML for common SEO issues.',
  init: (plugin) => {
    // used to store the data in the plugin's closure so it is persisted between loads

    plugin.test = new Tester(rules, plugin.config.display, plugin.settings.build);

    return plugin;
  },
  config: {
    display: ['errors', 'warnings'],
  },
  hooks: [
    {
      hook: 'html',
      name: 'evaluateHtml',
      description: 'Lints the elder.js response html',
      run: async ({ request, plugin, htmlString }) => {
        if (notProd) {
          await plugin.test(htmlString, request.permalink);
        }
      },
    },
  ],
};

module.exports = plugin;
