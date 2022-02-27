const glob = require('glob');
const path = require('path');
const fs = require('fs');
const remarkHtml = require('remark-html');
const remarkSlug = require('remark-slug');

const prepareMarkdownParser = require('./utils/prepareMarkdownParser');
const createMarkdownStore = require('./utils/markdownStore');

const extractFrontmatter = require('remark-extract-frontmatter');
const remarkFrontmatter = require('remark-frontmatter');
const yaml = require('yaml').parse;

const remarkPlugins = [
  remarkFrontmatter,
  [extractFrontmatter, { name: 'frontmatter', yaml: yaml }],
  remarkSlug,
  [remarkHtml, { sanitize: false }],
];

const plugin = {
  name: '@elderjs/plugin-markdown',
  description:
    'Reads and collects markdown content from specified routes. It automatically adds found markdown files as requests on allRequests. Includes a shortcode parser.',
  init: async (plugin) => {
    // used to store the data in the plugin's closure so it is persisted between loads
    plugin.markdown = {};
    plugin.requests = [];

    plugin.references = {};

    if (plugin.config.remarkPlugins.length === 0) {
      plugin.config.remarkPlugins = remarkPlugins;
    }

    if (plugin.config.useSyntaxHighlighting) {
      const rehypeShiki = require('./rehype-shiki');
      let rehypeShikiConfig = {};
      if (typeof plugin.config.useSyntaxHighlighting !== 'boolean') {
        rehypeShikiConfig = plugin.config.useSyntaxHighlighting;
      }
      plugin.config.remarkPlugins.push([rehypeShiki, rehypeShikiConfig]);
    }

    if (plugin.config.useTableOfContents) {
      const tableOfContents = require('./utils/tableOfContents');
      plugin.config.remarkPlugins.push(tableOfContents);
    }

    plugin.markdownParser = prepareMarkdownParser(plugin.config.remarkPlugins);

    if (plugin.config && Array.isArray(plugin.config.routes) && plugin.config.routes.length > 0) {
      for (const route of plugin.config.routes) {
        plugin.markdown[route] = [];
        const contentPath = plugin.config.contents[route] || null;
        let mdsInRoute = path.resolve(plugin.settings.srcDir, './routes/', route);
        if (contentPath) {
          mdsInRoute = path.resolve(plugin.settings.rootDir, contentPath);
          if (!fs.existsSync(mdsInRoute)) {
            throw new Error(`elderjs-plugin-markdown: Unable to find path ${mdsInRoute}`);
          }
        }

        const mdFiles = glob.sync(`${mdsInRoute}/**/*.md`);

        for (const file of mdFiles) {
          const markdown = createMarkdownStore({
            root: mdsInRoute,
            file,
            parser: plugin.markdownParser,
            useImagePlugin: plugin.settings.plugins['@elderjs/plugin-images'] && plugin.config.useElderJsPluginImages,
            shortcodes: plugin.settings.shortcodes,
            slug: plugin.config.slugFormatter,
          });
          await markdown.prepareSlug();
          plugin.markdown[route].push(markdown);
        }

        // NOTE: frontmatter is prepared after preparing slug
        // if there is a date in frontmatter, sort them by most recent
        const haveDates = plugin.markdown[route].reduce((out, cv) => {
          return out && !!cv.frontmatter && !!cv.frontmatter.date;
        }, true);

        if (haveDates) {
          plugin.markdown[route] = plugin.markdown[route].sort(
            (a, b) => new Date(b.frontmatter.date) - new Date(a.frontmatter.date),
          );
        }
      }

      // Remove drafts on production. Add DRAFT: to the title on dev.
      Object.keys(plugin.markdown).forEach((route) => {
        if (process.env.NODE_ENV === 'production') {
          plugin.markdown[route] = plugin.markdown[route].filter(
            (md) => !md.frontmatter.draft && md.slug.indexOf('draft-') !== 0,
          );
        } else {
          plugin.markdown[route].forEach((md) => {
            if (md.frontmatter.draft || md.slug.indexOf('draft') === 0) {
              md.frontmatter.title = `DRAFT: ${md.frontmatter.title || 'MISSING TITLE'}`;
            }
          });
        }
      });

      // loop through object to create requests
      Object.keys(plugin.markdown).forEach((route) => {
        plugin.markdown[route].forEach((md) => {
          plugin.requests.push({ slug: md.slug, route });
        });
      });
    }

    return plugin;
  },
  config: {
    routes: [],
    remarkPlugins: [], // if you define your own, you must define remarkHtml another html parser or you'll have issues. Order matters here.
    useElderJsPluginImages: true, // if you are using the @elderjs/plugin-images it will replace all markdown images with the {{picture src="" alt="" /}} shortcode.
    useSyntaxHighlighting: false, // available themes: https://github.com/shikijs/shiki/blob/main/docs/themes.md - try dark-plus.
    //theme is the only option available - for now.
    useTableOfContents: false, // adds tocTree and tocHtml to each route's data object.
    createRoutes: true, // creates routes in allRequests based on collected md files.
    contents: {},
  },
  shortcodes: [],
  hooks: [
    {
      hook: 'bootstrap',
      name: 'addMarkdownParserToHelpers',
      description:
        'Adds markdown parser to helpers so that it can be used other Elder.js plugins, user defined hooks, or in templates. ',
      priority: 99,
      run: async ({ helpers, plugin }) => {
        return {
          helpers: {
            ...helpers,
            markdownParser: plugin.markdownParser,
          },
        };
      },
    },

    {
      hook: 'bootstrap',
      name: 'addMdFilesToDataObject',
      description: 'Add parsed .md content and data to the data object',
      priority: 99,
      run: async ({ data, plugin }) => {
        if (plugin.config.routes.length > 0) {
          return {
            data: { ...data, markdown: plugin.markdown },
          };
        }
      },
    },
    {
      hook: 'allRequests',
      name: 'mdFilesToAllRequests',
      description:
        'Add collected md files to allRequests array using the frontmatter slug or filename as the slug. Users can modify the plugin.requests before this hook to change generated requests.',
      priority: 50, // default
      run: async ({ allRequests, plugin }) => {
        if (plugin.config.routes.length > 0 && plugin.config.createRoutes) {
          return {
            allRequests: [...allRequests, ...plugin.requests],
          };
        }
      },
    },
    {
      hook: 'request',
      name: 'resetReferencesOnRequest',
      description: `If references aren't reset, the plugin will collect references between page loads.`,
      run: async ({ request, plugin }) => {
        plugin.references[request.permalink] = [];
        return { plugin };
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
            await markdown.prepareHtml();
            let { html, frontmatter, data: addToData } = markdown;

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

module.exports = plugin;
exports.default = plugin;
