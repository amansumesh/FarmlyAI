import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { advisoryService } from '../services/advisory.service';
import { AdvisoryResponse } from '../types/advisory.types';
import { RecommendationCard } from '../components/advisory/RecommendationCard';
import { Button } from '../components/common/Button';
import { BottomNav } from '../components/common/BottomNav';
import { useAuthStore } from '../store/authStore';
import { useUserStore } from '../store/userStore';

export const AdvisoryPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user: authUser } = useAuthStore();
  const { user } = useUserStore();
  const [advisoryData, setAdvisoryData] = useState<AdvisoryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadAdvisory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await advisoryService.getRecommendations(
        user?.language || authUser?.language || i18n.language
      );
      setAdvisoryData(data);
    } catch (err) {
      const errorMessage = err instanceof Error && 'response' in err 
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message 
        : undefined;
      
      if (errorMessage === 'Please complete your farm profile first') {
        setError(t('advisory.errors.profileIncomplete'));
      } else if (errorMessage === 'Farm location is required for personalized recommendations') {
        setError(t('advisory.errors.locationRequired'));
      } else if (errorMessage === 'Please add at least one crop to your farm profile') {
        setError(t('advisory.errors.cropsRequired'));
      } else {
        setError(errorMessage || t('advisory.errors.loadFailed'));
      }
      console.error('Failed to load advisory:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.language, authUser?.language, i18n.language, t]);

  useEffect(() => {
    loadAdvisory();
  }, [loadAdvisory]);

  const handleCompleteProfile = () => {
    navigate('/onboarding');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <svg
            className="w-16 h-16 text-red-500 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('common.error')}</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={loadAdvisory} variant="primary">
              {t('common.retry')}
            </Button>
            {(error === t('advisory.errors.profileIncomplete') ||
              error === t('advisory.errors.locationRequired') ||
              error === t('advisory.errors.cropsRequired')) && (
              <Button onClick={handleCompleteProfile} variant="secondary">
                {t('advisory.completeProfile')}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!advisoryData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      <div className="bg-green-600 text-white p-6 shadow-md">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>{t('common.back')}</span>
          </button>
          <h1 className="text-2xl font-bold mb-2">{t('advisory.title')}</h1>
          <p className="text-green-100">{t('advisory.subtitle')}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t('advisory.farmContext')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('advisory.crop')}</p>
                <p className="font-medium text-gray-900 capitalize">
                  {advisoryData.basedOn.crop}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('advisory.location')}</p>
                <p className="font-medium text-gray-900">
                  {advisoryData.basedOn.location}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('advisory.soilType')}</p>
                <p className="font-medium text-gray-900 capitalize">
                  {advisoryData.basedOn.soilType}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {t('advisory.currentWeather')}
            </h2>
            <span className="text-sm text-gray-600">
              {advisoryData.weather.location.name}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <img
                src={`https://openweathermap.org/img/wn/${advisoryData.weather.current.icon}@2x.png`}
                alt={advisoryData.weather.current.description}
                className="w-16 h-16"
              />
              <div>
                <p className="text-3xl font-bold text-gray-900">
                  {advisoryData.weather.current.temp}°C
                </p>
                <p className="text-sm text-gray-600 capitalize">
                  {advisoryData.weather.current.description}
                </p>
              </div>
            </div>
            <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4 ml-4">
              <div>
                <p className="text-xs text-gray-600">{t('weather.humidity')}</p>
                <p className="font-medium text-gray-900">
                  {advisoryData.weather.current.humidity}%
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">{t('weather.windSpeed')}</p>
                <p className="font-medium text-gray-900">
                  {advisoryData.weather.current.windSpeed} m/s
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">{t('weather.feelsLike')}</p>
                <p className="font-medium text-gray-900">
                  {advisoryData.weather.current.feels_like}°C
                </p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {t('advisory.recommendations')}
            </h2>
            <button
              onClick={loadAdvisory}
              className="flex items-center gap-2 text-green-600 hover:text-green-700 font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {t('common.refresh')}
            </button>
          </div>

          {advisoryData.recommendations.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <svg
                className="w-16 h-16 text-gray-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-gray-600">{t('advisory.noRecommendations')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {advisoryData.recommendations.map((rec, index) => (
                <RecommendationCard key={index} recommendation={rec} />
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};
