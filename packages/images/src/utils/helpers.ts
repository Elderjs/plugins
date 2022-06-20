import { ElderjsImageSize } from '..';

export function getSrcsets({
  maxWidth,
  fileSizes,
  key = 'relative',
}: {
  maxWidth: number;
  fileSizes: ElderjsImageSize[];
  key: string;
}) {
  const sizes: number[] = [];
  const srcsets = fileSizes.reduce(
    (out, cv) => {
      // skip sizes larger than our max;
      if (cv.width > maxWidth) return out;
      if (!sizes.includes(cv.width)) sizes.push(cv.width);

      let thisSrcSet = out[cv.format][cv.width] || '';
      // let thisSrcSet = '';
      if (cv.scale === 1) thisSrcSet = `${cv[key]}${thisSrcSet}`;
      if (cv.scale === 2 && thisSrcSet.length) thisSrcSet = `${thisSrcSet}, ${cv[key]} 2x`;
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

type ReturnGetSrcsets = ReturnType<typeof getSrcsets>;

export function getSources(
  sizes: ReturnGetSrcsets['sizes'],
  srcsets: ReturnGetSrcsets['srcsets'],
): { webp: string[]; jpeg: string[]; png: string[] } {
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
        // sizes is sorted descending in getSrcsets
        source += `media="(min-width: ${sizes[i + 1]}px)" `;
      }
      source += `/>`;

      sources[type].push(source);
    });
  });

  return sources;
}

export function getLargest(fileSizes: ElderjsImageSize[], orgFormat: string, maxWidth: number) {
  return fileSizes
    .filter((p) => p.format === orgFormat)
    .find((p, _i, arr) => {
      let largest = true;
      arr.forEach((a) => {
        if (a.width > maxWidth) return;
        if (a.width > p.width) largest = false;
      });
      return largest;
    });
}

export function getSmallest(fileSizes: ElderjsImageSize[], orgFormat: string) {
  return fileSizes
    .filter((p) => p.format === orgFormat)
    .find((p, _i, arr) => {
      let smallest = true;
      arr.forEach((a) => {
        if (a.width < p.width) smallest = false;
      });
      return smallest;
    });
}
