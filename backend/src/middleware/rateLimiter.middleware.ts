import rateLimit, { Options } from 'express-rate-limit';
import { Request, Response } from 'express';

export const rateLimiter = (options: Partial<Options> = {}) => {
  const defaultOptions: Partial<Options> = {
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      return req.user?.userId || req.ip || 'anonymous';
    },
    handler: (_req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
      });
    },
  };

  return rateLimit({ ...defaultOptions, ...options });
};

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
