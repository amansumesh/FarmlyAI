import React from 'react';
import { useTranslation } from 'react-i18next';
import { TreatmentRecommendation } from '../../types/disease.types';
import { cn } from '../../utils/cn';

interface TreatmentCardProps {
  treatment: TreatmentRecommendation;
}

export const TreatmentCard: React.FC<TreatmentCardProps> = ({ treatment }) => {
  const { t } = useTranslation();

  const typeStyles = {
    organic: 'bg-green-50 border-green-200 text-green-900',
    chemical: 'bg-orange-50 border-orange-200 text-orange-900',
    preventive: 'bg-blue-50 border-blue-200 text-blue-900',
  };

  const typeIcons = {
    organic: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
        />
      </svg>
    ),
    chemical: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
        />
      </svg>
    ),
    preventive: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    ),
  };

  return (
    <div className={cn('border rounded-lg p-4 space-y-3', typeStyles[treatment.type])}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {typeIcons[treatment.type]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-base">{treatment.title}</h4>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/50">
              {t(`disease.treatmentTypes.${treatment.type}`)}
            </span>
          </div>
          <p className="text-sm leading-relaxed">{treatment.description}</p>
        </div>
      </div>

      {treatment.steps && treatment.steps.length > 0 && (
        <div>
          <h5 className="text-sm font-semibold mb-2">{t('disease.steps')}:</h5>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            {treatment.steps.map((step, index) => (
              <li key={index} className="leading-relaxed">{step}</li>
            ))}
          </ol>
        </div>
      )}

      {treatment.products && treatment.products.length > 0 && (
        <div>
          <h5 className="text-sm font-semibold mb-2">{t('disease.recommendedProducts')}:</h5>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {treatment.products.map((product, index) => (
              <li key={index}>{product}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
