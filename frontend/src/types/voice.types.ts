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
