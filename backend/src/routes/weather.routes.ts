import { Router } from 'express';
import { weatherController } from '../controllers/weather.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router: ReturnType<typeof Router> = Router();

router.get('/forecast', authenticateToken, weatherController.getForecast.bind(weatherController));

export default router;
