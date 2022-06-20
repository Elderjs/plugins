import sharp from 'sharp';
import fs from 'fs-extra';
import AWS from 'aws-sdk';

import getSuffix from '../utils/getSuffix.js';
import getPrefix from '../utils/getPrefix.js';
import asyncS3PutObject from '../utils/asyncS3PutObject.js';
import getS3Params from '../utils/getS3Params.js';
import { ElderjsImageSize, ElderjsImagesS3Config, GenericWorker } from '../index.js';

export default async function resize({
  rel,
  src: uncheckedSrc,
  publicPrefix = '',
  cachePrefix = '',
  width,
  scale,
  fileType,
  quality,
  s3: s3Params,
  debug,
}: {
  rel: string;
  src: string | Buffer;
  publicPrefix: string;
  cachePrefix: string;
  scale: number;
  width: number;
  fileType: string;
  quality: number;
  s3?: ElderjsImagesS3Config;
  debug?: boolean;
}): Promise<ElderjsImageSize> {
  // Prep common stuff
  const prefix = getPrefix(rel, publicPrefix);
  const suffix = getSuffix(width, scale, fileType);
  let cacheLocation = `${cachePrefix}${suffix}`;
  let publicLocation = `${publicPrefix}${suffix}`;
  let relative = `${prefix}${suffix}`;

  let src = uncheckedSrc;
  // convert Array buffer if needed.
  if (typeof uncheckedSrc !== 'string') {
    src = Buffer.from(uncheckedSrc);
  }

  let s3;
  let s3Location;

  // check if we should use s3.
  const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET, S3_BUCKET_URL } = getS3Params(s3Params);
  if (AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY && S3_BUCKET && S3_BUCKET_URL) {
    s3 = new AWS.S3({
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
      signatureVersion: 'v4',
    });

    //overwrite the cache and public prefix as they'll be going to the s3 bucket.
    publicLocation = `${S3_BUCKET_URL}${relative}`;
    cacheLocation = `${S3_BUCKET_URL}${relative}`;

    s3Location = `${S3_BUCKET_URL}${relative}`;
  }

  let image;
  // check for a cached image on the local server.
  let cachedImage = false;
  if (!s3 && cachePrefix && fs.existsSync(cacheLocation)) {
    try {
      image = {
        info: await sharp(cacheLocation).metadata(),
      };

      if (!fs.existsSync(publicLocation)) {
        fs.outputFileSync(publicLocation, fs.readFileSync(cacheLocation));
      }

      cachedImage = true;
      // console.log(`${prefix}${suffix} found in cache`);
    } catch (e) {
      console.error(e);
    }
  }

  // no existing image resize exists
  // time to process.
  // NOTE: IMAGE OBJECT IS A SHARP INSTANCE AND IS MUTATED OVER AND OVER AGAIN.
  if (!image) {
    // resize and rotate the image to be correctly fit.
    image = await sharp(src)
      .rotate()
      .resize({
        width: width * scale,
        fit: sharp.fit.cover,
        // position: sharp.strategy.attention,
      });

    // adjust the image to the correct format.
    if (fileType === 'jpeg') {
      image = await image.jpeg({
        quality,
        progressive: true,
        optimizeScans: true,
        chromaSubsampling: '4:2:0',
        trellisQuantisation: true,
        quantisationTable: 2,
      });
    } else if (fileType === 'png') {
      image = await image.png({
        quality,
        progressive: true,
        palette: true,
      });
    } else if (fileType === 'webp') {
      image = await image.webp({
        quality,
      });
    }

    // convert the image to a buffer for saving.
    image = await image.toBuffer({ resolveWithObject: true });

    if (s3) {
      // do s3 upload.
      try {
        const r = await asyncS3PutObject(s3, {
          Body: image.data,
          ContentType: `image/${fileType}`,
          Bucket: S3_BUCKET,
          Key: relative.substr(1),
        });
        if (debug) console.log(`s3Response`, r);
      } catch (e) {
        console.error(e);
      }
    } else {
      // local image
      fs.outputFileSync(publicLocation, image.data);

      if (!cachedImage && cachePrefix && cachePrefix.length > 0) {
        fs.outputFileSync(cacheLocation, image.data);
      }
    }
  }

  const out: ElderjsImageSize = {
    width: image.info.width,
    height: image.info.height,
    format: image.info.format,
    relative: relative,
    scale,
    rel,
    cache: cacheLocation,
    public: publicLocation,
    s3: s3 ? s3Location : undefined,
  };

  // handle scaled images
  if (scale > 1) {
    out.height = out.height / scale;
    out.width = out.width / scale;
  }

  if (debug) console.log(`Completed ${relative}`, out);

  return out;
}

export type ResizeWorker = GenericWorker<typeof resize>;
