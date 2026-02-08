import axiosInstance from '../utils/axios';
import { MarketPricesResponse, GetMarketPricesRequest } from '../types/market.types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

class MarketService {
  async getMarketPrices(request: GetMarketPricesRequest): Promise<MarketPricesResponse> {
    const params = new URLSearchParams();
    params.append('crop', request.crop);
    if (request.language) {
      params.append('language', request.language);
    }

    const response = await axiosInstance.get<{ success: boolean; data: MarketPricesResponse }>(
      `${API_URL}/api/market/prices?${params.toString()}`
    );

    return response.data.data;
  }
}

export const marketService = new MarketService();
