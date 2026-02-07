import mongoose, { Document, Schema } from 'mongoose';

export interface IPrediction {
  disease: string;
  diseaseLocal: string;
  crop: string;
  confidence: number;
  severity: 'low' | 'moderate' | 'high' | 'critical';
}

export interface IRecommendations {
  organic: string[];
  chemical: string[];
  preventive: string[];
}

export interface IDiseaseDetection extends Document {
  userId: mongoose.Types.ObjectId;
  queryId?: mongoose.Types.ObjectId;
  imageUrl: string;
  imageMetadata: {
    size: number;
    mimeType: string;
    capturedAt: Date;
  };
  predictions: IPrediction[];
  topPrediction: {
    disease: string;
    confidence: number;
    severity: string;
  };
  recommendations: IRecommendations;
  modelVersion: string;
  inferenceTimeMs: number;
  createdAt: Date;
}

const predictionSchema = new Schema<IPrediction>(
  {
    disease: { type: String, required: true },
    diseaseLocal: { type: String, required: true },
    crop: { type: String, required: true },
    confidence: { type: Number, required: true, min: 0, max: 1 },
    severity: {
      type: String,
      enum: ['low', 'moderate', 'high', 'critical'],
      required: true,
    },
  },
  { _id: false }
);

const diseaseDetectionSchema = new Schema<IDiseaseDetection>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    queryId: {
      type: Schema.Types.ObjectId,
      ref: 'Query',
    },
    imageUrl: {
      type: String,
      required: true,
    },
    imageMetadata: {
      size: { type: Number, required: true },
      mimeType: { type: String, required: true },
      capturedAt: { type: Date, required: true },
    },
    predictions: {
      type: [predictionSchema],
      required: true,
    },
    topPrediction: {
      disease: { type: String, required: true },
      confidence: { type: Number, required: true },
      severity: { type: String, required: true },
    },
    recommendations: {
      organic: [String],
      chemical: [String],
      preventive: [String],
    },
    modelVersion: {
      type: String,
      required: true,
    },
    inferenceTimeMs: {
      type: Number,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

diseaseDetectionSchema.index({ userId: 1, createdAt: -1 });
diseaseDetectionSchema.index({ 'topPrediction.disease': 1 });

export const DiseaseDetection = mongoose.model<IDiseaseDetection>(
  'DiseaseDetection',
  diseaseDetectionSchema
);
