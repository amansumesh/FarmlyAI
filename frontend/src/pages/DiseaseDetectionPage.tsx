import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { CameraCapture } from '../components/disease/CameraCapture';
import { DiseaseResult } from '../components/disease/DiseaseResult';
import { Button } from '../components/common/Button';
import { BottomNav } from '../components/common/BottomNav';
import { diseaseService } from '../services/disease.service';
import { DiseaseDetectionResponse, CropType } from '../types/disease.types';
import { useUserStore } from '../store/userStore';
import { parseAIAnalysis } from '../utils/parseAIAnalysis';

type PageState = 'selectCrop' | 'capture' | 'analyzing' | 'result' | 'error';

export const DiseaseDetectionPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useUserStore();

  const [pageState, setPageState] = useState<PageState>('selectCrop');
  const [selectedCrop, setSelectedCrop] = useState<CropType | null>(null);
  const [availableCrops, setAvailableCrops] = useState<string[]>([]);
  const [onlineAvailable, setOnlineAvailable] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [capturedImageData, setCapturedImageData] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<DiseaseDetectionResponse | null>(null);
  const [error, setError] = useState<string>('');

  const getCropDisplayName = (crop: string) => {
    const names: Record<string, string> = {
      tomato: '🍅 Tomato',
      potato: '🥔 Potato',
      pepperbell: '🌶️ Bell Pepper',
      other: '🌿 Other Plants'
    };
    return names[crop] || crop;
  };

  const parsedAIResult = React.useMemo(() => {
    if (result?.mode === 'online' && result.analysis) {
      const cropName = selectedCrop ? getCropDisplayName(selectedCrop).split(' ').slice(1).join(' ') : 'Plant';
      return parseAIAnalysis(result.analysis, cropName);
    }
    return null;
  }, [result, selectedCrop]);

  useEffect(() => {
    const loadCrops = async () => {
      try {
        const crops = await diseaseService.getAvailableCrops();
        setAvailableCrops(crops.crops);
        setOnlineAvailable(crops.online_available);
      } catch (err) {
        console.error('Failed to load crops:', err);
      }
    };
    loadCrops();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleImageCapture = (imageData: string) => {
    setCapturedImageData(imageData);
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleCropSelect = (crop: CropType) => {
    setSelectedCrop(crop);
    setPageState('capture');
  };

  const handleAnalyze = async () => {
    if (!selectedFile && !capturedImageData) {
      setError(t('disease.errors.noImage'));
      return;
    }

    if (!selectedCrop) {
      setError('Please select a crop type first');
      return;
    }

    const mode = selectedCrop === 'other' ? 'online' : 'offline';

    if (mode === 'online' && !isOnline) {
      setError('You are offline. Online mode requires an internet connection.');
      setPageState('error');
      return;
    }

    setPageState('analyzing');
    setError('');

    try {
      let fileToUpload: File;

      if (selectedFile) {
        fileToUpload = selectedFile;
      } else {
        const blob = await fetch(capturedImageData).then((r) => r.blob());
        fileToUpload = new File([blob], 'captured-image.jpg', { type: 'image/jpeg' });
      }

      const response = await diseaseService.detectDisease({
        image: fileToUpload,
        language: user?.language || i18n.language,
        crop: selectedCrop,
        mode
      });

      setResult(response);
      setPageState('result');
    } catch (err) {
      console.error('Disease detection error:', err);
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      setError(
        error.response?.data?.message ||
          error.message ||
          t('disease.errors.analysisFailed')
      );
      setPageState('error');
    }
  };

  const handleReset = () => {
    setPageState('selectCrop');
    setSelectedCrop(null);
    setCapturedImageData('');
    setSelectedFile(null);
    setResult(null);
    setError('');
  };

  const handleBackToCropSelection = () => {
    setPageState('selectCrop');
    setSelectedCrop(null);
    setCapturedImageData('');
    setSelectedFile(null);
  };

  const handleSave = () => {
    navigate('/home');
  };

  const handleGoBack = () => {
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleGoBack}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg
                className="w-6 h-6 text-gray-700"
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
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {t('disease.title')}
              </h1>
              <p className="text-sm text-gray-600">{t('disease.subtitle')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {pageState === 'selectCrop' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Select Your Crop
              </h2>
              <p className="text-sm text-gray-600">
                Choose the type of plant you want to diagnose
              </p>
            </div>

            {!isOnline && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="text-sm text-orange-800">
                    <p className="font-semibold">Offline Mode</p>
                    <p>Only available crops can be detected. "Other Plants" requires internet.</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              {availableCrops.map((crop) => (
                <button
                  key={crop}
                  onClick={() => handleCropSelect(crop as CropType)}
                  className="bg-white border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 rounded-lg p-4 transition-all text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">{getCropDisplayName(crop).split(' ')[0]}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-green-700">
                        {getCropDisplayName(crop).split(' ').slice(1).join(' ')}
                      </h3>
                      <p className="text-sm text-gray-500">Tap to select</p>
                    </div>
                    <svg className="w-6 h-6 text-gray-400 group-hover:text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}

              {isOnline && onlineAvailable && (
                <button
                  onClick={() => handleCropSelect('other')}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg p-4 transition-all text-left group hover:shadow-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">🌿</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">
                        Other Plants
                      </h3>
                      <p className="text-sm text-blue-100">AI-powered detection for any crop</p>
                    </div>
                    <div className="bg-white/20 px-2 py-1 rounded text-xs font-medium">
                      ONLINE
                    </div>
                  </div>
                </button>
              )}
            </div>
          </div>
        )}

        {pageState === 'capture' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={handleBackToCropSelection}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex-1">
                <p className="text-sm text-gray-600">Selected Crop:</p>
                <p className="font-semibold text-gray-900">{selectedCrop && getCropDisplayName(selectedCrop)}</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-3">
                <svg
                  className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="flex-1 text-sm text-blue-800">
                  <p className="font-semibold mb-1">{t('disease.instructions.title')}</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>{t('disease.instructions.step1')}</li>
                    <li>{t('disease.instructions.step2')}</li>
                    <li>{t('disease.instructions.step3')}</li>
                  </ul>
                </div>
              </div>
            </div>

            <CameraCapture
              onCapture={handleImageCapture}
              onFileSelect={handleFileSelect}
            />

            {capturedImageData && (
              <Button onClick={handleAnalyze} className="w-full" size="lg">
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
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                {t('disease.analyzeNow')}
              </Button>
            )}
          </div>
        )}

        {pageState === 'analyzing' && (
          <div className="flex flex-col items-center justify-center py-16 space-y-6">
            <div className="relative">
              <div className="w-24 h-24 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-green-600"
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
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold text-gray-900">
                {t('disease.analyzing')}
              </h3>
              <p className="text-gray-600">{t('disease.analyzingSubtitle')}</p>
            </div>

            {capturedImageData && (
              <div className="w-full max-w-md">
                <img
                  src={capturedImageData}
                  alt="Analyzing"
                  className="w-full rounded-lg shadow-md"
                />
              </div>
            )}
          </div>
        )}

        {pageState === 'result' && result && (
          <>
            {result.mode === 'online' && result.analysis && parsedAIResult ? (
              <>
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <p className="text-sm font-semibold text-purple-900">AI-Powered Analysis</p>
                  </div>
                </div>

                {parsedAIResult.recommendations.length > 0 ? (
                  <>
                    <DiseaseResult
                      imageUrl={result.imageUrl || capturedImageData}
                      predictions={parsedAIResult.predictions}
                      recommendations={parsedAIResult.recommendations}
                      localizedDisease={parsedAIResult.localizedDisease}
                      onReset={handleReset}
                      onSave={handleSave}
                    />
                    
                    <details className="mt-6 bg-gray-50 rounded-lg border border-gray-200">
                      <summary className="cursor-pointer p-4 font-semibold text-gray-700 hover:bg-gray-100 rounded-lg">
                        View Detailed Analysis
                      </summary>
                      <div className="p-4 pt-0">
                        <div className="prose prose-sm max-w-none text-gray-700">
                          <ReactMarkdown>{result.analysis}</ReactMarkdown>
                        </div>
                      </div>
                    </details>
                  </>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                      {capturedImageData && (
                        <img
                          src={capturedImageData}
                          alt="Analyzed crop"
                          className="w-full h-64 object-cover"
                        />
                      )}
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-4">
                        Analysis Result
                      </h3>
                      <div className="prose prose-sm max-w-none text-gray-700">
                        <ReactMarkdown>{result.analysis}</ReactMarkdown>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-4 border-t">
                      <Button variant="outline" onClick={handleReset} className="w-full">
                        Analyze Another
                      </Button>
                      <Button onClick={handleSave} className="w-full">
                        Done
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : result.predictions && result.recommendations ? (
              <DiseaseResult
                imageUrl={result.imageUrl || capturedImageData}
                predictions={result.predictions}
                recommendations={result.recommendations}
                localizedDisease={result.localizedDisease}
                onReset={handleReset}
                onSave={handleSave}
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">No results available</p>
                <Button onClick={handleReset} variant="outline" className="mt-4">
                  Try Again
                </Button>
              </div>
            )}
          </>
        )}

        {pageState === 'error' && (
          <div className="flex flex-col items-center justify-center py-16 space-y-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="w-10 h-10 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold text-gray-900">
                {t('disease.errors.title')}
              </h3>
              <p className="text-gray-600">{error}</p>
            </div>

            <Button onClick={handleReset} variant="outline">
              {t('disease.tryAgain')}
            </Button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};
