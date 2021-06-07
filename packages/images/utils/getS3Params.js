module.exports = (s3 = {}) => {
  const result = {
    AWS_ACCESS_KEY_ID: s3['AWS_ACCESS_KEY_ID'],
    AWS_SECRET_ACCESS_KEY: s3['AWS_SECRET_ACCESS_KEY'],
    S3_BUCKET: s3['S3_BUCKET'],
    S3_BUCKET_URL: s3['S3_BUCKET_URL'],
    USE_S3_HOSTING: s3['USE_S3_HOSTING'],
  };
  return result;
};
