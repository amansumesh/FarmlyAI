import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';

const router: ReturnType<typeof Router> = Router();

// POST /api/auth/send-otp
router.post('/send-otp', authController.sendOTP.bind(authController));

// POST /api/auth/verify-otp
router.post('/verify-otp', authController.verifyOTP.bind(authController));

// POST /api/auth/refresh-token
router.post('/refresh-token', authController.refreshToken.bind(authController));

export default router;
