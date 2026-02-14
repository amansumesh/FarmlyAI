import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { connectDB } from './utils/db.js';
import { connectRedis } from './utils/redis.js';
import { logger } from './utils/logger.js';

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import diseaseRoutes from './routes/disease.routes.js';
import queryRoutes from './routes/query.routes.js';
import weatherRoutes from './routes/weather.routes.js';
import marketRoutes from './routes/market.routes.js';
import advisoryRoutes from './routes/advisory.routes.js';
import schemeRoutes from './routes/scheme.routes.js';

import { errorHandler, notFoundHandler } from './middleware/errorHandler.middleware.js';
import { performanceMonitoring, cacheControl, addResponseTimeHeader } from './middleware/performance.middleware.js';

// ✅ Step 7 + Step 8 imports
import { startSchemeCron } from './cron/scheme.cron.js';
import { updateSchemes } from './services/scheme.service.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(addResponseTimeHeader);
app.use(performanceMonitoring);
app.use(cacheControl);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded images in development
if (process.env.NODE_ENV === 'development') {
  app.use('/uploads', express.static('uploads'));
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/disease', diseaseRoutes);
app.use('/api/query', queryRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/advisory', advisoryRoutes);
app.use('/api/schemes', schemeRoutes);

app.get('/health', async (_req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    db: 'disconnected',
    redis: 'disconnected'
  };

  try {
    // Check MongoDB connection
    const mongoose = await import('mongoose');
    if (mongoose.default.connection.readyState === 1) {
      health.db = 'connected';
    }

    // Check Redis connection
    const { redisClient } = await import('./utils/redis.js');
    if (redisClient.isOpen) {
      health.redis = 'connected';
    }

    res.json(health);
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(500).json({ ...health, status: 'error' });
  }
});

app.get('/', (_req, res) => {
  res.json({
    message: 'Farmly AI API',
    version: '1.0.0',
    docs: '/api/docs'
  });
});

// Error handling middleware (must be after all routes)
app.use(notFoundHandler);
app.use(errorHandler);

async function startServer() {
  try {
    await connectDB();

    // Try Redis but don't fail if it's not available
    try {
      await connectRedis();
    } catch (redisError) {
      logger.warn('Redis connection failed, continuing without cache:', redisError);
    }

    // ✅ STEP 7: Start cron job
    startSchemeCron();

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);

      // ✅ STEP 8: Update schemes in background after startup
      updateSchemes().then((updated) => {
        logger.info(`✅ Initial Scheme Update done: ${updated}`);
      }).catch((err) => {
        logger.error('❌ Initial scheme update failed:', err);
      });
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();