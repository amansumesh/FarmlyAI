import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { marketService } from '../services/market.service';
import { MarketPricesResponse } from '../types/market.types';
import { Button } from '../components/common/Button';
import { BottomNav } from '../components/common/BottomNav';
import { useAuthStore } from '../store/authStore';
import { getLocale } from '../utils/locale';

const AVAILABLE_CROPS = [
  'rice',
  'wheat',
  'cotton',
  'sugarcane',
  'tomato',
  'potato',
  'onion',
  'chili',
  'maize',
  'soybean',
  'groundnut',
  'pulses',
];

export const MarketPageV2 = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const locale = getLocale(i18n.language);
  const [selectedCrop, setSelectedCrop] = useState<string>('tomato');
  const [marketData, setMarketData] = useState<MarketPricesResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadMarketPrices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await marketService.getMarketPrices({
        crop: selectedCrop,
        language: user?.language || i18n.language,
      });
      setMarketData(data);
    } catch (err) {
      let errorMessage = t('market.errors.loadFailed');

      if (err instanceof Error && 'response' in err) {
        const response = (err as { response?: { data?: { error?: string; message?: string } } }).response;
        if (response?.data?.error && response.data.error.includes('location')) {
          errorMessage = t('market.errors.loadFailed');
        } else if (response?.data?.error) {
          errorMessage = response.data.error;
        } else if (response?.data?.message) {
          errorMessage = response.data.message;
        }
      }

      setError(errorMessage);
      console.error('Failed to load market prices:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCrop, user?.language, i18n.language, t]);

  useEffect(() => {
    loadMarketPrices().catch(console.error);
  }, [loadMarketPrices]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button
            onClick={() => navigate('/home')}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            {t('common.back')}
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">{t('market.title')}</h1>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('market.selectCrop')}
          </label>
          <select
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {AVAILABLE_CROPS.map((crop) => (
              <option key={crop} value={crop}>
                {t(`crops.${crop}`)}
              </option>
            ))}
          </select>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">{t('common.loading')}</p>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 border border-red-300 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3 className="font-semibold text-red-800">{t('common.error')}</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
            <Button onClick={loadMarketPrices} variant="secondary" className="mt-3">
              {t('market.retry')}
            </Button>
          </div>
        )}

        {!loading && !error && !marketData && (
          <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
            <p className="text-blue-800">{t('market.errors.loadFailed')}</p>
          </div>
        )}

        {!loading && !error && marketData && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="space-y-2 mb-4">
              <p><strong>{t('market.nearbyMarkets')}:</strong> {marketData.markets?.length || 0}</p>
              <p><strong>{t('market.lastUpdated')}:</strong> {new Date(marketData.updatedAt).toLocaleString(locale)}</p>
            </div>

            {marketData.priceAnalysis && (() => {
              const trend = marketData.priceAnalysis.trend;
              const trendColors = {
                rising: { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-800', badge: 'bg-green-100 text-green-700' },
                falling: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-800', badge: 'bg-red-100 text-red-700' },
                stable: { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-800', badge: 'bg-yellow-100 text-yellow-700' },
              };
              const colors = trendColors[trend] || trendColors.stable;

              return (
                <div className={`mb-6 rounded-xl border ${colors.border} ${colors.bg} p-6`}>
                  {/* Header with trend badge */}
                  <div className="flex items-center justify-between mb-5">
                    <h3 className={`text-lg font-bold ${colors.text}`}>{t('market.aiRecommendation')}</h3>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${colors.badge}`}>
                      {trend === 'rising' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      )}
                      {trend === 'falling' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
                        </svg>
                      )}
                      {trend === 'stable' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                        </svg>
                      )}
                      {t('market.trend')}: {t(`market.trends.${trend}`)}
                    </span>
                  </div>

                  {/* Stat cards grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                    {/* Average */}
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 text-center">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{t('market.avgPrice')}</p>
                      <p className="text-2xl font-bold text-gray-900">₹{marketData.priceAnalysis.average.toLocaleString(locale)}</p>
                      <p className="text-xs text-gray-400">/ {t('market.perKg')}</p>
                    </div>

                    {/* Lowest */}
                    <div className="bg-white rounded-lg p-4 shadow-sm border-2 border-green-400 text-center">
                      <p className="text-xs font-medium text-green-600 uppercase tracking-wide mb-1">
                        <span className="inline-flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                          {t('market.minPrice')}
                        </span>
                      </p>
                      <p className="text-2xl font-bold text-green-700">₹{marketData.priceAnalysis.lowest?.price.toLocaleString(locale)}</p>
                      <p className="text-xs text-gray-400">/ {t('market.perKg')}</p>
                    </div>

                    {/* Highest */}
                    <div className="bg-white rounded-lg p-4 shadow-sm border-2 border-red-400 text-center">
                      <p className="text-xs font-medium text-red-600 uppercase tracking-wide mb-1">
                        <span className="inline-flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                          </svg>
                          {t('market.maxPrice')}
                        </span>
                      </p>
                      <p className="text-2xl font-bold text-red-700">₹{marketData.priceAnalysis.highest?.price.toLocaleString(locale)}</p>
                      <p className="text-xs text-gray-400">/ {t('market.perKg')}</p>
                    </div>
                  </div>

                  {/* Recommendation banner */}
                  <div className={`rounded-lg p-4 ${colors.badge} border ${colors.border}`}>
                    <p className="text-sm font-medium leading-relaxed">
                      💡 {t(`market.recommendations.${trend}`)}
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Market cards */}
            {marketData.markets && marketData.markets.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {marketData.markets.map((market, index) => (
                  <div key={`${market.name}-${index}`} className="border rounded-lg p-4 bg-gray-50">
                    <h3 className="font-semibold text-lg">{market.name}</h3>
                    <p className="text-sm text-gray-600">{market.location}</p>
                    <p className="text-2xl font-bold mt-2">₹{market.price.toLocaleString(locale)}</p>
                    <p className="text-sm text-gray-500">/ {t('market.perKg')}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {market.distance.toFixed(1)} {t('market.km')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};
