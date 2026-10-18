import { API_ORIGIN } from '../api/client';

/** Fotos guardadas pela API vêm com caminho relativo ("/api/files/…"); externas já vêm completas. */
export const mediaUrl = (url: string | null | undefined) => (url && url.startsWith('/') ? API_ORIGIN + url : url ?? null);

/**
 * Reduz a foto no navegador antes de enviar (lado maior até 1600 px, JPEG 85%).
 * Foto de celular tem 3–8 MB; depois disso fica em ~300 KB, sobe rápido no 4G e ocupa pouco no banco.
 */
export async function shrinkImage(file: File, maxSide = 1600, quality = 0.85): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch {
    return file; // formato que o navegador não decodifica: envia como está e a API valida
  }
}
