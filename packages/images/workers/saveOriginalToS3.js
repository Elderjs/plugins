const AWS = require('aws-sdk');
const sharp = require('sharp');

const asyncS3PutObject = require('../utils/asyncS3PutObject');
const getS3Params = require('../utils/getS3Params');

const saveOriginalToS3 = async ({ src, rel, s3: s3Params, debug }) => {
  if (debug) console.log('saveOrigionalToS3Params', s3Params);
  const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET, S3_BUCKET_URL } = getS3Params(s3Params);

  const original = await sharp(Buffer.from(src)).toBuffer({ resolveWithObject: true });

  const s3 = new AWS.S3({
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
    signatureVersion: 'v4',
  });

  const Key = `originals/${rel.substr(1)}`;
  const s3r = await asyncS3PutObject(s3, {
    Body: original.data,
    ContentType: `image/${original.info.format}`,
    Bucket: S3_BUCKET,
    Key,
  });

  if (debug) console.log('saveOriginalToS3', s3r, `${S3_BUCKET_URL}/${Key}`, S3_BUCKET);

  return `${S3_BUCKET_URL}/${Key}`;
};

module.exports = saveOriginalToS3;
