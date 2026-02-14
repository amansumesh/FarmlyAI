import axios from 'axios';
import { DiseaseDetectionResponse, DetectDiseaseRequest, AvailableCropsResponse, TreatmentRecommendation } from '../types/disease.types';

const ML_API_URL = import.meta.env.VITE_ML_API_BASE_URL || 'http://localhost:8000';

class DiseaseService {
  async getAvailableCrops(): Promise<AvailableCropsResponse> {
    const response = await axios.get<AvailableCropsResponse>(
      `${ML_API_URL}/ml/available-crops`
    );
    return response.data;
  }

  async detectDisease(request: DetectDiseaseRequest): Promise<DiseaseDetectionResponse> {
    const isOnline = navigator.onLine;
    const mode = request.mode || (isOnline ? 'offline' : 'offline');
    
    if (mode === 'online' && !isOnline) {
      throw new Error('You are offline. Online mode requires an internet connection.');
    }

    const reader = new FileReader();
    const imageBase64 = await new Promise<string>((resolve, reject) => {
      reader.onload = () => {
        const result = reader.result as string;
        const base64Data = result.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(request.image);
    });

    try {
      const response = await axios.post<DiseaseDetectionResponse>(
        `${ML_API_URL}/ml/detect-disease`,
        {
          image_base64: imageBase64,
          crop: request.crop,
          mode: mode,
          top_k: 3
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: mode === 'online' ? 30000 : 10000,
        }
      );

      const data = response.data;

      if (!data.success) {
        throw new Error(data.error || 'Detection failed');
      }

    if (data.mode === 'offline' && data.predictions) {
      const recommendations: TreatmentRecommendation[] = [];

      const topPrediction = data.top_prediction || data.predictions[0];
      
      if (topPrediction?.treatments) {
        if (topPrediction.treatments.organic?.length > 0) {
          recommendations.push({
            type: 'organic',
            title: 'Organic Treatment',
            description: 'Natural and organic solutions',
            steps: topPrediction.treatments.organic
          });
        }
        
        if (topPrediction.treatments.chemical?.length > 0) {
          recommendations.push({
            type: 'chemical',
            title: 'Chemical Treatment',
            description: 'Chemical pesticides and fungicides',
            steps: topPrediction.treatments.chemical
          });
        }
        
        if (topPrediction.treatments.preventive?.length > 0) {
          recommendations.push({
            type: 'preventive',
            title: 'Preventive Measures',
            description: 'Prevent future occurrences',
            steps: topPrediction.treatments.preventive
          });
        }
      }

      return {
        ...data,
        recommendations,
        localizedDisease: topPrediction?.disease,
        predictions: data.predictions,
        createdAt: new Date().toISOString()
      };
    }

    return {
      ...data,
      createdAt: new Date().toISOString()
    };
    } catch (error: any) {
      if (error.response?.status === 429) {
        throw new Error('⏱️ AI service is busy. Please wait 1-2 minutes and try again. Free tier allows 15 requests per minute.');
      }
      throw error;
    }
  }

  async getHistory(): Promise<DiseaseDetectionResponse[]> {
    return [];
  }
}

export const diseaseService = new DiseaseService();
