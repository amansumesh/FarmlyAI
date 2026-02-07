import axios from 'axios';
import { SendOTPResponse, VerifyOTPResponse, RefreshTokenResponse } from '../types/auth.types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

class AuthService {
  async sendOTP(phoneNumber: string): Promise<SendOTPResponse> {
    const response = await axios.post<SendOTPResponse>(
      `${API_URL}/api/auth/send-otp`,
      { phoneNumber }
    );
    return response.data;
  }

  async verifyOTP(phoneNumber: string, otp: string): Promise<VerifyOTPResponse> {
    const response = await axios.post<VerifyOTPResponse>(
      `${API_URL}/api/auth/verify-otp`,
      { phoneNumber, otp }
    );
    return response.data;
  }

  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    const response = await axios.post<RefreshTokenResponse>(
      `${API_URL}/api/auth/refresh-token`,
      { refreshToken }
    );
    return response.data;
  }
}

export const authService = new AuthService();
