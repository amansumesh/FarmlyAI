import { Router, type IRouter } from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { rateLimiter } from '../middleware/rateLimiter.middleware.js';
import {
  handleVoiceQuery,
  getQueryHistory,
  toggleSaveQuery
} from '../controllers/query.controller.js';

const router: IRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/webm', 'audio/ogg'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid audio format. Allowed: WAV, MP3, WEBM, OGG'));
    }
  }
});

router.post(
  '/voice',
  authenticateToken,
  rateLimiter({ windowMs: 60 * 60 * 1000, max: 30 }),
  upload.single('audio'),
  handleVoiceQuery
);

router.get('/history', authenticateToken, getQueryHistory);

router.patch('/:queryId/save', authenticateToken, toggleSaveQuery);

export default router;
