import axiosInstance from '../utils/axios';
import { SchemesResponse } from '../types/scheme.types';

export const schemeService = {
  async getEligibleSchemes(language: string = 'en'): Promise<SchemesResponse> {
    const response = await axiosInstance.get<{ success: boolean; data: SchemesResponse }>(
      `/api/schemes/match?language=${language}`
    );
    return response.data.data;
  },
};
