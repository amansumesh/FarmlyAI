import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../utils/db.js';
import { Scheme } from '../models/scheme.model.js';
import { User } from '../models/user.model.js';
import { SchemeService } from '../services/scheme.service.js';
import { logger } from '../utils/logger.js';

async function testSchemesAPI() {
  try {
    await connectDB();
    logger.info('Connected to database');

    const schemeCount = await Scheme.countDocuments({ active: true });
    logger.info(`Found ${schemeCount} active schemes in database`);

    if (schemeCount === 0) {
      logger.error('No schemes found. Please run seed:schemes first');
      process.exit(1);
    }

    const schemes = await Scheme.find({ active: true }).limit(3);
    logger.info('Sample schemes:');
    schemes.forEach((scheme) => {
      logger.info(`- ${scheme.name.en} (${scheme.type})`);
    });

    const testUser = await User.findOne({ phoneVerified: true });
    if (!testUser) {
      logger.warn('No verified users found. Creating test user...');
      const newUser = await User.create({
        phoneNumber: '+919876543210',
        phoneVerified: true,
        language: 'en',
        onboardingCompleted: true,
        farmProfile: {
          location: {
            type: 'Point',
            coordinates: [73.8567, 18.5204],
            state: 'Maharashtra',
            district: 'Pune',
          },
          crops: ['tomato', 'rice'],
          landSize: 2.5,
          soilType: 'loamy',
        },
      });
      logger.info(`Created test user: ${newUser._id}`);
      
      const eligibleSchemes = await SchemeService.getEligibleSchemes(newUser, 'en');
      logger.info(`Test user is eligible for ${eligibleSchemes.totalSchemes} schemes`);
      eligibleSchemes.eligibleSchemes.forEach((scheme) => {
        logger.info(`- ${scheme.name} (${scheme.eligibilityMatch}% match)`);
      });
    } else {
      logger.info(`Testing with existing user: ${testUser.phoneNumber}`);
      const eligibleSchemes = await SchemeService.getEligibleSchemes(testUser, 'en');
      logger.info(`User is eligible for ${eligibleSchemes.totalSchemes} schemes`);
      eligibleSchemes.eligibleSchemes.forEach((scheme) => {
        logger.info(`- ${scheme.name} (${scheme.eligibilityMatch}% match)`);
      });
    }

    logger.info('✅ Schemes API test completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Test failed:', error);
    process.exit(1);
  }
}

testSchemesAPI();
