import { Router } from 'express';
import { AdvisoryController } from '../controllers/advisory.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/recommendations', authMiddleware, AdvisoryController.getRecommendations);

export default router;
