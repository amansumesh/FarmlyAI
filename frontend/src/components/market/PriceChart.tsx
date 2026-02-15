import { useTranslation } from 'react-i18next';
import { getLocale } from '../../utils/locale';
import { useTheme } from '../../hooks/useTheme';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { PriceHistory } from '../../types/market.types';

interface PriceChartProps {
  data: PriceHistory[];
  crop: string;
}

export const PriceChart = ({ data, crop }: PriceChartProps) => {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const locale = getLocale(i18n.language);

  const chartData = data.map((item) => ({
    date: new Date(item.date).toLocaleDateString(locale, { month: 'short', day: 'numeric' }),
    price: item.avgPrice,
  }));

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { date: string }; value: number }> }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-3 shadow-lg transition-colors">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{payload[0].payload.date}</p>
          <p className="text-lg font-bold text-green-600 dark:text-green-400">
            ₹{Math.round(payload[0].value).toLocaleString(locale)}
          </p>
        </div>
      );
    }
    return null;
  };

  const isDark = theme === 'dark';
  const gridColor = isDark ? '#374151' : '#e5e7eb';
  const axisColor = isDark ? '#9ca3af' : '#6b7280';

  return (
    <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-4 transition-colors duration-200">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 transition-colors">
        {t('market.priceHistory')} - {crop}
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis
            dataKey="date"
            stroke={axisColor}
            style={{ fontSize: '12px' }}
            tick={{ fill: axisColor }}
          />
          <YAxis
            stroke={axisColor}
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => `₹${value}`}
            tick={{ fill: axisColor }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '14px', paddingTop: '10px', color: axisColor }}
            formatter={(_value) => <span style={{ color: axisColor }}>{t('market.price')}</span>}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: '#10b981', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
