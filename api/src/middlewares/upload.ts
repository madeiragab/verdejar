import multer from 'multer';
import { badRequest } from '../lib/errors.js';
import { ALLOWED_MIME } from '../lib/storage.js';

/** Recebe uma foto em memória (até 5 MB, jpeg/png/webp). Quem decide onde salvar é o storage. */
export const photoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) cb(null, true);
    else cb(badRequest('Envie uma foto JPG, PNG ou WEBP'));
  },
}).single('photo');
