import { PluginOptions, PluginInitPayload, PluginClosure } from '@elderjs/elderjs';

export interface ElderjsPlugin {
  references: Record<string, string[]>;
}

type HookPlugin = PluginClosure & ElderjsPlugin;

const config = {
  referenceListLabel: 'References: ',
};

const plugin: PluginOptions = {
  name: '@elderjs/plugin-references',
  minimumElderjsVersion: '1.7.5',
  description:
    'Adds {{ref}} and {{referenceList}} shortcodes to Elder.js allowing you to add wikipedia style references to your content.',
  init: (plugin: PluginInitPayload & { config: typeof config }): PluginInitPayload & ElderjsPlugin => {
    // used to store the data in the plugin's closure so it is persisted between loads
    const internal: ElderjsPlugin = {
      references: {},
    };
    return { ...plugin, ...internal };
  },
  config,
  shortcodes: [
    {
      shortcode: 'ref',
      run: ({ content, request, ...rest }) => {
        const plugin = rest.plugin as HookPlugin;

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
      run: ({ props, request, ...rest }) => {
        const plugin = rest.plugin as HookPlugin;
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
      run: async ({ request, ...rest }) => {
        const plugin = rest.plugin as HookPlugin;
        //stored as such to prevent possible page.ts leakage. Unlikely but could happen.
        plugin.references[request.permalink] = [];
        return { plugin };
      },
    },
  ],
};

export default plugin;
