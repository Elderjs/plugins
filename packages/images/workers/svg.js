const svgPlaceholder = require('../utils/svgPlaceholder');

const svg = async ({ rel, src, publicPrefix = '', cachePrefix = '', options, debug }) => {
  try {
    const svgForResize = await resize(rel, src, publicPrefix, cachePrefix, 150, 1, 'jpeg', 70);

    const svg = await svgPlaceholder(svgForResize.public, options);

    if (debug) console.log('svg', { rel, svg, error: null });
    return { rel, svg, error: null };
  } catch (e) {
    return { error: e };
  }
};

module.exports = svg;
