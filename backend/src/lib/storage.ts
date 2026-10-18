import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config/env.js';

export const UPLOAD_DIR = path.resolve('uploads');

const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
export const ALLOWED_MIME = Object.keys(EXT);

interface UploadFile {
  buffer: Buffer;
  mimetype: string;
}

/** Salva a foto no Cloudinary (se configurado) ou em ./uploads e devolve a URL pública. */
export async function savePhoto(file: UploadFile): Promise<string> {
  if (config.cloudinaryUrl) return uploadToCloudinary(file, config.cloudinaryUrl);

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${EXT[file.mimetype]}`;
  await fs.writeFile(path.join(UPLOAD_DIR, name), file.buffer);
  return `${config.publicUrl}/uploads/${name}`;
}

async function uploadToCloudinary(file: UploadFile, url: string): Promise<string> {
  const { username: apiKey, password: apiSecret, hostname: cloudName } = new URL(url);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const folder = 'verdejar';
  const signature = crypto
    .createHash('sha1')
    .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
    .digest('hex');

  const form = new FormData();
  form.append('file', new Blob([new Uint8Array(file.buffer)], { type: file.mimetype }));
  form.append('api_key', apiKey);
  form.append('timestamp', timestamp);
  form.append('folder', folder);
  form.append('signature', signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) throw new Error(`Falha no upload para o Cloudinary: ${res.status}`);
  const data = (await res.json()) as { secure_url: string };
  return data.secure_url;
}

/** Remove uma foto salva localmente (fotos externas são ignoradas). */
export async function deleteLocalPhoto(photoUrl: string | null | undefined) {
  if (!photoUrl?.startsWith(`${config.publicUrl}/uploads/`)) return;
  await fs.rm(path.join(UPLOAD_DIR, path.basename(photoUrl)), { force: true });
}
