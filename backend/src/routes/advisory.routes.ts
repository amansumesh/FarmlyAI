import { Router } from 'express';
import { AdvisoryController } from '../controllers/advisory.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router: ReturnType<typeof Router> = Router();

router.get('/recommendations', authenticateToken, AdvisoryController.getRecommendations);

export default router;
