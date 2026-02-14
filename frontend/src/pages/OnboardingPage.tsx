import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '../components/common/LanguageSelector';
import { Button } from '../components/common/Button';
import { useGeolocation } from '../hooks/useGeolocation';
import { useUserStore } from '../store/userStore';
import { useAuthStore } from '../store/authStore';
import { cn } from '../utils/cn';

type OnboardingStep = 'language' | 'name' | 'location' | 'crops' | 'landSize' | 'soilType' | 'complete';

const AVAILABLE_CROPS = [
  'rice', 'wheat', 'cotton', 'sugarcane', 'tomato', 'potato',
  'onion', 'chili', 'maize', 'soybean', 'groundnut', 'pulses', 'mango', 'banana'
];

const SOIL_TYPES = ['loamy', 'clay', 'sandy', 'red', 'black', 'laterite'] as const;

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { updateProfile, loading: userLoading } = useUserStore();
  const { setUser, user: authUser } = useAuthStore();
  const {
    latitude,
    longitude,
    address: geoAddress,
    city: geoCity,
    state: geoState,
    district: geoDistrict,
    error: geoError,
    loading: geoLoading,
    getCurrentLocation
  } = useGeolocation();

  // Check if user is editing an existing profile
  const isEditing = authUser?.onboardingCompleted === true;

  const [currentStep, setCurrentStep] = useState<OnboardingStep>('language');
  const [selectedLanguage, setSelectedLanguage] = useState<string>(i18n.language);
  const [name, setName] = useState('');
  const [useManualLocation, setUseManualLocation] = useState(false);
  const [address, setAddress] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [selectedCrops, setSelectedCrops] = useState<string[]>([]);
  const [landSize, setLandSize] = useState('');
  const [soilType, setSoilType] = useState<typeof SOIL_TYPES[number] | ''>('');
  const [error, setError] = useState('');

  // Pre-populate form fields from existing profile when editing
  useEffect(() => {
    if (isEditing && authUser) {
      // Pre-fill name
      if (authUser.name) {
        setName(authUser.name);
      }
      // Pre-fill language
      if (authUser.language) {
        setSelectedLanguage(authUser.language);
      }

      if (authUser.farmProfile) {
        // Pre-fill crops
        if (authUser.farmProfile.crops && authUser.farmProfile.crops.length > 0) {
          setSelectedCrops(authUser.farmProfile.crops);
        }
        // Pre-fill land size
        if (authUser.farmProfile.landSize) {
          setLandSize(String(authUser.farmProfile.landSize));
        }
        // Pre-fill soil type
        if (authUser.farmProfile.soilType) {
          setSoilType(authUser.farmProfile.soilType);
        }
        // Pre-fill location
        if (authUser.farmProfile.location) {
          const loc = authUser.farmProfile.location;
          if (loc.address) {
            setAddress(loc.address);
            setUseManualLocation(true);
          }
          if (loc.state) {
            setState(loc.state);
          }
          if (loc.district) {
            setDistrict(loc.district);
          }
        }
      }

      // Skip language step when editing — start at name
      setCurrentStep('name');
    }
  }, []); // Run only on mount

  useEffect(() => {
    if (geoAddress && !useManualLocation) {
      setAddress(geoAddress);
    }
    if (geoCity && !useManualLocation) {
      setAddress(geoCity);
    }
    if (geoState && !state) {
      setState(geoState);
    }
    if (geoDistrict && !district) {
      setDistrict(geoDistrict);
    }
  }, [geoAddress, geoCity, geoState, geoDistrict, useManualLocation, state, district]);

  const handleNext = async () => {
    setError('');

    if (currentStep === 'language') {
      setCurrentStep('name');
    } else if (currentStep === 'name') {
      if (!name.trim()) {
        setError('Please enter your name');
        return;
      }
      setCurrentStep('location');
    } else if (currentStep === 'location') {
      if (!useManualLocation && !latitude && !longitude) {
        setError(t('errors.locationFailed'));
        return;
      }
      if (useManualLocation && !address && !state && !district) {
        setError('Please enter location details');
        return;
      }
      setCurrentStep('crops');
    } else if (currentStep === 'crops') {
      if (selectedCrops.length === 0) {
        setError('Please select at least one crop');
        return;
      }
      setCurrentStep('landSize');
    } else if (currentStep === 'landSize') {
      if (!landSize || parseFloat(landSize) <= 0) {
        setError('Please enter a valid land size');
        return;
      }
      setCurrentStep('soilType');
    } else if (currentStep === 'soilType') {
      if (!soilType) {
        setError('Please select a soil type');
        return;
      }
      await handleComplete();
    }
  };

  const handleBack = () => {
    setError('');
    if (currentStep === 'name') {
      if (isEditing) {
        navigate('/profile');
      } else {
        setCurrentStep('language');
      }
    } else if (currentStep === 'location') {
      setCurrentStep('name');
    } else if (currentStep === 'crops') {
      setCurrentStep('location');
    } else if (currentStep === 'landSize') {
      setCurrentStep('crops');
    } else if (currentStep === 'soilType') {
      setCurrentStep('landSize');
    }
  };

  const handleComplete = async () => {
    try {
      let locationData: {
        type: 'Point';
        coordinates: [number, number];
        address?: string;
        state?: string;
        district?: string;
      } | undefined;

      if (useManualLocation) {
        // For manual location, use default coordinates based on state
        // TODO: Implement proper geocoding API in future
        // Default to center of India for MVP
        locationData = {
          type: 'Point',
          coordinates: [78.9629, 20.5937] as [number, number], // Center of India
          address,
          state,
          district
        };
      } else if (latitude && longitude) {
        locationData = {
          type: 'Point',
          coordinates: [longitude, latitude] as [number, number],
          address,
          state,
          district
        };
      }

      await updateProfile({
        name: name.trim(),
        language: selectedLanguage as 'hi' | 'ta' | 'ml' | 'te' | 'kn' | 'en',
        farmProfile: {
          location: locationData,
          crops: selectedCrops,
          landSize: parseFloat(landSize),
          soilType: soilType as typeof SOIL_TYPES[number]
        },
        onboardingCompleted: true
      });

      // Update auth store's user object with ALL profile data
      if (authUser) {
        setUser({
          ...authUser,
          name: name.trim(),
          language: selectedLanguage as 'hi' | 'ta' | 'ml' | 'te' | 'kn' | 'en',
          onboardingCompleted: true,
          farmProfile: {
            location: locationData,
            crops: selectedCrops,
            landSize: parseFloat(landSize),
            soilType: soilType as typeof SOIL_TYPES[number]
          }
        });
      }

      setCurrentStep('complete');
    } catch (err) {
      setError(t('errors.saveFailed'));
    }
  };

  const handleGetLocation = async () => {
    setError('');
    await getCurrentLocation();
    if (geoError) {
      setError(t('errors.locationFailed'));
    }
  };

  const toggleCrop = (crop: string) => {
    setSelectedCrops(prev =>
      prev.includes(crop)
        ? prev.filter(c => c !== crop)
        : [...prev, crop]
    );
  };

  const renderStepIndicator = () => {
    const steps = ['language', 'name', 'location', 'crops', 'landSize', 'soilType'];
    const currentIndex = steps.indexOf(currentStep);

    return (
      <div className="flex items-center justify-center gap-2 mb-8">
        {steps.map((step, index) => (
          <div
            key={step}
            className={cn(
              'h-2 rounded-full transition-all',
              index <= currentIndex ? 'w-8 bg-green-600' : 'w-2 bg-gray-300'
            )}
          />
        ))}
      </div>
    );
  };

  if (currentStep === 'complete') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-6xl mb-6">🎉</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {t('onboarding.allSet')}
          </h1>
          <p className="text-gray-600 mb-8">
            {t('onboarding.readyMessage')}
          </p>
          <Button onClick={() => navigate('/home')} className="w-full" size="lg">
            {t('onboarding.goToHome')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center px-4 py-8">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        {currentStep !== 'language' && renderStepIndicator()}

        {currentStep === 'language' && (
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
              {t('onboarding.welcome')}
            </h1>
            <p className="text-gray-600 mb-2 text-center">{t('onboarding.subtitle')}</p>
            <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
              {t('onboarding.selectLanguage')}
            </h2>
            <p className="text-gray-600 mb-6 text-center">
              {t('onboarding.languagePrompt')}
            </p>
            <LanguageSelector onSelect={setSelectedLanguage} />
            <Button onClick={handleNext} className="w-full mt-8" size="lg">
              {t('common.next')}
            </Button>
          </div>
        )}

        {currentStep === 'name' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              What's your name?
            </h2>
            <p className="text-gray-600 mb-6">
              Let us know what to call you
            </p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-lg"
              autoFocus
            />
            {error && (
              <p className="text-red-600 text-sm mt-2">{error}</p>
            )}
            <div className="flex gap-4 mt-8">
              <Button onClick={handleBack} variant="secondary" size="lg" className="flex-1">
                {t('common.back')}
              </Button>
              <Button onClick={handleNext} size="lg" className="flex-1">
                {t('common.next')}
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'location' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {t('onboarding.locationTitle')}
            </h2>
            <p className="text-gray-600 mb-6">{t('onboarding.locationPrompt')}</p>

            {!useManualLocation ? (
              <div className="space-y-4">
                <Button
                  onClick={handleGetLocation}
                  loading={geoLoading}
                  className="w-full"
                  size="lg"
                >
                  📍 {t('onboarding.useCurrentLocation')}
                </Button>
                {latitude && longitude && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      ✓ Location: {latitude.toFixed(6)}, {longitude.toFixed(6)}
                    </p>
                  </div>
                )}
                <button
                  onClick={() => setUseManualLocation(true)}
                  className="w-full text-green-600 hover:text-green-700 font-medium"
                >
                  {t('onboarding.enterManually')}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('onboarding.address')}
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder={t('onboarding.address')}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('onboarding.state')}
                    </label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder={t('onboarding.state')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('onboarding.district')}
                    </label>
                    <input
                      type="text"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder={t('onboarding.district')}
                    />
                  </div>
                </div>
                <button
                  onClick={() => setUseManualLocation(false)}
                  className="text-green-600 hover:text-green-700 font-medium text-sm"
                >
                  ← {t('onboarding.useCurrentLocation')}
                </button>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="flex gap-3 mt-8">
              <Button onClick={handleBack} variant="outline" className="flex-1">
                {t('common.back')}
              </Button>
              <Button onClick={handleNext} className="flex-1">
                {t('common.next')}
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'crops' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {t('onboarding.cropsTitle')}
            </h2>
            <p className="text-gray-600 mb-6">{t('onboarding.cropsPrompt')}</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {AVAILABLE_CROPS.map((crop) => (
                <button
                  key={crop}
                  onClick={() => toggleCrop(crop)}
                  className={cn(
                    'p-4 rounded-lg border-2 transition-all text-left',
                    selectedCrops.includes(crop)
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-200 hover:border-green-300'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      'w-5 h-5 rounded border-2 flex items-center justify-center',
                      selectedCrops.includes(crop)
                        ? 'border-green-600 bg-green-600'
                        : 'border-gray-300'
                    )}>
                      {selectedCrops.includes(crop) && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className={cn(
                      'font-medium',
                      selectedCrops.includes(crop) ? 'text-green-700' : 'text-gray-700'
                    )}>
                      {t(`crops.${crop}`)}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="flex gap-3 mt-8">
              <Button onClick={handleBack} variant="outline" className="flex-1">
                {t('common.back')}
              </Button>
              <Button onClick={handleNext} className="flex-1">
                {t('common.next')}
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'landSize' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {t('onboarding.landSizeTitle')}
            </h2>
            <p className="text-gray-600 mb-6">{t('onboarding.landSizePrompt')}</p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('onboarding.enterLandSize')}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={landSize}
                  onChange={(e) => setLandSize(e.target.value)}
                  min="0"
                  step="0.1"
                  className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="0.0"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                  {t('onboarding.acres')}
                </span>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="flex gap-3 mt-8">
              <Button onClick={handleBack} variant="outline" className="flex-1">
                {t('common.back')}
              </Button>
              <Button onClick={handleNext} className="flex-1">
                {t('common.next')}
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'soilType' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {t('onboarding.soilTypeTitle')}
            </h2>
            <p className="text-gray-600 mb-6">{t('onboarding.soilTypePrompt')}</p>

            <div className="space-y-3">
              {SOIL_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setSoilType(type)}
                  className={cn(
                    'w-full p-4 rounded-lg border-2 transition-all text-left',
                    soilType === type
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-200 hover:border-green-300'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                      soilType === type
                        ? 'border-green-600'
                        : 'border-gray-300'
                    )}>
                      {soilType === type && (
                        <div className="w-3 h-3 rounded-full bg-green-600" />
                      )}
                    </div>
                    <span className={cn(
                      'text-lg font-medium',
                      soilType === type ? 'text-green-700' : 'text-gray-700'
                    )}>
                      {t(`onboarding.soilTypes.${type}`)}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="flex gap-3 mt-8">
              <Button onClick={handleBack} variant="outline" className="flex-1">
                {t('common.back')}
              </Button>
              <Button
                onClick={handleNext}
                loading={userLoading}
                className="flex-1"
              >
                {t('common.done')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
