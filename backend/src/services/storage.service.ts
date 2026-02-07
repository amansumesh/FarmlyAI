import { put } from '@vercel/blob';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

export class StorageService {
  static async uploadImage(
    file: Express.Multer.File,
    userId: string
  ): Promise<string> {
    try {
      const timestamp = Date.now();
      const filename = `disease-detection/${userId}/${timestamp}-${file.originalname}`;

      const blob = await put(filename, file.buffer, {
        access: 'public',
        token: config.blobStorage.token,
      });

      logger.info('Image uploaded to Vercel Blob', {
        url: blob.url,
        size: file.size,
      });

      return blob.url;
    } catch (error) {
      logger.error('Error uploading image to Vercel Blob', { error });
      throw new Error('Failed to upload image');
    }
  }

  static isValidImageFormat(mimetype: string): boolean {
    const validFormats = ['image/jpeg', 'image/jpg', 'image/png'];
    return validFormats.includes(mimetype);
  }

  static isValidImageSize(size: number): boolean {
    const maxSize = 10 * 1024 * 1024;
    return size <= maxSize;
  }
}
