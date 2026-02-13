import axios from 'axios';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

export interface MLPrediction {
  disease: string;
  crop: string;
  confidence: number;
  severity: string;
}

export interface MLServiceResponse {
  predictions: MLPrediction[];
  inference_time_ms: number;
  model_version: string;
}

export class MLService {
  private static readonly ML_API_URL = config.mlService.url;

  static async detectDisease(
    imageBase64: string
  ): Promise<MLServiceResponse> {
    try {
      logger.info('Sending image to ML service for detection');

      const response = await axios.post<MLServiceResponse>(
        `${this.ML_API_URL}/ml/detect-disease`,
        {
          image_base64: imageBase64,
        },
        {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info('ML service response received', {
        predictions: response.data.predictions.length,
        inferenceTime: response.data.inference_time_ms,
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error('ML service error', {
          status: error.response?.status,
          message: error.message,
        });
        if (error.response?.status === 422) {
          throw new Error('Unable to detect plant in image');
        }
      }
      logger.error('Failed to call ML service', { error });
      throw new Error('Disease detection service unavailable');
    }
  }

  static async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.ML_API_URL}/health`, {
        timeout: 5000,
      });
      return response.status === 200;
    } catch (error) {
      logger.error('ML service health check failed', { error });
      return false;
    }
  }
}
