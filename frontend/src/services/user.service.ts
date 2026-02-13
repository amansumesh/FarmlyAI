import axiosInstance from '../utils/axios';
import { UserProfile, UpdateProfileRequest } from '../types/user.types';

interface GetProfileResponse {
  success: boolean;
  user: UserProfile;
}

interface UpdateProfileResponse {
  success: boolean;
  message: string;
  user: UserProfile;
}

export const userService = {
  async getProfile(): Promise<UserProfile> {
    const response = await axiosInstance.get<GetProfileResponse>('/api/user/profile');
    return response.data.user;
  },

  async updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
    const response = await axiosInstance.put<UpdateProfileResponse>('/api/user/profile', data);
    return response.data.user;
  }
};
