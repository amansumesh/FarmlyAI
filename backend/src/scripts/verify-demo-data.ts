import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../utils/db.js';
import { User } from '../models/user.model.js';
import { Query } from '../models/query.model.js';
import { DiseaseDetection } from '../models/disease.model.js';
import { logger } from '../utils/logger.js';

async function verifyDemoData() {
  try {
    await connectDB();
    logger.info('Connected to MongoDB\n');

    const demoPhoneNumbers = [
      '+919876543210',
      '+919876543211',
      '+919876543212',
      '+919876543213',
      '+919876543214',
    ];

    // Check users
    const users = await User.find({ phoneNumber: { $in: demoPhoneNumbers } });
    logger.info(`✓ Found ${users.length} demo users`);
    
    for (const user of users) {
      const queryCount = await Query.countDocuments({ userId: user._id });
      const detectionCount = await DiseaseDetection.countDocuments({ userId: user._id });
      
      logger.info(`  - ${user.phoneNumber} (${user.language}): ${queryCount} queries, ${detectionCount} detections`);
    }

    // Total counts
    const totalQueries = await Query.countDocuments({ userId: { $in: users.map(u => u._id) } });
    const totalDetections = await DiseaseDetection.countDocuments({ userId: { $in: users.map(u => u._id) } });
    
    logger.info(`\nTotal demo queries: ${totalQueries}`);
    logger.info(`Total demo disease detections: ${totalDetections}`);
    logger.info('\n✅ Demo data verification complete!\n');

    process.exit(0);
  } catch (error) {
    logger.error('Error verifying demo data:', error);
    process.exit(1);
  }
}

verifyDemoData();
