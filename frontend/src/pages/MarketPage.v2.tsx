import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { marketService } from '../services/market.service';
import { MarketPricesResponse } from '../types/market.types';
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

export const MarketPageV2 = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
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
      
      // Check if error is due to missing location
      if (err instanceof Error && 'response' in err) {
        const response = (err as { response?: { data?: { error?: string; message?: string } } }).response;
        if (response?.data?.error && response.data.error.includes('location')) {
          errorMessage = 'Location not set in your profile. Please go to Settings and update your farm location to use this feature.';
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
            <p className="text-blue-800">No market data available for {selectedCrop}</p>
          </div>
        )}

        {!loading && !error && marketData && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Market Data Loaded Successfully!</h2>
            <div className="space-y-2">
              <p><strong>Crop:</strong> {marketData.crop}</p>
              <p><strong>Markets found:</strong> {marketData.markets?.length || 0}</p>
              <p><strong>Last updated:</strong> {new Date(marketData.updatedAt).toLocaleString()}</p>
            </div>
            
            {marketData.priceAnalysis && (
              <div className="mt-4 p-4 bg-green-50 rounded">
                <h3 className="font-bold mb-2">Price Analysis</h3>
                <p><strong>Average:</strong> ₹{marketData.priceAnalysis.average}</p>
                <p><strong>Trend:</strong> {marketData.priceAnalysis.trend}</p>
                <p><strong>Recommendation:</strong> {marketData.priceAnalysis.recommendation}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
