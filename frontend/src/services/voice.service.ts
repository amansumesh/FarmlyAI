import axios from '../utils/axios';
import { VoiceQueryResult, QueryHistoryResponse } from '../types/voice.types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

class VoiceService {
  async submitVoiceQuery(audioBlob: Blob, language: string): Promise<VoiceQueryResult> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'query.wav');
    formData.append('language', language);

    const response = await axios.post<VoiceQueryResult>(
      `${API_URL}/api/query/voice`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  }

  async getQueryHistory(params?: {
    page?: number;
    limit?: number;
    type?: 'voice' | 'text' | 'disease_detection';
  }): Promise<QueryHistoryResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.type) searchParams.append('type', params.type);

    const url = `${API_URL}/api/query/history${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const response = await axios.get<QueryHistoryResponse>(url);
    return response.data;
  }

  async toggleSaveQuery(queryId: string): Promise<{ success: boolean; query: { id: string; saved: boolean } }> {
    const response = await axios.patch<{ success: boolean; query: { id: string; saved: boolean } }>(
      `${API_URL}/api/query/${queryId}/save`
    );
    return response.data;
  }
}

export const voiceService = new VoiceService();
