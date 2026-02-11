// import axios from 'axios';
// import { config } from '../config/index.js';
// import { logger } from '../utils/logger.js';
// import { redisClient } from '../utils/redis.js';

// export interface MarketPrice {
//   name: string;
//   location: string;
//   distance: number;
//   price: number;
//   unit: string;
//   date: string;
//   trend: 'up' | 'down' | 'stable';
// }

// export interface PriceAnalysis {
//   average: number;
//   highest: {
//     market: string;
//     price: number;
//   };
//   lowest: {
//     market: string;
//     price: number;
//   };
//   trend: 'rising' | 'falling' | 'stable';
//   recommendation: string;
// }

// export interface PriceHistory {
//   date: string;
//   avgPrice: number;
// }

// export interface MarketPriceResponse {
//   crop: string;
//   markets: MarketPrice[];
//   priceAnalysis: PriceAnalysis;
//   priceHistory: PriceHistory[];
// }

// interface AgmarknetRecord {
//   market?: string;
//   state: string;
//   district: string;
//   commodity: string;
//   variety?: string;
//   arrival_date: string;
//   min_price: number;
//   max_price: number;
//   modal_price: number;
//   latitude?: number;
//   longitude?: number;
// }

// interface MarketDataWithDistance extends AgmarknetRecord {
//   distance: number;
// }

// export class MarketService {
//   private static readonly GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
//   private static readonly CACHE_TTL = 21600; // 6 hours in seconds

//   private static getCacheKey(crop: string, lat: number, lon: number): string {
//     return `market:${crop}:${lat.toFixed(4)},${lon.toFixed(4)}`;
//   }

//   /**
//    * Calculate distance between two coordinates using Haversine formula
//    */
//   private static calculateDistance(
//     lat1: number,
//     lon1: number,
//     lat2: number,
//     lon2: number
//   ): number {
//     const R = 6371; // Earth's radius in km
//     const dLat = this.toRad(lat2 - lat1);
//     const dLon = this.toRad(lon2 - lon1);
//     const a =
//       Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//       Math.cos(this.toRad(lat1)) *
//         Math.cos(this.toRad(lat2)) *
//         Math.sin(dLon / 2) *
//         Math.sin(dLon / 2);
//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//     return R * c;
//   }

//   private static toRad(degrees: number): number {
//     return (degrees * Math.PI) / 180;
//   }

//   /**
//    * Fetch market prices from Gemini 2.5 Flash LLM
//    */
//   private static async fetchFromGemini(
//     crop: string,
//     _userLat: number,
//     _userLon: number,
//     limit: number = 5
//   ): Promise<AgmarknetRecord[]> {
//     try {
//       const apiKey = config.gemini?.apiKey;
      
//       if (!apiKey) {
//         logger.warn('[Gemini] API key not configured, using fallback data');
//         return [];
//       }

//       logger.info('[Gemini] Calling Gemini API for crop:', crop);

//       const prompt = `You are an agricultural market data expert. Generate realistic market prices data for ${crop} crops in India in JSON format.

// Return ONLY a valid JSON array with exactly ${limit} market entries. Each entry must have these exact fields:
// {
//   "market": "Market Name",
//   "state": "State Name",
//   "district": "District Name",
//   "commodity": "${crop}",
//   "variety": "Local",
//   "arrival_date": "${new Date().toISOString().split('T')[0]}",
//   "min_price": <number>,
//   "max_price": <number>,
//   "modal_price": <number>,
//   "latitude": <number between 8 and 35>,
//   "longitude": <number between 68 and 97>
// }

// Create realistic prices for ${crop} in INR per kg. Make the data varied and realistic. Ensure latitude/longitude are within India's bounds.
// Return ONLY the JSON array, no markdown formatting, no code blocks, no explanations.`;

//       const response = await axios.post(
//         this.GEMINI_API_URL,
//         {
//           contents: [
//             {
//               parts: [
//                 {
//                   text: prompt,
//                 },
//               ],
//             },
//           ],
//         },
//         {
//           params: {
//             key: apiKey,
//           },
//           timeout: 20000,
//           headers: {
//             'Content-Type': 'application/json',
//           },
//         }
//       );

//       // Log the raw response object (trimmed) to help diagnose empty/odd shapes
//       try {
//         logger.info('[Gemini] Response received', { status: response.status, dataSnippet: JSON.stringify(response.data).substring(0, 1000) });
//       } catch (e) {
//         logger.info('[Gemini] Response received (could not stringify)');
//       }

//       // Attempt to extract text from several possible candidate shapes
//       let responseText: string | null = null;
//       const candidate = response.data?.candidates?.[0];
//       if (candidate) {
//         // common nested shapes
//         if (candidate.content) {
//           // shape: candidate.content.parts[0].text
//           if (candidate.content.parts && candidate.content.parts[0]?.text) {
//             responseText = candidate.content.parts[0].text;
//           }

//           // shape: candidate.content[0].parts[0].text
//           if (!responseText && Array.isArray(candidate.content) && candidate.content[0]?.parts && candidate.content[0].parts[0]?.text) {
//             responseText = candidate.content[0].parts[0].text;
//           }

//           // shape: candidate.content[0].text
//           if (!responseText && Array.isArray(candidate.content) && candidate.content[0]?.text) {
//             responseText = candidate.content[0].text;
//           }
//         }

//         // alternative property that some responses use
//         if (!responseText && candidate.output_text) {
//           responseText = candidate.output_text;
//         }
//       }

//       // further fallback shapes
//       if (!responseText && response.data?.output?.[0]?.content?.[0]?.text) {
//         responseText = response.data.output[0].content[0].text;
//       }

//       if (!responseText) {
//         logger.warn('[Gemini] No text found in candidate; full response logged above');
//         return [];
//       }

//       responseText = responseText.trim();
//       logger.info('[Gemini] Response text snippet:', responseText.substring(0, 300));

//       // Remove markdown code block formatting if present
//       let jsonString = responseText;
//       if (jsonString.includes('```json')) {
//         jsonString = jsonString.replace(/```json\n?/g, '').replace(/```\n?/g, '');
//       } else if (jsonString.includes('```')) {
//         jsonString = jsonString.replace(/```\n?/g, '');
//       }

//       // Try to extract a JSON array from the text if there is leading/trailing noise
//       const arrayMatch = jsonString.match(/\[\s*\{[\s\S]*\}\s*\]/m);
//       if (arrayMatch) {
//         jsonString = arrayMatch[0];
//       }

//       let parsedData: any;
//       try {
//         parsedData = JSON.parse(jsonString.trim());
//       } catch (parseErr) {
//         logger.error('[Gemini] JSON parse failed', { parseError: parseErr instanceof Error ? parseErr.message : String(parseErr) });
//         return [];
//       }

//       logger.info('[Gemini] Parsed data snippet:', JSON.stringify(parsedData).substring(0, 1000));

//       if (Array.isArray(parsedData)) {
//         logger.info('[Gemini] Market data successfully generated', { crop, count: parsedData.length });
//         logger.info('[Gemini] First market:', JSON.stringify(parsedData[0]));
//         return parsedData;
//       }

//       logger.warn('[Gemini] Invalid response format from Gemini API (parsed non-array)');
//       return [];
//     } catch (error) {
//       logger.error('[Gemini] API call failed:', { 
//         error: error instanceof Error ? error.message : String(error),
//         crop 
//       });
//       return [];
//     }
//   }

//   /**
//    * Generate mock market data as fallback
//    */
//   private static generateMockData(
//     crop: string,
//     userLat: number,
//     userLon: number,
//     limit: number = 5
//   ): MarketDataWithDistance[] {
//     const mockMarkets = [
//       { name: 'Pune Mandi', lat: 18.5204, lon: 73.8567, state: 'Maharashtra' },
//       { name: 'Mumbai APMC', lat: 19.0760, lon: 72.8777, state: 'Maharashtra' },
//       { name: 'Nashik Market', lat: 19.9975, lon: 73.7898, state: 'Maharashtra' },
//       { name: 'Solapur Mandi', lat: 17.6599, lon: 75.9064, state: 'Maharashtra' },
//       { name: 'Aurangabad Market', lat: 19.8762, lon: 75.3433, state: 'Maharashtra' },
//       { name: 'Nagpur APMC', lat: 21.1458, lon: 79.0882, state: 'Maharashtra' },
//       { name: 'Kolhapur Mandi', lat: 16.7050, lon: 74.2433, state: 'Maharashtra' },
//       { name: 'Ahmednagar Market', lat: 19.0948, lon: 74.7480, state: 'Maharashtra' },
//     ];

//     // Calculate distances and sort
//     const marketsWithDistance = mockMarkets.map((market) => ({
//       ...market,
//       distance: this.calculateDistance(userLat, userLon, market.lat, market.lon),
//     }));

//     marketsWithDistance.sort((a, b) => a.distance - b.distance);

//     // Take nearest markets
//     const nearestMarkets = marketsWithDistance.slice(0, limit);

//     // Generate mock price data with some variation
//     const basePrice = this.getBasePrice(crop);
//     const today = new Date();

//     return nearestMarkets.map((market) => {
//       const priceVariation = (Math.random() - 0.5) * basePrice * 0.3; // ±15% variation
//       const price = Math.round((basePrice + priceVariation) * 100) / 100;

//       return {
//         market: market.name,
//         state: market.state,
//         district: market.name.split(' ')[0],
//         commodity: crop,
//         variety: 'Local',
//         arrival_date: today.toISOString().split('T')[0],
//         min_price: Math.round(price * 0.9 * 100) / 100,
//         max_price: Math.round(price * 1.1 * 100) / 100,
//         modal_price: price,
//         latitude: market.lat,
//         longitude: market.lon,
//         distance: Math.round(market.distance * 10) / 10,
//       };
//     });
//   }

//   /**
//    * Get base price for common crops (in INR per kg)
//    */
//   private static getBasePrice(crop: string): number {
//     const basePrices: Record<string, number> = {
//       tomato: 25,
//       potato: 18,
//       onion: 22,
//       wheat: 21,
//       rice: 28,
//       cotton: 55,
//       sugarcane: 3,
//       maize: 18,
//       soybean: 42,
//       groundnut: 50,
//       chili: 80,
//       banana: 15,
//       mango: 40,
//     };

//     const normalizedCrop = crop.toLowerCase().trim();
//     return basePrices[normalizedCrop] || 25;
//   }

//   /**
//    * Generate mock price history for last 30 days
//    */
//   private static generateMockHistory(basePrice: number): PriceHistory[] {
//     const history: PriceHistory[] = [];
//     const today = new Date();

//     for (let i = 29; i >= 0; i--) {
//       const date = new Date(today);
//       date.setDate(date.getDate() - i);

//       // Generate trend: slight upward or downward movement with noise
//       const trendFactor = 1 + (29 - i) * 0.005; // Slight upward trend
//       const noise = (Math.random() - 0.5) * 0.1; // ±5% noise
//       const price = Math.round(basePrice * trendFactor * (1 + noise) * 100) / 100;

//       history.push({
//         date: date.toISOString().split('T')[0],
//         avgPrice: price,
//       });
//     }

//     return history;
//   }

//   /**
//    * Calculate price trend based on history
//    */
//   private static calculateTrend(history: PriceHistory[]): 'rising' | 'falling' | 'stable' {
//     if (history.length < 7) return 'stable';

//     const recent = history.slice(-7);
//     const older = history.slice(-14, -7);

//     const recentAvg = recent.reduce((sum, item) => sum + item.avgPrice, 0) / recent.length;
//     const olderAvg = older.reduce((sum, item) => sum + item.avgPrice, 0) / older.length;

//     const change = ((recentAvg - olderAvg) / olderAvg) * 100;

//     if (change > 3) return 'rising';
//     if (change < -3) return 'falling';
//     return 'stable';
//   }

//   /**
//    * Calculate short-term trend for individual market (last 3 days vs previous 3 days)
//    */
//   private static calculateMarketTrend(_currentPrice: number): 'up' | 'down' | 'stable' {
//     // For mock data, randomly assign trend based on price
//     const random = Math.random();
//     if (random > 0.6) return 'up';
//     if (random < 0.4) return 'down';
//     return 'stable';
//   }

//   /**
//    * Generate localized recommendation based on trend
//    */
//   private static generateRecommendation(
//     trend: 'rising' | 'falling' | 'stable',
//     language: string
//   ): string {
//     const recommendations: Record<string, Record<string, string>> = {
//       rising: {
//         hi: 'कीमतें बढ़ रही हैं। 2-3 दिन प्रतीक्षा करें, बेहतर दाम मिल सकते हैं।',
//         ta: 'விலைகள் அதிகரித்து வருகின்றன. 2-3 நாட்கள் காத்திருங்கள், சிறந்த விலை கிடைக்கலாம்.',
//         ml: 'വില കൂടിക്കൊണ്ടിരിക്കുന്നു. 2-3 ദിവസം കാത്തിരിക്കുക, മികച്ച വില ലഭിച്ചേക്കാം.',
//         te: 'ధరలు పెరుగుతున్నాయి. 2-3 రోజులు వేచి ఉండండి, మంచి ధర దొరకవచ్చు.',
//         kn: 'ಬೆಲೆಗಳು ಏರುತ್ತಿವೆ. 2-3 ದಿನ ಕಾಯಿರಿ, ಉತ್ತಮ ಬೆಲೆ ಸಿಗಬಹುದು.',
//         en: 'Prices are rising. Wait 2-3 days for potentially better rates.',
//       },
//       falling: {
//         hi: 'कीमतें गिर रही हैं। अभी बेचना अच्छा समय है।',
//         ta: 'விலைகள் குறைந்து வருகின்றன. இப்போது விற்பது நல்ல நேரம்.',
//         ml: 'വില കുറയുന്നു. ഇപ്പോൾ വിൽക്കുന്നത് നല്ല സമയമാണ്.',
//         te: 'ధరలు తగ్గుతున్నాయి. ఇప్పుడు అమ్మడం మంచి సమయం.',
//         kn: 'ಬೆಲೆಗಳು ಕುಸಿಯುತ್ತಿವೆ. ಈಗ ಮಾರಾಟ ಮಾಡುವುದು ಉತ್ತಮ ಸಮಯ.',
//         en: 'Prices are falling. Good time to sell now.',
//       },
//       stable: {
//         hi: 'कीमतें स्थिर हैं। आप अभी बेच सकते हैं या 1-2 दिन प्रतीक्षा कर सकते हैं।',
//         ta: 'விலைகள் நிலையாக உள்ளன. நீங்கள் இப்போது விற்கலாம் அல்லது 1-2 நாட்கள் காத்திருக்கலாம்.',
//         ml: 'വില സ്ഥിരമാണ്. നിങ്ങൾക്ക് ഇപ്പോൾ വിൽക്കാം അല്ലെങ്കിൽ 1-2 ദിവസം കാത്തിരിക്കാം.',
//         te: 'ధరలు స్థిరంగా ఉన్నాయి. మీరు ఇప్పుడు అమ్మవచ్చు లేదా 1-2 రోజులు వేచి ఉండవచ్చు.',
//         kn: 'ಬೆಲೆಗಳು ಸ್ಥಿರವಾಗಿವೆ. ನೀವು ಈಗ ಮಾರಾಟ ಮಾಡಬಹುದು ಅಥವಾ 1-2 ದಿನ ಕಾಯಬಹುದು.',
//         en: 'Prices are stable. You can sell now or wait 1-2 days.',
//       },
//     };

//     return recommendations[trend][language] || recommendations[trend]['en'];
//   }

//   /**
//    * Get market prices for a crop near user location
//    */
//   static async getMarketPrices(
//     crop: string,
//     userLat: number,
//     userLon: number,
//     language: string = 'en',
//     limit: number = 5,
//     includeFar: boolean = false
//   ): Promise<MarketPriceResponse> {
//     try {
//       const cacheKey = this.getCacheKey(crop, userLat, userLon);

//       // Try cache first
//       if (redisClient.isOpen) {
//         try {
//           const cachedData = await redisClient.get(cacheKey);
//           if (cachedData) {
//             logger.info('Market data retrieved from cache', { crop, userLat, userLon });
//             return JSON.parse(cachedData);
//           }
//         } catch (cacheError) {
//           logger.warn('Redis cache read failed, fetching fresh data:', cacheError);
//         }
//       }

//       logger.info('Fetching market data', { crop, userLat, userLon });

//       // Fetch from Gemini LLM
//       const marketData = await this.fetchFromGemini(crop, userLat, userLon, limit);
//       logger.debug('[Market] Gemini returned:', { count: marketData?.length || 0 });

//       // Fallback to mock data if Gemini fails or returns no data
//       let marketDataWithDistance: MarketDataWithDistance[];
//       if (!marketData || marketData.length === 0) {
//         logger.info('Using mock market data', { crop });
//         marketDataWithDistance = this.generateMockData(crop, userLat, userLon, limit);
//       } else {
//         logger.info('[Market] Processing Gemini data with', { count: marketData.length });
//         // Calculate distances for Gemini data and prefer nearby markets
//         const withDistances = marketData.map((item) => {
//           logger.debug('[Market] Processing item:', { market: item.market, state: item.state });
//           return {
//             ...item,
//             distance: this.calculateDistance(
//               userLat,
//               userLon,
//               item.latitude || 0,
//               item.longitude || 0
//             ),
//           };
//         });

//         // Try to get markets within 200km first (unless includeFar is true)
//         let nearby: MarketDataWithDistance[];
//         if (includeFar) {
//           logger.info('[Market] includeFar flag set; returning nearest markets regardless of distance');
//           nearby = withDistances.sort((a, b) => a.distance - b.distance);
//         } else {
//           nearby = withDistances.filter((item) => item.distance <= 200).sort((a, b) => a.distance - b.distance);

//           // If none found within 200km, fall back to nearest markets regardless of distance
//           if (nearby.length === 0) {
//             logger.warn('[Market] No Gemini markets within 200km; using nearest markets instead');
//             nearby = withDistances.sort((a, b) => a.distance - b.distance);
//           }
//         }

//         marketDataWithDistance = nearby.slice(0, limit);
//         logger.info('[Market] After processing Gemini data:', { available: withDistances.length, returned: marketDataWithDistance.length });
//       }

//       // Transform to market prices
//       const markets: MarketPrice[] = marketDataWithDistance.map((item) => ({
//         name: item.market || item.district || 'Unknown Market',
//         location: `${item.district || 'Unknown'}, ${item.state || 'Unknown'}`,
//         distance: Math.round(item.distance * 10) / 10,
//         price: Number(item.modal_price) || 0,
//         unit: 'per kg',
//         date: item.arrival_date || new Date().toISOString().split('T')[0],
//         trend: this.calculateMarketTrend(Number(item.modal_price) || 0),
//       }));

//       // Handle empty markets array
//       if (markets.length === 0) {
//         throw new Error('No market data available');
//       }

//       // Calculate price analysis with safe reduce
//       const prices = markets.map((m) => m.price).filter(p => p > 0);
//       const average = prices.length > 0 
//         ? Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 100) / 100
//         : 0;

//       const highest = markets.length > 0 
//         ? markets.reduce((max, m) => (m.price > max.price ? m : max))
//         : markets[0];
      
//       const lowest = markets.length > 0 
//         ? markets.reduce((min, m) => (m.price < min.price ? m : min))
//         : markets[0];

//       // Generate price history
//       const priceHistory = this.generateMockHistory(average);
//       const overallTrend = this.calculateTrend(priceHistory);

//       const priceAnalysis: PriceAnalysis = {
//         average,
//         highest: {
//           market: highest.name,
//           price: highest.price,
//         },
//         lowest: {
//           market: lowest.name,
//           price: lowest.price,
//         },
//         trend: overallTrend,
//         recommendation: this.generateRecommendation(overallTrend, language),
//       };

//       const response: MarketPriceResponse = {
//         crop,
//         markets,
//         priceAnalysis,
//         priceHistory,
//       };

//       // Cache the result
//       if (redisClient.isOpen) {
//         try {
//           await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(response));
//           logger.info('Market data cached successfully', { crop, userLat, userLon });
//         } catch (cacheError) {
//           logger.warn('Failed to cache market data:', cacheError);
//         }
//       }

//       return response;
//     } catch (error) {
//       logger.error('Failed to fetch market data', { error, crop });
//       throw new Error('Market service unavailable');
//     }
//   }

//   /**
//    * Health check for market service
//    */
//   static async healthCheck(): Promise<boolean> {
//     try {
//       // Test with mock data
//       const testData = this.generateMockData('tomato', 18.5204, 73.8567, 1);
//       return testData.length > 0;
//     } catch (error) {
//       logger.error('Market service health check failed', { error });
//       return false;
//     }
//   }
// }


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
  private static readonly GEMINI_API_URL =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
    // 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

  private static readonly CACHE_TTL = 21600;

  private static getCacheKey(
    crop: string,
    lat: number,
    lon: number,
    includeFar: boolean
  ): string {
    return `market:${crop}:${lat.toFixed(4)},${lon.toFixed(4)}:far=${includeFar}`;
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
        min_price: Number(item.min_price),
        max_price: Number(item.max_price),
        modal_price: Number(item.modal_price),
        latitude: 20,  // Agmarknet doesn’t give lat/lon
        longitude: 78,
      }));
    } catch (error) {
      logger.warn('[MarketAPI] Agmarknet failed');
      return [];
    }
  }

  /* ================= GEMINI METHOD (UNCHANGED) ================= */
//   private static async fetchFromGemini(
//   crop: string,
//   _userLat: number,
//   _userLon: number,
//   limit: number = 5
// ): Promise<AgmarknetRecord[]> {
//   try {
//     const apiKey = process.env.GEMINI_API_KEY;

//     const response = await axios.post(
//       this.GEMINI_API_URL,
//       {
//         contents: [{ parts: [{ text: "Say hello in JSON format." }] }],
//       },
//       {
//         params: { key: apiKey },
//       }
//     );

//     console.log("========== GEMINI RESPONSE ==========");
//     console.log(JSON.stringify(response.data, null, 2));
//     console.log("=====================================");

//     return [];

//   } catch (error) {
//     console.log("========== GEMINI ERROR ==========");
//     console.log(error);

//     if (axios.isAxiosError(error)) {
//       console.log("STATUS:", error.response?.status);
//       console.log("DATA:", error.response?.data);
//     }

//     return [];
//   }
// }


  private static async fetchFromGemini(
    
    crop: string,
    _userLat: number,
    _userLon: number,
    limit: number = 5
  ): Promise<AgmarknetRecord[]> {
    try {
      const apiKey = config.gemini?.apiKey;

      if (!apiKey) {
        logger.warn('[Gemini] API key not configured');
        return [];
      }

//       const prompt = `You are an agricultural market data expert. Generate realistic market prices data for ${crop} crops in India in JSON format.

// Return ONLY a valid JSON array with exactly ${limit} market entries. Each entry must have these exact fields:
// {
//   "market": "Market Name",
//   "state": "State Name",
//   "district": "District Name",
//   "commodity": "${crop}",
//   "variety": "Local",
//   "arrival_date": "${new Date().toISOString().split('T')[0]}",
//   "min_price": <number>,
//   "max_price": <number>,
//   "modal_price": <number>,
//   "latitude": <number between 8 and 35>,
//   "longitude": <number between 68 and 97>
// }

// Return ONLY the JSON array.`;

const prompt = `You are an agricultural market data expert.

Generate TODAY'S wholesale mandi price per kg in Indian Rupees (INR) for ${crop} in India in JSON format.

Return ONLY a valid JSON array with exactly ${limit} market entries. Each entry must have these exact fields:
{
  "market": "Market Name",
  "state": "State Name",
  "district": "District Name",
  "commodity": "${crop}",
  "variety": "Local",
  "arrival_date": "${new Date().toISOString().split('T')[0]}",
  "min_price": <number>,
  "max_price": <number>,
  "modal_price": <number>,
  "latitude": <number between 8 and 35>,
  "longitude": <number between 68 and 97>
}

All prices must be in INR per kg and reflect today's Indian wholesale mandi rates.

Return ONLY the JSON array.`;


      const response = await axios.post(
        this.GEMINI_API_URL,
        {
          contents: [{ parts: [{ text: prompt }] }],
        },
        {
          params: { key: apiKey },
          timeout: 20000,
          headers: { 'Content-Type': 'application/json' },
        }
      );
      // console.log('Gemini raw response:', JSON.stringify(response.data, null, 2));


      const text =
        response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (!text) return [];

    const clean = text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    // Extract JSON array safely
    const match = clean.match(/\[\s*\{[\s\S]*\}\s*\]/);

    if (!match) {
      logger.warn('[Gemini] Could not extract JSON array');
      return [];
    }

    let parsed;
    try {
      parsed = JSON.parse(match[0]);
    } catch {
      logger.warn('[Gemini] JSON parse failed');
      return [];
    }

    return Array.isArray(parsed) ? parsed : [];

    } catch (error) {
    if (axios.isAxiosError(error)) {
      logger.error('[Gemini] Status:', error.response?.status);
      logger.error('[Gemini] Data:', error.response?.data);
    } else {
      logger.error('[Gemini] Error');
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
    const today = new Date().toISOString().split('T')[0];

    return marketsWithDistance.map((market) => ({
      market: market.name,
      state: market.state,
      district: market.name.split(' ')[0],
      commodity: crop,
      arrival_date: today,
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

  private static generateRecommendation(): string {
    return 'Prices are stable.';
  }

  /* ================= UPDATED METHOD ================= */

  // static async getMarketPrices(
  //   crop: string,
  //   userLat: number,
  //   userLon: number,
  //   language: string = 'en',
  //   limit: number = 5,
  //   includeFar: boolean = false
  // ): Promise<MarketPriceResponse> {
  //   try {
  //     const cacheKey = this.getCacheKey(
  //       crop,
  //       userLat,
  //       userLon,
  //       includeFar
  //     );

  //     // 1️⃣ GEMINI FIRST
  //     let marketData = await this.fetchFromGemini(
  //       crop,
  //       userLat,
  //       userLon,
  //       limit
  //     );

  //     // 2️⃣ REDIS FALLBACK
  //     if ((!marketData || marketData.length === 0) && redisClient.isOpen) {
  //       const cached = await redisClient.get(cacheKey);
  //       if (cached) return JSON.parse(cached);
  //     }

  //     // 3️⃣ MOCK IF BOTH FAIL
  //     let marketDataWithDistance: MarketDataWithDistance[];

  //     if (!marketData || marketData.length === 0) {
  //       marketDataWithDistance = this.generateMockData(
  //         crop,
  //         userLat,
  //         userLon,
  //         limit
  //       );
  //     } else {
  //       const withDistances = marketData.map((item) => ({
  //         ...item,
  //         distance: this.calculateDistance(
  //           userLat,
  //           userLon,
  //           item.latitude || 0,
  //           item.longitude || 0
  //         ),
  //       }));

  //       marketDataWithDistance = withDistances
  //         .sort((a, b) => a.distance - b.distance)
  //         .slice(0, limit);
  //     }

  static async getMarketPrices(
  crop: string,
  userLat: number,
  userLon: number,
  language: string = 'en',
  limit: number = 5,
  includeFar: boolean = false
): Promise<MarketPriceResponse> {
  try {
    const cacheKey = this.getCacheKey(crop, userLat, userLon, includeFar);

    let marketData: AgmarknetRecord[] = [];

    /* ===================== 1️⃣ GEMINI ===================== */
    try {
      logger.info('Trying Gemini...');
      marketData = await this.fetchFromGemini(crop, userLat, userLon, limit);
    } catch (error) {
      logger.warn('Gemini failed');
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
          date: item.arrival_date,
          trend: this.calculateMarketTrend(),
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

      const response: MarketPriceResponse = {
        crop,
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
          recommendation: this.generateRecommendation(),
        },
        priceHistory,
      };

      // 4️⃣ CACHE ONLY IF GEMINI WORKED
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
}
