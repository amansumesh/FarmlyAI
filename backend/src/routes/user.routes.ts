import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router: ReturnType<typeof Router> = Router();

router.get('/profile', authenticateToken, userController.getProfile.bind(userController));

router.put('/profile', authenticateToken, userController.updateProfile.bind(userController));

export default router;
