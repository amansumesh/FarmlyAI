import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useVoice } from '../../hooks/useVoice';
import { voiceService } from '../../services/voice.service';
import { AudioPlayer } from './AudioPlayer';
import { Button } from '../common/Button';
import { cn } from '../../utils/cn';
import { useAuthStore } from '../../store/authStore';

interface VoiceInputProps {
  onQueryComplete?: (transcription: string, responseText: string) => void;
  className?: string;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ 
  onQueryComplete,
  className 
}) => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const {
    isRecording,
    recordingState,
    audioBlob,
    audioUrl,
    error: recordingError,
    startRecording,
    stopRecording,
    resetRecording,
    hasPermission,
  } = useVoice();

  const [isProcessing, setIsProcessing] = useState(false);
  const [transcription, setTranscription] = useState<string>('');
  const [responseText, setResponseText] = useState<string>('');
  const [responseAudioUrl, setResponseAudioUrl] = useState<string>('');
  const [processingTime, setProcessingTime] = useState<number>(0);
  const [error, setError] = useState<string>('');

  const handleStartRecording = async () => {
    setError('');
    setTranscription('');
    setResponseText('');
    setResponseAudioUrl('');
    await startRecording();
  };

  const handleStopRecording = () => {
    stopRecording();
  };

  const handleSubmit = async () => {
    if (!audioBlob || !user) return;

    setIsProcessing(true);
    setError('');

    try {
      const result = await voiceService.submitVoiceQuery(audioBlob, user.language);
      
      setTranscription(result.query.transcription);
      setResponseText(result.response.text);
      setResponseAudioUrl(result.response.audioUrl);
      setProcessingTime(result.processingTime);

      if (onQueryComplete) {
        onQueryComplete(result.query.transcription, result.response.text);
      }
    } catch (err) {
      console.error('Voice query failed:', err);
      setError(t('voice.errors.queryFailed'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    resetRecording();
    setTranscription('');
    setResponseText('');
    setResponseAudioUrl('');
    setError('');
  };

  return (
    <div className={cn('bg-white rounded-lg border border-gray-200 p-6', className)}>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {t('voice.title')}
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          {t('voice.subtitle')}
        </p>

        {!hasPermission && recordingError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
            {recordingError}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
            {error}
          </div>
        )}

        {recordingState === 'idle' && (
          <div className="space-y-4">
            <button
              onClick={handleStartRecording}
              className="mx-auto w-20 h-20 flex items-center justify-center rounded-full bg-green-600 text-white hover:bg-green-700 transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300 shadow-lg"
              aria-label={t('voice.startRecording')}
            >
              <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            </button>
            <p className="text-sm text-gray-600">
              {t('voice.tapToRecord')}
            </p>
          </div>
        )}

        {isRecording && (
          <div className="space-y-4">
            <div className="relative mx-auto w-20 h-20">
              <button
                onClick={handleStopRecording}
                className="w-full h-full flex items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors focus:outline-none focus:ring-4 focus:ring-red-300 shadow-lg"
                aria-label={t('voice.stopRecording')}
              >
                <div className="w-6 h-6 bg-white rounded-sm" />
              </button>
              <div className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping" />
            </div>
            <p className="text-sm text-gray-600 font-medium animate-pulse">
              {t('voice.recording')}
            </p>
          </div>
        )}

        {recordingState === 'stopped' && audioUrl && !transcription && (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">
                {t('voice.recordingComplete')}
              </span>
            </div>

            <AudioPlayer audioUrl={audioUrl} className="mb-4" />

            <div className="flex gap-3 justify-center">
              <Button onClick={handleReset} variant="outline" size="md">
                {t('voice.reRecord')}
              </Button>
              <Button onClick={handleSubmit} loading={isProcessing} size="md">
                {t('voice.submit')}
              </Button>
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="space-y-3">
            <div className="flex justify-center">
              <svg className="animate-spin h-10 w-10 text-green-600" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
            <p className="text-sm text-gray-600">
              {t('voice.processing')}
            </p>
          </div>
        )}

        {transcription && responseText && (
          <div className="space-y-4 text-left">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">
                {t('voice.yourQuestion')}
              </h4>
              <p className="text-sm text-blue-800">
                "{transcription}"
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-green-900 mb-2">
                {t('voice.response')}
              </h4>
              <p className="text-sm text-green-800 whitespace-pre-wrap">
                {responseText}
              </p>
            </div>

            {responseAudioUrl && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                  {t('voice.listenToResponse')}
                </h4>
                <AudioPlayer audioUrl={responseAudioUrl} autoPlay />
              </div>
            )}

            {processingTime > 0 && (
              <p className="text-xs text-gray-500 text-center">
                {t('voice.processedIn', { time: (processingTime / 1000).toFixed(2) })}
              </p>
            )}

            <div className="flex justify-center pt-2">
              <Button onClick={handleReset} variant="outline" size="md">
                {t('voice.askAnother')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
