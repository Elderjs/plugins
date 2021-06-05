module.exports = function (s3, params) {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line node/no-unsupported-features/es-syntax
    s3.putObject({ ...params }, (err, data) => {
      resolve({ err, data });
    });
  });
};
