import { useTranslation } from 'react-i18next';
import { WifiOff, RefreshCw } from 'lucide-react';

export function OfflineFallback() {
  const { t } = useTranslation();

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-gray-200 p-6">
            <WifiOff className="h-16 w-16 text-gray-600" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          {t('offline.title', 'You are offline')}
        </h1>

        <p className="text-gray-600 mb-8">
          {t(
            'offline.message',
            'Please check your internet connection and try again. Some features may still be available offline.'
          )}
        </p>

        <div className="space-y-4">
          <button
            onClick={handleRetry}
            className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            <RefreshCw className="h-5 w-5" />
            {t('offline.retry', 'Try Again')}
          </button>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
            <h3 className="font-semibold text-blue-900 mb-2">
              {t('offline.available_title', 'Available Offline:')}
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• {t('offline.feature_1', 'Disease detection (previously loaded)')}</li>
              <li>• {t('offline.feature_2', 'Cached market prices')}</li>
              <li>• {t('offline.feature_3', 'Previously viewed recommendations')}</li>
              <li>• {t('offline.feature_4', 'Government schemes information')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
