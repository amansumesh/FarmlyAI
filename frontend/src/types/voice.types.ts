export interface VoiceQuery {
  transcription: string;
  intent: string;
  confidence?: number;
}

export interface VoiceResponse {
  text: string;
  audioUrl: string;
}

export interface VoiceQueryResult {
  query: VoiceQuery;
  response: VoiceResponse;
  processingTime: number;
}

export interface VoiceQueryRequest {
  audio: Blob;
  language: string;
}

export interface QueryHistoryItem {
  _id: string;
  userId: string;
  type: 'voice' | 'text' | 'disease_detection';
  input: {
    text?: string;
    language: string;
    audioUrl?: string;
    imageUrl?: string;
  };
  response: {
    text: string;
    audioUrl?: string;
    data?: Record<string, unknown>;
  };
  intent?: string;
  processingTimeMs: number;
  saved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QueryHistoryResponse {
  success: boolean;
  queries: QueryHistoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
