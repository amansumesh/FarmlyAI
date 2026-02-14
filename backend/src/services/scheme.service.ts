import { Scheme, IScheme } from '../models/scheme.model.js';
import { IUser } from '../models/user.model.js';
import { logger } from '../utils/logger.js';
import {
  fetchPMKisanData,
  fetchPMFBYData,
  fetchSoilHealthCardData,
  fetchPMKSYData,
  fetchPKVYData,
  fetchENAMData,
} from "./schemeScraper.service.js"; // Importing from the scraper service

export interface SchemeMatch {
  id: string;
  name: string;
  description: string;
  benefits: string[];
  applicationSteps: string[];
  requiredDocuments: string[];
  applicationUrl: string;
  eligibilityMatch: number;
  type: string;
}

export async function updateSchemes() {
  const schemes = [
    await fetchPMKisanData(),
    await fetchPMFBYData(),
    await fetchSoilHealthCardData(),
    await fetchPMKSYData(),
    await fetchPKVYData(),
    await fetchENAMData(),
  ];

  let updatedCount = 0;

  for (const scheme of schemes) {
    // Update or insert the scheme
    await Scheme.updateOne(
      { schemeId: scheme.schemeId },
      // @ts-ignore: Suppressing type mismatch between scraper output and strict schema if any
      { $set: scheme },
      { upsert: true }
    );

    updatedCount++;
  }

  return updatedCount;
}

export async function getAllSchemes() {
  return await Scheme.find().sort({ updatedAt: -1 });
}

export async function getSchemeById(schemeId: string) {
  return await Scheme.findOne({ schemeId });
}

export class SchemeService {
  static async getEligibleSchemes(
    user: IUser,
    language: string = 'en'
  ): Promise<{ eligibleSchemes: SchemeMatch[]; totalSchemes: number }> {
    try {
      // Find all active schemes
      const schemes = await Scheme.find({ status: 'active' });

      const eligibleSchemes: SchemeMatch[] = [];

      for (const scheme of schemes) {
        const matchPercentage = this.calculateEligibilityMatch(user, scheme);

        if (matchPercentage > 0) {
          const lang = language as 'en' | 'hi' | 'ta' | 'ml' | 'te' | 'kn';

          // Note: The following property access assumes scheme has localized fields (object)
          // If scheme has flat strings (from scraper), this might need adjustment.
          // Using 'as any' to allow flexible property access.
          const s = scheme as any;

          eligibleSchemes.push({
            id: scheme._id.toString(),
            name: s.name?.[lang] || s.name?.en || s.name,
            description: s.description?.[lang] || s.description?.en || s.description,
            benefits: s.benefits?.[lang] || s.benefits?.en || (Array.isArray(s.benefits) ? s.benefits : [s.benefits]),
            applicationSteps: s.applicationProcess?.steps?.[lang] || s.applicationProcess?.steps?.en || s.howToApply || [],
            requiredDocuments: s.applicationProcess?.documents?.[lang] || s.applicationProcess?.documents?.en || s.documentsRequired || [],
            applicationUrl: s.applicationProcess?.applicationUrl || s.officialUrl || '',
            eligibilityMatch: matchPercentage,
            type: s.type || 'central',
          });
        }
      }

      eligibleSchemes.sort((a, b) => b.eligibilityMatch - a.eligibilityMatch);

      return {
        eligibleSchemes,
        totalSchemes: eligibleSchemes.length,
      };
    } catch (error) {
      logger.error('Error fetching eligible schemes:', error);
      throw new Error('Failed to fetch eligible schemes');
    }
  }

  private static calculateEligibilityMatch(user: IUser, scheme: any): number {
    let score = 0;
    let maxScore = 0;

    const landSize = user.farmProfile?.landSize || 0;
    const userCrops = user.farmProfile?.crops || [];
    const userState = user.farmProfile?.location?.state || '';

    // Check if eligibility criteria exists and is in the expected structured format
    if (scheme.eligibility && !Array.isArray(scheme.eligibility)) {
      if (scheme.eligibility.landSize) {
        maxScore += 30;
        const minLand = scheme.eligibility.landSize.min ?? 0;
        const maxLand = scheme.eligibility.landSize.max ?? Infinity;

        if (landSize >= minLand && landSize <= maxLand) {
          score += 30;
        } else if (landSize > 0) {
          const distance = Math.min(
            Math.abs(landSize - minLand),
            Math.abs(landSize - maxLand)
          );
          const partialScore = Math.max(0, 30 - (distance * 3));
          score += partialScore;
        }
      }

      if (scheme.eligibility.crops && scheme.eligibility.crops.length > 0) {
        maxScore += 40;
        const matchingCrops = userCrops.filter((crop: string) =>
          scheme.eligibility.crops.includes(crop.toLowerCase())
        );

        if (matchingCrops.length > 0) {
          const cropScore = (matchingCrops.length / scheme.eligibility.crops.length) * 40;
          score += cropScore;
        }
      }

      if (scheme.eligibility.states && scheme.eligibility.states.length > 0) {
        maxScore += 30;
        if (userState && scheme.eligibility.states.includes(userState)) {
          score += 30;
        }
      } else {
        maxScore += 30;
        score += 30;
      }
    } else {
      // Fallback for flat schemes (scraper data) where eligibility is just text
      // Retrieve 100% match if no explicit structured criteria prevents it
      return 100;
    }

    if (maxScore === 0) {
      return 100;
    }

    const percentage = Math.round((score / maxScore) * 100);
    return percentage;
  }
}