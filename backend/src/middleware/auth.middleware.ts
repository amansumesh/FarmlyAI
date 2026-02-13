import { Response, NextFunction } from 'express';
import { jwtService } from '../services/jwt.service.js';
import { User } from '../models/user.model.js';
import { logger } from '../utils/logger.js';
import { AuthRequest } from '../types/auth.types.js';

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Authorization token required'
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Invalid authorization header format'
      });
      return;
    }

    // Verify token
    const decoded = jwtService.verifyAccessToken(token);

    // Verify user exists
    const user = await User.findById(decoded.userId);

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      phoneNumber: decoded.phoneNumber
    };

    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    
    res.status(401).json({
      success: false,
      message: error instanceof Error ? error.message : 'Authentication failed'
    });
    return;
  }
};
