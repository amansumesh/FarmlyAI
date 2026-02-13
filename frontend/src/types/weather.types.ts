export interface CurrentWeather {
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
}

export interface ForecastDay {
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
}

export interface WeatherForecastResponse {
  location: {
    lat: number;
    lon: number;
    name?: string;
  };
  current: CurrentWeather;
  forecast: ForecastDay[];
}
