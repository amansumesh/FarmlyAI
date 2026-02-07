# Voice Query API Documentation

## Overview

The Voice Query API enables farmers to interact with Farmly AI using natural voice input in their regional languages. The system uses Google Cloud Speech-to-Text for transcription, intent recognition for understanding queries, and Google Cloud Text-to-Speech for generating audio responses.

## Supported Languages

- **Hindi** (hi)
- **Tamil** (ta)
- **Malayalam** (ml)
- **Telugu** (te)
- **Kannada** (kn)
- **English** (en)

## Features

### 1. Speech-to-Text (STT)
- Converts audio input to text
- Supports 6 Indian languages
- Enhanced with agricultural vocabulary for better accuracy
- Handles multiple audio formats (WAV, MP3, WEBM, OGG)

### 2. Intent Recognition
The system recognizes the following intents:
- **price_query**: Market price inquiries
- **disease_query**: Crop disease identification
- **scheme_query**: Government scheme information
- **weather_query**: Weather forecasts
- **advisory_query**: Farming advice
- **general**: General queries and greetings

### 3. Text-to-Speech (TTS)
- Generates natural-sounding audio responses
- Uses regional voices for each language
- Optimized speech rate (0.95x) for clarity

### 4. Query History
- Stores all voice queries in MongoDB
- Tracks processing time and intent
- Allows users to save favorite queries

## API Endpoints

### POST `/api/query/voice`

Submit a voice query for processing.

**Request:**
```
Content-Type: multipart/form-data
Authorization: Bearer <token>

Fields:
  - audio: File (WAV/MP3/WEBM/OGG, max 10MB)
  - language: string (hi|ta|ml|te|kn|en)
```

**Response:**
```json
{
  "success": true,
  "query": {
    "id": "507f1f77bcf86cd799439011",
    "transcription": "टमाटर की कीमत क्या है?",
    "intent": "price_query"
  },
  "response": {
    "text": "टमाटर की कीमत जानने के लिए कृपया मार्केट प्राइस पेज पर जाएं...",
    "audioUrl": "https://blob.vercel-storage.com/tts-hi-1234567890.mp3"
  },
  "processingTime": 2847
}
```

**Errors:**
- `400`: No audio file provided or invalid format
- `401`: Unauthorized
- `413`: Audio file too large (>10MB)
- `429`: Rate limit exceeded (max 30 per hour)
- `500`: STT/TTS service error

### GET `/api/query/history`

Retrieve user's query history.

**Request:**
```
Authorization: Bearer <token>

Query Parameters:
  - page: number (default: 1)
  - limit: number (default: 20, max: 100)
  - type: 'voice' | 'text' | 'disease_detection' (optional filter)
```

**Response:**
```json
{
  "success": true,
  "queries": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "userId": "507f191e810c19729de860ea",
      "type": "voice",
      "input": {
        "text": "टमाटर की कीमत क्या है?",
        "language": "hi",
        "audioUrl": "https://..."
      },
      "response": {
        "text": "टमाटर की कीमत...",
        "audioUrl": "https://..."
      },
      "intent": "price_query",
      "processingTimeMs": 2847,
      "saved": false,
      "createdAt": "2026-02-07T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

### PATCH `/api/query/:queryId/save`

Toggle the saved status of a query (bookmark/unbookmark).

**Request:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "query": {
    "id": "507f1f77bcf86cd799439011",
    "saved": true
  }
}
```

## Implementation Details

### Google Cloud Services

#### Speech-to-Text Configuration
```typescript
{
  encoding: 'LINEAR16',
  sampleRateHertz: 16000,
  languageCode: 'hi-IN',  // Based on user language
  alternativeLanguageCodes: ['en-IN'],
  enableAutomaticPunctuation: true,
  model: 'default',
  useEnhanced: true,
  speechContexts: [{
    phrases: agriculturalPhrases,  // Custom vocabulary
    boost: 20
  }]
}
```

#### Text-to-Speech Configuration
```typescript
{
  voice: {
    languageCode: 'hi-IN',
    name: 'hi-IN-Wavenet-A'  // High-quality neural voice
  },
  audioConfig: {
    audioEncoding: 'MP3',
    speakingRate: 0.95,  // Slightly slower for clarity
    pitch: 0
  }
}
```

### Intent Recognition

Uses keyword-based pattern matching with confidence scoring:

```typescript
const intentPatterns = {
  price_query: [/कीमत|दाम|भाव|price|rate/i, /मंडी|बाजार|market/i],
  disease_query: [/बीमारी|रोग|disease/i, /कीड़े|कीट|pest/i],
  scheme_query: [/योजना|स्कीम|scheme/i, /सरकार|government/i],
  // ... more patterns
};
```

Confidence calculation:
- Base confidence: 0.6
- +0.2 per matched pattern
- Max confidence: 0.95

### Agricultural Vocabulary

Enhanced STT accuracy with 60+ agricultural terms:
- Crops: टमाटर, धान, गेहूं, tomato, wheat, rice, etc.
- Terms: खाद, बीमारी, सिंचाई, fertilizer, disease, irrigation, etc.

### Response Generation

Responses are pre-translated for all 6 languages and customized based on:
- Detected intent
- User's language preference
- Extracted entities (e.g., crop names)

## Rate Limiting

- **Voice queries**: 30 per hour per user
- **Query history**: No limit
- **Save query**: No limit

## Storage

### Query Document (MongoDB)
```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  type: 'voice',
  input: {
    text: string,
    language: string,
    audioUrl: string
  },
  response: {
    text: string,
    audioUrl: string
  },
  intent: string,
  processingTimeMs: number,
  saved: boolean,
  createdAt: Date
}
```

### Audio Files (Vercel Blob Storage)
- Input audio: `voice-{userId}-{timestamp}.{ext}`
- Output audio: `tts-{language}-{timestamp}.mp3`
- Public access URLs with CDN caching

## Performance

### Target Metrics
- **End-to-end latency**: <3 seconds
- **STT accuracy**: >95% for agricultural terms
- **TTS generation**: <1 second
- **Audio upload**: <500ms

### Monitoring
All queries log:
- Processing time (ms)
- Transcription length
- Intent confidence
- Error details (if any)

## Testing

Run the test suite:
```bash
pnpm run test:voice
```

This verifies:
- ✅ Voice query endpoint exists and requires authentication
- ✅ Query history endpoint exists and requires authentication
- ✅ Toggle save endpoint exists and requires authentication

## Setup Instructions

1. **Create Google Cloud Project**
   - Go to [console.cloud.google.com](https://console.cloud.google.com)
   - Create a new project or select existing one

2. **Enable APIs**
   - Enable Cloud Speech-to-Text API
   - Enable Cloud Text-to-Speech API

3. **Create Service Account**
   - Go to IAM & Admin > Service Accounts
   - Create service account with roles:
     - Cloud Speech Administrator
     - Cloud Text-to-Speech Admin
   - Generate and download JSON key file

4. **Configure Environment Variables**
   ```bash
   GOOGLE_CLOUD_PROJECT_ID=your-project-id
   GOOGLE_CLOUD_CREDENTIALS=/path/to/service-account-key.json
   ```

5. **Test Integration**
   ```bash
   pnpm run dev
   pnpm run test:voice
   ```

## Error Handling

The system handles:
- Empty/silent audio files → Returns "Could not transcribe" error
- Invalid audio formats → Returns 400 error at upload
- Google Cloud service errors → Logged and returns 500 error
- Rate limit exceeded → Returns 429 with retry-after header

## Future Enhancements

1. **Advanced NLP**: Replace keyword matching with fine-tuned BERT model
2. **Streaming STT**: Real-time transcription for longer queries
3. **Voice biometrics**: User authentication via voice
4. **Dialect support**: Handle regional variations within languages
5. **Offline mode**: On-device speech recognition for low connectivity areas
6. **Multi-turn conversations**: Maintain context across queries

## Security Considerations

- ✅ JWT authentication required for all endpoints
- ✅ Rate limiting prevents abuse
- ✅ Audio files stored with unique user-specific names
- ✅ Google Cloud credentials stored securely (not in code)
- ✅ No sensitive data in transcriptions (queries are non-personal)

## Related Documentation

- [Google Cloud Speech-to-Text](https://cloud.google.com/speech-to-text/docs)
- [Google Cloud Text-to-Speech](https://cloud.google.com/text-to-speech/docs)
- [Vercel Blob Storage](https://vercel.com/docs/storage/vercel-blob)
- [MongoDB Query Model](../src/models/query.model.ts)
