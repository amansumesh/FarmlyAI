import { logger } from '../utils/logger.js';
import { put } from '@vercel/blob';

const GOOGLE_API_KEY = process.env.GOOGLE_CLOUD_API_KEY || '';

const languageCodeMap: Record<string, string> = {
  hi: 'hi-IN',
  ta: 'ta-IN',
  ml: 'ml-IN',
  te: 'te-IN',
  kn: 'kn-IN',
  en: 'en-IN'
};

const agriculturalPhrases = [
  'tomato', 'wheat', 'rice', 'cotton', 'maize', 'soybean',
  'potato', 'onion', 'chili', 'sugarcane', 'fertilizer',
  'disease', 'pest', 'irrigation', 'price', 'mandi', 'scheme',
  'blight', 'wilt', 'rot', 'fungus', 'nitrogen', 'urea'
];

export async function transcribeAudio(
  audioContent: Buffer,
  language: string = 'en'
): Promise<string> {
  if (!GOOGLE_API_KEY) {
    logger.error('GOOGLE_CLOUD_API_KEY not set in .env');
    throw new Error('Google Cloud API key not configured');
  }

  const languageCode = languageCodeMap[language] || 'en-IN';
  logger.info(`Transcribing audio via Google Cloud REST API (lang param: ${language}, code: ${languageCode})`);

  try {
    const requestBody = {
      config: {
        encoding: 'WEBM_OPUS' as const,
        languageCode,
        enableAutomaticPunctuation: true,
        model: 'default',
        speechContexts: [{
          phrases: agriculturalPhrases,
          boost: 20
        }]
      },
      audio: {
        content: audioContent.toString('base64')
      }
    };

    const url = `https://speech.googleapis.com/v1/speech:recognize?key=${GOOGLE_API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`Google STT API error: ${response.status} - ${errorText}`);
      throw new Error(`Google STT API returned ${response.status}: ${errorText}`);
    }

    const data: any = await response.json();
    const transcription = data.results
      ?.map((result: any) => result.alternatives?.[0]?.transcript)
      .filter(Boolean)
      .join(' ') || '';

    logger.info(`Google STT transcription: "${transcription.substring(0, 80)}"`);
    return transcription;
  } catch (error: any) {
    logger.error(`Speech-to-Text error: ${error?.message}`);
    throw new Error(`Failed to transcribe audio: ${error?.message}`);
  }
}

export async function synthesizeSpeech(
  text: string,
  language: string = 'en'
): Promise<string> {
  if (!GOOGLE_API_KEY) {
    logger.warn('Google Cloud API key not configured, skipping TTS');
    return '';
  }

  try {
    const langCode = languageCodeMap[language] || 'en-IN';
    const requestBody = {
      input: { text },
      voice: {
        languageCode: langCode,
        ssmlGender: 'FEMALE'
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 0.95
      }
    };

    const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      logger.warn(`Google TTS API error: ${response.status}`);
      return '';
    }

    const data: any = await response.json();
    if (!data.audioContent) {
      return '';
    }

    const audioBuffer = Buffer.from(data.audioContent, 'base64');

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const timestamp = Date.now();
        const filename = `tts-${language}-${timestamp}.mp3`;
        const blob = await put(filename, audioBuffer, {
          access: 'public',
          contentType: 'audio/mpeg'
        });
        logger.info(`TTS audio uploaded: ${blob.url}`);
        return blob.url;
      } catch (error) {
        logger.warn('Blob storage unavailable for TTS');
        return '';
      }
    }
    return '';
  } catch (error) {
    logger.error('Text-to-Speech error:', error);
    return '';
  }
}
