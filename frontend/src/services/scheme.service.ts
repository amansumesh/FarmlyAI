import { apiClient } from '../utils/axios';
import { SchemesResponse } from '../types/scheme.types';

export const schemeService = {
  async getEligibleSchemes(language: string = 'en'): Promise<SchemesResponse> {
    const response = await apiClient.get<{ success: boolean; data: SchemesResponse }>(
      `/schemes/match?language=${language}`
    );
    return response.data.data;
  },
};
