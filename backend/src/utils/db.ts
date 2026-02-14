import mongoose from 'mongoose';
import dns from 'dns';
import { config } from '../config/index.js';
import { logger } from './logger.js';

// Set DNS resolver order to IPv4 first for Windows compatibility
dns.setDefaultResultOrder('ipv4first');

export async function connectDB() {
  try {
    await mongoose.connect(config.mongodb.uri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4, // Force IPv4
    });
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    throw error;
  }
}

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('error', (error) => {
  logger.error('MongoDB error:', error);
});
