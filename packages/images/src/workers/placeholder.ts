import sharp from 'sharp';
import { GenericWorker } from '../index.js';

export default async function placeholder({
  rel,
  src: uncheckedSrc,
  options,
  debug,
}: {
  rel: string;
  src: string | Buffer;
  options: any;
  debug: boolean;
}) {
  try {
    let src = uncheckedSrc;
    // convert Array buffer if needed.
    if (typeof uncheckedSrc !== 'string') {
      src = Buffer.from(uncheckedSrc);
    }

    const place = await sharp(src).resize(options.resize).jpeg(options.jpeg).toBuffer({ resolveWithObject: false });

    if (debug) console.log({ rel, placeholder: `data:image/jpeg;base64,${place.toString('base64')}`, error: null });

    return { rel, placeholder: `data:image/jpeg;base64,${place.toString('base64')}`, error: null };
  } catch (e) {
    return { error: e };
  }
}

export type PlaceholderWorker = GenericWorker<typeof placeholder>;
