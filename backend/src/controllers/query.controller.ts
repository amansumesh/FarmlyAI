import { Request, Response } from 'express';
import { Query } from '../models/query.model.js';
import { transcribeAudio, synthesizeSpeech } from '../services/google-cloud.service.js';
import { recognizeIntent, generateResponse } from '../services/intent.service.js';
import { put } from '@vercel/blob';
import { logger } from '../utils/logger.js';

export async function handleVoiceQuery(req: Request, res: Response) {
  const startTime = Date.now();

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No audio file provided'
      });
    }

    const { language = 'hi' } = req.body;
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

    const transcription = await transcribeAudio(audioBuffer, language);

    if (!transcription || transcription.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Could not transcribe audio. Please speak clearly and try again.'
      });
    }

    const intentResult = recognizeIntent(transcription);

    const responseText = generateResponse(intentResult.intent, language, intentResult.entities);

    const responseAudioUrl = await synthesizeSpeech(responseText, language);

    const processingTime = Date.now() - startTime;

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
      intent: intentResult.intent,
      processingTimeMs: processingTime,
      saved: false
    });

    logger.info(`Voice query processed successfully in ${processingTime}ms`);

    return res.json({
      success: true,
      query: {
        id: query._id.toString(),
        transcription,
        intent: intentResult.intent
      },
      response: {
        text: responseText,
        audioUrl: responseAudioUrl || undefined
      },
      processingTime
    });
  } catch (error) {
    logger.error('Voice query error:', error);

    const processingTime = Date.now() - startTime;

    return res.status(500).json({
      success: false,
      error: 'Failed to process voice query',
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
