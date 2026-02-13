import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { weatherService } from '../../services/weather.service';
import { CurrentWeather, ForecastDay } from '../../types/weather.types';
import { cn } from '../../utils/cn';

interface WeatherWidgetProps {
  className?: string;
  compact?: boolean;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  className,
  compact = false,
}) => {
  const { t } = useTranslation();
  const [current, setCurrent] = useState<CurrentWeather | null>(null);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWeather();
  }, []);

  const loadWeather = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await weatherService.getForecast();
      setCurrent(data.current);
      setForecast(data.forecast);
    } catch (err) {
      console.error('Failed to load weather:', err);
      setError('Failed to load weather data');
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (icon: string) => {
    return `https://openweathermap.org/img/wn/${icon}@2x.png`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' }).format(date);
  };

  if (loading) {
    return (
      <div className={cn('bg-white rounded-lg shadow-md p-4', className)}>
        <div className="flex items-center justify-center h-32">
          <div className="animate-pulse flex space-x-4">
            <div className="rounded-full bg-gray-200 h-12 w-12"></div>
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !current) {
    return (
      <div className={cn('bg-white rounded-lg shadow-md p-4', className)}>
        <div className="text-center text-gray-500 py-4">
          <p>{t('weather.error', 'Weather unavailable')}</p>
          <button
            onClick={loadWeather}
            className="mt-2 text-sm text-green-600 hover:text-green-700"
          >
            {t('weather.retry', 'Retry')}
          </button>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={cn('bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-4 text-white', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={getWeatherIcon(current.icon)}
              alt={current.description}
              className="w-16 h-16"
            />
            <div>
              <p className="text-3xl font-bold">{current.temp}°C</p>
              <p className="text-sm opacity-90 capitalize">{current.description}</p>
            </div>
          </div>
          <div className="text-right text-sm">
            <p className="opacity-90">
              💧 {current.humidity}%
            </p>
            <p className="opacity-90">
              💨 {current.windSpeed} m/s
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-white rounded-lg shadow-md overflow-hidden', className)}>
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white">
        <h2 className="text-xl font-semibold mb-4">
          {t('weather.current', 'Current Weather')}
        </h2>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src={getWeatherIcon(current.icon)}
              alt={current.description}
              className="w-20 h-20"
            />
            <div>
              <p className="text-5xl font-bold">{current.temp}°C</p>
              <p className="text-lg opacity-90 capitalize">{current.description}</p>
              <p className="text-sm opacity-75">
                {t('weather.feelsLike', 'Feels like')} {current.feels_like}°C
              </p>
            </div>
          </div>
          
          <div className="text-right space-y-1">
            <p className="flex items-center justify-end gap-2">
              <span className="opacity-75">{t('weather.humidity', 'Humidity')}</span>
              <span className="font-semibold">{current.humidity}%</span>
            </p>
            <p className="flex items-center justify-end gap-2">
              <span className="opacity-75">{t('weather.wind', 'Wind')}</span>
              <span className="font-semibold">{current.windSpeed} m/s</span>
            </p>
            <p className="flex items-center justify-end gap-2">
              <span className="opacity-75">{t('weather.clouds', 'Clouds')}</span>
              <span className="font-semibold">{current.clouds}%</span>
            </p>
          </div>
        </div>
      </div>

      {forecast.length > 0 && (
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">
            {t('weather.forecast', '7-Day Forecast')}
          </h3>
          <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
            {forecast.map((day, index) => (
              <div
                key={index}
                className="text-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <p className="text-xs text-gray-600 mb-1 font-medium">
                  {index === 0 ? t('weather.today', 'Today') : formatDate(day.date)}
                </p>
                <img
                  src={getWeatherIcon(day.icon)}
                  alt={day.description}
                  className="w-12 h-12 mx-auto"
                />
                <div className="mt-1">
                  <p className="text-lg font-bold text-gray-800">
                    {day.temp.max}°
                  </p>
                  <p className="text-sm text-gray-500">
                    {day.temp.min}°
                  </p>
                </div>
                {day.pop > 30 && (
                  <p className="text-xs text-blue-600 mt-1">
                    💧 {day.pop}%
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
