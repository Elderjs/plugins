const glob = require('glob');
const path = require('path');
const fs = require('fs');
const remarkHtml = require('remark-html');
const remarkSlug = require('remark-slug');

const prepareMarkdownParser = require('./utils/prepareMarkdownParser');

const extractFrontmatter = require('remark-extract-frontmatter');
const remarkFrontmatter = require('remark-frontmatter');
const yaml = require('yaml').parse;

const remarkPlugins = [
  remarkFrontmatter,
  [extractFrontmatter, { name: 'frontmatter', yaml: yaml }],
  remarkSlug,
  remarkHtml,
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

    const { openPattern, closePattern } = plugin.settings.shortcodes;

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
        const mdsInRoute = path.resolve(plugin.settings.srcDir, './routes/', route);
        const mdFiles = glob.sync(`${mdsInRoute}/**/*.md`);

        for (const file of mdFiles) {
          let md = fs.readFileSync(file, 'utf-8');

          // replace md images if image plugin is being used
          if (plugin.settings.plugins['@elderjs/plugin-images'] && plugin.config.useElderJsPluginImages) {
            const MDImgRegex = /!\[([A-Za-z-_ \d]*)\]\(([^)]*)\)/gm;
            let match;
            while ((match = MDImgRegex.exec(md)) !== null) {
              const [fullMatch, alt, src] = match;
              md = md.replace(
                fullMatch,
                `<div class="md-img">${openPattern}picture alt="${alt}" src="${src}" /${closePattern}</div>`,
              );
            }
          }

          const {
            contents: html,
            data: { frontmatter, ...data },
          } = await plugin.markdownParser.process(md);
          let slug;

          if (plugin.config.slugFormatter && typeof plugin.config.slugFormatter === 'function') {
            let relativePath = file.replace(`${mdsInRoute}/`, '');
            slug = plugin.config.slugFormatter(relativePath, frontmatter);
          }
          if (typeof slug !== 'string') {
            if (frontmatter && frontmatter.slug) {
              slug = frontmatter.slug;
            } else {
              slug = file.replace('.md', '').split('/').pop();
              if (slug.includes(' ')) {
                slug = slug.replace(/ /gim, '-');
              }
            }
          }
          plugin.markdown[route].push({
            slug,
            frontmatter,
            html,
            data,
          });
          plugin.requests.push({ slug, route });
        }

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
    }

    return plugin;
  },
  config: {
    routes: [],
    remarkPlugins: [], // if you define your own, you must define remarkHtml another html parser or you'll have issues. Order matters here.
    useElderJsPluginImages: true, // if you are using the @elderjs/plugin-images it will replace all markdown images with the {{picture src="" alt="" /}} shortcode.
    useSyntaxHighlighting: false, // available themes: https://github.com/shikijs/shiki/blob/master/packages/themes/README.md#literal-values - try material-theme-darker.
    //theme is the only option available - for now.
    useTableOfContents: false, // adds tocTree and tocHtml to each route's data object.
    createRoutes: true, // creates routes in allRequests based on collected md files.
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
      description: 'Add collected md files to allRequests array using the frontmatter slug or filename as the slug.',
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
