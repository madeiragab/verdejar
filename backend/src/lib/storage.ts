import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config/env.js';
import { prisma } from './prisma.js';

/**
 * Onde as fotos ficam:
 *  - "database" (padrão): tabela stored_files — funciona em hospedagem gratuita, sem serviço extra
 *  - "disk": pasta ./uploads — útil para depurar localmente
 *  - Cloudinary: se CLOUDINARY_URL estiver definida, tem prioridade sobre os outros
 */
export const UPLOAD_DIR = path.resolve('uploads');
export const FILES_ROUTE = '/api/files';

const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
export const ALLOWED_MIME = Object.keys(EXT);

interface UploadFile {
  buffer: Buffer;
  mimetype: string;
}

/** Salva a foto e devolve a URL pública (relativa à API quando fica no banco). */
export async function savePhoto(file: UploadFile): Promise<string> {
  if (config.cloudinaryUrl) return uploadToCloudinary(file, config.cloudinaryUrl);

  if (config.storageDriver === 'disk') {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${EXT[file.mimetype]}`;
    await fs.writeFile(path.join(UPLOAD_DIR, name), file.buffer);
    return `${config.publicUrl}/uploads/${name}`;
  }

  const stored = await prisma.storedFile.create({
    data: { mimeType: file.mimetype, size: file.buffer.length, data: new Uint8Array(file.buffer) },
    select: { id: true },
  });
  return `${FILES_ROUTE}/${stored.id}`;
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

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`Falha no upload para o Cloudinary: ${res.status}`);
  const data = (await res.json()) as { secure_url: string };
  return data.secure_url;
}

/** Apaga uma foto que é nossa (banco ou disco). Fotos externas (Wikimedia, Cloudinary) são ignoradas. */
export async function deletePhoto(photoUrl: string | null | undefined) {
  if (!photoUrl) return;
  if (photoUrl.startsWith(`${FILES_ROUTE}/`)) {
    const id = photoUrl.slice(FILES_ROUTE.length + 1);
    await prisma.storedFile.deleteMany({ where: { id } });
  } else if (photoUrl.startsWith(`${config.publicUrl}/uploads/`)) {
    await fs.rm(path.join(UPLOAD_DIR, path.basename(photoUrl)), { force: true });
  }
}
