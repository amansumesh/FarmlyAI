import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, AuthTokens } from '../types/auth.types';
import { authService } from '../services/auth.service';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User) => void;
  setTokens: (token: string, refreshToken?: string) => void;
  login: (phoneNumber: string, otp: string) => Promise<void>;
  logout: () => void;
  refreshTokens: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      get token() {
        return get().tokens?.token || null;
      },
      get refreshToken() {
        return get().tokens?.refreshToken || null;
      },
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setUser: (user) => set({ user, isAuthenticated: true }),

      setTokens: (token, refreshToken) => set((state) => ({ 
        tokens: {
          token,
          refreshToken: refreshToken || state.tokens?.refreshToken || ''
        }
      })),

      login: async (phoneNumber, otp) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.verifyOTP(phoneNumber, otp);
          
          set({
            user: response.user,
            tokens: {
              token: response.token,
              refreshToken: response.refreshToken
            },
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
        } catch (error: unknown) {
          const errorMessage = error && typeof error === 'object' && 'response' in error
            ? (error.response as { data?: { message?: string } })?.data?.message || 'Failed to verify OTP'
            : 'Failed to verify OTP';
          set({
            isLoading: false,
            error: errorMessage,
            isAuthenticated: false
          });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
          error: null
        });
        // Clear from localStorage
        localStorage.removeItem('auth-storage');
      },

      refreshTokens: async () => {
        const { tokens } = get();
        
        if (!tokens?.refreshToken) {
          throw new Error('No refresh token available');
        }

        try {
          const response = await authService.refreshToken(tokens.refreshToken);
          
          set({
            tokens: {
              ...tokens,
              token: response.token
            }
          });
        } catch (error) {
          // If refresh fails, logout user
          get().logout();
          throw error;
        }
      },

      clearError: () => set({ error: null })
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);
