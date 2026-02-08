import { Router } from 'express';
import { MarketController } from '../controllers/market.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { rateLimiter } from '../middleware/rateLimiter.middleware.js';

const router = Router();

// Apply rate limiting to market endpoints (max 30 requests per minute)
router.use(rateLimiter(30, 60000));

// GET /api/market/prices - Get market prices for a crop
router.get('/prices', authMiddleware, MarketController.getMarketPrices);

// GET /api/market/health - Health check
router.get('/health', MarketController.healthCheck);

export default router;
