import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { schemeService } from '../services/scheme.service';
import { SchemesResponse } from '../types/scheme.types';
import { SchemeCard } from '../components/schemes/SchemeCard';
import { Button } from '../components/common/Button';
import { BottomNav } from '../components/common/BottomNav';
import { useAuthStore } from '../store/authStore';
import { useUserStore } from '../store/userStore';

export const SchemesPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user: authUser } = useAuthStore();
  const { user } = useUserStore();
  const [schemesData, setSchemesData] = useState<SchemesResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadSchemes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await schemeService.getEligibleSchemes(
        user?.language || authUser?.language || i18n.language
      );
      setSchemesData(data);
    } catch (err) {
      const errorMessage = err instanceof Error && 'response' in err 
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message 
        : undefined;
      
      if (errorMessage === 'Please complete your farm profile first') {
        setError(t('schemes.errors.profileIncomplete'));
      } else {
        setError(errorMessage || t('schemes.errors.loadFailed'));
      }
      console.error('Failed to load schemes:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.language, authUser?.language, i18n.language, t]);

  useEffect(() => {
    loadSchemes();
  }, [loadSchemes]);

  const handleCompleteProfile = () => {
    navigate('/onboarding');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <svg
            className="w-16 h-16 text-red-500 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {t('common.error')}
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={loadSchemes} variant="secondary">
              {t('common.retry')}
            </Button>
            {error.includes(t('schemes.errors.profileIncomplete')) && (
              <Button onClick={handleCompleteProfile}>
                {t('schemes.completeProfile')}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            {t('common.back')}
          </button>

          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-gray-900">
              {t('schemes.title')}
            </h1>
            <button
              onClick={loadSchemes}
              className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors"
              title={t('common.refresh')}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>
          <p className="text-gray-600">{t('schemes.subtitle')}</p>

          {schemesData && schemesData.totalSchemes > 0 && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800">
                {t('schemes.eligibleCount', { count: schemesData.totalSchemes })}
              </p>
            </div>
          )}
        </div>

        {schemesData && schemesData.eligibleSchemes.length > 0 ? (
          <div className="space-y-4">
            {schemesData.eligibleSchemes.map((scheme) => (
              <SchemeCard key={scheme.id} scheme={scheme} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t('schemes.noSchemes')}
            </h3>
            <p className="text-gray-600 mb-4">
              {t('schemes.noSchemesDescription')}
            </p>
            <Button onClick={handleCompleteProfile}>
              {t('schemes.updateProfile')}
            </Button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};
