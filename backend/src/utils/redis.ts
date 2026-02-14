import { createClient, RedisClientType } from 'redis';
import { config } from '../config/index.js';
import { logger } from './logger.js';

export const redisClient: RedisClientType = createClient({
  url: config.redis.url,
  socket: {
    reconnectStrategy: false, // Disable reconnection attempts for now
  },
}) as RedisClientType;

export async function connectRedis() {
  try {
    await redisClient.connect();
    logger.info('Redis connected successfully');
  } catch (error) {
    logger.error('Redis connection error:', error);
    throw error;
  }
}

redisClient.on('error', (error) => {
  logger.error('Redis error:', error);
});

redisClient.on('disconnect', () => {
  logger.warn('Redis disconnected');
});
