import { Scheme } from '../models/scheme.model.js';
import { IUser } from '../models/user.model.js';
import { logger } from '../utils/logger.js';

interface SchemeMatch {
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

export class SchemeService {
  static async getEligibleSchemes(
    user: IUser,
    language: string = 'en'
  ): Promise<{ eligibleSchemes: SchemeMatch[]; totalSchemes: number }> {
    try {
      const schemes = await Scheme.find({ active: true });
      
      const eligibleSchemes: SchemeMatch[] = [];
      
      for (const scheme of schemes) {
        const matchPercentage = this.calculateEligibilityMatch(user, scheme);
        
        if (matchPercentage > 0) {
          const lang = language as 'en' | 'hi' | 'ta' | 'ml' | 'te' | 'kn';
          
          eligibleSchemes.push({
            id: scheme._id.toString(),
            name: scheme.name[lang] || scheme.name.en,
            description: scheme.description[lang] || scheme.description.en,
            benefits: scheme.benefits[lang] || scheme.benefits.en,
            applicationSteps: scheme.applicationProcess.steps[lang] || scheme.applicationProcess.steps.en,
            requiredDocuments: scheme.applicationProcess.documents[lang] || scheme.applicationProcess.documents.en,
            applicationUrl: scheme.applicationProcess.applicationUrl || '',
            eligibilityMatch: matchPercentage,
            type: scheme.type,
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
    
    if (maxScore === 0) {
      return 100;
    }
    
    const percentage = Math.round((score / maxScore) * 100);
    return percentage;
  }
}
