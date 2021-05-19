# Elder.js Plugin: Markdown

An extensible markdown parser for [Elder.js](https://github.com/Elderjs/elderjs/) powered by [remark](https://github.com/remarkjs/remark).

Use it to create a blog, or site, just configure and it'll parse your markdown and make it available in your Svelte templates.

## Install

```bash
npm install --save @elderjs/plugin-markdown
```

## Config

Once installed, open your `elder.config.js` and configure the plugin by adding `@elderjs/plugin-markdown` to your plugin object.

```javascript
plugins: {
  '@elderjs/plugin-markdown': {
    routes: [], // if all of your markdown lives in ./src/routes/blog/, you'd add 'blog' to this array.
    slugFormatter: function(relativeFilePath, frontmatter) {
      return false; // If needed, a custom slug for the url can be crafted from the relative path to the file and
      // frontmatter in it (if any). slugFormatter must be a function and must return a string to be used.
    },
    useSyntaxHighlighting: false // This plugin ships with syntax highlighting ability for your convenience. Recommend setting true for technical blogs. See below for customizing options
  }
}
```

## Customizing the Defaults

Below are the default settings of the plugin. You can adjust them to your needs.

```javascript
plugins: {

  '@elderjs/plugin-markdown': {
    routes: [], // a list of routes, the plugin should look for markdown in.
    remarkPlugins: [
      frontmatter, // 'remark-frontmatter' package
      [extractFrontmatter, { name: 'frontmatter', yaml: yaml.parse }], // 'remark-extract-frontmatter' and 'yaml' packages.
      remarkSlug, // 'remark-slug' package
      remarkHtml, // 'remark-html' package
    ],
    // If you need to customize syntax highlighting, pass an options object instead of true
    // If you choose to pass your own remarkPlugins above, this feature is disabled - you can choose to copy out the code in rehype-shiki.js or roll your own syntax highlighting
    useSyntaxHighlighting: {
      theme: 'nord' // available themes: https://github.com/shikijs/shiki/blob/master/packages/themes/README.md#literal-values - try material-theme-darker
      // theme is the only option available - for now.
    },
    useElderJsPluginImages: true, // if you are using the @elderjs/plugin-images the plugin replace all markdown images with the {{picture src="" alt="" /}} shortcode.
    useTableOfContents: false, // adds tocTree to each route's data object.
    createRoutes: true, // creates routes in allRequests based on collected md files.
  },

}
```

A note on the default syntax highlighting - we use [shiki](https://shiki.matsu.io/) (compared to other well known options) because it highlights everything in inline styles (so no extra JS/CSS needed), has extensive language support, and can use any VS Code theme including your own custom one. We have _not_ yet exposed this last feature to you as an option for this plugin - if you want this feature and are interested in implementing, please feel free to open an issue. If you wish to use your own syntax highlighting, you can add it to your `remarkPlugins` array, or set `useSyntaxHighlighting: false` and implement separately from this markdown toolchain.

## Getting all Markdown For a Route:

An object representing all of the markdown the plugin parsed from the defined `routes` is available at `data.markdown`.

If you are looking to get an array of the markdown for a specific route such as `blog` you can access it `data.markdown.blog`.

## `helpers.markdownParser`:

In addition to parsing the markdown in the given routes, this plugin makes available the configured [remark](https://github.com/remarkjs/remark) parser at `helpers.markdownParser` during the `bootstrap` hook.

This means you can use the same markdown parser to parse markdown from other sources if needed.

For full documentation please review [remark's docs](https://github.com/remarkjs/remark). That said, the default plugin config can be used to parse markdown like so:

- `helpers.markdownParser.processSync(mdText)` if you are not using syntax highlighting.
- `helpers.markdownParser.process(mdText)` if you are using syntax highlighting. **Note that because this is an async function, it will not run inside of a non-hydrated Svelte file. To get around this, you'll want to execute the function in the `data` portion of your `route.js` file.**

## Remark Plugins:

If you need to customize the remark plugins that are used here are some notes:

1. The `remarkPlugins` array are added to `remark` in the order they are given.
1. If you add a single plugin in your `elder.config.js`, you must specify a full `remark` pipeline.
1. If a plugin such as `remark-extract-frontmatter` needs an array of options, you can pass in an array like so: `remarkPlugins: [[extractFrontmatter, { name: 'frontmatter', yaml: yaml.parse }]]`

The default remarkPlugins are exported for ease of use via the package. `const { remarkPlugins } = require('@elderjs/plugin-markdown');`

### Notes:

- By default, if there is a `date` field in your frontmatter it will sort all of the markdown for that route by it.
- If there is a `slug` field in your frontmatter it will use that for the slug, if not it falls back to the filename.
