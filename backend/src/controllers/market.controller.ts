import { Request, Response } from 'express';
import { MarketService } from '../services/market.service.js';
import { logger } from '../utils/logger.js';
import { User } from '../models/user.model.js';

export class MarketController {
  /**
   * GET /api/market/prices
   * Get market prices for a specific crop
   */
  static async getMarketPrices(req: Request, res: Response) {
    try {
      const { crop, language = 'en', limit = '5' } = req.query;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      if (!crop || typeof crop !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Crop name is required',
        });
      }

      // Get user's location from profile
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      if (!user.farmProfile?.location?.coordinates) {
        return res.status(400).json({
          success: false,
          error: 'User location not set. Please complete your farm profile.',
        });
      }

      const [userLon, userLat] = user.farmProfile.location.coordinates;
      const userLanguage = language as string || user.language || 'en';
      const limitNum = parseInt(limit as string, 10) || 5;

      logger.info('Fetching market prices', {
        userId,
        crop,
        userLat,
        userLon,
        language: userLanguage,
      });

      const includeFar = req.query.includeFar === 'true' || req.query.includeFar === '1';

      const marketData = await MarketService.getMarketPrices(
        crop,
        userLat,
        userLon,
        userLanguage,
        Math.min(limitNum, 10), // Max 10 markets
        includeFar
      );

      return res.json({
        success: true,
        data: marketData,
      });
    } catch (error) {
      logger.error('Error fetching market prices', { error });
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch market prices',
      });
    }
  }

  /**
   * GET /api/market/health
   * Health check endpoint
   */
  static async healthCheck(_req: Request, res: Response) {
    try {
      const isHealthy = await MarketService.healthCheck();
      return res.json({
        success: true,
        healthy: isHealthy,
        service: 'market',
      });
    } catch (error) {
      logger.error('Market health check failed', { error });
      return res.status(500).json({
        success: false,
        healthy: false,
        service: 'market',
      });
    }
  }

  /**
   * POST /api/market/clear-cache
   * Clear market price cache
   */
  static async clearCache(_req: Request, res: Response) {
    try {
      const deletedCount = await MarketService.clearCache();
      return res.json({
        success: true,
        message: `Cleared ${deletedCount} cache entries`,
        deletedCount,
      });
    } catch (error) {
      logger.error('Failed to clear cache', { error });
      return res.status(500).json({
        success: false,
        error: 'Failed to clear cache',
      });
    }
  }
}
