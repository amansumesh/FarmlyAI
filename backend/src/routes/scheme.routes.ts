import { Router } from 'express';
import { SchemeController } from '../controllers/scheme.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router: ReturnType<typeof Router> = Router();

router.get('/match', authenticateToken, SchemeController.getEligibleSchemes);

export default router;
