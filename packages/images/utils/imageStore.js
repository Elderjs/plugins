const { getLargest, getSrcsets, getSmallest, getSources } = require('./helpers');

const imageStore = (manifest, plugin) => {
  return {
    src: function src(path) {
      // outputs img tag
      return manifest[path];
    },
    largest: function largest(path, opts) {
      const { maxWidth } = { maxWidth: 2000, ...opts };
      const file = manifest[path];
      return getLargest(file.sizes, file.format, maxWidth);
    },
    picture: function picture(path, opts) {
      try {
        // maxWidth, the largest resolution this should ever display.
        const { maxWidth, class: classStr, alt, wrap } = { maxWidth: 2000, class: '', alt: '', ...opts };
        const file = manifest[path];

        plugin.shouldAddCodeDependencies = true;

        //todo title

        const { sizes, srcsets } = getSrcsets({
          maxWidth,
          fileSizes: file.sizes,
          key: plugin.config.s3 && plugin.config.s3.USE_S3_HOSTING ? 's3' : 'relative',
        });
        const sources = getSources(sizes, srcsets);

        let picture = `<picture class="${classStr ? ` ${classStr}` : ''}">`;

        picture += sources.webp.reduce((out, cv) => `${out}${cv}`, '');

        if (file.format === 'jpeg') picture += sources.jpeg.reduce((out, cv) => `${out}${cv}`, '');
        if (file.format === 'png') picture += sources.png.reduce((out, cv) => `${out}${cv}`, '');

        picture += `<img src="${file.placeholder}"${alt.length > 0 ? ` alt="${alt}"` : ''} class="lazy blur-up">`;

        picture += `</picture>`;

        let pictureWithWrap = `<div class="ejs" ${
          plugin.addStyles ? `style="padding-bottom: ${Math.round((file.height / file.width) * 10000) / 100}%;"` : ''
        }>`;

        if (plugin.config.placeholder) {
          pictureWithWrap += `<div class="placeholder" style="background-image: url('${
            plugin.config.svg ? file.svg : file.placeholder
          }')"></div>`;
        }

        // if (plugin.config.svg && file.svg) {
        //   pictureWithWrap += `<img class="placeholder" src="${file.svg}" />`;
        // }

        pictureWithWrap += `${picture}</div>`;

        if (wrap) {
          return `<div class="${wrap}">${pictureWithWrap}</div>`;
        }

        return pictureWithWrap;
      } catch (e) {
        if (e.message.includes("'sizes' of undefined")) {
          console.log('manifest keys', Object.keys(manifest));
          throw new Error(`Cannot find source image with ${path} in manifest. (logged above)`);
        } else {
          throw e;
        }
      }
    },

    // src: function src(file, opts) {
    //   // used with Svelte picture component.
    //   return { src: manifest[file] };
    // },
  };
};

module.exports = imageStore;
exports.default = imageStore;
