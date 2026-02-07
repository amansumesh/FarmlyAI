import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

export const diseaseDetectionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many disease detection requests. Maximum 10 per hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return req.user?.userId || req.ip || 'anonymous';
  },
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many disease detection requests. Please try again later.',
      retryAfter: 3600,
    });
  },
});
