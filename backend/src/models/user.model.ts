import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  phoneNumber: string;
  phoneVerified: boolean;
  language: 'hi' | 'ta' | 'ml' | 'te' | 'kn' | 'en';
  farmProfile: {
    location?: {
      type: 'Point';
      coordinates: [number, number];
      address?: string;
      state?: string;
      district?: string;
    };
    crops: string[];
    landSize?: number;
    soilType?: 'loamy' | 'clay' | 'sandy' | 'red' | 'black' | 'laterite';
  };
  createdAt: Date;
  lastLoginAt: Date;
  onboardingCompleted: boolean;
}

const userSchema = new Schema<IUser>({
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: /^\+\d{1,3}\d{10}$/
  },
  phoneVerified: {
    type: Boolean,
    default: false
  },
  language: {
    type: String,
    enum: ['hi', 'ta', 'ml', 'te', 'kn', 'en'],
    default: 'hi'
  },
  farmProfile: {
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        default: undefined
      },
      address: String,
      state: String,
      district: String
    },
    crops: {
      type: [String],
      default: []
    },
    landSize: Number,
    soilType: {
      type: String,
      enum: ['loamy', 'clay', 'sandy', 'red', 'black', 'laterite']
    }
  },
  onboardingCompleted: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLoginAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create geospatial index (phoneNumber unique index is created by schema definition)
userSchema.index({ 'farmProfile.location': '2dsphere' });

export const User = mongoose.model<IUser>('User', userSchema);
