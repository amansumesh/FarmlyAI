import { Response } from 'express';
import { z } from 'zod';
import { User } from '../models/user.model.js';
import { logger } from '../utils/logger.js';
import { AuthRequest } from '../types/auth.types.js';

const updateProfileSchema = z.object({
  name: z.string().optional(),
  language: z.enum(['hi', 'ta', 'ml', 'te', 'kn', 'en']).optional(),
  farmProfile: z.object({
    location: z.object({
      coordinates: z.tuple([z.number(), z.number()]),
      address: z.string().optional(),
      state: z.string().optional(),
      district: z.string().optional()
    }).optional(),
    crops: z.array(z.string()).optional(),
    landSize: z.number().positive().optional(),
    soilType: z.enum(['loamy', 'clay', 'sandy', 'red', 'black', 'laterite']).optional()
  }).optional(),
  onboardingCompleted: z.boolean().optional()
});

export class UserController {
  async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const user = await User.findById(userId).select('-__v');

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        user: {
          id: user._id.toString(),
          phoneNumber: user.phoneNumber,
          name: user.name,
          phoneVerified: user.phoneVerified,
          language: user.language,
          farmProfile: user.farmProfile,
          onboardingCompleted: user.onboardingCompleted,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt
        }
      });
    } catch (error) {
      logger.error('Error in getProfile:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user profile'
      });
    }
  }

  async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const validatedData = updateProfileSchema.parse(req.body);

      const user = await User.findById(userId);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      if (validatedData.name !== undefined) {
        user.name = validatedData.name;
      }

      if (validatedData.language) {
        user.language = validatedData.language;
      }

      if (validatedData.farmProfile) {
        if (validatedData.farmProfile.location) {
          user.farmProfile.location = {
            type: 'Point',
            coordinates: validatedData.farmProfile.location.coordinates,
            address: validatedData.farmProfile.location.address,
            state: validatedData.farmProfile.location.state,
            district: validatedData.farmProfile.location.district
          };
        }

        if (validatedData.farmProfile.crops) {
          user.farmProfile.crops = validatedData.farmProfile.crops;
        }

        if (validatedData.farmProfile.landSize !== undefined) {
          user.farmProfile.landSize = validatedData.farmProfile.landSize;
        }

        if (validatedData.farmProfile.soilType) {
          user.farmProfile.soilType = validatedData.farmProfile.soilType;
        }
      }

      if (validatedData.onboardingCompleted !== undefined) {
        user.onboardingCompleted = validatedData.onboardingCompleted;
      }

      await user.save();

      logger.info(`User profile updated: ${userId}`);

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        user: {
          id: user._id.toString(),
          phoneNumber: user.phoneNumber,
          name: user.name,
          phoneVerified: user.phoneVerified,
          language: user.language,
          farmProfile: user.farmProfile,
          onboardingCompleted: user.onboardingCompleted,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt
        }
      });
    } catch (error) {
      logger.error('Error in updateProfile:', error);

      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Invalid input data',
          errors: error.errors
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update user profile'
      });
    }
  }
}

export const userController = new UserController();
