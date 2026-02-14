export interface UserProfile {
  id: string;
  phoneNumber: string;
  name?: string;
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
  onboardingCompleted: boolean;
  createdAt: string;
  lastLoginAt: string;
}

export interface UpdateProfileRequest {
  name?: string;
  language?: 'hi' | 'ta' | 'ml' | 'te' | 'kn' | 'en';
  farmProfile?: {
    location?: {
      coordinates: [number, number];
      address?: string;
      state?: string;
      district?: string;
    };
    crops?: string[];
    landSize?: number;
    soilType?: 'loamy' | 'clay' | 'sandy' | 'red' | 'black' | 'laterite';
  };
  onboardingCompleted?: boolean;
}
