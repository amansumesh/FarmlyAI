import axios from 'axios';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { redisClient } from '../utils/redis.js';

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
  pop: number; // Probability of precipitation
  rain?: number; // Rain volume in mm
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

interface HourlyForecastItem {
  dt: number;
  main: {
    temp: number;
    humidity: number;
  };
  weather: Array<{
    description: string;
    icon: string;
  }>;
  wind: {
    speed: number;
  };
  clouds: {
    all: number;
  };
  pop?: number;
  rain?: {
    '3h'?: number;
  };
}

export class WeatherService {
  private static readonly API_BASE_URL = 'https://api.openweathermap.org/data/2.5';
  private static readonly API_KEY = config.openWeather.apiKey;
  private static readonly CACHE_TTL = 3600; // 1 hour in seconds

  private static getCacheKey(lat: number, lon: number): string {
    return `weather:${lat.toFixed(4)},${lon.toFixed(4)}`;
  }

  static async getForecast(
    lat: number,
    lon: number
  ): Promise<WeatherForecastResponse> {
    try {
      const cacheKey = this.getCacheKey(lat, lon);

      // Try to get from cache first
      if (redisClient.isOpen) {
        try {
          const cachedData = await redisClient.get(cacheKey);
          if (cachedData) {
            logger.info('Weather data retrieved from cache', { lat, lon });
            return JSON.parse(cachedData);
          }
        } catch (cacheError) {
          logger.warn('Redis cache read failed, fetching fresh data:', cacheError);
        }
      }

      logger.info('Fetching weather data from OpenWeatherMap', { lat, lon });

      // Fetch current weather and forecast in parallel
      const [currentResponse, forecastResponse] = await Promise.all([
        axios.get(`${this.API_BASE_URL}/weather`, {
          params: {
            lat,
            lon,
            appid: this.API_KEY,
            units: 'metric',
          },
          timeout: 10000,
        }),
        axios.get(`${this.API_BASE_URL}/forecast`, {
          params: {
            lat,
            lon,
            appid: this.API_KEY,
            units: 'metric',
          },
          timeout: 10000,
        }),
      ]);

      // Parse current weather
      const current: CurrentWeather = {
        temp: Math.round(currentResponse.data.main.temp),
        feels_like: Math.round(currentResponse.data.main.feels_like),
        humidity: currentResponse.data.main.humidity,
        pressure: currentResponse.data.main.pressure,
        description: currentResponse.data.weather[0].description,
        icon: currentResponse.data.weather[0].icon,
        windSpeed: currentResponse.data.wind.speed,
        clouds: currentResponse.data.clouds.all,
        sunrise: currentResponse.data.sys.sunrise,
        sunset: currentResponse.data.sys.sunset,
      };

      // Parse 7-day forecast (OpenWeatherMap free tier gives 5-day forecast)
      const dailyForecasts = this.parseDailyForecasts(forecastResponse.data.list);

      const weatherData: WeatherForecastResponse = {
        location: {
          lat,
          lon,
          name: currentResponse.data.name,
        },
        current,
        forecast: dailyForecasts,
      };

      // Cache the result
      if (redisClient.isOpen) {
        try {
          await redisClient.setEx(
            cacheKey,
            this.CACHE_TTL,
            JSON.stringify(weatherData)
          );
          logger.info('Weather data cached successfully', { lat, lon });
        } catch (cacheError) {
          logger.warn('Failed to cache weather data:', cacheError);
        }
      }

      return weatherData;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error('OpenWeatherMap API error', {
          status: error.response?.status,
          message: error.message,
        });
        if (error.response?.status === 401) {
          throw new Error('Invalid OpenWeatherMap API key');
        }
        if (error.response?.status === 404) {
          throw new Error('Location not found');
        }
      }
      logger.error('Failed to fetch weather data', { error });
      throw new Error('Weather service unavailable');
    }
  }

  private static parseDailyForecasts(
    hourlyData: HourlyForecastItem[]
  ): ForecastDay[] {
    // Group hourly forecasts by day
    const dailyMap = new Map<string, HourlyForecastItem[]>();

    hourlyData.forEach((item) => {
      const date = new Date(item.dt * 1000).toISOString().split('T')[0];
      if (!dailyMap.has(date)) {
        dailyMap.set(date, []);
      }
      dailyMap.get(date)?.push(item);
    });

    // Convert to daily forecasts (take up to 7 days)
    const dailyForecasts: ForecastDay[] = [];
    let count = 0;

    for (const [date, items] of dailyMap.entries()) {
      if (count >= 7) break;

      // Calculate daily aggregates
      const temps = items.map((item) => item.main.temp);
      const minTemp = Math.round(Math.min(...temps));
      const maxTemp = Math.round(Math.max(...temps));
      const avgTemp = Math.round(
        temps.reduce((a, b) => a + b, 0) / temps.length
      );

      const avgHumidity = Math.round(
        items.reduce((sum, item) => sum + item.main.humidity, 0) / items.length
      );

      // Find the most common weather description (noon forecast)
      const noonForecast = items.find((item) => {
        const hour = new Date(item.dt * 1000).getHours();
        return hour >= 12 && hour <= 14;
      }) || items[Math.floor(items.length / 2)];

      const avgWindSpeed =
        items.reduce((sum, item) => sum + item.wind.speed, 0) / items.length;
      const avgClouds = Math.round(
        items.reduce((sum, item) => sum + item.clouds.all, 0) / items.length
      );
      const maxPop = Math.max(...items.map((item) => item.pop || 0));
      const totalRain = items.reduce(
        (sum, item) => sum + (item.rain?.['3h'] || 0),
        0
      );

      dailyForecasts.push({
        date,
        temp: {
          min: minTemp,
          max: maxTemp,
          day: avgTemp,
        },
        humidity: avgHumidity,
        description: noonForecast.weather[0].description,
        icon: noonForecast.weather[0].icon,
        windSpeed: Math.round(avgWindSpeed * 10) / 10,
        clouds: avgClouds,
        pop: Math.round(maxPop * 100),
        rain: totalRain > 0 ? Math.round(totalRain * 10) / 10 : undefined,
      });

      count++;
    }

    return dailyForecasts;
  }

  static async healthCheck(): Promise<boolean> {
    try {
      if (!this.API_KEY) {
        logger.warn('OpenWeatherMap API key not configured');
        return false;
      }
      // Test with a simple location (New Delhi)
      const response = await axios.get(`${this.API_BASE_URL}/weather`, {
        params: {
          lat: 28.6139,
          lon: 77.2090,
          appid: this.API_KEY,
        },
        timeout: 5000,
      });
      return response.status === 200;
    } catch (error) {
      logger.error('Weather service health check failed', { error });
      return false;
    }
  }
}
