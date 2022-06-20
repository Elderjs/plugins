import AWS from 'aws-sdk';
import sharp from 'sharp';
import { ElderjsImagesS3Config, GenericWorker } from '../index.js';

import asyncS3PutObject from '../utils/asyncS3PutObject.js';
import getS3Params from '../utils/getS3Params.js';

export default async function saveOriginalToS3({
  src,
  rel,
  s3: s3Params,
  debug,
}: {
  src: Buffer;
  rel: string;
  s3: ElderjsImagesS3Config;
  debug: boolean;
}) {
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
}
export type SaveOriginalToS3Worker = GenericWorker<typeof saveOriginalToS3>;
