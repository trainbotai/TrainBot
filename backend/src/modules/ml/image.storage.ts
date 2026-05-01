import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { env } from '../../config/index.js';

export interface ProcessedImage {
  filename: string;       // path relative to UPLOAD_DIR (e.g. "labels/abc/img-xyz.jpg")
  absolutePath: string;
  sizeBytes: number;
  width: number;
  height: number;
}

export async function ensureUploadRoot(): Promise<void> {
  await fs.mkdir(env.UPLOAD_DIR, { recursive: true });
}

/**
 * Resize + re-encode image as JPEG, write to disk, return metadata.
 * Throws on invalid image input.
 */
export async function storeImage(opts: {
  labelId: string;
  imageId: string;
  buffer: Buffer;
}): Promise<ProcessedImage> {
  await ensureUploadRoot();
  const dir = path.join(env.UPLOAD_DIR, 'labels', opts.labelId);
  await fs.mkdir(dir, { recursive: true });

  const filename = path.join('labels', opts.labelId, `${opts.imageId}.jpg`);
  const absolutePath = path.join(env.UPLOAD_DIR, filename);

  const pipeline = sharp(opts.buffer)
    .rotate() // honor EXIF orientation
    .resize({
      width: env.UPLOAD_MAX_DIMENSION,
      height: env.UPLOAD_MAX_DIMENSION,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: 85, mozjpeg: true });

  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
  await fs.writeFile(absolutePath, data, { mode: 0o600 });

  return {
    filename,
    absolutePath,
    sizeBytes: data.length,
    width: info.width,
    height: info.height,
  };
}

export async function deleteImage(filename: string): Promise<void> {
  const abs = path.join(env.UPLOAD_DIR, filename);
  // Defensive: ensure path stays within UPLOAD_DIR
  const resolved = path.resolve(abs);
  if (!resolved.startsWith(path.resolve(env.UPLOAD_DIR) + path.sep)) {
    throw new Error('Path traversal blocked');
  }
  await fs.unlink(resolved).catch(() => undefined);
}

export function absolutePathOf(filename: string): string {
  const abs = path.join(env.UPLOAD_DIR, filename);
  const resolved = path.resolve(abs);
  if (!resolved.startsWith(path.resolve(env.UPLOAD_DIR) + path.sep)) {
    throw new Error('Path traversal blocked');
  }
  return resolved;
}
