export interface User {
  id: string;
  phoneNumber: string;
  language: 'hi' | 'ta' | 'ml' | 'te' | 'kn' | 'en';
  onboardingCompleted: boolean;
  farmProfile?: {
    location?: {
      lat: number;
      lon: number;
      address?: string;
      state?: string;
      district?: string;
    };
    crops: string[];
    landSize?: number;
    soilType?: 'loamy' | 'clay' | 'sandy' | 'red' | 'black' | 'laterite';
  };
}

export interface AuthTokens {
  token: string;
  refreshToken: string;
}

export interface SendOTPResponse {
  success: boolean;
  message: string;
  expiresIn: number;
  otp?: string;
}

export interface VerifyOTPResponse {
  success: boolean;
  token: string;
  refreshToken: string;
  user: User;
}

export interface RefreshTokenResponse {
  success: boolean;
  token: string;
}
