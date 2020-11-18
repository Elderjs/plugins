# Elder.js Plugin: Images

Easily generate responsive images for your Elder.js site.

Offers much of the functionality of the well known `gatsby-image` plugin for [Elder.js](https://github.com/Elderjs/elderjs).

> **demo** For a demo of this plugin in action visit: [nicholasreese.com](https://nicholasreese.com) and look at the header and post images.

> This plugin works on several sites but hasn't been thoroughly tested for all edge cases. PRs are welcome.

## What This Plugin Does:

Dealing with responsive images isn't easy. Often you need to compress in many different sizes, fiddle with picture formats, and figure out lazy loading and browser compatibility.

This plugin aims to simplify this and will take folder of non-responsive images and:

1. resizes them to various widths
1. saves them in webp + original format.
1. generates scales for high density displays
1. generates a low quality image placeholder (for the blur up effect)

So where you would usually have a non-responsive image of: `/images/wide.jpeg`

You can now use an Elder.js shortcode `{{picture src='/images/wide.jpeg' /}}` which will output (something like):

```html
<picture
  ><source type="image/webp" media="(min-width: 1200px)" srcset="/images/wide-ejs-1200.webp" />
  <source type="image/webp" media="(min-width: 992px)" srcset="/images/wide-ejs-992.webp" />
  <source type="image/webp" media="(min-width: 768px)" srcset="/images/wide-ejs-768.webp" />
  <source
    type="image/webp"
    media="(min-width: 576px)"
    srcset="/images/wide-ejs-576.webp, /images/wide-ejs-576@2x.webp 2x" />
  <source
    type="image/webp"
    media="(min-width: 400px)"
    srcset="/images/wide-ejs-400.webp, /images/wide-ejs-400@2x.webp 2x" />
  <source
    type="image/webp"
    media="(min-width: 350px)"
    srcset="/images/wide-ejs-350.webp, /images/wide-ejs-350@2x.webp 2x" />
  <source type="image/webp" srcset="/images/wide-ejs-200.webp, /images/wide-ejs-200@2x.webp 2x" />
  <source media="(min-width: 1200px)" srcset="/images/wide-ejs-1200.jpeg" />
  <source media="(min-width: 992px)" srcset="/images/wide-ejs-992.jpeg" />
  <source media="(min-width: 768px)" srcset="/images/wide-ejs-768.jpeg" />
  <source media="(min-width: 576px)" srcset="/images/wide-ejs-576.jpeg, /images/wide-ejs-576@2x.jpeg 2x" />
  <source media="(min-width: 400px)" srcset="/images/wide-ejs-400.jpeg, /images/wide-ejs-400@2x.jpeg 2x" />
  <source media="(min-width: 350px)" srcset="/images/wide-ejs-350.jpeg, /images/wide-ejs-350@2x.jpeg 2x" />
  <source srcset="/images/wide-ejs-200.jpeg, /images/wide-ejs-200@2x.jpeg 2x" />
  <img
    src="data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wgARCAAEAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAID/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAL/2gAMAwEAAhADEAAAAcZIf//EABgQAAIDAAAAAAAAAAAAAAAAAAABAhIx/9oACAEBAAEFAtlVH//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQMBAT8Bf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQIBAT8Bf//EABYQAQEBAAAAAAAAAAAAAAAAAAACMf/aAAgBAQAGPwKWP//EABcQAQEBAQAAAAAAAAAAAAAAAAERACH/2gAIAQEAAT8hVXXtpmuf/9oADAMBAAIAAwAAABCL/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPxB//8QAFREBAQAAAAAAAAAAAAAAAAAAAAH/2gAIAQIBAT8Qr//EABoQAQACAwEAAAAAAAAAAAAAAAEAESExUdH/2gAIAQEAAT8QaBDoacRSUXfX2f/Z"
    class="lazy blur-up loaded"
    data-ll-status="loaded"
/></picture>
```

## Helpers

In addition to the `{{picture src='' alt='' /}}` shortcode. This plugin adds the following to the `helper` object available in all Elder.js hooks after bootstrap:

### `helpers.images.src(path)`

Takes a relative path of the image and returns all the srcsets and data from the `ejs-image-manifest.json`.

### `helpers.images.picture(path, {maxWidth: 2000, class:'', alt: ''})`

Takes a `path` and `opts` object and outputs the `<picture>` tag similar to the shortcode.

**opts**

- `maxWidth` The largest responsive image to be included.
- `class` a class added to the `<picture>`
- `alt` alt tag added to the `<img>`.

### `helpers.images.largest(path, {maxWidth: 2000})`

A small utility to find the largest file (up to the maxWidth) for a given image.

### Default File Structure

The default plugin config assumes the following structure for your images:

```plaintext
root
| -- images
| -- | -- image files
```

It will automatically create:

```plaintext
root
| -- images
| -- | -- image files
| -- | -- ejs-image-manifest.json
| -- | -- sizes
| -- | -- | -- (resized images)
```

### Install

## Setup:

```bash
npm install --save @elderjs/plugin-images vanilla-lazyload
```

### Add To `elder.config.js`:

Once installed, open your `elder.config.js` and configure the plugin by adding `@elderjs/plugin-images` to your plugin object.

```javascript
plugins: {
    ...
    '@elderjs/plugin-images': {
        folders: [
            {
                src: '/images/*', // glob of where your original images are. Relative to rootDir/process.cwd() defined in your elder.config.js. Careful with **.
                output: '/images/', // where files should be put within the distDir defined in your elder.config.js.
            },
        ],
    }
    ...
}
```

## Full Config:

```javascript
plugins: {

  '@elderjs/plugin-images': {
        folders: [
      {
        src: '/images/', // where your original images are. Relative to rootDir/process.cwd() defined in your elder.config.js.
        output: '/images/', // where files should be put within the distDir defined in your elder.config.js.
      },
    ],
    widths: [1280, 992, 768, 576, 400, 350, 200], // Sizes the images will be resized to.
    fileTypes: ['webp'], // file types in addition to jpeg/png.
    imageManifest: '/images/ejs-image-manifest.json', // relative to root dir
    cacheFolder: '/images/sizes/', // relative to root dir
    scales: [1, 2], // 1x, 2x sizes
    svg: false, // experimental... you can play with it.
    placeholder: { // placeholder settings. See sharp.
      resize: {
        width: 10,
        fit: sharp.fit.cover,
      },
      jpeg: {
          // resize settings for the placeholder. See sharp.
        quality: 50,
        progressive: true,
        optimizeScans: true,
        chromaSubsampling: '4:2:0',
        trellisQuantisation: true,
        quantisationTable: 2,
      },
    },
    quality: 70, // quality to save the resized images in.
    cssString: ``, // if you want to overwrite the default css added
    addVanillaLazy: true, // if you want to disable the lazyload plugin and add your own.
    vanillaLazyLocation: '/static/vanillaLazy.min.js', // vanillaLazy's location relative to the root of the site. The plugin will move it to your public folder for you.
  }


}
```

## Additional Notes For Usage

Within your project's root, you can add the following to further optimize this plugin's usage.

### Adjust .gitignore to keep cache files out of repository

```
/images/sizes/
/images/*.json
```

### Cleaning cache

Explicitly default cache related values to elder.config.js

```js
imageManifest: '/images/ejs-image-manifest.json',
cacheFolder: '/images/sizes/',
```

and created package script to clear the cache when it feels appropriate

```js
//src/cleanImageCache.js

const del = require('del');
const path = require('path');
const { getConfig } = require('@elderjs/elderjs');

const { rootDir, plugins } = getConfig();

console.log(' Clearing out image cache.');

if (plugins['@elderjs/plugin-images'] !== undefined) {
  const plugin = plugins['@elderjs/plugin-images'];
  if (plugin.imageManifest !== undefined) {
    del.sync(path.join(rootDir, plugin.imageManifest));
  }
  if (plugin.cacheFolder !== undefined) {
    del.sync(path.join(rootDir, plugin.cacheFolder));
  }
}
```

```console
node ./src/cleanImageCache.js
```

## Troubleshooting

If you are struggling with the plugin doing unexpected things, remove your `ejs-image-manifest.json` and let the plugin rebuild it from scratch. Generally this won't result in generating new images but can help clean up issues caused by an out of sync manifest.json.

## Special Thanks

Thanks to [@meigo](https://github.com/meigo) for helping make this work on Windows and many of the scripts in this readme.
