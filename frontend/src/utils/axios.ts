import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';
import { useAuthStore } from '../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: AxiosError | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const tokens = useAuthStore.getState().tokens;
    
    if (tokens?.token && config.headers) {
      config.headers.Authorization = `Bearer ${tokens.token}`;
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (!originalRequest) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const tokens = useAuthStore.getState().tokens;
      
      if (!tokens?.refreshToken) {
        useAuthStore.getState().logout();
        processQueue(error);
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
        await useAuthStore.getState().refreshTokens();
        
        processQueue(null);
        isRefreshing = false;

        const newTokens = useAuthStore.getState().tokens;
        if (newTokens?.token && originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newTokens.token}`;
        }
        
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError);
        useAuthStore.getState().logout();
        isRefreshing = false;
        return Promise.reject(refreshError);
      }
    }

    const errorMessage = getErrorMessage(error);
    
    if (error.response?.status === 429) {
      toast.error('Too many requests. Please try again later.');
    } else if (error.response?.status === 403) {
      toast.error('Access denied');
    } else if (error.response?.status === 404) {
      toast.error('Resource not found');
    } else if (error.response?.status && error.response.status >= 500) {
      toast.error('Server error. Please try again later.');
    } else if (error.code === 'ECONNABORTED') {
      toast.error('Request timeout. Please check your connection.');
    } else if (error.message === 'Network Error') {
      toast.error('Network error. Please check your internet connection.');
    } else if (!navigator.onLine) {
      toast.error('You are offline. Please check your internet connection.');
    }

    return Promise.reject({
      ...error,
      message: errorMessage,
    });
  }
);

function getErrorMessage(error: AxiosError): string {
  if (error.response?.data) {
    const data = error.response.data as any;
    if (data.message) {
      return data.message;
    }
    if (data.errors && Array.isArray(data.errors)) {
      return data.errors.map((e: any) => e.message || e).join(', ');
    }
  }
  
  if (error.message === 'Network Error') {
    return 'Unable to connect to server. Please check your internet connection.';
  }
  
  if (error.code === 'ECONNABORTED') {
    return 'Request timed out. Please try again.';
  }
  
  return error.message || 'An unexpected error occurred';
}

export { getErrorMessage };
export default axiosInstance;
