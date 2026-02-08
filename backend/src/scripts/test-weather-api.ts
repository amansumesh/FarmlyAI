import dotenv from 'dotenv';
dotenv.config();

import { WeatherService } from '../services/weather.service.js';
import { logger } from '../utils/logger.js';

async function testWeatherAPI() {
  try {
    logger.info('Testing Weather API...');
    
    // Test with Mumbai coordinates
    const lat = 19.0760;
    const lon = 72.8777;
    
    logger.info(`Fetching weather for Mumbai (${lat}, ${lon})`);
    
    const result = await WeatherService.getForecast(lat, lon);
    
    logger.info('Weather API Test Results:');
    logger.info('Location:', result.location);
    logger.info('Current Weather:', {
      temp: result.current.temp,
      description: result.current.description,
      humidity: result.current.humidity,
      windSpeed: result.current.windSpeed,
    });
    logger.info(`Forecast days: ${result.forecast.length}`);
    
    if (result.forecast.length > 0) {
      logger.info('First forecast day:', {
        date: result.forecast[0].date,
        temp: result.forecast[0].temp,
        description: result.forecast[0].description,
      });
    }
    
    logger.info('✅ Weather API test completed successfully!');
    
    // Test health check
    const isHealthy = await WeatherService.healthCheck();
    logger.info(`Weather service health check: ${isHealthy ? '✅ Healthy' : '❌ Unhealthy'}`);
    
  } catch (error) {
    logger.error('❌ Weather API test failed:', error);
    process.exit(1);
  }
}

testWeatherAPI();
