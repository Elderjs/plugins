const sharp = require('sharp');
const { nanoid } = require('nanoid')

module.exports = async ({ rel, src: uncheckedSrc, options, debug }) => {
  try {
    src = uncheckedSrc;
    // convert Array buffer if needed.
    if (typeof uncheckedSrc !== 'string') {
      src = Buffer.from(uncheckedSrc);
    }

    //Lighthouse makes it difficutl to tell which placeholders belong to which images, so this helps us know which one it belongs to
    //We Stick it in the base64 image encoded URL in a place where it does not interfere with the image.
    const id_string = `id:${nanoid()};`;

    const place = await sharp(src).resize(options.resize).jpeg(options.jpeg).toBuffer({ resolveWithObject: false });

    if (debug) console.log({ rel, placeholder: `data:image/jpeg;${id_string}base64,${place.toString('base64')}`, error: null });

    return { rel, placeholder: `data:image/jpeg;${id_string}base64,${place.toString('base64')}`, error: null };
  } catch (e) {
    return { error: e };
  }
};
