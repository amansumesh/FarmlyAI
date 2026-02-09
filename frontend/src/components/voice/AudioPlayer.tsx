import React, { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/cn';

interface AudioPlayerProps {
  audioUrl: string;
  autoPlay?: boolean;
  className?: string;
  fallbackDuration?: number; // In seconds, used when blob duration isn't available
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ 
  audioUrl, 
  autoPlay = false,
  className,
  fallbackDuration 
}) => {
  const { t } = useTranslation();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(fallbackDuration || 0);
  const [error, setError] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    setError(false);
    setCurrentTime(0);
    setDuration(fallbackDuration || 0);
    setIsPlaying(false);

    const updateTime = () => {
      if (!isNaN(audio.currentTime)) {
        setCurrentTime(audio.currentTime);
      }
    };
    
    const updateDuration = () => {
      if (!isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
        console.log('Audio duration set:', audio.duration);
      }
    };
    
    const handleEnded = () => setIsPlaying(false);
    
    const handleError = () => {
      console.error('Audio player error - invalid audio source');
      setError(true);
      setIsPlaying(false);
    };

    const handleCanPlay = () => {
      // Sometimes blob URLs only have duration after canplay event
      updateDuration();
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('loadeddata', updateDuration);
    audio.addEventListener('durationchange', updateDuration);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('canplaythrough', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    
    // Force load metadata
    audio.load();

    if (autoPlay) {
      audio.play().then(() => setIsPlaying(true)).catch((err) => {
        console.error('Autoplay failed:', err);
        setError(true);
      });
    }

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('loadeddata', updateDuration);
      audio.removeEventListener('durationchange', updateDuration);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('canplaythrough', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [audioUrl, autoPlay, fallbackDuration]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const time = parseFloat(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const formatTime = (time: number) => {
    if (!isFinite(time) || isNaN(time) || time < 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!audioUrl) {
    return null;
  }

  if (error) {
    return (
      <div className={cn('bg-red-50 rounded-lg border border-red-200 p-4', className)}>
        <p className="text-sm text-red-800 text-center">
          {t('voice.audioError') || 'Unable to load audio'}
        </p>
      </div>
    );
  }

  return (
    <div className={cn('bg-white rounded-lg border border-gray-200 p-4', className)}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      <div className="flex items-center gap-4">
        <button
          onClick={togglePlayPause}
          className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-green-600 text-white hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          aria-label={isPlaying ? t('voice.pause') : t('voice.play')}
        >
          {isPlaying ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <div className="flex-1">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
          />
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
