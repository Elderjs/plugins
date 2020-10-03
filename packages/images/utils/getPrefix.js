const getPrefix = (rel, publicPrefix) => {
  const fileWithoutExt = rel.split('.')[0];
  return fileWithoutExt + publicPrefix.replace(/\\/g, '/').split(fileWithoutExt).pop();
};

module.exports = getPrefix;
exports.default = getPrefix;
