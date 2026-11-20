import multer from 'multer';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';
import { ValidationError } from '../errors/AppError.js';
import { logImageEvent } from '../lib/logger.js';

// Configure Cloudinary if credentials are supplied
if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

// Memory storage to process buffers without leaving temporary disk artifacts
const storage = multer.memoryStorage();

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(
      new ValidationError(
        `Invalid file type '${file.mimetype}'. Only JPEG, PNG, and WebP images are supported.`
      )
    );
  }
  cb(null, true);
};

export const multerUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter,
});

export const uploadSingleImage = (req: Request, res: Response, next: NextFunction) => {
  multerUpload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new ValidationError('Image file size exceeds the 5MB limit.'));
      }
      return next(new ValidationError(`Upload error: ${err.message}`));
    } else if (err) {
      return next(err);
    }
    next();
  });
};

export class UploadService {
  /**
   * Uploads an image buffer to Cloudinary or returns an offline mock Cloudinary URL
   * when running in test/local environments without live Cloudinary keys.
   */
  async uploadPropertyImage(
    propertyId: string,
    file: Express.Multer.File,
    userId?: string
  ): Promise<{ url: string; publicId: string }> {
    if (!file) {
      throw new ValidationError('No image file provided in request (field: "image")');
    }

    const hasCloudinary = Boolean(
      env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET
    );

    if (hasCloudinary && env.NODE_ENV !== 'test') {
      try {
        const result = await new Promise<UploadApiResponse>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: `the_bombay_reserve/properties/${propertyId}`,
              transformation: [{ quality: 'auto', fetch_format: 'auto' }],
            },
            (err, res) => {
              if (err || !res) return reject(err);
              resolve(res);
            }
          );
          uploadStream.end(file.buffer);
        });

        logImageEvent('uploaded', {
          propertyId,
          imageUrl: result.secure_url,
          userId,
        });

        return {
          url: result.secure_url,
          publicId: result.public_id,
        };
      } catch (err: any) {
        throw new ValidationError(`Cloudinary upload failed: ${err.message}`);
      }
    }

    // Resilient test and offline environment fallback
    const mockId = `tbr-img-${randomUUID()}`;
    const mockUrl = `https://res.cloudinary.com/the_bombay_reserve/image/upload/v1700000000/properties/${propertyId}/${mockId}.jpg`;

    logImageEvent('uploaded', {
      propertyId,
      imageUrl: mockUrl,
      userId,
    });

    return {
      url: mockUrl,
      publicId: mockId,
    };
  }
}

export const uploadService = new UploadService();
