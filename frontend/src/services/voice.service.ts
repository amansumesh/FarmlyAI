import axios from '../utils/axios';
import { VoiceQueryResult } from '../types/voice.types';

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
}

export const voiceService = new VoiceService();
