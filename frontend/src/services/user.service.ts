import { apiClient } from '../utils/axios';
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
    const response = await apiClient.get<GetProfileResponse>('/user/profile');
    return response.data.user;
  },

  async updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
    const response = await apiClient.put<UpdateProfileResponse>('/user/profile', data);
    return response.data.user;
  }
};
