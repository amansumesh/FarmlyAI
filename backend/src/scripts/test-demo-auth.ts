import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../utils/db.js';
import { otpService } from '../services/otp.service.js';
import { logger } from '../utils/logger.js';

async function testDemoAuth() {
  try {
    await connectDB();
    logger.info('Connected to MongoDB');

    const demoPhone = '+919876543210';
    
    logger.info(`\nTesting OTP for demo account: ${demoPhone}`);
    
    // Send OTP
    const result = await otpService.sendOTP(demoPhone);
    logger.info(`OTP sent: ${JSON.stringify(result)}`);
    
    // Verify OTP
    if (result.otp) {
      const verified = await otpService.verifyOTP(demoPhone, result.otp);
      logger.info(`OTP verified: ${verified}`);
      
      if (verified) {
        logger.info('✅ Demo authentication test passed!');
      } else {
        logger.error('❌ Demo authentication test failed!');
      }
    }
    
    process.exit(0);
  } catch (error) {
    logger.error('Error testing demo auth:', error);
    process.exit(1);
  }
}

testDemoAuth();
