const svgDataUri = require('mini-svg-data-uri');
const potrace = require(`potrace`);
const optimize = require('./optimizeSvg');

const defaultTraceArgs = {
  color: `lightgray`,
  optTolerance: 0.4,
  turdSize: 100,
  turnPolicy: potrace.Potrace.TURNPOLICY_MAJORITY,
};

const defaultPosterizeArgs = {
  color: 'lightgray',
  background: '#fff',
  steps: 4,
};

function trace(path, settings = {}) {
  return new Promise((resolve, reject) => {
    potrace.trace(path, { ...defaultTraceArgs, ...settings }, (err, svg) => {
      if (err) reject(err);
      resolve(svg);
    });
  });
}

function posterize(path, settings = { threshold: 180, steps: 4 }) {
  return new Promise((resolve, reject) => {
    potrace.trace(path, { ...defaultPosterizeArgs, ...settings }, (err, svg) => {
      if (err) reject(err);
      resolve(svg);
    });
  });
}

function svgBackgroundImage(svgString) {
  if (typeof svgString !== 'string') {
    throw new TypeError(`Expected a string, but received ${typeof svgString}`);
  }

  let svg = svgString.replace(/\"/gim, "'");

  svg = Buffer.from(svg, 'utf-8');

  return `data:image/svg+xml;base64,${svg.toString('base64')}`;
}

async function svgPlaceholder(file, options = {}) {
  if (!options.type || options.type === 'trace') {
    return trace(file, options)
      .then(optimize)

      .then(svgBackgroundImage);
  } else {
    return posterize(file, options)
      .then(optimize)

      .then(svgBackgroundImage);
  }
}

module.exports = svgPlaceholder;
exports.default = svgPlaceholder;
