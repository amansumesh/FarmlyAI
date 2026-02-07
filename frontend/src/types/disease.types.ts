export interface DiseasePrediction {
  disease: string;
  crop: string;
  confidence: number;
  severity: 'low' | 'moderate' | 'high' | 'critical';
}

export interface TreatmentRecommendation {
  type: 'organic' | 'chemical' | 'preventive';
  title: string;
  description: string;
  steps?: string[];
  products?: string[];
}

export interface DiseaseDetectionResponse {
  _id: string;
  userId: string;
  imageUrl: string;
  predictions: DiseasePrediction[];
  recommendations: TreatmentRecommendation[];
  localizedDisease?: string;
  createdAt: string;
}

export interface DetectDiseaseRequest {
  image: File;
  language: string;
}
