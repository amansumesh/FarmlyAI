import speech from '@google-cloud/speech';
import textToSpeech from '@google-cloud/text-to-speech';
import { logger } from '../utils/logger.js';
import { put } from '@vercel/blob';

const speechClient = new speech.SpeechClient({
  keyFilename: process.env.GOOGLE_CLOUD_CREDENTIALS
});

const ttsClient = new textToSpeech.TextToSpeechClient({
  keyFilename: process.env.GOOGLE_CLOUD_CREDENTIALS
});

const languageCodeMap: Record<string, string> = {
  hi: 'hi-IN',
  ta: 'ta-IN',
  ml: 'ml-IN',
  te: 'te-IN',
  kn: 'kn-IN',
  en: 'en-IN'
};

const ttsVoiceMap: Record<string, { languageCode: string; name: string }> = {
  hi: { languageCode: 'hi-IN', name: 'hi-IN-Wavenet-A' },
  ta: { languageCode: 'ta-IN', name: 'ta-IN-Wavenet-A' },
  ml: { languageCode: 'ml-IN', name: 'ml-IN-Wavenet-A' },
  te: { languageCode: 'te-IN', name: 'te-IN-Wavenet-A' },
  kn: { languageCode: 'kn-IN', name: 'kn-IN-Wavenet-A' },
  en: { languageCode: 'en-IN', name: 'en-IN-Wavenet-C' }
};

const agriculturalPhrases = [
  'टमाटर',
  'धान',
  'गेहूं',
  'कपास',
  'मक्का',
  'सोयाबीन',
  'आलू',
  'प्याज',
  'मिर्च',
  'गन्ना',
  'खाद',
  'बीमारी',
  'कीड़े',
  'सिंचाई',
  'कीमत',
  'मंडी',
  'योजना',
  'tomato',
  'wheat',
  'rice',
  'cotton',
  'maize',
  'soybean',
  'potato',
  'onion',
  'chili',
  'sugarcane',
  'fertilizer',
  'disease',
  'pest',
  'irrigation',
  'price',
  'mandi',
  'scheme'
];

export async function transcribeAudio(
  audioContent: Buffer,
  language: string = 'hi'
): Promise<string> {
  if (!process.env.GOOGLE_CLOUD_CREDENTIALS) {
    logger.warn('Google Cloud credentials not configured, returning demo transcription');
    const demoTranscriptions: Record<string, string> = {
      hi: 'टमाटर में कीड़े लग गए हैं',
      ta: 'தக்காளியில் புழுக்கள் வருகின்றன',
      ml: 'തക്കാളിയിൽ പുഴുക്കൾ വരുന്നു',
      te: 'టొమాటోలో పురుగులు వస్తున్నాయి',
      kn: 'ಟೊಮೇಟೊದಲ್ಲಿ ಹುಳುಗಳು ಬರುತ್ತಿವೆ',
      en: 'Worms are coming in tomatoes'
    };
    return demoTranscriptions[language] || demoTranscriptions.en;
  }

  try {
    const languageCode = languageCodeMap[language] || 'hi-IN';

    const audio = {
      content: audioContent.toString('base64')
    };

    const config = {
      encoding: 'LINEAR16' as const,
      sampleRateHertz: 16000,
      languageCode,
      alternativeLanguageCodes: ['en-IN'],
      enableAutomaticPunctuation: true,
      model: 'default',
      useEnhanced: true,
      speechContexts: [
        {
          phrases: agriculturalPhrases,
          boost: 20
        }
      ]
    };

    const request = {
      audio,
      config
    };

    logger.info(`Transcribing audio in language: ${languageCode}`);
    const [response] = await speechClient.recognize(request);

    const transcription = response.results
      ?.map((result) => result.alternatives?.[0]?.transcript)
      .filter(Boolean)
      .join(' ') || '';

    logger.info(`Transcription successful: ${transcription.substring(0, 50)}...`);
    return transcription;
  } catch (error) {
    logger.error('Speech-to-Text error:', error);
    throw new Error('Failed to transcribe audio');
  }
}

export async function synthesizeSpeech(
  text: string,
  language: string = 'hi'
): Promise<string> {
  if (!process.env.GOOGLE_CLOUD_CREDENTIALS) {
    logger.warn('Google Cloud credentials not configured, skipping TTS generation');
    return '';
  }

  try {
    const voice = ttsVoiceMap[language] || ttsVoiceMap.hi;

    const request = {
      input: { text },
      voice: {
        languageCode: voice.languageCode,
        name: voice.name
      },
      audioConfig: {
        audioEncoding: 'MP3' as const,
        speakingRate: 0.95,
        pitch: 0
      }
    };

    logger.info(`Synthesizing speech in language: ${voice.languageCode}`);
    const [response] = await ttsClient.synthesizeSpeech(request);

    if (!response.audioContent) {
      throw new Error('No audio content generated');
    }

    const audioBuffer = Buffer.from(response.audioContent as Uint8Array);
    
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
        logger.warn('Blob storage unavailable for TTS, skipping upload');
        return '';
      }
    } else {
      logger.info('Blob storage not configured, skipping TTS upload');
      return '';
    }
  } catch (error) {
    logger.error('Text-to-Speech error:', error);
    throw new Error('Failed to synthesize speech');
  }
}
