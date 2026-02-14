import axios from 'axios';
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
  changePercent: number;
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
  // recommendation: string;
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
  updatedAt: string;
}

interface AgmarknetRecord {
  market?: string;
  state: string;
  district: string;
  commodity: string;
  variety?: string;
  arrival_date: string;
  min_price: number;
  max_price: number;
  modal_price: number;
  latitude?: number;
  longitude?: number;
}

interface MarketDataWithDistance extends AgmarknetRecord {
  distance: number;
}

export class MarketService {
  private static readonly CACHE_TTL = 21600;

  private static getLanguageName(code: string): string {
    const map: Record<string, string> = {
      en: 'English',
      hi: 'Hindi',
      ta: 'Tamil',
      ml: 'Malayalam',
      te: 'Telugu',
      kn: 'Kannada',
    };
    return map[code] || 'English';
  }

  private static getCacheKey(
    crop: string,
    lat: number,
    lon: number,
    includeFar: boolean,
    language: string = 'en'
  ): string {
    return `market:${crop}:${lat.toFixed(4)},${lon.toFixed(4)}:far=${includeFar}:lang=${language}`;
  }

  private static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371;
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

  private static normalizeDate(dateStr?: string): string {
    if (!dateStr) return new Date().toISOString();

    if (dateStr.toUpperCase() === 'TODAY') {
      return new Date().toISOString();
    }

    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      const parsed = new Date(`${year}-${month}-${day}`);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    }

    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }

    return new Date().toISOString();
  }


  /* ================= MARKETAPI METHOD (UNCHANGED) ================= */
  private static async fetchFromMarketAPI(
    crop: string,
    limit: number
  ): Promise<AgmarknetRecord[]> {
    try {
      logger.info('[MarketAPI] Calling Agmarknet API');

      const response = await axios.get(
        'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070',
        {
          params: {
            'api-key': process.env.AGMARKNET_API_KEY,
            format: 'json',
            limit: limit,
            filters: JSON.stringify({
              commodity: crop,
            }),
          },
          timeout: 10000,
        }
      );

      const records = response.data?.records;

      if (!records || !Array.isArray(records)) {
        return [];
      }

      return records.map((item: any) => ({
        market: item.market,
        state: item.state,
        district: item.district,
        commodity: item.commodity,
        arrival_date: item.arrival_date,
        min_price: Number(item.min_price) / 100,  // Convert quintal to kg
        max_price: Number(item.max_price) / 100,  // Convert quintal to kg
        modal_price: Number(item.modal_price) / 100,  // Convert quintal to kg
        latitude: 20,  // Agmarknet doesn't give lat/lon
        longitude: 78,
      }));
    } catch (error) {
      logger.warn('[MarketAPI] Agmarknet failed');
      return [];
    }
  }


  /* ================= GROQ ================= */
  private static async fetchFromGroq(
    crop: string,
    _userLat: number,
    _userLon: number,
    limit: number = 5,
    language: string = 'en'
  ): Promise<AgmarknetRecord[]> {
    try {
      const apiKey = process.env.GROQ_API_KEY;

      if (!apiKey) {
        logger.warn('[Groq] API key not configured');
        return [];
      }

      const languageName = this.getLanguageName(language);
      const prompt = `
    You are an agricultural market data expert.

    Generate TODAY'S wholesale mandi price per kg in Indian Rupees (INR) for ${crop} in India.
    STRICT REALISTIC PRICE RANGES (per kg):
    - Sugarcane: ₹2–₹6
    - Tomato: ₹10–₹80
    - Onion: ₹10–₹60
    - Potato: ₹10–₹40
    - Rice: ₹20–₹60
    - Wheat: ₹20–₹40
    - Cotton: ₹40–₹80
    - Maize: ₹15–₹35
    - Soybean: ₹30–₹70
    - Groundnut: ₹40–₹90
    - Chili: ₹40–₹150
    - Pulses: ₹50–₹120

Prices MUST stay inside these ranges and round up in case of decimal value.

    IMPORTANT: Write the "market", "state", and "district" field values in ${languageName} language/script.
    For example, if language is Hindi, write "अमरावती" instead of "Amaravati".
    If language is English, write in English as usual.

    Return ONLY a valid JSON array with exactly ${limit} entries.
    Each entry must have:

    {
      "market": "Market Name in ${languageName}",
      "state": "State Name in ${languageName}",
      "district": "District Name in ${languageName}",
      "commodity": "${crop}",
      "variety": "Local",
      "arrival_date": "TODAY",
      "min_price": number,
      "max_price": number,
      "modal_price": number,
      "latitude": number,
      "longitude": number
    }

    Return ONLY the JSON array.
    `;

      const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama-3.1-8b-instant",

          messages: [
            { role: "user", content: prompt }
          ],
          temperature: 0.3
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          timeout: 20000
        }
      );

      const text = response.data?.choices?.[0]?.message?.content?.trim();

      if (!text) return [];

      const clean = text
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      const match = clean.match(/\[\s*\{[\s\S]*\}\s*\]/);

      if (!match) {
        logger.warn('[Groq] Could not extract JSON array');
        return [];
      }

      let parsed;
      try {
        parsed = JSON.parse(match[0]);
      } catch {
        logger.warn('[Groq] JSON parse failed');
        return [];
      }

      return Array.isArray(parsed) ? parsed : [];

    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error('[Groq] HTTP Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
        });
      } else {
        logger.error('[Groq] Error:', error instanceof Error ? error.message : error);
      }

      return [];
    }
  }




  /* ================= MOCK + OTHER METHODS (UNCHANGED) ================= */

  private static generateMockData(
    crop: string,
    userLat: number,
    userLon: number,
    limit: number = 5
  ): MarketDataWithDistance[] {
    const mockMarkets = [
      { name: 'Pune Mandi', lat: 18.5204, lon: 73.8567, state: 'Maharashtra' },
      { name: 'Mumbai APMC', lat: 19.0760, lon: 72.8777, state: 'Maharashtra' },
      { name: 'Nashik Market', lat: 19.9975, lon: 73.7898, state: 'Maharashtra' },
      { name: 'Solapur Mandi', lat: 17.6599, lon: 75.9064, state: 'Maharashtra' },
    ];

    const marketsWithDistance = mockMarkets
      .map((market) => ({
        ...market,
        distance: this.calculateDistance(
          userLat,
          userLon,
          market.lat,
          market.lon
        ),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);

    const basePrice = 25;

    return marketsWithDistance.map((market) => ({
      market: market.name,
      state: market.state,
      district: market.name.split(' ')[0],
      commodity: crop,
      arrival_date: new Date().toISOString().split('T')[0],
      min_price: basePrice - 3,
      max_price: basePrice + 3,
      modal_price: basePrice,
      latitude: market.lat,
      longitude: market.lon,
      distance: market.distance,
    }));
  }

  private static generateMockHistory(basePrice: number): PriceHistory[] {
    const history: PriceHistory[] = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      history.push({
        date: date.toISOString().split('T')[0],
        avgPrice: basePrice,
      });
    }
    return history;
  }

  private static calculateTrend(): 'rising' | 'falling' | 'stable' {
    return 'stable';
  }

  private static calculateMarketTrend(): 'up' | 'down' | 'stable' {
    return 'stable';
  }

  static async getMarketPrices(
    crop: string,
    userLat: number,
    userLon: number,
    language: string = 'en',
    limit: number = 5,
    includeFar: boolean = false
  ): Promise<MarketPriceResponse> {
    try {
      const cacheKey = this.getCacheKey(crop, userLat, userLon, includeFar, language);

      let marketData: AgmarknetRecord[] = [];

      /* ===================== 1️⃣ GROQ ===================== */
      try {
        logger.info('[Market Service] Trying GROQ...');
        marketData = await this.fetchFromGroq(crop, userLat, userLon, limit, language);
        logger.info(`[Market Service] GROQ returned ${marketData?.length ?? 0} markets`);

      } catch (error) {
        logger.warn('[Market Service] GROQ failed:', error instanceof Error ? error.message : error);
        marketData = [];
      }

      /* ===================== 2️⃣ MARKET API ===================== */
      if (!marketData || marketData.length === 0) {
        try {
          logger.info('Trying Market API...');
          marketData = await this.fetchFromMarketAPI(crop, limit);
          // ⬆️ Replace with your actual function
        } catch (error) {
          logger.warn('Market API failed');
          marketData = [];
        }
      }

      /* ===================== 3️⃣ REDIS ===================== */
      if ((!marketData || marketData.length === 0) && redisClient.isOpen) {
        try {
          logger.info('Trying Redis fallback...');
          const cached = await redisClient.get(cacheKey);
          if (cached) {
            return JSON.parse(cached);
          }
        } catch (error) {
          logger.warn('Redis fallback failed');
        }
      }

      /* ===================== 4️⃣ MOCK ===================== */
      let marketDataWithDistance: MarketDataWithDistance[];

      if (!marketData || marketData.length === 0) {
        logger.warn('All sources failed. Using mock data.');
        marketDataWithDistance = this.generateMockData(
          crop,
          userLat,
          userLon,
          limit
        );
      } else {
        const withDistances = marketData.map((item) => ({
          ...item,
          distance: this.calculateDistance(
            userLat,
            userLon,
            item.latitude || 0,
            item.longitude || 0
          ),
        }));

        marketDataWithDistance = withDistances
          .sort((a, b) => a.distance - b.distance)
          .slice(0, limit);
      }

      const markets: MarketPrice[] = marketDataWithDistance.map(
        (item) => ({
          name: item.market || 'Unknown',
          location: `${item.district}, ${item.state}`,
          distance: Math.round(item.distance * 10) / 10,
          price: Number(item.modal_price),
          unit: 'per kg',
          date: this.normalizeDate(item.arrival_date),
          trend: this.calculateMarketTrend(),
          changePercent: 0,
        })
      );

      const average =
        markets.reduce((sum, m) => sum + m.price, 0) /
        markets.length;

      const priceHistory = this.generateMockHistory(average);

      const highestMarket = markets.reduce((max, m) =>
        m.price > max.price ? m : max
      );

      const lowestMarket = markets.reduce((min, m) =>
        m.price < min.price ? m : min
      );

      const formattedCrop =
        crop.charAt(0).toUpperCase() + crop.slice(1).toLowerCase();

      const response: MarketPriceResponse = {
        crop: formattedCrop,
        markets,
        priceAnalysis: {
          average,
          highest: {
            market: highestMarket.name,
            price: highestMarket.price,
          },
          lowest: {
            market: lowestMarket.name,
            price: lowestMarket.price,
          },
          trend: this.calculateTrend(),
        },
        priceHistory,
        updatedAt: new Date().toISOString(),
      };

      if (marketData && marketData.length > 0 && redisClient.isOpen) {
        await redisClient.setEx(
          cacheKey,
          this.CACHE_TTL,
          JSON.stringify(response)
        );
      }

      return response;
    } catch (error) {
      logger.error('Market service unavailable', error);
      throw new Error('Market service unavailable');
    }
  }

  static async healthCheck(): Promise<boolean> {
    return true;
  }

  static async clearCache(): Promise<number> {
    try {
      if (!redisClient.isOpen) {
        return 0;
      }
      const keys = await redisClient.keys('market:*');
      if (keys.length === 0) {
        return 0;
      }
      await Promise.all(keys.map(key => redisClient.del(key)));
      logger.info(`[Market Service] Cleared ${keys.length} cache entries`);
      return keys.length;
    } catch (error) {
      logger.error('[Market Service] Failed to clear cache:', error);
      throw error;
    }
  }
}
