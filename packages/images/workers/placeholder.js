const sharp = require('sharp');

module.exports = async ({ rel, src: uncheckedSrc, options, debug }) => {
  try {
    src = uncheckedSrc;
    // convert Array buffer if needed.
    if (typeof uncheckedSrc !== 'string') {
      src = Buffer.from(uncheckedSrc);
    }

    const place = await sharp(src).resize(options.resize).jpeg(options.jpeg).toBuffer({ resolveWithObject: false });

    if (debug) console.log({ rel, placeholder: `data:image/jpeg;base64,${place.toString('base64')}`, error: null });

    return { rel, placeholder: `data:image/jpeg;base64,${place.toString('base64')}`, error: null };
  } catch (e) {
    return { error: e };
  }
};
