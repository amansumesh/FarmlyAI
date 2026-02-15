import { useTranslation } from 'react-i18next';
import { Market } from '../../types/market.types';
import { cn } from '../../utils/cn';
import { getLocale } from '../../utils/locale';

interface PriceCardProps {
  market: Market;
  isLowest?: boolean;
  isHighest?: boolean;
}

export const PriceCard = ({ market, isLowest, isHighest }: PriceCardProps) => {
  const { t, i18n } = useTranslation();
  const locale = getLocale(i18n.language);

  const trendConfig = {
    up: {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      ),
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/30',
    },
    down: {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      ),
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/30',
    },
    stable: {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
        </svg>
      ),
      color: 'text-gray-600 dark:text-gray-400',
      bgColor: 'bg-gray-50 dark:bg-gray-700',
    },
  };

  const trend = trendConfig[market.trend];

  return (
    <div
      className={cn(
        'border rounded-lg p-4 bg-white dark:bg-gray-800 hover:shadow-md transition-all duration-200 dark:border-gray-700',
        isLowest && 'border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-500',
        isHighest && 'border-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-500'
      )}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white transition-colors">{market.name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">{market.location}</p>
        </div>
        {(isLowest || isHighest) && (
          <span
            className={cn(
              'text-xs px-2 py-1 rounded-full font-medium transition-colors',
              isLowest && 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
              isHighest && 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
            )}
          >
            {isLowest ? t('market.lowestPrice') : t('market.highestPrice')}
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-3xl font-bold text-gray-900 dark:text-white transition-colors">
          ₹{market.price.toLocaleString(locale)}
        </span>
        <span className="text-sm text-gray-600 dark:text-gray-400 transition-colors">/ {t('market.perKg')}</span>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-gray-600 dark:text-gray-400 transition-colors">
            {market.distance.toFixed(1)} {t('market.km')}
          </span>
        </div>

        <div className={cn('flex items-center gap-1 transition-colors', trend.color)}>
          {trend.icon}
          <span className="font-medium">
            {market.changePercent > 0 ? '+' : ''}
            {market.changePercent.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 transition-colors">
        <span className="text-xs text-gray-500 dark:text-gray-400 transition-colors">
          {t('market.lastUpdated')}: {market.date && !isNaN(Date.parse(market.date))
            ? new Date(market.date).toLocaleDateString(locale)
            : '—'}

        </span>
      </div>
    </div>
  );
};
