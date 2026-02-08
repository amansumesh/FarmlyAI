import mongoose, { Schema, Document } from 'mongoose';

export interface IScheme extends Document {
  name: {
    en: string;
    hi: string;
    ta: string;
    ml: string;
    te: string;
    kn: string;
  };
  description: {
    en: string;
    hi: string;
    ta: string;
    ml: string;
    te: string;
    kn: string;
  };
  benefits: {
    en: string[];
    hi: string[];
    ta: string[];
    ml: string[];
    te: string[];
    kn: string[];
  };
  eligibility: {
    landSize?: { min?: number; max?: number };
    crops?: string[];
    states?: string[];
    annualIncome?: { max: number };
  };
  applicationProcess: {
    steps: {
      en: string[];
      hi: string[];
      ta: string[];
      ml: string[];
      te: string[];
      kn: string[];
    };
    documents: {
      en: string[];
      hi: string[];
      ta: string[];
      ml: string[];
      te: string[];
      kn: string[];
    };
    applicationUrl?: string;
  };
  type: 'central' | 'state' | 'district';
  active: boolean;
  updatedAt: Date;
}

const schemeSchema = new Schema<IScheme>(
  {
    name: {
      en: { type: String, required: true },
      hi: { type: String, required: true },
      ta: { type: String, required: true },
      ml: { type: String, required: true },
      te: { type: String, required: true },
      kn: { type: String, required: true },
    },
    description: {
      en: { type: String, required: true },
      hi: { type: String, required: true },
      ta: { type: String, required: true },
      ml: { type: String, required: true },
      te: { type: String, required: true },
      kn: { type: String, required: true },
    },
    benefits: {
      en: [String],
      hi: [String],
      ta: [String],
      ml: [String],
      te: [String],
      kn: [String],
    },
    eligibility: {
      landSize: {
        min: Number,
        max: Number,
      },
      crops: [String],
      states: [String],
      annualIncome: {
        max: Number,
      },
    },
    applicationProcess: {
      steps: {
        en: [String],
        hi: [String],
        ta: [String],
        ml: [String],
        te: [String],
        kn: [String],
      },
      documents: {
        en: [String],
        hi: [String],
        ta: [String],
        ml: [String],
        te: [String],
        kn: [String],
      },
      applicationUrl: String,
    },
    type: {
      type: String,
      enum: ['central', 'state', 'district'],
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

schemeSchema.index({ active: 1, type: 1 });

export const Scheme = mongoose.model<IScheme>('Scheme', schemeSchema);
