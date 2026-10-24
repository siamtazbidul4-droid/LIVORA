import { createHash } from 'node:crypto';
import { Router, RequestHandler, Response } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { requireAuth, requireStaff, AuthRequest } from '../middleware/auth';

const router = Router();
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_SIZE, files: 1 },
});

const parseUpload: RequestHandler = (req, res, next) => {
  upload.single('file')(req, res, (error: unknown) => {
    if (!error) return next();
    if (error instanceof multer.MulterError) {
      const message = error.code === 'LIMIT_FILE_SIZE'
        ? 'Image must be 5 MB or smaller.'
        : 'Select one valid image file.';
      return res.status(400).json({ error: message });
    }
    return next(error);
  });
};

function getVerifiedImageMime(buffer: Buffer): string | null {
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    return 'image/png';
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }
  return null;
}

const cloudinaryResponseSchema = z.object({
  secure_url: z.string().url(),
  public_id: z.string().min(1),
  format: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});

router.post(
  '/',
  requireAuth,
  requireStaff,
  parseUpload,
  async (req: AuthRequest, res: Response): Promise<any> => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
    const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
    const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
    if (!cloudName || !apiKey || !apiSecret || !/^[a-z0-9-]+$/i.test(cloudName)) {
      return res.status(503).json({ error: 'Image storage is not configured.' });
    }

    const file = req.file;
    if (!file) return res.status(400).json({ error: 'Select an image to upload.' });

    const mimeType = getVerifiedImageMime(file.buffer);
    if (!mimeType || file.mimetype !== mimeType) {
      return res.status(400).json({ error: 'Only valid JPEG, PNG, and WebP images are supported.' });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = 'novara/admin';
    const signature = createHash('sha1')
      .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
      .digest('hex');
    const form = new FormData();
    form.append('file', new Blob([new Uint8Array(file.buffer)], { type: mimeType }), 'image');
    form.append('api_key', apiKey);
    form.append('timestamp', String(timestamp));
    form.append('folder', folder);
    form.append('signature', signature);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: form, signal: AbortSignal.timeout(30_000) }
      );
      if (!response.ok) {
        return res.status(502).json({ error: 'Image storage rejected the upload. Please try again.' });
      }

      const result = cloudinaryResponseSchema.safeParse(await response.json());
      if (!result.success) {
        return res.status(502).json({ error: 'Image storage returned an invalid response.' });
      }
      return res.status(201).json({
        asset: {
          url: result.data.secure_url,
          publicId: result.data.public_id,
          format: result.data.format,
          width: result.data.width,
          height: result.data.height,
        },
      });
    } catch {
      return res.status(502).json({ error: 'Image storage could not be reached. Please try again.' });
    }
  }
);

export default router;
