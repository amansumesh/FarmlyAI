import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router: ReturnType<typeof Router> = Router();

router.get('/profile', authMiddleware, userController.getProfile.bind(userController));

router.put('/profile', authMiddleware, userController.updateProfile.bind(userController));

export default router;
