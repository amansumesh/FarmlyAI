import axiosInstance from '../utils/axios';
import { WeatherForecastResponse } from '../types/weather.types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

class WeatherService {
  async getForecast(lat?: number, lon?: number): Promise<WeatherForecastResponse> {
    const params: { lat?: string; lon?: string } = {};
    
    if (lat !== undefined && lon !== undefined) {
      params.lat = lat.toString();
      params.lon = lon.toString();
    }

    const response = await axiosInstance.get<{ success: boolean; data: WeatherForecastResponse }>(
      `${API_URL}/api/weather/forecast`,
      { params }
    );

    return response.data.data;
  }
}

export const weatherService = new WeatherService();
