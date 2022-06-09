import { PluginOptions, PluginInitPayload } from '@elderjs/elderjs';

interface ElderjsPluginInternal {
  references: Record<string, string[]>;
  config: typeof config;
}

type InitFn = PluginInitPayload & { config: typeof config };
type InitReturn = InitFn & { internal: ElderjsPluginInternal };

const config = {
  referenceListLabel: 'References: ',
};

const plugin: PluginOptions = {
  name: '@elderjs/plugin-references',
  minimumElderjsVersion: '1.7.5',
  description:
    'Adds {{ref}} and {{referenceList}} shortcodes to Elder.js allowing you to add wikipedia style references to your content.',
  init: (plugin: InitFn): InitReturn => {
    // used to store the data in the plugin's closure so it is persisted between loads
    const internal: ElderjsPluginInternal = {
      references: {},
      config: plugin.config,
    };
    return { ...plugin, internal };
  },
  config,
  shortcodes: [
    {
      shortcode: 'ref',
      run: ({ content, request, plugin }) => {
        const internal = plugin.internal as ElderjsPluginInternal;
        const count = internal.references[request.permalink].length + 1;
        internal.references[request.permalink].push(`
        <li id='cite_note-${count}'>
        <cite>${content}</cite>
        <a href='#cite_ref-${count}' class='cite-ref-backlink' aria-label='Jump up to reference' title='Jump up to reference'>^</a>
      </li>`);
        return `<sup id='cite_ref-${count}' class='reference'><a href='#cite_note-${count}'>[${count}]</a></sup>`;
      },
    },
    {
      shortcode: 'referenceList',
      run: ({ props, request, plugin }) => {
        const internal = plugin.internal as ElderjsPluginInternal;
        if (internal.references[request.permalink] && internal.references[request.permalink].length > 0) {
          return `<div class="references"><h4>${
            props.label || internal.config.referenceListLabel
          }</h4><ol>${internal.references[request.permalink].join('')}</ol></div>`;
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
        const internal = plugin.internal as ElderjsPluginInternal;
        //stored as such to prevent possible page.ts leakage. Unlikely but could happen.
        internal.references[request.permalink] = [];
        return { plugin };
      },
    },
  ],
};

export default plugin;
