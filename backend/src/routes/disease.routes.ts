import { Router } from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { diseaseDetectionLimiter } from '../middleware/rateLimiter.middleware.js';
import {
  detectDisease,
  getDetectionHistory,
} from '../controllers/disease.controller.js';

const router: ReturnType<typeof Router> = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

router.post(
  '/detect',
  authenticateToken,
  diseaseDetectionLimiter,
  upload.single('image'),
  detectDisease
);

router.get('/history', authenticateToken, getDetectionHistory);

export default router;
