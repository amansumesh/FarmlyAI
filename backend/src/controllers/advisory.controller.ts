import { Response } from 'express';
import { AdvisoryService } from '../services/advisory.service.js';
import { User } from '../models/user.model.js';
import { logger } from '../utils/logger.js';
import { AuthRequest } from '../types/auth.types.js';

export class AdvisoryController {
  static async getRecommendations(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      // Fetch the full user object from database
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      const language = (req.query.language as string) || user.language || 'en';

      // Validate user has completed onboarding
      if (!user.onboardingCompleted) {
        res.status(400).json({
          success: false,
          message: 'Please complete your farm profile first',
        });
        return;
      }

      // Validate user has location data
      if (
        !user.farmProfile.location ||
        !user.farmProfile.location.coordinates ||
        user.farmProfile.location.coordinates.length !== 2
      ) {
        res.status(400).json({
          success: false,
          message: 'Farm location is required for personalized recommendations',
        });
        return;
      }

      // Validate user has at least one crop
      if (!user.farmProfile.crops || user.farmProfile.crops.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Please add at least one crop to your farm profile',
        });
        return;
      }

      logger.info('Generating advisory recommendations', {
        userId: user._id,
        language,
      });

      const advisoryData = await AdvisoryService.getRecommendations(user, language);

      res.status(200).json({
        success: true,
        data: advisoryData,
      });
    } catch (error) {
      logger.error('Error generating advisory recommendations', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      if (error instanceof Error) {
        if (error.message === 'User location not available') {
          res.status(400).json({
            success: false,
            message: 'Farm location is required for personalized recommendations',
          });
          return;
        }

        if (error.message === 'Weather service unavailable') {
          res.status(503).json({
            success: false,
            message: 'Weather service is currently unavailable. Please try again later.',
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        message: 'Failed to generate recommendations',
        error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined,
      });
    }
  }
}
