export interface Recommendation {
  type: 'irrigation' | 'fertilizer' | 'pest_prevention' | 'harvest';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionBy: string;
}

export interface AdvisoryResponse {
  recommendations: Recommendation[];
  weather: {
    location: {
      lat: number;
      lon: number;
      name?: string;
    };
    current: {
      temp: number;
      feels_like: number;
      humidity: number;
      pressure: number;
      description: string;
      icon: string;
      windSpeed: number;
      clouds: number;
      sunrise: number;
      sunset: number;
    };
    forecast: Array<{
      date: string;
      temp: {
        min: number;
        max: number;
        day: number;
      };
      humidity: number;
      description: string;
      icon: string;
      windSpeed: number;
      clouds: number;
      pop: number;
      rain?: number;
    }>;
  };
  basedOn: {
    crop: string;
    location: string;
    soilType: string;
  };
}

export interface AdvisoryApiResponse {
  success: boolean;
  data: AdvisoryResponse;
}
