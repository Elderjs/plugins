import fg from 'fast-glob';
import path from 'path';
import fs from 'fs';
import remarkHtml from 'remark-html';
import remarkSlug from 'remark-slug';

import extractFrontmatter from 'remark-extract-frontmatter';
import remarkFrontmatter from 'remark-frontmatter';
import yaml from 'yaml';

import remarkGfm from 'remark-gfm';

import { PluginOptions, PluginInitPayload } from '@elderjs/elderjs';

import prepareMarkdownParser from './utils/prepareMarkdownParser.js';
import createMarkdownStore, { Ret } from './utils/markdownStore.js';
import rehypeShiki from './utils/rehype-shiki.js';
import tableOfContents from './utils/tableOfContents.js';

type InitFn = PluginInitPayload & { config: typeof config };
type InitReturn = InitFn & { internal: ElderjsMarkdownPluginInternal };

type Config = {
  routes: string[];
  contents: Record<string, string>;
  remarkPlugins: (unknown | unknown[])[];
  useTableOfContents: boolean;
  createRoutes: boolean;
  useElderJsPluginImages: boolean;
  useSyntaxHighlighting: boolean;
  useGitHubFriendlyMarkdown: boolean;
  slugFormatter?: (relativePath: string, frontmatter: unknown) => string;
};

const config: Config = {
  routes: [],
  remarkPlugins: [], // if you define your own, you must define remarkHtml another html parser or you'll have issues. Order matters here.
  useElderJsPluginImages: true, // if you are using the @elderjs/plugin-images it will replace all markdown images with the {{picture src="" alt="" /}} shortcode.
  useSyntaxHighlighting: false, // available themes: https://github.com/shikijs/shiki/blob/main/docs/themes.md - try dark-plus.
  //theme is the only option available - for now.
  useTableOfContents: false, // adds tocTree and tocHtml to each route's data object.
  useGitHubFriendlyMarkdown: false, // adds support for GFM (autolink literals, strikethrough, tables, tasklists).
  createRoutes: true, // creates routes in allRequests based on collected md files.
  contents: {},
};

export interface ElderjsMarkdownPluginInternal {
  markdown: Record<string, Ret[]>;
  requests: { slug: string; route: string }[];
  config: typeof config;
  markdownParser: ReturnType<typeof prepareMarkdownParser>;
  usesImagePlugin: boolean;
  shortcodes: {
    openPattern: string;
    closePattern: string;
  };
}

export async function bootstrap({ helpers, plugin, settings }) {
  const internal = plugin.internal as ElderjsMarkdownPluginInternal;

  if (internal.config && Array.isArray(internal.config.routes) && internal.config.routes.length > 0) {
    for (const route of internal.config.routes) {
      internal.markdown[route] = [];
      const contentPath = internal.config.contents[route] || null;
      let mdsInRoute = path.resolve(settings.srcDir, './routes/', route);
      if (contentPath) {
        mdsInRoute = path.resolve(settings.rootDir, contentPath);
        if (!fs.existsSync(mdsInRoute)) {
          throw new Error(`elderjs-plugin-markdown: Unable to find path ${mdsInRoute}`);
        }
      }

      const mdFiles = fg.sync(`${mdsInRoute}/**/*.md`);

      for (const file of mdFiles) {
        const markdown = await createMarkdownStore({
          root: mdsInRoute,
          file,
          parser: internal.markdownParser,
          useImagePlugin: internal.usesImagePlugin,
          shortcodes: internal.shortcodes,
          slug: internal.config.slugFormatter,
        });
        internal.markdown[route].push(markdown);
      }

      // if there is a date in frontmatter, sort them by most recent
      const haveDates = internal.markdown[route].reduce((out, cv) => {
        return out && !!cv.frontmatter && !!cv.frontmatter.date;
      }, true);

      if (haveDates) {
        internal.markdown[route] = internal.markdown[route].sort(
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          /// @ts-expect-error
          (a, b) => new Date(b.frontmatter.date) - new Date(a.frontmatter.date),
        );
      }
    }

    // Remove drafts on production. Add DRAFT: to the title on dev.
    Object.keys(internal.markdown).forEach((route) => {
      if (process.env.NODE_ENV === 'production') {
        internal.markdown[route] = internal.markdown[route].filter(
          (md) => !md.frontmatter.draft && md.slug.indexOf('draft-') !== 0,
        );
      } else {
        internal.markdown[route].forEach((md) => {
          if (md.frontmatter.draft || md.slug.indexOf('draft') === 0) {
            md.frontmatter.title = `DRAFT: ${md.frontmatter.title || 'MISSING TITLE'}`;
          }
        });
      }
    });

    // loop through object to create requests
    Object.keys(internal.markdown).forEach((route) => {
      internal.markdown[route].forEach((md) => {
        internal.requests.push({ slug: md.slug, route });
      });
    });
  }

  return {
    helpers: {
      ...helpers,
      markdownParser: internal.markdownParser,
    },
  };
}

const remarkPlugins = [
  remarkFrontmatter,
  [extractFrontmatter, { name: 'frontmatter', yaml: yaml.parse }],
  remarkSlug,
  [remarkHtml, { sanitize: false }],
];

const plugin: PluginOptions = {
  name: '@elderjs/plugin-markdown',
  minimumElderjsVersion: '1.7.5',
  description:
    'Reads and collects markdown content from specified routes. It automatically adds found markdown files as requests on allRequests. Includes a shortcode parser.',
  init: async (plugin: InitFn): Promise<InitReturn> => {
    // pick up configurations before defining the internal config.
    const initialConfig: Config = plugin.config;
    if (initialConfig.remarkPlugins.length === 0) {
      initialConfig.remarkPlugins = remarkPlugins;
    }
    if (initialConfig.useSyntaxHighlighting) {
      let rehypeShikiConfig = {};
      if (typeof initialConfig.useSyntaxHighlighting !== 'boolean') {
        rehypeShikiConfig = initialConfig.useSyntaxHighlighting;
      }
      initialConfig.remarkPlugins.push([rehypeShiki, rehypeShikiConfig]);
    }
    if (initialConfig.useTableOfContents) {
      initialConfig.remarkPlugins.push(tableOfContents);
    }
    if (initialConfig.useGitHubFriendlyMarkdown) {
      let gfmConfig = {};
      if (typeof initialConfig.useGitHubFriendlyMarkdown !== 'boolean') {
        gfmConfig = initialConfig.useGitHubFriendlyMarkdown;
      }
      initialConfig.remarkPlugins.push([remarkGfm, gfmConfig]);
    }

    const internal: ElderjsMarkdownPluginInternal = {
      config: initialConfig,
      markdown: {},
      requests: [],
      markdownParser: prepareMarkdownParser(initialConfig.remarkPlugins),
      usesImagePlugin:
        plugin.settings.plugins['@elderjs/plugin-images'] && initialConfig.useElderJsPluginImages ? true : false,
      shortcodes: plugin.settings.shortcodes,
    };

    return { ...plugin, internal };
  },
  config,
  shortcodes: [],
  hooks: [
    {
      hook: 'bootstrap',
      name: 'processMarkdownAddHelpers',
      description:
        'Processes all markdown files and adds markdown parser to helpers so that it can be used other Elder.js plugins, user defined hooks, or in templates. ',
      priority: 99,
      run: bootstrap,
    },

    {
      hook: 'bootstrap',
      name: 'addMdFilesToDataObject',
      description: 'Add parsed .md content and data to the data object',
      priority: 99,
      run: async ({ data, plugin }) => {
        const internal = plugin.internal as ElderjsMarkdownPluginInternal;
        if (internal.config.routes.length > 0) {
          return {
            data: { ...data, markdown: internal.markdown },
          };
        }
      },
    },
    {
      hook: 'allRequests',
      name: 'mdFilesToAllRequests',
      description:
        'Add collected md files to allRequests array using the frontmatter slug or filename as the slug. Users can modify the plugin. requests before this hook to change generated requests.',
      priority: 50, // default
      run: async ({ allRequests, plugin }) => {
        const internal = plugin.internal as ElderjsMarkdownPluginInternal;
        if (internal.config.routes.length > 0 && internal.config.createRoutes) {
          return {
            allRequests: [...allRequests, ...internal.requests],
          };
        }
      },
    },
    {
      hook: 'data',
      name: 'addFrontmatterAndHtmlToDataForRequest',
      description: 'Adds parsed frontmatter and html to the data object for the specific request.',
      priority: 50,
      run: async ({ request, data }) => {
        if (data.markdown && data.markdown[request.route]) {
          const markdown = data.markdown[request.route].find((m) => m.slug === request.slug);
          if (markdown) {
            await markdown.compileHtml();
            const { html, frontmatter, data: addToData } = markdown;

            return {
              data: {
                ...data,
                ...addToData,
                html,
                frontmatter,
              },
            };
          }
        }
      },
    },
  ],
  remarkPlugins,
};

export default plugin;
