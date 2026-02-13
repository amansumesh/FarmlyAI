import { Request, Response } from 'express';
import { DiseaseDetection } from '../models/disease.model.js';
import { StorageService } from '../services/storage.service.js';
import { MLService } from '../services/ml.service.js';
import { TreatmentService } from '../services/treatment.service.js';
import { logger } from '../utils/logger.js';

export const detectDisease = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const file = req.file;
    const language = (req.body.language as string) || 'en';

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided',
      });
    }

    if (!StorageService.isValidImageFormat(file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image format. Only JPEG and PNG are supported.',
      });
    }

    if (!StorageService.isValidImageSize(file.size)) {
      return res.status(413).json({
        success: false,
        message: 'Image too large. Maximum size is 10MB.',
      });
    }

    logger.info('Processing disease detection request', {
      userId,
      fileSize: file.size,
      mimeType: file.mimetype,
    });

    const startTime = Date.now();

    const imageUrl = await StorageService.uploadImage(file, userId);

    const imageBase64 = file.buffer.toString('base64');
    const mlResponse = await MLService.detectDisease(imageBase64);

    const normalizeSeverity = (severity: string): 'low' | 'moderate' | 'high' | 'critical' => {
      const validSeverities = ['low', 'moderate', 'high', 'critical'];
      if (validSeverities.includes(severity)) {
        return severity as 'low' | 'moderate' | 'high' | 'critical';
      }
      // Default to 'moderate' for uncertain or invalid values
      return 'moderate';
    };

    const predictions = mlResponse.predictions.map((pred) => ({
      disease: pred.disease,
      diseaseLocal: TreatmentService.getLocalizedDiseaseName(
        pred.disease,
        language
      ),
      crop: pred.crop,
      confidence: pred.confidence,
      severity: normalizeSeverity(pred.severity),
    }));

    const topPrediction = predictions[0] || {
      disease: 'Unknown',
      diseaseLocal: 'Unknown',
      confidence: 0,
      severity: 'low',
    };

    const recommendations = TreatmentService.getRecommendations(
      topPrediction.disease
    );

    const detection = new DiseaseDetection({
      userId,
      imageUrl,
      imageMetadata: {
        size: file.size,
        mimeType: file.mimetype,
        capturedAt: new Date(),
      },
      predictions,
      topPrediction: {
        disease: topPrediction.disease,
        confidence: topPrediction.confidence,
        severity: topPrediction.severity,
      },
      recommendations,
      modelVersion: mlResponse.model_version,
      inferenceTimeMs: mlResponse.inference_time_ms,
    });

    await detection.save();

    const totalTime = Date.now() - startTime;

    logger.info('Disease detection completed', {
      userId,
      detectionId: detection._id,
      disease: topPrediction.disease,
      confidence: topPrediction.confidence,
      totalTime,
    });

    return res.status(200).json({
      success: true,
      detection: {
        id: detection._id,
        imageUrl: detection.imageUrl,
        predictions: detection.predictions,
        topPrediction: {
          disease: topPrediction.disease,
          diseaseLocal: topPrediction.diseaseLocal,
          confidence: topPrediction.confidence,
          severity: topPrediction.severity,
        },
        recommendations: detection.recommendations,
      },
      inferenceTime: totalTime,
    });
  } catch (error) {
    logger.error('Error in disease detection', { error });

    if (error instanceof Error) {
      if (error.message === 'Unable to detect plant in image') {
        return res.status(422).json({
          success: false,
          message:
            'Unable to detect plant in image. Please ensure the image shows a clear view of the plant leaves.',
        });
      }
      if (error.message === 'Disease detection service unavailable') {
        return res.status(503).json({
          success: false,
          message: 'Disease detection service is temporarily unavailable.',
        });
      }
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to process disease detection',
    });
  }
};

export const getDetectionHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const skip = parseInt(req.query.skip as string) || 0;

    const detections = await DiseaseDetection.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .select('-imageMetadata -modelVersion -inferenceTimeMs');

    const total = await DiseaseDetection.countDocuments({ userId });

    return res.status(200).json({
      success: true,
      detections,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + limit < total,
      },
    });
  } catch (error) {
    logger.error('Error fetching detection history', { error });
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch detection history',
    });
  }
};
