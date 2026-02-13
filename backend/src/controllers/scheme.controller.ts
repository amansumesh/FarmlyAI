import { Response } from 'express';
import { SchemeService } from '../services/scheme.service.js';
import { User } from '../models/user.model.js';
import { logger } from '../utils/logger.js';
import { AuthRequest } from '../types/auth.types.js';

export class SchemeController {
  static async getEligibleSchemes(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      const language = (req.query.language as string) || user.language || 'en';

      if (!user.onboardingCompleted) {
        res.status(400).json({
          success: false,
          message: 'Please complete your farm profile first',
        });
        return;
      }

      logger.info('Fetching eligible schemes', {
        userId: user._id,
        language,
      });

      const schemesData = await SchemeService.getEligibleSchemes(user, language);

      res.status(200).json({
        success: true,
        data: schemesData,
      });
    } catch (error) {
      logger.error('Error fetching eligible schemes', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to fetch schemes',
        error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined,
      });
    }
  }
}
