import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserProfile, UpdateProfileRequest } from '../types/user.types';
import { userService } from '../services/user.service';

interface UserState {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: UpdateProfileRequest) => Promise<void>;
  clearUser: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      loading: false,
      error: null,

      fetchProfile: async () => {
        set({ loading: true, error: null });
        try {
          const user = await userService.getProfile();
          set({ user, loading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch profile',
            loading: false 
          });
          throw error;
        }
      },

      updateProfile: async (data: UpdateProfileRequest) => {
        set({ loading: true, error: null });
        try {
          const user = await userService.updateProfile(data);
          set({ user, loading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update profile',
            loading: false 
          });
          throw error;
        }
      },

      clearUser: () => {
        set({ user: null, loading: false, error: null });
      }
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({ user: state.user })
    }
  )
);
