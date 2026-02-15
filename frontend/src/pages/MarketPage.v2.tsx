import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft } from 'lucide-react';
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button
            onClick={() => navigate('/home')}
            variant="secondary"
            size="sm"
            className="rounded-full w-10 h-10 p-0 flex items-center justify-center shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors">{t('market.title')}</h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6 transition-colors duration-200">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
            {t('market.selectCrop')}
          </label>
          <select
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            className="w-full md:w-64 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
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
            <p className="mt-4 text-gray-600 dark:text-gray-400 transition-colors">{t('common.loading')}</p>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-800 rounded-lg p-4 mb-6 transition-colors">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3 className="font-semibold text-red-800 dark:text-red-200 transition-colors">{t('common.error')}</h3>
                <p className="text-sm text-red-700 dark:text-red-300 transition-colors">{error}</p>
              </div>
            </div>
            <Button onClick={loadMarketPrices} variant="secondary" className="mt-3">
              {t('market.retry')}
            </Button>
          </div>
        )}

        {!loading && !error && !marketData && (
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-800 rounded-lg p-4 transition-colors">
            <p className="text-blue-800 dark:text-blue-200 transition-colors">{t('market.errors.loadFailed')}</p>
          </div>
        )}

        {!loading && !error && marketData && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors duration-200">
            <div className="space-y-2 mb-4 text-gray-900 dark:text-gray-200 transition-colors">
              <p><strong>{t('market.nearbyMarkets')}:</strong> {marketData.markets?.length || 0}</p>
              <p><strong>{t('market.lastUpdated')}:</strong> {new Date(marketData.updatedAt).toLocaleString(locale)}</p>
            </div>

            {marketData.priceAnalysis && (() => {
              const trend = marketData.priceAnalysis.trend;
              const trendColors = {
                rising: {
                  bg: 'bg-green-50 dark:bg-green-900/20',
                  border: 'border-green-300 dark:border-green-800',
                  text: 'text-green-800 dark:text-green-300',
                  badge: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                },
                falling: {
                  bg: 'bg-red-50 dark:bg-red-900/20',
                  border: 'border-red-300 dark:border-red-800',
                  text: 'text-red-800 dark:text-red-300',
                  badge: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                },
                stable: {
                  bg: 'bg-yellow-50 dark:bg-yellow-900/20',
                  border: 'border-yellow-300 dark:border-yellow-800',
                  text: 'text-yellow-800 dark:text-yellow-300',
                  badge: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300'
                },
              };
              const colors = trendColors[trend] || trendColors.stable;

              return (
                <div className={`mb-6 rounded-xl border ${colors.border} ${colors.bg} p-6 transition-colors`}>
                  {/* Header with trend badge */}
                  <div className="flex items-center justify-between mb-5">
                    <h3 className={`text-lg font-bold ${colors.text} transition-colors`}>{t('market.aiRecommendation')}</h3>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${colors.badge} transition-colors`}>
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
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 text-center transition-colors">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 transition-colors">{t('market.avgPrice')}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">₹{marketData.priceAnalysis.average.toLocaleString(locale)}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 transition-colors">/ {t('market.perKg')}</p>
                    </div>

                    {/* Lowest */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border-2 border-green-400 dark:border-green-600 text-center transition-colors">
                      <p className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide mb-1 transition-colors">
                        <span className="inline-flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                          {t('market.minPrice')}
                        </span>
                      </p>
                      <p className="text-2xl font-bold text-green-700 dark:text-green-300 transition-colors">₹{marketData.priceAnalysis.lowest?.price.toLocaleString(locale)}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 transition-colors">/ {t('market.perKg')}</p>
                    </div>

                    {/* Highest */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border-2 border-red-400 dark:border-red-600 text-center transition-colors">
                      <p className="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wide mb-1 transition-colors">
                        <span className="inline-flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                          </svg>
                          {t('market.maxPrice')}
                        </span>
                      </p>
                      <p className="text-2xl font-bold text-red-700 dark:text-red-300 transition-colors">₹{marketData.priceAnalysis.highest?.price.toLocaleString(locale)}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 transition-colors">/ {t('market.perKg')}</p>
                    </div>
                  </div>

                  {/* Recommendation banner */}
                  <div className={`rounded-lg p-4 ${colors.badge} border ${colors.border} transition-colors`}>
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
                  <div key={`${market.name}-${index}`} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50 transition-colors">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white transition-colors">{market.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">{market.location}</p>
                    <p className="text-2xl font-bold mt-2 text-gray-900 dark:text-white transition-colors">₹{market.price.toLocaleString(locale)}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors">/ {t('market.perKg')}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 transition-colors">
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
