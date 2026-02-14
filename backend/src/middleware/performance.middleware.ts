import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

/**
 * Performance monitoring middleware
 * Tracks API response times and logs slow requests
 */
export function performanceMonitoring(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, originalUrl, ip } = req;
    const { statusCode } = res;

    if (duration > 2000) {
      logger.warn('Slow API request detected', {
        method,
        url: originalUrl,
        statusCode,
        duration: `${duration}ms`,
        ip,
      });
    }

    if (process.env.NODE_ENV === 'development') {
      logger.info('API Request', {
        method,
        url: originalUrl,
        statusCode,
        duration: `${duration}ms`,
      });
    }
  });

  next();
}

/**
 * Cache control middleware
 * Sets appropriate cache headers for different resource types
 */
export function cacheControl(req: Request, res: Response, next: NextFunction) {
  const { path } = req;

  if (path.startsWith('/api/market') || path.startsWith('/api/weather')) {
    res.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=7200');
  } else if (path.startsWith('/api/schemes')) {
    res.set('Cache-Control', 'public, max-age=86400');
  } else if (path.startsWith('/api/advisory')) {
    res.set('Cache-Control', 'public, max-age=43200');
  } else if (path.startsWith('/api/user') || path.startsWith('/api/query')) {
    res.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  } else {
    res.set('Cache-Control', 'public, max-age=300');
  }

  next();
}

/**
 * Response time header middleware
 * Adds X-Response-Time header to all responses
 */
export function addResponseTimeHeader(_req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  const originalSend = res.send;
  const originalJson = res.json;
  
  res.send = function (body?: unknown): Response {
    const duration = Date.now() - start;
    res.setHeader('X-Response-Time', `${duration}ms`);
    return originalSend.call(this, body);
  };

  res.json = function (body?: unknown): Response {
    const duration = Date.now() - start;
    res.setHeader('X-Response-Time', `${duration}ms`);
    return originalJson.call(this, body);
  };

  next();
}
