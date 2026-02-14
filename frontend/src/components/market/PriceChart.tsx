import { useTranslation } from 'react-i18next';
import { getLocale } from '../../utils/locale';
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
  const locale = getLocale(i18n.language);

  const chartData = data.map((item) => ({
    date: new Date(item.date).toLocaleDateString(locale, { month: 'short', day: 'numeric' }),
    price: item.avgPrice,
  }));

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { date: string }; value: number }> }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-300 rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-gray-900">{payload[0].payload.date}</p>
          <p className="text-lg font-bold text-green-600">
            ₹{Math.round(payload[0].value).toLocaleString(locale)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white border rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {t('market.priceHistory')} - {crop}
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => `₹${value}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '14px', paddingTop: '10px' }}
            formatter={() => t('market.price')}
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
