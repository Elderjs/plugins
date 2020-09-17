const sharp = require('sharp');
const fs = require('fs-extra');
const workerpool = require('workerpool');
const getSuffix = require('./utils/getSuffix');
const getPrefix = require('./utils/getPrefix');
const svgPlaceholder = require('./utils/svgPlaceholder');

const svg = async (rel, src, publicPrefix, cachePrefix, opts = {}) => {
  try {
    const options = JSON.parse(opts);

    const svgForResize = await resize(rel, src, publicPrefix, cachePrefix, 150, 1, 'jpeg', 70);

    const svg = await svgPlaceholder(svgForResize.public, options);

    return { rel, svg, error: null };
  } catch (e) {
    return { error: e };
  }
};

const placeholder = async (rel, src, opts = {}) => {
  try {
    const options = JSON.parse(opts);

    const place = await sharp(src).resize(options.resize).jpeg(options.jpeg).toBuffer({ resolveWithObject: false });

    return { rel, placeholder: `data:image/jpeg;base64,${place.toString('base64')}`, error: null };
  } catch (e) {
    return { error: e };
  }
};

const resize = async (rel, src, publicPrefix, cachePrefix, width, scale, fileType, quality) => {
  const prefix = getPrefix(rel, publicPrefix);
  const suffix = getSuffix(width, scale, fileType);
  const cacheLocation = `${cachePrefix}${suffix}`;
  const publicLocation = `${publicPrefix}${suffix}`;

  let image;

  let cachedImage = false;

  if (cachePrefix && fs.existsSync(cacheLocation)) {
    try {
      image = {
        info: await sharp(cacheLocation).metadata(),
      };

      if (!fs.existsSync(publicLocation)) {
        fs.outputFileSync(publicLocation, fs.readFileSync(cacheLocation));
      }

      cachedImage = true;
      // console.log(`${prefix}${suffix} found in cache`);
    } catch (e) {
      console.error(e);
    }
  }

  // no image resize exists
  if (!image) {
    image = await sharp(src)
      .rotate()
      .resize({
        width: width * scale,
        fit: sharp.fit.cover,
        // position: sharp.strategy.attention,
      });

    if (fileType === 'jpeg') {
      image = await image.jpeg({
        quality,
        progressive: true,
        optimizeScans: true,
        chromaSubsampling: '4:2:0',
        trellisQuantisation: true,
        quantisationTable: 2,
      });
    } else if (fileType === 'png') {
      image = await image.png({
        quality,
        progressive: true,
        palette: true,
      });
    } else if (fileType === 'webp') {
      image = await image.webp({
        quality,
        reductionEffort: 6,
        nearLossless: true,
        smartSubsample: true,
      });
    }

    image = await image.toBuffer({ resolveWithObject: true });

    fs.outputFileSync(`${publicLocation}`, image.data);

    if (!cachedImage && cachePrefix && cachePrefix.length > 0) {
      fs.outputFileSync(`${cacheLocation}`, image.data);
    }
  }

  const out = {
    width: image.info.width,
    height: image.info.height,
    format: image.info.format,
    relative: `${prefix}${suffix}`,
    scale,
    rel,
    cache: cacheLocation,
    public: publicLocation,
  };

  // handle scaled images
  if (scale > 1) {
    out.height = out.height / scale;
    out.width = out.width / scale;
  }

  return out;
};

workerpool.worker({
  resize: resize,
  placeholder: placeholder,
  svg: svg,
});
