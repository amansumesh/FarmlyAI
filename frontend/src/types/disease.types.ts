export interface DiseasePrediction {
  disease: string;
  crop: string;
  confidence: number;
  severity: 'low' | 'moderate' | 'high' | 'critical' | 'none' | 'uncertain';
  class_name?: string;
  treatments?: {
    organic: string[];
    chemical: string[];
    preventive: string[];
  };
}

export interface TreatmentRecommendation {
  type: 'organic' | 'chemical' | 'preventive';
  title: string;
  description: string;
  steps?: string[];
  products?: string[];
}

export interface DiseaseDetectionResponse {
  _id?: string;
  userId?: string;
  imageUrl?: string;
  predictions?: DiseasePrediction[];
  recommendations?: TreatmentRecommendation[];
  localizedDisease?: string;
  createdAt?: string;
  
  success: boolean;
  top_prediction?: DiseasePrediction;
  inference_time_ms?: number;
  total_time_ms?: number;
  mode?: 'offline' | 'online';
  crop?: string;
  analysis?: string;
  error?: string;
}

export interface DetectDiseaseRequest {
  image: File;
  language: string;
  crop: string;
  mode?: 'offline' | 'online';
}

export type CropType = 'tomato' | 'potato' | 'pepperbell' | 'other';

export interface AvailableCropsResponse {
  crops: string[];
  online_available: boolean;
}
