import mongoose, { Schema, Document } from "mongoose";

export interface IScheme extends Document {
  schemeId: string;
  name: any; // Localized object or string
  description: any; // Localized object or string
  benefits: any; // Localized object or string
  eligibility: any;
  documentsRequired: any;
  howToApply: any;
  applicationProcess: any;
  officialUrl: string;
  lastVerified: Date;
  sourceCitations: string[];
  status: "active" | "closed" | "paused";
}

const SchemeSchema = new Schema<IScheme>(
  {
    schemeId: { type: String, required: true, unique: true },
    // Updated to support localized content (Object with language keys)
    name: { type: Schema.Types.Mixed, required: true },
    description: { type: Schema.Types.Mixed, required: true },
    benefits: { type: Schema.Types.Mixed, required: true },

    // Eligibility can be complex object or array
    eligibility: { type: Schema.Types.Mixed, default: {} },

    // Application process details
    documentsRequired: { type: Schema.Types.Mixed, default: {} },
    howToApply: { type: Schema.Types.Mixed, default: {} },
    applicationProcess: { type: Schema.Types.Mixed, default: {} },

    officialUrl: { type: String, required: true },
    lastVerified: { type: Date, default: Date.now },

    sourceCitations: { type: [String], default: [] },
    status: { type: String, default: "active" },
  },
  { timestamps: true }
);

export const Scheme = mongoose.model<IScheme>("Scheme", SchemeSchema);