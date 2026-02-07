import React from 'react';
import { useTranslation } from 'react-i18next';
import { useCamera } from '../../hooks/useCamera';
import { Button } from '../common/Button';
import { cn } from '../../utils/cn';

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onFileSelect: (file: File) => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onFileSelect }) => {
  const { t } = useTranslation();
  const {
    videoRef,
    canvasRef,
    isStreaming,
    error,
    capturedImage,
    startCamera,
    stopCamera,
    capturePhoto,
    clearPhoto,
  } = useCamera();

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleCapture = () => {
    const imageData = capturePhoto();
    if (imageData) {
      onCapture(imageData);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onCapture(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRetake = () => {
    clearPhoto();
    startCamera();
  };

  return (
    <div className="space-y-4">
      <div className="relative bg-black rounded-lg overflow-hidden aspect-[4/3]">
        {!capturedImage ? (
          <>
            <video
              ref={videoRef}
              className={cn(
                'w-full h-full object-cover',
                !isStreaming && 'hidden'
              )}
              autoPlay
              playsInline
            />
            
            {!isStreaming && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="text-center space-y-4">
                  <svg
                    className="w-24 h-24 mx-auto text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <p className="text-gray-400">{t('disease.cameraInactive')}</p>
                </div>
              </div>
            )}

            {isStreaming && (
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-white text-sm text-center">
                  {t('disease.alignLeaf')}
                </p>
              </div>
            )}
          </>
        ) : (
          <img
            src={capturedImage}
            alt="Captured"
            className="w-full h-full object-cover"
          />
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {!isStreaming && !capturedImage && (
          <>
            <Button onClick={startCamera} className="w-full">
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
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {t('disease.openCamera')}
            </Button>

            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
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
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {t('disease.uploadImage')}
            </Button>
          </>
        )}

        {isStreaming && (
          <>
            <Button onClick={handleCapture} className="w-full">
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="10" strokeWidth={2} />
              </svg>
              {t('disease.capturePhoto')}
            </Button>

            <Button variant="secondary" onClick={stopCamera} className="w-full">
              {t('common.cancel')}
            </Button>
          </>
        )}

        {capturedImage && (
          <Button variant="outline" onClick={handleRetake} className="col-span-2">
            {t('disease.retake')}
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};
