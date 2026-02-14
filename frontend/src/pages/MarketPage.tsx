import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { marketService } from '../services/market.service';
import { getLocale } from '../utils/locale';
import { MarketPricesResponse } from '../types/market.types';
import { PriceCard } from '../components/market/PriceCard';
import { PriceChart } from '../components/market/PriceChart';
import { Button } from '../components/common/Button';
import { useAuthStore } from '../store/authStore';

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

export const MarketPage = () => {
  console.log('[MarketPage] Rendering...');
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [selectedCrop, setSelectedCrop] = useState<string>('tomato');
  const [marketData, setMarketData] = useState<MarketPricesResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  console.log('[MarketPage] State:', { loading, error, hasData: !!marketData });

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
      const errorMessage = err instanceof Error && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      setError(errorMessage || t('market.errors.loadFailed'));
      console.error('Failed to load market prices:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCrop, user?.language, i18n.language, t]);

  useEffect(() => {
    loadMarketPrices().catch(console.error);
  }, [loadMarketPrices]);

  const getLowestPriceIndex = () => {
    if (!marketData?.markets || marketData.markets.length === 0) return -1;
    return marketData.markets.reduce(
      (minIdx, market, idx, arr) => (market.price < arr[minIdx].price ? idx : minIdx),
      0
    );
  };

  const getHighestPriceIndex = () => {
    if (!marketData?.markets || marketData.markets.length === 0) return -1;
    return marketData.markets.reduce(
      (maxIdx, market, idx, arr) => (market.price > arr[maxIdx].price ? idx : maxIdx),
      0
    );
  };

  const getRecommendationColor = () => {
    if (!marketData?.priceAnalysis) return 'bg-gray-100 text-gray-800';
    const trend = marketData.priceAnalysis.trend;
    if (trend === 'rising') return 'bg-green-100 text-green-800 border-green-300';
    if (trend === 'falling') return 'bg-red-100 text-red-800 border-red-300';
    return 'bg-yellow-100 text-yellow-800 border-yellow-300';
  };

  const getRecommendationIcon = () => {
    if (!marketData?.priceAnalysis) return null;
    const trend = marketData.priceAnalysis.trend;

    if (trend === 'rising') {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
        </svg>
      );
    }

    if (trend === 'falling') {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6"
          />
        </svg>
      );
    }

    return (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
      </svg>
    );
  };

  const lowestPriceIdx = getLowestPriceIndex();
  const highestPriceIdx = getHighestPriceIndex();

  console.log('[MarketPage] Rendering JSX...');

  return (
    <div className="min-h-screen bg-gray-50">
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

        {error && (
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

        {!loading && !error && marketData && (
          <>
            {marketData.priceAnalysis && (
              <div className={`border rounded-lg p-6 mb-6 ${getRecommendationColor()}`}>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">{getRecommendationIcon()}</div>
                  <div className="flex-1">
                    <h2 className="text-lg font-bold mb-2">{t('market.aiRecommendation')}</h2>
                    <p className="text-lg mb-4">
                      {t(`market.recommendations.${marketData.priceAnalysis.trend}`)}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">{t('market.avgPrice')}:</span>
                        <span className="ml-2 text-lg font-bold">
                          ₹{marketData.priceAnalysis.average.toLocaleString(getLocale(i18n.language))}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">{t('market.minPrice')}:</span>
                        <span className="ml-2 text-lg font-bold">
                          ₹{marketData.priceAnalysis.lowest.price.toLocaleString(getLocale(i18n.language))}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">{t('market.maxPrice')}:</span>
                        <span className="ml-2 text-lg font-bold">
                          ₹{marketData.priceAnalysis.highest.price.toLocaleString(getLocale(i18n.language))}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">{t('market.trend')}:</span>
                        <span className="ml-2 font-bold capitalize">{t(`market.trends.${marketData.priceAnalysis.trend}`)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {t('market.nearbyMarkets')} ({marketData.markets.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {marketData.markets.map((market, index) => (
                  <PriceCard
                    key={`${market.name}-${index}`}
                    market={market}
                    isLowest={index === lowestPriceIdx}
                    isHighest={index === highestPriceIdx}
                  />
                ))}
              </div>
            </div>

            {marketData.priceHistory && marketData.priceHistory.length > 0 && (
              <div className="mb-6">
                <PriceChart data={marketData.priceHistory} crop={t(`crops.${selectedCrop}`)} />
              </div>
            )}

            <div className="bg-white border rounded-lg p-4 text-center text-sm text-gray-500">
              {t('market.lastUpdated')}: {new Date(marketData.updatedAt).toLocaleString(getLocale(i18n.language))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
