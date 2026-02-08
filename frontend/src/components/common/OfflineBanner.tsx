import { useTranslation } from 'react-i18next';
import { WifiOff, Wifi } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useEffect, useState } from 'react';

export function OfflineBanner() {
  const { t } = useTranslation();
  const isOnline = useOnlineStatus();
  const [showBanner, setShowBanner] = useState(false);
  const [justCameOnline, setJustCameOnline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowBanner(true);
      setJustCameOnline(false);
    } else if (showBanner) {
      setJustCameOnline(true);
      const timer = setTimeout(() => {
        setShowBanner(false);
        setJustCameOnline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, showBanner]);

  if (!showBanner) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        justCameOnline ? 'bg-green-600' : 'bg-orange-600'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-center gap-2 text-white">
          {justCameOnline ? (
            <>
              <Wifi className="h-5 w-5" />
              <span className="text-sm font-medium">
                {t('offline.back_online', 'Back online')}
              </span>
            </>
          ) : (
            <>
              <WifiOff className="h-5 w-5" />
              <span className="text-sm font-medium">
                {t('offline.banner', 'You are offline. Some features may be limited.')}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
