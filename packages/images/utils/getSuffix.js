const getSuffix = (width, scale, fileType) => {
  let suffix = `-ejs-${width}`;

  if (scale > 1) {
    suffix += `@${scale}x`;
  }
  suffix += `.${fileType}`;
  return suffix;
};

module.exports = getSuffix;
exports.default = getSuffix;
