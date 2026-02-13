import { redisClient } from '../utils/redis.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

const OTP_TTL = 600; // 10 minutes in seconds
const MAX_ATTEMPTS = 3;
const RATE_LIMIT_TTL = 3600; // 1 hour in seconds

interface OTPData {
  otp: string;
  attempts: number;
  expiresAt: number;
}

class OTPService {
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private getOTPKey(phoneNumber: string): string {
    return `otp:${phoneNumber}`;
  }

  private getRateLimitKey(phoneNumber: string): string {
    return `otp:ratelimit:${phoneNumber}`;
  }

  private isDemoAccount(phoneNumber: string): boolean {
    return config.demo.enabled && config.demo.accounts.includes(phoneNumber);
  }

  async sendOTP(phoneNumber: string): Promise<{ success: boolean; expiresIn: number; otp?: string }> {
    try {
      // Demo mode: Use fixed OTP for demo accounts
      if (this.isDemoAccount(phoneNumber)) {
        const otp = config.demo.otp;
        const expiresAt = Date.now() + (OTP_TTL * 1000);

        const otpData: OTPData = {
          otp,
          attempts: 0,
          expiresAt
        };

        const otpKey = this.getOTPKey(phoneNumber);
        await redisClient.setEx(otpKey, OTP_TTL, JSON.stringify(otpData));

        logger.info(`[DEMO MODE] OTP sent to demo account ${phoneNumber}: ${otp}`);
        return { success: true, expiresIn: OTP_TTL, otp };
      }

      // Check rate limiting
      const rateLimitKey = this.getRateLimitKey(phoneNumber);
      const rateLimitCount = await redisClient.get(rateLimitKey);
      
      if (rateLimitCount && parseInt(rateLimitCount) >= 5) {
        throw new Error('Too many OTP requests. Please try again later.');
      }

      // Generate OTP
      const otp = this.generateOTP();
      const expiresAt = Date.now() + (OTP_TTL * 1000);

      const otpData: OTPData = {
        otp,
        attempts: 0,
        expiresAt
      };

      // Store OTP in Redis
      const otpKey = this.getOTPKey(phoneNumber);
      await redisClient.setEx(otpKey, OTP_TTL, JSON.stringify(otpData));

      // Increment rate limit counter
      const currentCount = rateLimitCount ? parseInt(rateLimitCount) : 0;
      await redisClient.setEx(rateLimitKey, RATE_LIMIT_TTL, (currentCount + 1).toString());

      // Send OTP via Twilio
      await this.sendSMS(phoneNumber, otp);

      logger.info(`OTP sent to ${phoneNumber}`);

      // Return OTP in development mode for testing
      if (config.nodeEnv === 'development') {
        return { success: true, expiresIn: OTP_TTL, otp };
      }

      return { success: true, expiresIn: OTP_TTL };
    } catch (error) {
      logger.error('Error sending OTP:', error);
      throw error;
    }
  }

  async verifyOTP(phoneNumber: string, otp: string): Promise<boolean> {
    try {
      const otpKey = this.getOTPKey(phoneNumber);
      const storedData = await redisClient.get(otpKey);

      if (!storedData) {
        throw new Error('OTP expired or not found');
      }

      const otpData: OTPData = JSON.parse(storedData);

      // Check if OTP has expired
      if (Date.now() > otpData.expiresAt) {
        await redisClient.del(otpKey);
        throw new Error('OTP has expired');
      }

      // Check max attempts
      if (otpData.attempts >= MAX_ATTEMPTS) {
        await redisClient.del(otpKey);
        throw new Error('Maximum OTP verification attempts exceeded');
      }

      // Verify OTP
      if (otpData.otp === otp) {
        // Delete OTP after successful verification
        await redisClient.del(otpKey);
        logger.info(`OTP verified successfully for ${phoneNumber}`);
        return true;
      }

      // Increment attempts
      otpData.attempts += 1;
      await redisClient.setEx(otpKey, OTP_TTL, JSON.stringify(otpData));

      throw new Error('Invalid OTP');
    } catch (error) {
      logger.error('Error verifying OTP:', error);
      throw error;
    }
  }

  private async sendSMS(phoneNumber: string, otp: string): Promise<void> {
    // In development mode, just log the OTP
    if (config.nodeEnv === 'development') {
      logger.info(`[DEVELOPMENT] OTP for ${phoneNumber}: ${otp}`);
      return;
    }

    // Production: Use Twilio to send SMS
    try {
      // Check if Twilio is configured
      if (!config.twilio.accountSid || !config.twilio.authToken || !config.twilio.phoneNumber) {
        logger.warn('Twilio not configured. OTP will only be logged.');
        logger.info(`OTP for ${phoneNumber}: ${otp}`);
        return;
      }

      // Dynamically import Twilio (optional dependency)
      const twilio = await import('twilio').then(m => m.default);
      const client = twilio(config.twilio.accountSid, config.twilio.authToken);

      await client.messages.create({
        body: `Your Farmly AI verification code is: ${otp}. Valid for 10 minutes.`,
        from: config.twilio.phoneNumber,
        to: phoneNumber
      });

      logger.info(`SMS sent successfully to ${phoneNumber}`);
    } catch (error) {
      logger.error('Error sending SMS via Twilio:', error);
      // Fallback: log OTP for development
      logger.info(`[FALLBACK] OTP for ${phoneNumber}: ${otp}`);
    }
  }

  async clearOTP(phoneNumber: string): Promise<void> {
    const otpKey = this.getOTPKey(phoneNumber);
    await redisClient.del(otpKey);
  }
}

export const otpService = new OTPService();
