import { Router } from 'express';
import { MarketController } from '../controllers/market.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { rateLimiter } from '../middleware/rateLimiter.middleware.js';

const router: ReturnType<typeof Router> = Router();

// Apply rate limiting to market endpoints (max 30 requests per minute)
router.use(rateLimiter({ windowMs: 60000, max: 30 }));

// GET /api/market/prices - Get market prices for a crop
router.get('/prices', authenticateToken, MarketController.getMarketPrices);

// GET /api/market/health - Health check
router.get('/health', MarketController.healthCheck);

// POST /api/market/clear-cache - Clear cache (authenticated)
router.post('/clear-cache', authenticateToken, MarketController.clearCache);

export default router;
