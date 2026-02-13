import { Scheme } from '../../types/scheme.types';
import { useTranslation } from 'react-i18next';

interface SchemeCardProps {
  scheme: Scheme;
}

export const SchemeCard = ({ scheme }: SchemeCardProps) => {
  const { t } = useTranslation();

  const getMatchColor = (match: number) => {
    if (match >= 80) return 'bg-green-100 text-green-800';
    if (match >= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'central':
        return 'bg-blue-100 text-blue-800';
      case 'state':
        return 'bg-purple-100 text-purple-800';
      case 'district':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-gray-900 flex-1 pr-4">
          {scheme.name}
        </h3>
        <div className="flex gap-2 flex-shrink-0">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getMatchColor(scheme.eligibilityMatch)}`}>
            {scheme.eligibilityMatch}% {t('schemes.match')}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(scheme.type)}`}>
            {t(`schemes.types.${scheme.type}`)}
          </span>
        </div>
      </div>

      <p className="text-gray-600 text-sm mb-4">{scheme.description}</p>

      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">
          {t('schemes.benefits')}:
        </h4>
        <ul className="space-y-1">
          {scheme.benefits.map((benefit, index) => (
            <li key={index} className="flex items-start text-sm text-gray-700">
              <svg
                className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5"
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
              {benefit}
            </li>
          ))}
        </ul>
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">
          {t('schemes.applicationSteps')}:
        </h4>
        <ol className="list-decimal list-inside space-y-1">
          {scheme.applicationSteps.map((step, index) => (
            <li key={index} className="text-sm text-gray-700">
              {step}
            </li>
          ))}
        </ol>
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">
          {t('schemes.requiredDocuments')}:
        </h4>
        <div className="flex flex-wrap gap-2">
          {scheme.requiredDocuments.map((doc, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
            >
              {doc}
            </span>
          ))}
        </div>
      </div>

      {scheme.applicationUrl && (
        <div className="flex justify-end">
          <a
            href={scheme.applicationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
          >
            {t('schemes.applyNow')}
            <svg
              className="ml-2 w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>
      )}
    </div>
  );
};
