import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { VoiceInput } from '../components/voice/VoiceInput';

export const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleVoiceQueryComplete = (transcription: string, responseText: string) => {
    console.log('Voice query completed:', { transcription, responseText });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Welcome to Farmly AI</h1>
            <Button onClick={handleLogout} variant="secondary">
              Logout
            </Button>
          </div>

          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-green-900 mb-2">User Information</h2>
              <div className="space-y-1 text-sm text-green-800">
                <p><span className="font-medium">Phone:</span> {user?.phoneNumber}</p>
                <p><span className="font-medium">Language:</span> {user?.language.toUpperCase()}</p>
                <p><span className="font-medium">Onboarding Status:</span> {user?.onboardingCompleted ? 'Completed' : 'Pending'}</p>
              </div>
            </div>

            <div className="my-6">
              <VoiceInput onQueryComplete={handleVoiceQueryComplete} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div
                onClick={() => navigate('/disease')}
                className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white cursor-pointer hover:shadow-lg transition-all transform hover:scale-105"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 rounded-full p-3">
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{t('disease.title')}</h3>
                    <p className="text-sm text-green-100">{t('disease.subtitle')}</p>
                  </div>
                </div>
              </div>

              <div
                onClick={() => navigate('/market')}
                className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white cursor-pointer hover:shadow-lg transition-all transform hover:scale-105"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 rounded-full p-3">
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{t('market.title')}</h3>
                    <p className="text-sm text-blue-100">{t('market.subtitle')}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white opacity-50 cursor-not-allowed">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 rounded-full p-3">
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Farm Advisory</h3>
                    <p className="text-sm text-orange-100">Coming soon</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white opacity-50 cursor-not-allowed">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 rounded-full p-3">
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Government Schemes</h3>
                    <p className="text-sm text-purple-100">Coming soon</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
