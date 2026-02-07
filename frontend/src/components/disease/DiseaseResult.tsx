import React from 'react';
import { useTranslation } from 'react-i18next';
import { DiseasePrediction, TreatmentRecommendation } from '../../types/disease.types';
import { TreatmentCard } from './TreatmentCard';
import { Button } from '../common/Button';
import { cn } from '../../utils/cn';

interface DiseaseResultProps {
  imageUrl: string;
  predictions: DiseasePrediction[];
  recommendations: TreatmentRecommendation[];
  localizedDisease?: string;
  onReset: () => void;
  onSave?: () => void;
}

export const DiseaseResult: React.FC<DiseaseResultProps> = ({
  imageUrl,
  predictions,
  recommendations,
  localizedDisease,
  onReset,
  onSave,
}) => {
  const { t } = useTranslation();

  const topPrediction = predictions[0];
  const confidencePercentage = Math.round(topPrediction.confidence * 100);

  const severityStyles: Record<string, string> = {
    low: 'bg-green-100 text-green-800 border-green-300',
    moderate: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    high: 'bg-orange-100 text-orange-800 border-orange-300',
    critical: 'bg-red-100 text-red-800 border-red-300',
  };

  const severityIcons: Record<string, string> = {
    low: '✓',
    moderate: '⚠',
    high: '⚠️',
    critical: '🚨',
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <img
          src={imageUrl}
          alt="Analyzed crop"
          className="w-full h-64 object-cover"
        />
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {localizedDisease || topPrediction.disease}
            </h3>
            <p className="text-gray-600">
              {t('disease.affectedCrop')}: <span className="font-medium">{topPrediction.crop}</span>
            </p>
          </div>

          <div
            className={cn(
              'px-4 py-2 rounded-lg border-2 flex items-center gap-2',
              severityStyles[topPrediction.severity]
            )}
          >
            <span className="text-xl">{severityIcons[topPrediction.severity]}</span>
            <div className="text-right">
              <div className="text-xs font-medium uppercase">
                {t(`disease.severity.${topPrediction.severity}`)}
              </div>
              <div className="text-sm font-bold">{confidencePercentage}%</div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="mb-2 flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">{t('disease.confidence')}:</span>
            <span className="text-sm font-bold text-gray-900">{confidencePercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                confidencePercentage >= 90
                  ? 'bg-green-500'
                  : confidencePercentage >= 70
                  ? 'bg-yellow-500'
                  : 'bg-orange-500'
              )}
              style={{ width: `${confidencePercentage}%` }}
            />
          </div>
        </div>

        {predictions.length > 1 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">
              {t('disease.otherPossibilities')}:
            </h4>
            <div className="space-y-1">
              {predictions.slice(1, 3).map((pred, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center text-sm text-gray-600"
                >
                  <span>{pred.disease}</span>
                  <span className="font-medium">{Math.round(pred.confidence * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">
            {t('disease.treatmentRecommendations')}
          </h3>
          <span className="text-sm text-gray-500">
            {recommendations.length} {t('disease.options')}
          </span>
        </div>

        <div className="space-y-3">
          {recommendations.map((treatment, index) => (
            <TreatmentCard key={index} treatment={treatment} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onReset} className="w-full">
          {t('disease.analyzeAnother')}
        </Button>
        {onSave && (
          <Button onClick={onSave} className="w-full">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            {t('disease.saveToHistory')}
          </Button>
        )}
      </div>
    </div>
  );
};
