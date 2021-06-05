const sharp = require('sharp');
const fs = require('fs-extra');
const workerpool = require('workerpool');
const getSuffix = require('./utils/getSuffix');
const getPrefix = require('./utils/getPrefix');
const svgPlaceholder = require('./utils/svgPlaceholder');
const AWS = require('aws-sdk');

const asyncS3PutObject = function (s3, params) {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line node/no-unsupported-features/es-syntax
    s3.putObject({ ...params }, (err, data) => {
      resolve({ err, data });
    });
  });
};

const saveOrigionalToS3 = async (rel, src, s3String) => {
  const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET, S3_BUCKET_URL } = parseS3String(s3String);

  const original = await sharp(src).toBuffer({ resolveWithObject: true });

  const s3 = new AWS.S3({
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
    signatureVersion: 'v4',
  });

  const Key = `originals/${rel.substr(1)}`;
  await asyncS3PutObject(s3, {
    Body: original.data,
    ContentType: `image/${original.info.format}`,
    Bucket: S3_BUCKET,
    Key,
  });

  return `${S3_BUCKET_URL}/${Key}`;
};

const svg = async (rel, src, publicPrefix, cachePrefix, opts = {}) => {
  try {
    const options = JSON.parse(opts);

    const svgForResize = await resize(rel, src, publicPrefix, cachePrefix, 150, 1, 'jpeg', 70);

    const svg = await svgPlaceholder(svgForResize.public, options);

    return { rel, svg, error: null };
  } catch (e) {
    return { error: e };
  }
};

const placeholder = async (rel, src, opts = {}) => {
  try {
    const options = JSON.parse(opts);

    const place = await sharp(src).resize(options.resize).jpeg(options.jpeg).toBuffer({ resolveWithObject: false });

    return { rel, placeholder: `data:image/jpeg;base64,${place.toString('base64')}`, error: null };
  } catch (e) {
    return { error: e };
  }
};

const parseS3String = (s3String) => {
  let s3Parsed;
  try {
    s3Parsed = JSON.parse(s3String);
  } catch (e) {
    // silence
  }

  return {
    AWS_ACCESS_KEY_ID: s3Parsed.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: s3Parsed.AWS_SECRET_ACCESS_KEY,
    S3_BUCKET: s3Parsed.S3_BUCKET,
    S3_BUCKET_URL: s3Parsed.S3_BUCKET_URL,
  };
};

// unfortunately workerpool makes you pass variables in an array.
const resize = async (rel, src, publicPrefix, cachePrefix, width, scale, fileType, quality, s3String) => {
  // Prep common stuff
  const prefix = getPrefix(rel, publicPrefix);
  const suffix = getSuffix(width, scale, fileType);
  let cacheLocation = `${cachePrefix}${suffix}`;
  let publicLocation = `${publicPrefix}${suffix}`;
  const relative = `${prefix}${suffix}`;

  // check if we should use s3.
  let s3;

  const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET, S3_BUCKET_URL } = parseS3String(s3String);
  if (AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY && S3_BUCKET && S3_BUCKET_URL) {
    s3 = new AWS.S3({
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
      signatureVersion: 'v4',
    });

    //overwrite the cache and public prefix as they'll be going to the s3 bucket.
    publicLocation = `${S3_BUCKET_URL}${relative}`;
    cacheLocation = `${S3_BUCKET_URL}${relative}`;
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
        reductionEffort: 6,
        nearLossless: true,
        smartSubsample: true,
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
        console.log(`s3Response`, r);
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

  const out = {
    width: image.info.width,
    height: image.info.height,
    format: image.info.format,
    relative: relative,
    scale,
    rel,
    cache: cacheLocation,
    public: publicLocation,
  };

  // handle scaled images
  if (scale > 1) {
    out.height = out.height / scale;
    out.width = out.width / scale;
  }

  console.log(`Completed ${relative}`);

  return out;
};

workerpool.worker({
  resize: resize,
  placeholder: placeholder,
  svg: svg,
  saveOrigionalToS3: saveOrigionalToS3,
});
