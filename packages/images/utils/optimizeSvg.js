const SVGO = require(`svgo`);

// https://github.com/gatsbyjs/gatsby/blob/master/packages/gatsby-plugin-sharp/src/trace-svg.js MIT
const optimizeSvg = (svg) => {
  const svgo = new SVGO({
    multipass: true,
    floatPrecision: 0,
    plugins: [
      {
        removeViewBox: false,
      },
      {
        addAttributesToSVGElement: {
          attributes: [
            {
              preserveAspectRatio: `none`,
            },
          ],
        },
      },
    ],
  });
  return svgo.optimize(svg).then(({ data }) => data);
};

module.exports = optimizeSvg;
exports.default = optimizeSvg;
