import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { useUserStore } from '../store/userStore';
import { Button } from '../components/common/Button';
import { Header } from '../components/common/Header';
import { BottomNav } from '../components/common/BottomNav';
import { LanguageSelector } from '../components/common/LanguageSelector';

export const ProfilePage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { updateProfile } = useUserStore();
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleLanguageChange = async (languageCode: string) => {
    const validLanguages = ['hi', 'ta', 'ml', 'te', 'kn', 'en'] as const;
    type ValidLanguage = typeof validLanguages[number];
    const language = validLanguages.includes(languageCode as ValidLanguage) 
      ? languageCode as ValidLanguage
      : 'en';
    
    await updateProfile({ language });
    
    // Update authStore to sync the language
    if (user) {
      const { setUser } = useAuthStore.getState();
      setUser({ ...user, language });
    }
    
    i18n.changeLanguage(languageCode);
    setShowLanguageSelector(false);
  };

  const handleEditProfile = () => {
    navigate('/onboarding');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      <Header />
      
      <div className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {t('profile.title')}
        </h1>

        <div className="bg-white rounded-lg shadow-md divide-y divide-gray-200">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-green-600 rounded-full w-16 h-16 flex items-center justify-center text-white font-bold text-2xl">
                {user.name ? user.name.charAt(0).toUpperCase() : user.phoneNumber?.slice(-2) || 'U'}
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900">
                  {user.name || user.phoneNumber}
                </p>
                <p className="text-sm text-gray-500 capitalize">
                  {t('profile.language')}: {user.language}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  {t('profile.phoneNumber')}
                </label>
                <p className="text-gray-900">{user.phoneNumber}</p>
              </div>

              {user.farmProfile && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      {t('advisory.location')}
                    </label>
                    <p className="text-gray-900">
                      {user.farmProfile.location?.address || 
                       (user.farmProfile.location?.district && user.farmProfile.location?.state
                         ? `${user.farmProfile.location.district}, ${user.farmProfile.location.state}`
                         : user.farmProfile.location?.state ||
                           (user.farmProfile.location?.coordinates 
                             ? `${user.farmProfile.location.coordinates[1].toFixed(4)}°N, ${user.farmProfile.location.coordinates[0].toFixed(4)}°E`
                             : t('profile.notSet')))}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      {t('onboarding.cropsTitle')}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {user.farmProfile.crops.map((crop) => (
                        <span
                          key={crop}
                          className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                        >
                          {t(`crops.${crop}`)}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        {t('onboarding.landSizeTitle')}
                      </label>
                      <p className="text-gray-900">
                        {user.farmProfile.landSize} {t('onboarding.acres')}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        {t('onboarding.soilTypeTitle')}
                      </label>
                      <p className="text-gray-900 capitalize">
                        {user.farmProfile.soilType ? t(`onboarding.soilTypes.${user.farmProfile.soilType}`) : t('profile.notSet')}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="p-6 space-y-3">
            <Button
              onClick={handleEditProfile}
              variant="secondary"
              className="w-full"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {t('profile.editProfile')}
            </Button>

            <Button
              onClick={() => setShowLanguageSelector(!showLanguageSelector)}
              variant="secondary"
              className="w-full"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              {t('profile.changeLanguage')}
            </Button>

            {showLanguageSelector && (
              <div className="pt-4">
                <LanguageSelector
                  onSelect={handleLanguageChange}
                />
              </div>
            )}
          </div>

          <div className="p-6">
            <Button
              onClick={handleLogout}
              variant="secondary"
              className="w-full text-red-600 hover:bg-red-50"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {t('profile.logout')}
            </Button>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>{t('profile.version')}</p>
          <p className="mt-1">{t('profile.tagline')}</p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};
