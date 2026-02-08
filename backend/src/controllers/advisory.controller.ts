import { Request, Response } from 'express';
import { AdvisoryService } from '../services/advisory.service.js';
import { logger } from '../utils/logger.js';

export class AdvisoryController {
  static async getRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
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
    } catch (error: any) {
      logger.error('Error generating advisory recommendations', {
        error: error.message,
        stack: error.stack,
      });

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

      res.status(500).json({
        success: false,
        message: 'Failed to generate recommendations',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
}
