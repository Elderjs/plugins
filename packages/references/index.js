const plugin = {
  name: '@elderjs/plugin-references',
  description:
    'Adds {{ref}} and {{referenceList}} shortcodes to Elder.js allowing you to add wikipedia style references to your content.',
  init: (plugin) => {
    // used to store the data in the plugin's closure so it is persisted between loads
    plugin.references = {};
    return plugin;
  },
  config: {
    referenceListLabel: 'References: ',
  },
  shortcodes: [
    {
      shortcode: 'ref',
      run: ({ plugin, content, request }) => {
        const count = plugin.references[request.permalink].length + 1;
        plugin.references[request.permalink].push(`
        <li id='cite_note-${count}'>
        <cite>${content}</cite>
        <a href='#cite_ref-${count}' class='cite-ref-backlink' aria-label='Jump up to reference' title='Jump up to reference'>^</a>
      </li>`);
        return `<sup id='cite_ref-${count}' class='reference'><a href='#cite_note-${count}'>[${count}]</a></sup>`;
      },
    },
    {
      shortcode: 'referenceList',
      run: ({ plugin, props, request }) => {
        if (plugin.references[request.permalink] && plugin.references[request.permalink].length > 0) {
          return `<div class="references"><h4>${
            props.label || plugin.config.referenceListLabel
          }</h4><ol>${plugin.references[request.permalink].join('')}</ol></div>`;
        }
      },
    },
  ],
  hooks: [
    {
      hook: 'request',
      name: 'resetReferencesOnRequest',
      description: `If references aren't reset, the plugin will collect references between page loads.`,
      run: async ({ request, plugin }) => {
        //stored as such to prevent possible page.ts leakage. Unlikely but could happen.
        plugin.references[request.permalink] = [];
        return { plugin };
      },
    },
  ],
};

module.exports = plugin;
exports.default = plugin;
