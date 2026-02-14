import axiosInstance from '../utils/axios';
import { MarketPricesResponse, GetMarketPricesRequest } from '../types/market.types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

class MarketService {
  private getCacheKey(crop: string, language?: string): string {
    return `market_data_${crop}_${language || 'en'}`;
  }

  async getMarketPrices(request: GetMarketPricesRequest): Promise<MarketPricesResponse & { isOffline?: boolean }> {
    const cacheKey = this.getCacheKey(request.crop, request.language);

    try {
      const params = new URLSearchParams();
      params.append('crop', request.crop);
      if (request.language) {
        params.append('language', request.language);
      }

      // 1. Check if offline before making request
      if (!navigator.onLine) {
        console.log('App is offline, skipping network request');
        throw new Error('Offline');
      }

      const response = await axiosInstance.get<{ success: boolean; data: MarketPricesResponse }>(
        `${API_URL}/api/market/prices?${params.toString()}`
      );

      // Cache successful response
      if (response.data.success) {
        localStorage.setItem(cacheKey, JSON.stringify({
          data: response.data.data,
          timestamp: Date.now()
        }));
      }

      return response.data.data;
    } catch (error) {
      console.warn('Network request failed, trying cache...', error);
      
      // Try to get from cache
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          // Optional: Check if cache is too old (e.g., > 24 hours)? 
          // For now, return what we have with a flag.
          return {
            ...parsed.data,
            isOffline: true,
            updatedAt: new Date(parsed.timestamp).toISOString() 
          };
        } catch (e) {
          console.error('Failed to parse cached market data', e);
        }
      }
      
      throw error;
    }
  }
}

export const marketService = new MarketService();
