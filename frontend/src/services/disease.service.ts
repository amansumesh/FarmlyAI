import axiosInstance from '../utils/axios';
import { DiseaseDetectionResponse, DetectDiseaseRequest } from '../types/disease.types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

class DiseaseService {
  async detectDisease(request: DetectDiseaseRequest): Promise<DiseaseDetectionResponse> {
    const formData = new FormData();
    formData.append('image', request.image);
    formData.append('language', request.language);

    const response = await axiosInstance.post<DiseaseDetectionResponse>(
      `${API_URL}/api/disease/detect`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  async getHistory(): Promise<DiseaseDetectionResponse[]> {
    const response = await axiosInstance.get<DiseaseDetectionResponse[]>(
      `${API_URL}/api/disease/history`
    );
    return response.data;
  }
}

export const diseaseService = new DiseaseService();
