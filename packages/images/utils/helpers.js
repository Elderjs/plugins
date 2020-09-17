function getSrcsets(maxWidth, fileSizes) {
  const sizes = [];
  const srcsets = fileSizes.reduce(
    (out, cv) => {
      // skip sizes larger than our max;
      if (cv.width > maxWidth) return out;
      if (!sizes.includes(cv.width)) sizes.push(cv.width);

      let thisSrcSet = out[cv.format][cv.width] || '';
      // let thisSrcSet = '';
      if (cv.scale === 1) thisSrcSet = `${cv.relative}${thisSrcSet}`;
      if (cv.scale === 2 && thisSrcSet.length) thisSrcSet = `${thisSrcSet}, ${cv.relative} 2x`;
      out[cv.format][cv.width] = thisSrcSet;
      return out;
    },
    {
      webp: {},
      jpeg: {},
      png: {},
    },
  );
  return {
    sizes: sizes.sort((a, b) => b - a),
    srcsets,
  };
}

function getSources(sizes, srcsets) {
  const sources = {
    webp: [],
    jpeg: [],
    png: [],
  };

  sizes.forEach((size, i, arr) => {
    Object.keys(srcsets).forEach((type) => {
      if (!srcsets[type][size]) return;
      let source = `<source `;
      if (type === 'webp') source += `type="image/webp" `;
      if (type === 'png') source += `type="image/png" `;
      source += `data-srcset="${srcsets[type][size]}" `;

      if (i + 1 < arr.length) {
        source += `media="(min-width: ${size}px)" `;
      }
      source += `/>`;

      sources[type].push(source);
    });
  });

  return sources;
}

function getLargest(fileSizes, orgFormat, maxWidth) {
  return fileSizes
    .filter((p) => p.format === orgFormat)
    .find((p, i, arr) => {
      let largest = true;
      arr.forEach((a) => {
        if (a.width > maxWidth) return;
        if (a.width > p.width) largest = false;
      });
      return largest;
    });
}

function getSmallest(fileSizes, orgFormat) {
  return fileSizes
    .filter((p) => p.format === orgFormat)
    .find((p, i, arr) => {
      let smallest = true;
      arr.forEach((a) => {
        if (a.width < p.width) smallest = false;
      });
      return smallest;
    });
}

module.exports = {
  getSrcsets,
  getSources,
  getLargest,
  getSmallest,
};
