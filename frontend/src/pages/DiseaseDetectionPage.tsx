import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { CameraCapture } from '../components/disease/CameraCapture';
import { DiseaseResult } from '../components/disease/DiseaseResult';
import { Button } from '../components/common/Button';
import { diseaseService } from '../services/disease.service';
import { DiseaseDetectionResponse } from '../types/disease.types';
import { useUserStore } from '../store/userStore';

type PageState = 'capture' | 'analyzing' | 'result' | 'error';

export const DiseaseDetectionPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useUserStore();

  const [pageState, setPageState] = useState<PageState>('capture');
  const [capturedImageData, setCapturedImageData] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<DiseaseDetectionResponse | null>(null);
  const [error, setError] = useState<string>('');

  const handleImageCapture = (imageData: string) => {
    setCapturedImageData(imageData);
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleAnalyze = async () => {
    if (!selectedFile && !capturedImageData) {
      setError(t('disease.errors.noImage'));
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
    setPageState('capture');
    setCapturedImageData('');
    setSelectedFile(null);
    setResult(null);
    setError('');
  };

  const handleSave = () => {
    navigate('/home');
  };

  const handleGoBack = () => {
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
        {pageState === 'capture' && (
          <div className="space-y-6">
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
          <DiseaseResult
            imageUrl={result.imageUrl || capturedImageData}
            predictions={result.predictions}
            recommendations={result.recommendations}
            localizedDisease={result.localizedDisease}
            onReset={handleReset}
            onSave={handleSave}
          />
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
    </div>
  );
};
