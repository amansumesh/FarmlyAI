import axiosInstance from '../utils/axios';
import { AdvisoryApiResponse } from '../types/advisory.types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

class AdvisoryService {
  async getRecommendations(language?: string): Promise<AdvisoryApiResponse['data']> {
    const params = new URLSearchParams();
    if (language) {
      params.append('language', language);
    }

    const response = await axiosInstance.get<AdvisoryApiResponse>(
      `${API_URL}/api/advisory/recommendations${params.toString() ? `?${params.toString()}` : ''}`
    );

    return response.data.data;
  }
}

export const advisoryService = new AdvisoryService();
