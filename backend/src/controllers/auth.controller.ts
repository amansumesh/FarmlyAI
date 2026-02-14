import { Request, Response } from 'express';
import { z } from 'zod';
import { User } from '../models/user.model.js';
import { otpService } from '../services/otp.service.js';
import { jwtService } from '../services/jwt.service.js';
import { logger } from '../utils/logger.js';

// Validation schemas
const sendOTPSchema = z.object({
  phoneNumber: z.string()
    .regex(/^\+\d{1,3}\d{10}$/, 'Invalid phone number format. Use +91XXXXXXXXXX')
});

const verifyOTPSchema = z.object({
  phoneNumber: z.string()
    .regex(/^\+\d{1,3}\d{10}$/, 'Invalid phone number format'),
  otp: z.string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only digits')
});

export class AuthController {
  async sendOTP(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      const { phoneNumber } = sendOTPSchema.parse(req.body);

      // Send OTP
      const result = await otpService.sendOTP(phoneNumber);

      res.status(200).json({
        success: true,
        message: 'OTP sent successfully',
        expiresIn: result.expiresIn,
        ...(result.otp && { otp: result.otp }) // Include OTP in development mode
      });
    } catch (error) {
      logger.error('Error in sendOTP:', error);

      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: error.errors[0].message
        });
        return;
      }

      if (error instanceof Error) {
        if (error.message.includes('Too many')) {
          res.status(429).json({
            success: false,
            message: error.message
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        message: 'Failed to send OTP'
      });
    }
  }

  async verifyOTP(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      const { phoneNumber, otp } = verifyOTPSchema.parse(req.body);

      // Verify OTP
      await otpService.verifyOTP(phoneNumber, otp);

      // Find or create user
      let user = await User.findOne({ phoneNumber });

      if (!user) {
        user = await User.create({
          phoneNumber,
          phoneVerified: true,
          language: 'hi',
          onboardingCompleted: false,
          farmProfile: {
            crops: []
          }
        });
        logger.info(`New user created: ${phoneNumber}`);
      } else {
        // Update last login
        user.phoneVerified = true;
        user.lastLoginAt = new Date();
        await user.save();
        logger.info(`User logged in: ${phoneNumber}`);
      }

      // Generate tokens
      const tokenPayload = {
        userId: user._id.toString(),
        phoneNumber: user.phoneNumber
      };

      const { token, refreshToken } = jwtService.generateTokenPair(tokenPayload);

      res.status(200).json({
        success: true,
        token,
        refreshToken,
        user: {
          id: user._id.toString(),
          phoneNumber: user.phoneNumber,
          name: user.name,
          language: user.language,
          onboardingCompleted: user.onboardingCompleted,
          farmProfile: user.farmProfile
        }
      });
    } catch (error) {
      logger.error('Error in verifyOTP:', error);

      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: error.errors[0].message
        });
        return;
      }

      if (error instanceof Error) {
        if (error.message.includes('expired')) {
          res.status(401).json({
            success: false,
            message: error.message
          });
          return;
        }

        if (error.message.includes('Maximum') || error.message.includes('Invalid OTP')) {
          res.status(400).json({
            success: false,
            message: error.message
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        message: 'Failed to verify OTP'
      });
    }
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          message: 'Refresh token required'
        });
        return;
      }

      // Verify refresh token
      const decoded = jwtService.verifyRefreshToken(refreshToken);

      // Generate new access token
      const tokenPayload = {
        userId: decoded.userId,
        phoneNumber: decoded.phoneNumber
      };

      const newToken = jwtService.generateAccessToken(tokenPayload);

      res.status(200).json({
        success: true,
        token: newToken
      });
    } catch (error) {
      logger.error('Error in refreshToken:', error);

      res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }
  }
}

export const authController = new AuthController();
