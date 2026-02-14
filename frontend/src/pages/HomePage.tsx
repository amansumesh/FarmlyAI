import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { VoiceInput } from '../components/voice/VoiceInput';
import { WeatherWidget } from '../components/weather/WeatherWidget';
import { Header } from '../components/common/Header';
import { BottomNav } from '../components/common/BottomNav';
import { QueryHistoryList } from '../components/voice/QueryHistoryList';

export const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const handleVoiceQueryComplete = (transcription: string, responseText: string) => {
    console.log('Voice query completed:', { transcription, responseText });
  };

  const featureCards = [
    {
      title: t('disease.title'),
      subtitle: t('disease.subtitle'),
      path: '/disease',
      gradient: 'from-green-500 to-green-600',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: t('market.title'),
      subtitle: t('market.subtitle'),
      path: '/market',
      gradient: 'from-blue-500 to-blue-600',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
    {
      title: t('advisory.title'),
      subtitle: t('advisory.subtitle'),
      path: '/advisory',
      gradient: 'from-orange-500 to-orange-600',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
    {
      title: t('schemes.title'),
      subtitle: t('schemes.subtitle'),
      path: '/schemes',
      gradient: 'from-purple-500 to-purple-600',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8 animate-fade-in">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg shadow-md p-6 text-white animate-scale-in">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            {user?.name ? `${t('onboarding.welcome')}, ${user.name}!` : t('onboarding.welcome')}
          </h1>
          <p className="text-green-100 text-sm md:text-base">
            {t('onboarding.subtitle')}
          </p>

          {user?.farmProfile && (
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              {user.farmProfile.location && (
                <span className="bg-white/20 rounded-full px-3 py-1 min-h-[32px] flex items-center">
                  📍 {user.farmProfile.location.address || 
                      (user.farmProfile.location.district && user.farmProfile.location.state 
                        ? `${user.farmProfile.location.district}, ${user.farmProfile.location.state}`
                        : user.farmProfile.location.state || 
                          (user.farmProfile.location.coordinates?.length >= 2
                            ? `${user.farmProfile.location.coordinates[1].toFixed(4)}°N, ${user.farmProfile.location.coordinates[0].toFixed(4)}°E`
                            : 'Location not available'))}
                </span>
              )}

              <span className="bg-white/20 rounded-full px-3 py-1 min-h-[32px] flex items-center">
                🌾 {user.farmProfile.crops.length} {user.farmProfile.crops.length === 1 ? 'Crop' : 'Crops'}
              </span>

              <span className="bg-white/20 rounded-full px-3 py-1 min-h-[32px] flex items-center">
                📏 {user.farmProfile.landSize} {t('onboarding.acres')}
              </span>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 animate-scale-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            <h2 className="text-lg font-semibold text-gray-900">
              {t('voice.title')}
            </h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            {t('voice.subtitle')}
          </p>
          <VoiceInput onQueryComplete={handleVoiceQueryComplete} />
        </div>

        <WeatherWidget compact />

        <div className="animate-scale-in" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Access
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featureCards.map((card, index) => (
              <div
                key={card.path}
                onClick={() => navigate(card.path)}
                className={`bg-gradient-to-br ${card.gradient} rounded-lg p-6 text-white cursor-pointer card-hover min-h-[100px]`}
                style={{ animationDelay: `${0.3 + index * 0.05}s` }}
              >
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 rounded-full p-3 min-w-[56px] min-h-[56px] flex items-center justify-center">
                    {card.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{card.title}</h3>
                    <p className="text-sm opacity-90">{card.subtitle}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 animate-scale-in" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {t('history.title')}
            </h2>
          </div>
          <QueryHistoryList limit={5} />
        </div>
      </div>

      <BottomNav />
    </div>
  );
};
