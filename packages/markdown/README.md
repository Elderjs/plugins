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
      [extractFrontmatter, { name: 'frontmatter', yaml: yaml }], // 'remark-extract-frontmatter' and 'yaml' packages.
      remarkHtml, // 'remark-html' package
    ],
    // If you need to customize syntax highlighting, pass an options object instead of true
    // note that this feature is disabled if you choose to pass your own remarkPlugins above
    useSyntaxHighlighting: {
      theme: 'nord' // available themes: https://github.com/shikijs/shiki/blob/master/packages/themes/README.md#literal-values - try material-theme-darker
      // theme is the only option available - for now.
    },
    useElderJsPluginImages: true, // if you are using the @elderjs/plugin-images the plugin replace all markdown images with the {{picture src="" alt="" /}} shortcode.
  },

}
```

## Getting all Markdown For a Route:

An object representing all of the markdown the plugin parsed from the defined `routes` is available at `data.markdown`.

If you are looking to get an array of the markdown for a specific route such as `blog` you can access it `data.markdown.blog`.

## `helpers.markdownParser`:

In addition to parsing the markdown in the given routes, this plugin makes available the configured [remark](https://github.com/remarkjs/remark) parser at `helpers.markdownParser` during the `bootstrap` hook.

This means you can use the same markdown parser to parse markdown from other sources if needed.

For full documentation please review [remark's docs](https://github.com/remarkjs/remark). That said, the default plugin config can be used to parse markdown like so: `helpers.markdownParser.processSync(mdText)`

## Remark Plugins:

If you need to customize the remark plugins that are used here are some notes:

1. The `remarkPlugins` array are added to `remark` in the order they are given.
1. If you add a single plugin in your `elder.config.js`, you must specify a full `remark` pipeline.
1. If a plugin such as `remark-extract-frontmatter` needs an array of options, you can pass in an array like so: `remarkPlugins: [[extractFrontmatter, { name: 'frontmatter', yaml: yaml }]]`

### Notes:

- By default, if there is a `date` field in your frontmatter it will sort all of the markdown for that route by it.
- If there is a `slug` field in your frontmatter it will use that for the slug, if not it falls back to the filename.
