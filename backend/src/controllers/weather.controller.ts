import { Response } from 'express';
import { z } from 'zod';
import { WeatherService } from '../services/weather.service.js';
import { logger } from '../utils/logger.js';
import { AuthRequest } from '../types/auth.types.js';
import { User } from '../models/user.model.js';

const getForecastQuerySchema = z.object({
  lat: z.string().optional(),
  lon: z.string().optional(),
  language: z.enum(['hi', 'ta', 'ml', 'te', 'kn', 'en']).optional(),
});

export class WeatherController {
  async getForecast(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const validatedQuery = getForecastQuerySchema.parse(req.query);

      let lat: number;
      let lon: number;

      // Use coordinates from query params if provided
      if (validatedQuery.lat && validatedQuery.lon) {
        lat = parseFloat(validatedQuery.lat);
        lon = parseFloat(validatedQuery.lon);

        if (isNaN(lat) || isNaN(lon)) {
          res.status(400).json({
            success: false,
            message: 'Invalid coordinates',
          });
          return;
        }

        if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
          res.status(400).json({
            success: false,
            message: 'Coordinates out of range',
          });
          return;
        }
      } else {
        // Get coordinates from user profile
        const user = await User.findById(userId);

        if (!user) {
          res.status(404).json({
            success: false,
            message: 'User not found',
          });
          return;
        }

        if (
          !user.farmProfile?.location?.coordinates ||
          user.farmProfile.location.coordinates.length !== 2
        ) {
          res.status(400).json({
            success: false,
            message: 'Location not set in profile. Please provide lat/lon or complete onboarding.',
          });
          return;
        }

        // MongoDB stores coordinates as [longitude, latitude]
        lon = user.farmProfile.location.coordinates[0];
        lat = user.farmProfile.location.coordinates[1];
      }

      logger.info('Fetching weather forecast', { userId, lat, lon });

      const weatherData = await WeatherService.getForecast(lat, lon);

      res.status(200).json({
        success: true,
        data: weatherData,
      });
    } catch (error) {
      logger.error('Error in getForecast:', error);

      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors: error.errors,
        });
        return;
      }

      if (error instanceof Error) {
        if (error.message === 'Invalid OpenWeatherMap API key') {
          res.status(500).json({
            success: false,
            message: 'Weather service configuration error',
          });
          return;
        }
        if (error.message === 'Location not found') {
          res.status(404).json({
            success: false,
            message: 'Location not found',
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        message: 'Failed to fetch weather forecast',
      });
    }
  }
}

export const weatherController = new WeatherController();
