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

function getSources(sizes, srcsets, srcSizes) {
  const sources = {
    webp: [],
    jpeg: [],
    png: [],
  };

  Object.entries(srcsets).forEach((srcset) => {
    let type = srcset[0];
    let items = srcset[1];

    if (Object.keys(items).length === 0) return; 

    let source = `<source `;
    if (type === 'webp') source += `type="image/webp" `;
    if (type === 'png') source += `type="image/png" `;
    source += `data-srcset="`;
    Object.entries(items).forEach((item) => {
      source += `${item[1]} ${item[0]}w, `; // ☝ image src with width w descriptor
    });
    source = source.replace(/,\s*$/, "");
    source += `" sizes="${srcSizes ? srcSizes : '100vw'}" `; // ☝ sizes attribute must be set if w descriptors are used
    source += `>`;

    sources[type] = [source];
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
