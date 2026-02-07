import { put } from '@vercel/blob';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class StorageService {
  static async uploadImage(
    file: Express.Multer.File,
    userId: string
  ): Promise<string> {
    // Use local storage in development if Vercel Blob token is not configured
    if (config.nodeEnv === 'development' && !config.blobStorage.token) {
      return this.uploadImageLocally(file, userId);
    }

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

  private static async uploadImageLocally(
    file: Express.Multer.File,
    userId: string
  ): Promise<string> {
    try {
      const timestamp = Date.now();
      const uploadDir = path.join(__dirname, '../../uploads/disease-detection', userId);
      
      await fs.mkdir(uploadDir, { recursive: true });
      
      const filename = `${timestamp}-${file.originalname}`;
      const filepath = path.join(uploadDir, filename);
      
      await fs.writeFile(filepath, file.buffer);
      
      const url = `/uploads/disease-detection/${userId}/${filename}`;
      
      logger.info('Image saved locally', {
        url,
        size: file.size,
      });
      
      return url;
    } catch (error) {
      logger.error('Error saving image locally', { error });
      throw new Error('Failed to save image');
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
