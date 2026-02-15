import { Request, Response } from 'express';
import { Query } from '../models/query.model.js';
import { transcribeAudio, synthesizeSpeech } from '../services/google-cloud.service.js';
import { recognizeIntent, generateResponse } from '../services/intent.service.js';
import { put } from '@vercel/blob';
import { logger } from '../utils/logger.js';


const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || 'http://127.0.0.1:5001';

export async function handleVoiceQuery(req: Request, res: Response) {
  const startTime = Date.now();

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No audio file provided'
      });
    }

    const { language = 'en' } = req.body;
    logger.info(`Voice query - language: ${language}`);
    const userId = req.user!.userId;

    if (req.file.size > 10 * 1024 * 1024) {
      return res.status(413).json({
        success: false,
        error: 'Audio file too large (max 10MB)'
      });
    }

    logger.info(`Processing voice query for user ${userId}, language: ${language}`);

    const audioBuffer = req.file.buffer;
    const timestamp = Date.now();
    const audioFilename = `voice-${userId}-${timestamp}.${req.file.mimetype.split('/')[1]}`;

    let inputAudioUrl: string | null = null;
    
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const audioBlob = await put(audioFilename, audioBuffer, {
          access: 'public',
          contentType: req.file.mimetype
        });
        inputAudioUrl = audioBlob.url;
        logger.info(`Audio uploaded to: ${inputAudioUrl}`);
      } catch (error) {
        logger.warn('Blob storage unavailable, continuing without audio upload:', error);
      }
    } else {
      logger.info('Blob storage not configured, skipping audio upload');
    }
    // Transcribe audio using Google Cloud Speech-to-Text (primary)
    let transcription: string = '';
    try {
      logger.info('Transcribing audio via Google Cloud STT...');
      transcription = await transcribeAudio(audioBuffer, language);
      logger.info(`Google STT result: "${transcription.substring(0, 80)}"`);
    } catch (sttError: any) {
      logger.warn(`Google Cloud STT failed: ${sttError?.message}`);
      // Fallback to Groq Whisper via RAG service
      try {
        logger.info('Falling back to Groq Whisper...');
        const ragTranscribeResponse = await fetch(`${RAG_SERVICE_URL}/transcribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audio_base64: audioBuffer.toString('base64'),
            filename: audioFilename,
            mimetype: req.file.mimetype,
            language: language
          }),
          signal: AbortSignal.timeout(60000)
        });
        if (ragTranscribeResponse.ok) {
          const whisperData: any = await ragTranscribeResponse.json();
          transcription = whisperData.text || '';
          logger.info(`Whisper result: "${transcription.substring(0, 80)}"`);
        }
      } catch (whisperError: any) {
        logger.error(`Whisper fallback also failed: ${whisperError?.message}`);
      }
    }

    if (!transcription || transcription.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Could not transcribe audio. Please speak clearly and try again.'
      });
    }

    // Call Python RAG service for AI-powered response
    let responseText: string = '';
    let ragSources: Array<{ crop?: string; disease?: string; category?: string; score?: number }> = [];
    let detectedIntent: string = 'general';

    try {
      const ragUrl = `${RAG_SERVICE_URL}/query`;
      logger.info(`Calling RAG service at ${ragUrl} with query: "${transcription}"`);
      
      // Use native fetch instead of axios to avoid any interceptor issues
      const ragFetchResponse = await fetch(ragUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: transcription, k: 3, language }),
        signal: AbortSignal.timeout(120000)
      });

      if (!ragFetchResponse.ok) {
        throw new Error(`RAG service returned ${ragFetchResponse.status}: ${await ragFetchResponse.text()}`);
      }

      const ragData: any = await ragFetchResponse.json();
      responseText = ragData.answer;
      ragSources = ragData.sources || [];
      logger.info(`RAG response received (${ragSources.length} sources): "${responseText.substring(0, 100)}"`);
    } catch (ragError: any) {
      logger.error(`RAG service call FAILED: ${ragError?.message}`);
      const fallbackResult = recognizeIntent(transcription);
      detectedIntent = fallbackResult.intent;
      responseText = generateResponse(fallbackResult.intent, language, fallbackResult.entities);
      logger.info(`Using fallback response instead`);
    }

    let responseAudioUrl: string | null = null;
    try {
      responseAudioUrl = await synthesizeSpeech(responseText, language);
    } catch (ttsError) {
      logger.warn('Text-to-speech failed, continuing without audio response');
    }

    const processingTime = Date.now() - startTime;

    let queryId = 'temp-' + Date.now();
    try {
      const query = await Query.create({
        userId,
        type: 'voice',
        input: {
          text: transcription,
          language,
          audioUrl: inputAudioUrl || undefined
        },
        response: {
          text: responseText,
          audioUrl: responseAudioUrl || undefined
        },
        intent: detectedIntent,
        processingTimeMs: processingTime,
        saved: false
      });
      queryId = query._id.toString();
    } catch (dbError) {
      logger.warn('Failed to save query to database, continuing with response');
    }

    logger.info(`Voice query processed successfully in ${processingTime}ms`);

    return res.json({
      success: true,
      query: {
        id: queryId,
        transcription,
        intent: detectedIntent
      },
      response: {
        text: responseText,
        audioUrl: responseAudioUrl || undefined
      },
      ragSources,
      processingTime
    });
  } catch (error: any) {
    logger.error('Voice query UNHANDLED error:', error?.message || error);
    logger.error('Error stack:', error?.stack);

    const processingTime = Date.now() - startTime;

    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to process voice query',
      processingTime
    });
  }
}

export async function getQueryHistory(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const { page = '1', limit = '20', type } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const query: { userId: string; type?: string } = { userId };
    if (type) {
      query.type = type as string;
    }

    const total = await Query.countDocuments(query);
    const queries = await Query.find(query)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .select('-__v')
      .lean();

    return res.json({
      success: true,
      queries,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    logger.error('Get query history error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch query history'
    });
  }
}

export async function toggleSaveQuery(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const { queryId } = req.params;

    const query = await Query.findOne({ _id: queryId, userId });

    if (!query) {
      return res.status(404).json({
        success: false,
        error: 'Query not found'
      });
    }

    query.saved = !query.saved;
    await query.save();

    return res.json({
      success: true,
      query: {
        id: query._id.toString(),
        saved: query.saved
      }
    });
  } catch (error) {
    logger.error('Toggle save query error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update query'
    });
  }
}

export async function handleTextQuery(req: Request, res: Response) {
  const startTime = Date.now();
  try {
    const { query, language = 'en' } = req.body;
    const userId = req.user!.userId;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Missing query text'
      });
    }

    logger.info(`Processing text query for user ${userId}, language: ${language}`);

    // Call Python RAG service for AI-powered response
    let responseText: string = '';
    let ragSources: Array<{ crop?: string; disease?: string; category?: string; score?: number }> = [];
    let detectedIntent: string = 'general';

    try {
      const ragUrl = `${RAG_SERVICE_URL}/query`;
      logger.info(`Calling RAG service at ${ragUrl} with query: "${query}"`);
      
      const ragFetchResponse = await fetch(ragUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, k: 3, language }),
        signal: AbortSignal.timeout(120000)
      });

      if (!ragFetchResponse.ok) {
        throw new Error(`RAG service returned ${ragFetchResponse.status}: ${await ragFetchResponse.text()}`);
      }

      const ragData: any = await ragFetchResponse.json();
      responseText = ragData.answer;
      ragSources = ragData.sources || [];
      logger.info(`RAG response received (${ragSources.length} sources): "${responseText.substring(0, 100)}"`);
    } catch (ragError: any) {
      logger.error(`RAG service call FAILED: ${ragError?.message}`);
      const fallbackResult = recognizeIntent(query);
      detectedIntent = fallbackResult.intent;
      responseText = generateResponse(fallbackResult.intent, language, fallbackResult.entities);
      logger.info(`Using fallback response instead`);
    }

    const processingTime = Date.now() - startTime;

    let queryId = 'temp-' + Date.now();
    try {
      const queryRecord = await Query.create({
        userId,
        type: 'text',
        input: {
          text: query,
          language
        },
        response: {
          text: responseText
        },
        intent: detectedIntent,
        processingTimeMs: processingTime,
        saved: false
      });
      queryId = queryRecord._id.toString();
    } catch (dbError) {
      logger.warn('Failed to save query to database, continuing with response');
    }

    return res.json({
      success: true,
      query: {
        id: queryId,
        text: query,
        intent: detectedIntent
      },
      response: {
        text: responseText
      },
      ragSources,
      processingTime
    });
  } catch (error: any) {
    logger.error('Text query UNHANDLED error:', error?.message || error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to process text query',
      processingTime: Date.now() - startTime
    });
  }
}