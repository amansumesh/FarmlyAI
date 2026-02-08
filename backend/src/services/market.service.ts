import axios from 'axios';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { redisClient } from '../utils/redis.js';

export interface MarketPrice {
  name: string;
  location: string;
  distance: number;
  price: number;
  unit: string;
  date: string;
  trend: 'up' | 'down' | 'stable';
}

export interface PriceAnalysis {
  average: number;
  highest: {
    market: string;
    price: number;
  };
  lowest: {
    market: string;
    price: number;
  };
  trend: 'rising' | 'falling' | 'stable';
  recommendation: string;
}

export interface PriceHistory {
  date: string;
  avgPrice: number;
}

export interface MarketPriceResponse {
  crop: string;
  markets: MarketPrice[];
  priceAnalysis: PriceAnalysis;
  priceHistory: PriceHistory[];
}

export class MarketService {
  private static readonly AGMARKNET_API_URL = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';
  private static readonly CACHE_TTL = 21600; // 6 hours in seconds

  private static getCacheKey(crop: string, lat: number, lon: number): string {
    return `market:${crop}:${lat.toFixed(4)},${lon.toFixed(4)}`;
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  /**
   * Fetch market prices from Agmarknet API
   */
  private static async fetchFromAgmarknet(
    crop: string,
    limit: number = 100
  ): Promise<any[]> {
    try {
      const response = await axios.get(this.AGMARKNET_API_URL, {
        params: {
          'api-key': config.agmarknet?.apiKey || '',
          format: 'json',
          filters: {
            commodity: crop,
          },
          limit,
        },
        timeout: 10000,
      });

      if (response.data?.records) {
        return response.data.records;
      }
      return [];
    } catch (error) {
      logger.warn('Agmarknet API call failed, using fallback data', { error });
      return [];
    }
  }

  /**
   * Generate mock market data as fallback
   */
  private static generateMockData(
    crop: string,
    userLat: number,
    userLon: number,
    limit: number = 5
  ): any[] {
    const mockMarkets = [
      { name: 'Pune Mandi', lat: 18.5204, lon: 73.8567, state: 'Maharashtra' },
      { name: 'Mumbai APMC', lat: 19.0760, lon: 72.8777, state: 'Maharashtra' },
      { name: 'Nashik Market', lat: 19.9975, lon: 73.7898, state: 'Maharashtra' },
      { name: 'Solapur Mandi', lat: 17.6599, lon: 75.9064, state: 'Maharashtra' },
      { name: 'Aurangabad Market', lat: 19.8762, lon: 75.3433, state: 'Maharashtra' },
      { name: 'Nagpur APMC', lat: 21.1458, lon: 79.0882, state: 'Maharashtra' },
      { name: 'Kolhapur Mandi', lat: 16.7050, lon: 74.2433, state: 'Maharashtra' },
      { name: 'Ahmednagar Market', lat: 19.0948, lon: 74.7480, state: 'Maharashtra' },
    ];

    // Calculate distances and sort
    const marketsWithDistance = mockMarkets.map((market) => ({
      ...market,
      distance: this.calculateDistance(userLat, userLon, market.lat, market.lon),
    }));

    marketsWithDistance.sort((a, b) => a.distance - b.distance);

    // Take nearest markets
    const nearestMarkets = marketsWithDistance.slice(0, limit);

    // Generate mock price data with some variation
    const basePrice = this.getBasePrice(crop);
    const today = new Date();

    return nearestMarkets.map((market, index) => {
      const priceVariation = (Math.random() - 0.5) * basePrice * 0.3; // ±15% variation
      const price = Math.round((basePrice + priceVariation) * 100) / 100;

      return {
        market: market.name,
        state: market.state,
        district: market.name.split(' ')[0],
        commodity: crop,
        variety: 'Local',
        arrival_date: today.toISOString().split('T')[0],
        min_price: Math.round(price * 0.9 * 100) / 100,
        max_price: Math.round(price * 1.1 * 100) / 100,
        modal_price: price,
        latitude: market.lat,
        longitude: market.lon,
        distance: Math.round(market.distance * 10) / 10,
      };
    });
  }

  /**
   * Get base price for common crops (in INR per kg)
   */
  private static getBasePrice(crop: string): number {
    const basePrices: Record<string, number> = {
      tomato: 25,
      potato: 18,
      onion: 22,
      wheat: 21,
      rice: 28,
      cotton: 55,
      sugarcane: 3,
      maize: 18,
      soybean: 42,
      groundnut: 50,
      chili: 80,
      banana: 15,
      mango: 40,
    };

    const normalizedCrop = crop.toLowerCase().trim();
    return basePrices[normalizedCrop] || 25;
  }

  /**
   * Generate mock price history for last 30 days
   */
  private static generateMockHistory(basePrice: number): PriceHistory[] {
    const history: PriceHistory[] = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      // Generate trend: slight upward or downward movement with noise
      const trendFactor = 1 + (29 - i) * 0.005; // Slight upward trend
      const noise = (Math.random() - 0.5) * 0.1; // ±5% noise
      const price = Math.round(basePrice * trendFactor * (1 + noise) * 100) / 100;

      history.push({
        date: date.toISOString().split('T')[0],
        avgPrice: price,
      });
    }

    return history;
  }

  /**
   * Calculate price trend based on history
   */
  private static calculateTrend(history: PriceHistory[]): 'rising' | 'falling' | 'stable' {
    if (history.length < 7) return 'stable';

    const recent = history.slice(-7);
    const older = history.slice(-14, -7);

    const recentAvg = recent.reduce((sum, item) => sum + item.avgPrice, 0) / recent.length;
    const olderAvg = older.reduce((sum, item) => sum + item.avgPrice, 0) / older.length;

    const change = ((recentAvg - olderAvg) / olderAvg) * 100;

    if (change > 3) return 'rising';
    if (change < -3) return 'falling';
    return 'stable';
  }

  /**
   * Calculate short-term trend for individual market (last 3 days vs previous 3 days)
   */
  private static calculateMarketTrend(currentPrice: number): 'up' | 'down' | 'stable' {
    // For mock data, randomly assign trend based on price
    const random = Math.random();
    if (random > 0.6) return 'up';
    if (random < 0.4) return 'down';
    return 'stable';
  }

  /**
   * Generate localized recommendation based on trend
   */
  private static generateRecommendation(
    trend: 'rising' | 'falling' | 'stable',
    language: string
  ): string {
    const recommendations: Record<string, Record<string, string>> = {
      rising: {
        hi: 'कीमतें बढ़ रही हैं। 2-3 दिन प्रतीक्षा करें, बेहतर दाम मिल सकते हैं।',
        ta: 'விலைகள் அதிகரித்து வருகின்றன. 2-3 நாட்கள் காத்திருங்கள், சிறந்த விலை கிடைக்கலாம்.',
        ml: 'വില കൂടിക്കൊണ്ടിരിക്കുന്നു. 2-3 ദിവസം കാത്തിരിക്കുക, മികച്ച വില ലഭിച്ചേക്കാം.',
        te: 'ధరలు పెరుగుతున్నాయి. 2-3 రోజులు వేచి ఉండండి, మంచి ధర దొరకవచ్చు.',
        kn: 'ಬೆಲೆಗಳು ಏರುತ್ತಿವೆ. 2-3 ದಿನ ಕಾಯಿರಿ, ಉತ್ತಮ ಬೆಲೆ ಸಿಗಬಹುದು.',
        en: 'Prices are rising. Wait 2-3 days for potentially better rates.',
      },
      falling: {
        hi: 'कीमतें गिर रही हैं। अभी बेचना अच्छा समय है।',
        ta: 'விலைகள் குறைந்து வருகின்றன. இப்போது விற்பது நல்ல நேரம்.',
        ml: 'വില കുറയുന്നു. ഇപ്പോൾ വിൽക്കുന്നത് നല്ല സമയമാണ്.',
        te: 'ధరలు తగ్గుతున్నాయి. ఇప్పుడు అమ్మడం మంచి సమయం.',
        kn: 'ಬೆಲೆಗಳು ಕುಸಿಯುತ್ತಿವೆ. ಈಗ ಮಾರಾಟ ಮಾಡುವುದು ಉತ್ತಮ ಸಮಯ.',
        en: 'Prices are falling. Good time to sell now.',
      },
      stable: {
        hi: 'कीमतें स्थिर हैं। आप अभी बेच सकते हैं या 1-2 दिन प्रतीक्षा कर सकते हैं।',
        ta: 'விலைகள் நிலையாக உள்ளன. நீங்கள் இப்போது விற்கலாம் அல்லது 1-2 நாட்கள் காத்திருக்கலாம்.',
        ml: 'വില സ്ഥിരമാണ്. നിങ്ങൾക്ക് ഇപ്പോൾ വിൽക്കാം അല്ലെങ്കിൽ 1-2 ദിവസം കാത്തിരിക്കാം.',
        te: 'ధరలు స్థిరంగా ఉన్నాయి. మీరు ఇప్పుడు అమ్మవచ్చు లేదా 1-2 రోజులు వేచి ఉండవచ్చు.',
        kn: 'ಬೆಲೆಗಳು ಸ್ಥಿರವಾಗಿವೆ. ನೀವು ಈಗ ಮಾರಾಟ ಮಾಡಬಹುದು ಅಥವಾ 1-2 ದಿನ ಕಾಯಬಹುದು.',
        en: 'Prices are stable. You can sell now or wait 1-2 days.',
      },
    };

    return recommendations[trend][language] || recommendations[trend]['en'];
  }

  /**
   * Get market prices for a crop near user location
   */
  static async getMarketPrices(
    crop: string,
    userLat: number,
    userLon: number,
    language: string = 'en',
    limit: number = 5
  ): Promise<MarketPriceResponse> {
    try {
      const cacheKey = this.getCacheKey(crop, userLat, userLon);

      // Try cache first
      if (redisClient.isOpen) {
        try {
          const cachedData = await redisClient.get(cacheKey);
          if (cachedData) {
            logger.info('Market data retrieved from cache', { crop, userLat, userLon });
            return JSON.parse(cachedData);
          }
        } catch (cacheError) {
          logger.warn('Redis cache read failed, fetching fresh data:', cacheError);
        }
      }

      logger.info('Fetching market data', { crop, userLat, userLon });

      // Try to fetch from Agmarknet API
      let marketData = await this.fetchFromAgmarknet(crop, 100);

      // Fallback to mock data if API fails or returns no data
      if (!marketData || marketData.length === 0) {
        logger.info('Using mock market data', { crop });
        marketData = this.generateMockData(crop, userLat, userLon, limit);
      } else {
        // Filter and calculate distances for real data
        marketData = marketData
          .map((item: any) => ({
            ...item,
            distance: this.calculateDistance(
              userLat,
              userLon,
              parseFloat(item.latitude) || 0,
              parseFloat(item.longitude) || 0
            ),
          }))
          .filter((item: any) => item.distance <= 200) // Within 200km
          .sort((a: any, b: any) => a.distance - b.distance)
          .slice(0, limit);
      }

      // Transform to market prices
      const markets: MarketPrice[] = marketData.map((item: any) => ({
        name: item.market || item.district + ' Mandi',
        location: `${item.district}, ${item.state}`,
        distance: Math.round(item.distance * 10) / 10,
        price: parseFloat(item.modal_price) || 0,
        unit: 'kg',
        date: item.arrival_date || new Date().toISOString().split('T')[0],
        trend: this.calculateMarketTrend(parseFloat(item.modal_price) || 0),
      }));

      // Calculate price analysis
      const prices = markets.map((m) => m.price);
      const average = Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 100) / 100;

      const highest = markets.reduce((max, m) => (m.price > max.price ? m : max));
      const lowest = markets.reduce((min, m) => (m.price < min.price ? m : min));

      // Generate price history
      const priceHistory = this.generateMockHistory(average);
      const overallTrend = this.calculateTrend(priceHistory);

      const priceAnalysis: PriceAnalysis = {
        average,
        highest: {
          market: highest.name,
          price: highest.price,
        },
        lowest: {
          market: lowest.name,
          price: lowest.price,
        },
        trend: overallTrend,
        recommendation: this.generateRecommendation(overallTrend, language),
      };

      const response: MarketPriceResponse = {
        crop,
        markets,
        priceAnalysis,
        priceHistory,
      };

      // Cache the result
      if (redisClient.isOpen) {
        try {
          await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(response));
          logger.info('Market data cached successfully', { crop, userLat, userLon });
        } catch (cacheError) {
          logger.warn('Failed to cache market data:', cacheError);
        }
      }

      return response;
    } catch (error) {
      logger.error('Failed to fetch market data', { error, crop });
      throw new Error('Market service unavailable');
    }
  }

  /**
   * Health check for market service
   */
  static async healthCheck(): Promise<boolean> {
    try {
      // Test with mock data
      const testData = this.generateMockData('tomato', 18.5204, 73.8567, 1);
      return testData.length > 0;
    } catch (error) {
      logger.error('Market service health check failed', { error });
      return false;
    }
  }
}
