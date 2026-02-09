import axiosInstance from '../utils/axios';
import { DiseaseDetectionResponse, DetectDiseaseRequest } from '../types/disease.types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

class DiseaseService {
  async detectDisease(request: DetectDiseaseRequest): Promise<DiseaseDetectionResponse> {
    // Early check for offline status
    if (!navigator.onLine) {
      throw new Error('You are offline. Disease detection requires an internet connection.');
    }

    const formData = new FormData();
    formData.append('image', request.image);
    formData.append('language', request.language);

    const response = await axiosInstance.post<{ success: boolean; detection: any }>(
      `${API_URL}/api/disease/detect`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 seconds for image upload + ML inference
      }
    );
    
    // Transform backend response to match frontend types
    const detection = response.data.detection;
    
    // Transform recommendations from object to array
    const recommendations = [];
    
    if (detection.recommendations?.organic) {
      recommendations.push({
        type: 'organic' as const,
        title: 'Organic Treatment',
        description: 'Natural and organic solutions',
        steps: detection.recommendations.organic
      });
    }
    
    if (detection.recommendations?.chemical) {
      recommendations.push({
        type: 'chemical' as const,
        title: 'Chemical Treatment',
        description: 'Chemical pesticides and fungicides',
        steps: detection.recommendations.chemical
      });
    }
    
    if (detection.recommendations?.preventive) {
      recommendations.push({
        type: 'preventive' as const,
        title: 'Preventive Measures',
        description: 'Prevent future occurrences',
        steps: detection.recommendations.preventive
      });
    }
    
    return {
      _id: detection.id,
      userId: detection.userId || '',
      imageUrl: detection.imageUrl,
      predictions: detection.predictions,
      recommendations,
      localizedDisease: detection.topPrediction?.diseaseLocal,
      createdAt: new Date().toISOString()
    };
  }

  async getHistory(): Promise<DiseaseDetectionResponse[]> {
    const response = await axiosInstance.get<DiseaseDetectionResponse[]>(
      `${API_URL}/api/disease/history`
    );
    return response.data;
  }
}

export const diseaseService = new DiseaseService();
