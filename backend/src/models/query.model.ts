import mongoose, { Document, Schema } from 'mongoose';

export interface IQuery extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'voice' | 'text' | 'disease_detection';
  input: {
    text?: string;
    language: string;
    audioUrl?: string;
    imageUrl?: string;
  };
  response: {
    text: string;
    audioUrl?: string;
    data?: Record<string, unknown>;
  };
  intent?: string;
  processingTimeMs: number;
  createdAt: Date;
  saved: boolean;
}

const QuerySchema = new Schema<IQuery>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['voice', 'text', 'disease_detection'],
      required: true,
      index: true
    },
    input: {
      text: String,
      language: {
        type: String,
        required: true
      },
      audioUrl: String,
      imageUrl: String
    },
    response: {
      text: {
        type: String,
        required: true
      },
      audioUrl: String,
      data: Schema.Types.Mixed
    },
    intent: String,
    processingTimeMs: {
      type: Number,
      required: true
    },
    saved: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

QuerySchema.index({ userId: 1, createdAt: -1 });
QuerySchema.index({ type: 1, createdAt: -1 });

export const Query = mongoose.model<IQuery>('Query', QuerySchema);
