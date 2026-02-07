import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/cn';

interface LanguageSelectorProps {
  onSelect?: (language: string) => void;
  className?: string;
}

const languages = [
  { code: 'hi', name: 'हिंदी', icon: '🇮🇳' },
  { code: 'ta', name: 'தமிழ்', icon: '🇮🇳' },
  { code: 'ml', name: 'മലയാളം', icon: '🇮🇳' },
  { code: 'te', name: 'తెలుగు', icon: '🇮🇳' },
  { code: 'kn', name: 'ಕನ್ನಡ', icon: '🇮🇳' },
  { code: 'en', name: 'English', icon: '🇬🇧' }
];

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  onSelect, 
  className 
}) => {
  const { i18n } = useTranslation();

  const handleSelect = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    if (onSelect) {
      onSelect(languageCode);
    }
  };

  return (
    <div className={cn('grid grid-cols-2 gap-3 w-full', className)}>
      {languages.map((language) => (
        <button
          key={language.code}
          onClick={() => handleSelect(language.code)}
          className={cn(
            'flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all',
            'hover:scale-105 active:scale-95',
            i18n.language === language.code
              ? 'border-green-600 bg-green-50 shadow-md'
              : 'border-gray-200 bg-white hover:border-green-300'
          )}
        >
          <span className="text-4xl mb-2">{language.icon}</span>
          <span className={cn(
            'text-lg font-semibold',
            i18n.language === language.code
              ? 'text-green-700'
              : 'text-gray-700'
          )}>
            {language.name}
          </span>
        </button>
      ))}
    </div>
  );
};
