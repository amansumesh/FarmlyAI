# Technical Specification - Farmly AI MVP

**Version**: 1.0  
**Date**: February 2026  
**Implementation Timeline**: 24-48 Hours  
**Based On**: [requirements.md](./requirements.md) v1.1

---

## 1. Technical Context

### 1.1 Project Type
**Greenfield Project** - No existing codebase, building from scratch for hackathon submission.

### 1.2 Core Technology Stack

#### Frontend
- **Framework**: React 18.2+ with TypeScript
- **Build Tool**: Vite 5.x (faster than CRA, optimized for development speed)
- **UI Library**: Tailwind CSS 3.x + shadcn/ui components
- **State Management**: 
  - Zustand (lightweight global state)
  - TanStack Query (React Query) for server state
- **PWA**: Vite PWA Plugin with Workbox
- **Routing**: React Router v6
- **Form Handling**: React Hook Form with Zod validation
- **Internationalization**: i18next + react-i18next
- **HTTP Client**: Axios with interceptors
- **Voice Interface**: Google Cloud Speech-to-Text & Text-to-Speech SDKs

#### Backend
- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js 5.x with TypeScript
- **API Style**: RESTful JSON APIs
- **Authentication**: JWT with refresh tokens
- **Validation**: Zod (shared with frontend)
- **OTP Service**: Twilio (free trial) or fast2sms
- **File Upload**: Multer for image handling

#### ML/AI Backend
- **Runtime**: Python 3.11
- **Framework**: FastAPI
- **ML Framework**: PyTorch or TensorFlow
- **Image Processing**: Pillow, OpenCV
- **Model Serving**: Direct inference (no TensorFlow Serving for MVP)

#### Database
- **Primary DB**: MongoDB Atlas (M0 free tier)
  - Document-based, flexible schema
  - Good for rapid iteration
  - Built-in geospatial queries for location-based features
- **Caching**: Redis Cloud (free tier 30MB)
  - Cache weather data
  - Cache market prices
  - Session storage

#### Cloud Services & APIs
- **Hosting**: 
  - Frontend: Vercel (free tier, auto-deploy from Git)
  - Backend API: Vercel Serverless Functions
  - ML API: Railway.app or Render.com (free tier)
- **File Storage**: Vercel Blob Storage (disease detection images)
- **Voice Services**: Google Cloud (Speech-to-Text + Text-to-Speech)
- **Weather Data**: OpenWeatherMap API (free tier: 1000 calls/day)
- **Market Data**: Agmarknet API (government, free)

### 1.3 Development Tools
- **Package Manager**: pnpm (faster than npm/yarn)
- **Code Quality**: ESLint + Prettier
- **Type Checking**: TypeScript strict mode
- **Git Hosting**: GitHub
- **API Testing**: Thunder Client (VS Code) or Postman
- **Environment Management**: dotenv

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                         │
│  ┌────────────────────────────────────────────────────┐     │
│  │   React PWA (Vite + TypeScript + Tailwind)        │     │
│  │   - Voice Interface (Google Cloud SDK)             │     │
│  │   - Camera Capture                                 │     │
│  │   - Offline Support (Service Worker)               │     │
│  │   - i18next (6 languages)                          │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                          ↓ HTTPS/REST
┌─────────────────────────────────────────────────────────────┐
│                       API GATEWAY                            │
│  ┌────────────────────────────────────────────────────┐     │
│  │   Express.js API (Vercel Serverless)               │     │
│  │   - Authentication & Authorization                  │     │
│  │   - Request Validation                              │     │
│  │   - Rate Limiting                                   │     │
│  │   - Response Caching                                │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
           ↓                    ↓                    ↓
┌──────────────────┐  ┌──────────────────┐  ┌─────────────────┐
│  ML SERVICE      │  │  EXTERNAL APIs   │  │   DATABASE      │
│                  │  │                  │  │                 │
│  FastAPI         │  │  - Google Cloud  │  │  MongoDB Atlas  │
│  - Disease Det.  │  │  - OpenWeather   │  │  - Users        │
│  - PyTorch Model │  │  - Agmarknet     │  │  - Queries      │
│  (Railway.app)   │  │  - Twilio        │  │  - History      │
└──────────────────┘  └──────────────────┘  └─────────────────┘
           ↓
┌──────────────────┐                          ┌─────────────────┐
│  BLOB STORAGE    │                          │  REDIS CACHE    │
│  Vercel Blob     │                          │  - Weather      │
│  - User Images   │                          │  - Market Data  │
└──────────────────┘                          └─────────────────┘
```

### 2.2 Request Flow Examples

#### Flow 1: Voice Query
```
User speaks → Frontend (STT via Google Cloud) → Text transcription →
Express API (/api/query/voice) → NLP Intent Recognition →
Generate response (rule-based or DB lookup) → TTS via Google Cloud →
Play audio to user
```

#### Flow 2: Disease Detection
```
User captures image → Frontend → Upload to Express API →
Express forwards to ML API (FastAPI) → PyTorch inference →
Return disease, confidence, severity → Express enriches with treatment data →
Frontend displays results in user's language
```

#### Flow 3: Market Prices
```
User requests prices → Express API checks Redis cache →
If cache miss: fetch from Agmarknet API → Cache for 6 hours →
Return to frontend → Display in user's language
```

---

## 3. Data Models

### 3.1 MongoDB Collections

#### Collection: `users`
```typescript
interface User {
  _id: ObjectId;
  phoneNumber: string;              // Primary identifier, unique
  phoneVerified: boolean;
  language: 'hi' | 'ta' | 'ml' | 'te' | 'kn' | 'en';
  
  // Farm Profile
  farmProfile: {
    location: {
      type: 'Point';
      coordinates: [number, number]; // [longitude, latitude]
      address?: string;
      state?: string;
      district?: string;
    };
    crops: string[];                // Array of crop names
    landSize: number;               // In acres
    soilType: 'loamy' | 'clay' | 'sandy' | 'red' | 'black' | 'laterite';
  };
  
  // Metadata
  createdAt: Date;
  lastLoginAt: Date;
  onboardingCompleted: boolean;
}

// Indexes
users.createIndex({ phoneNumber: 1 }, { unique: true });
users.createIndex({ 'farmProfile.location': '2dsphere' }); // Geospatial queries
```

#### Collection: `queries`
```typescript
interface Query {
  _id: ObjectId;
  userId: ObjectId;                 // Reference to users._id
  type: 'voice' | 'text' | 'disease_detection';
  
  // Input
  input: {
    text?: string;                  // Transcribed or typed text
    language: string;
    audioUrl?: string;              // For voice queries
    imageUrl?: string;              // For disease detection
  };
  
  // Output
  response: {
    text: string;                   // Response in user's language
    audioUrl?: string;              // TTS generated audio
    data?: any;                     // Structured data (e.g., disease info, prices)
  };
  
  // Metadata
  processingTimeMs: number;
  createdAt: Date;
  saved: boolean;                   // User bookmarked this query
}

// Indexes
queries.createIndex({ userId: 1, createdAt: -1 }); // User's query history
queries.createIndex({ type: 1, createdAt: -1 });   // Query type analytics
```

#### Collection: `diseaseDetections`
```typescript
interface DiseaseDetection {
  _id: ObjectId;
  userId: ObjectId;
  queryId: ObjectId;                // Reference to queries._id
  
  // Image Info
  imageUrl: string;                 // Vercel Blob URL
  imageMetadata: {
    size: number;                   // Bytes
    mimeType: string;
    capturedAt: Date;
  };
  
  // Detection Results
  predictions: Array<{
    disease: string;                // Disease name (English)
    diseaseLocal: string;           // Disease name in user's language
    crop: string;
    confidence: number;             // 0-1
    severity: 'low' | 'moderate' | 'high' | 'critical';
  }>;
  
  topPrediction: {
    disease: string;
    confidence: number;
    severity: string;
  };
  
  // Treatment
  recommendations: {
    organic: string[];
    chemical: string[];
    preventive: string[];
  };
  
  // Metadata
  modelVersion: string;
  inferenceTimeMs: number;
  createdAt: Date;
}

// Indexes
diseaseDetections.createIndex({ userId: 1, createdAt: -1 });
diseaseDetections.createIndex({ 'topPrediction.disease': 1 }); // Disease analytics
```

#### Collection: `schemes` (Static/Seeded Data)
```typescript
interface Scheme {
  _id: ObjectId;
  name: {
    en: string;
    hi: string;
    ta: string;
    ml: string;
    te: string;
    kn: string;
  };
  
  description: {
    en: string;
    hi: string;
    // ... other languages
  };
  
  benefits: string[];               // Localized benefit descriptions
  
  eligibility: {
    landSize?: { min?: number; max?: number };
    crops?: string[];
    states?: string[];              // Empty = all India
    annualIncome?: { max: number };
  };
  
  applicationProcess: {
    steps: string[];                // Localized steps
    documents: string[];            // Required documents
    applicationUrl?: string;
  };
  
  type: 'central' | 'state' | 'district';
  active: boolean;
  updatedAt: Date;
}

// Indexes
schemes.createIndex({ active: 1, type: 1 });
```

### 3.2 Redis Cache Schema

```typescript
// Weather Cache (TTL: 1 hour)
Key: `weather:{lat},{lon}`
Value: {
  current: { temp, humidity, windSpeed, description },
  forecast: [ /* 7-day forecast */ ],
  fetchedAt: timestamp
}

// Market Prices Cache (TTL: 6 hours)
Key: `market:{crop}:{state}`
Value: {
  markets: [
    { name, location, price, date, distance }
  ],
  trend: 'rising' | 'falling' | 'stable',
  fetchedAt: timestamp
}

// OTP Cache (TTL: 10 minutes)
Key: `otp:{phoneNumber}`
Value: {
  otp: string,        // 6-digit code
  attempts: number,   // Rate limiting
  expiresAt: timestamp
}
```

---

## 4. API Contracts

### 4.1 Authentication APIs

#### POST `/api/auth/send-otp`
```typescript
Request:
{
  phoneNumber: string;  // Format: +91XXXXXXXXXX
}

Response:
{
  success: boolean;
  message: string;
  expiresIn: number;    // Seconds
}

Errors:
- 400: Invalid phone number format
- 429: Too many OTP requests
```

#### POST `/api/auth/verify-otp`
```typescript
Request:
{
  phoneNumber: string;
  otp: string;          // 6 digits
}

Response:
{
  success: boolean;
  token: string;        // JWT access token
  refreshToken: string;
  user: {
    id: string;
    phoneNumber: string;
    language: string;
    onboardingCompleted: boolean;
  }
}

Errors:
- 400: Invalid OTP
- 401: OTP expired
- 429: Too many attempts
```

### 4.2 User Profile APIs

#### GET `/api/user/profile`
```typescript
Headers:
  Authorization: Bearer <token>

Response:
{
  id: string;
  phoneNumber: string;
  language: string;
  farmProfile: {
    location: { lat, lon, address },
    crops: string[],
    landSize: number,
    soilType: string
  },
  createdAt: string;
}
```

#### PUT `/api/user/profile`
```typescript
Headers:
  Authorization: Bearer <token>

Request:
{
  language?: 'hi' | 'ta' | 'ml' | 'te' | 'kn' | 'en';
  farmProfile?: {
    location?: { lat, lon, address },
    crops?: string[],
    landSize?: number,
    soilType?: string
  }
}

Response:
{
  success: boolean;
  user: { /* updated user object */ }
}
```

### 4.3 Voice Query API

#### POST `/api/query/voice`
```typescript
Headers:
  Authorization: Bearer <token>
  Content-Type: multipart/form-data

Request:
{
  audio: File;          // WAV/MP3/WEBM audio file
  language: string;     // User's language code
}

Response:
{
  query: {
    id: string;
    transcription: string;
    intent: string;     // 'disease_query' | 'price_query' | 'scheme_query' | 'general'
  },
  response: {
    text: string;       // Response in user's language
    audioUrl: string;   // Pre-signed URL for TTS audio
    data?: any;         // Structured data if applicable
  },
  processingTime: number;
}

Errors:
- 400: Invalid audio format
- 413: Audio file too large (>10MB)
- 500: STT/TTS service error
```

### 4.4 Disease Detection API

#### POST `/api/disease/detect`
```typescript
Headers:
  Authorization: Bearer <token>
  Content-Type: multipart/form-data

Request:
{
  image: File;          // JPEG/PNG image
  language: string;
}

Response:
{
  detection: {
    id: string;
    imageUrl: string;
    predictions: [
      {
        disease: string;
        diseaseLocal: string;
        crop: string;
        confidence: number;
        severity: string;
      }
    ],
    topPrediction: {
      disease: string,
      diseaseLocal: string,
      confidence: number,
      severity: string
    },
    recommendations: {
      organic: string[],
      chemical: string[],
      preventive: string[]
    }
  },
  inferenceTime: number;
}

Errors:
- 400: Invalid image format
- 413: Image too large (>10MB)
- 422: Unable to detect plant in image
```

### 4.5 Advisory APIs

#### GET `/api/advisory/recommendations`
```typescript
Headers:
  Authorization: Bearer <token>

Query Params:
  ?language=hi

Response:
{
  recommendations: [
    {
      type: 'irrigation' | 'fertilizer' | 'pest_prevention' | 'harvest',
      title: string,
      description: string,
      priority: 'high' | 'medium' | 'low',
      actionBy: string,   // Date or timeframe
    }
  ],
  weather: {
    current: { temp, humidity, description },
    forecast: [ /* 7-day */ ]
  },
  basedOn: {
    crop: string,
    location: string,
    soilType: string
  }
}
```

### 4.6 Market Intelligence API

#### GET `/api/market/prices`
```typescript
Headers:
  Authorization: Bearer <token>

Query Params:
  ?crop=tomato&language=hi&limit=5

Response:
{
  crop: string,
  markets: [
    {
      name: string,
      location: string,
      distance: number,   // km from user
      price: number,      // per kg
      unit: string,
      date: string,
      trend: 'up' | 'down' | 'stable'
    }
  ],
  priceAnalysis: {
    average: number,
    highest: { market, price },
    lowest: { market, price },
    trend: 'rising' | 'falling' | 'stable',
    recommendation: string  // Localized advice
  },
  priceHistory: [
    { date, avgPrice }    // Last 30 days
  ]
}
```

### 4.7 Government Schemes API

#### GET `/api/schemes/match`
```typescript
Headers:
  Authorization: Bearer <token>

Query Params:
  ?language=hi

Response:
{
  eligibleSchemes: [
    {
      id: string,
      name: string,
      description: string,
      benefits: string[],
      applicationSteps: string[],
      requiredDocuments: string[],
      applicationUrl: string,
      eligibilityMatch: number  // Percentage match
    }
  ],
  totalSchemes: number
}
```

### 4.8 ML Service API (Internal - FastAPI)

#### POST `/ml/detect-disease`
```typescript
Request:
{
  image_base64: string;
}

Response:
{
  predictions: [
    {
      disease: string,
      crop: string,
      confidence: float,
      severity: string
    }
  ],
  inference_time_ms: number,
  model_version: string
}
```

---

## 5. Source Code Structure

```
farmly-ai/
├── frontend/                      # React PWA
│   ├── public/
│   │   ├── locales/              # i18next translations
│   │   │   ├── en/
│   │   │   ├── hi/
│   │   │   ├── ta/
│   │   │   ├── ml/
│   │   │   ├── te/
│   │   │   └── kn/
│   │   ├── favicon.ico
│   │   └── manifest.json
│   │
│   ├── src/
│   │   ├── assets/               # Images, icons
│   │   ├── components/           # React components
│   │   │   ├── common/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── LanguageSelector.tsx
│   │   │   │   └── LoadingSpinner.tsx
│   │   │   ├── voice/
│   │   │   │   ├── VoiceInput.tsx
│   │   │   │   └── AudioPlayer.tsx
│   │   │   ├── disease/
│   │   │   │   ├── CameraCapture.tsx
│   │   │   │   ├── DiseaseResult.tsx
│   │   │   │   └── TreatmentCard.tsx
│   │   │   ├── advisory/
│   │   │   │   └── RecommendationCard.tsx
│   │   │   ├── market/
│   │   │   │   ├── PriceCard.tsx
│   │   │   │   └── PriceChart.tsx
│   │   │   └── schemes/
│   │   │       └── SchemeCard.tsx
│   │   │
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx
│   │   │   ├── OnboardingPage.tsx
│   │   │   ├── HomePage.tsx
│   │   │   ├── DiseaseDetectionPage.tsx
│   │   │   ├── AdvisoryPage.tsx
│   │   │   ├── MarketPage.tsx
│   │   │   ├── SchemesPage.tsx
│   │   │   └── ProfilePage.tsx
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useVoice.ts        # Google Cloud STT/TTS
│   │   │   ├── useCamera.ts
│   │   │   └── useGeolocation.ts
│   │   │
│   │   ├── services/
│   │   │   ├── api.ts             # Axios instance
│   │   │   ├── auth.service.ts
│   │   │   ├── voice.service.ts
│   │   │   ├── disease.service.ts
│   │   │   ├── advisory.service.ts
│   │   │   ├── market.service.ts
│   │   │   └── schemes.service.ts
│   │   │
│   │   ├── store/
│   │   │   ├── authStore.ts       # Zustand
│   │   │   ├── userStore.ts
│   │   │   └── settingsStore.ts
│   │   │
│   │   ├── utils/
│   │   │   ├── validators.ts
│   │   │   ├── formatters.ts
│   │   │   └── constants.ts
│   │   │
│   │   ├── types/
│   │   │   ├── user.types.ts
│   │   │   ├── query.types.ts
│   │   │   └── api.types.ts
│   │   │
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── vite-env.d.ts
│   │
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── .env.example
│
├── backend/                       # Express API
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── user.controller.ts
│   │   │   ├── query.controller.ts
│   │   │   ├── disease.controller.ts
│   │   │   ├── advisory.controller.ts
│   │   │   ├── market.controller.ts
│   │   │   └── schemes.controller.ts
│   │   │
│   │   ├── services/
│   │   │   ├── otp.service.ts     # Twilio integration
│   │   │   ├── jwt.service.ts
│   │   │   ├── google-cloud.service.ts  # STT/TTS
│   │   │   ├── ml.service.ts      # Calls ML API
│   │   │   ├── weather.service.ts
│   │   │   ├── market.service.ts  # Agmarknet API
│   │   │   └── storage.service.ts # Vercel Blob
│   │   │
│   │   ├── models/
│   │   │   ├── user.model.ts
│   │   │   ├── query.model.ts
│   │   │   ├── disease.model.ts
│   │   │   └── scheme.model.ts
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── validation.middleware.ts
│   │   │   ├── errorHandler.middleware.ts
│   │   │   └── rateLimiter.middleware.ts
│   │   │
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── user.routes.ts
│   │   │   ├── query.routes.ts
│   │   │   ├── disease.routes.ts
│   │   │   ├── advisory.routes.ts
│   │   │   ├── market.routes.ts
│   │   │   └── schemes.routes.ts
│   │   │
│   │   ├── utils/
│   │   │   ├── db.ts              # MongoDB connection
│   │   │   ├── redis.ts           # Redis connection
│   │   │   ├── validators.ts      # Zod schemas
│   │   │   └── logger.ts
│   │   │
│   │   ├── config/
│   │   │   └── index.ts           # Environment config
│   │   │
│   │   ├── types/
│   │   │   └── index.ts
│   │   │
│   │   └── index.ts               # Express app entry
│   │
│   ├── scripts/
│   │   └── seed-schemes.ts        # Populate schemes DB
│   │
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── ml-service/                    # Python ML API
│   ├── app/
│   │   ├── main.py                # FastAPI app
│   │   ├── models/
│   │   │   └── disease_detector.py
│   │   ├── services/
│   │   │   ├── preprocessing.py
│   │   │   └── inference.py
│   │   ├── utils/
│   │   │   └── image_utils.py
│   │   └── config.py
│   │
│   ├── models/                    # Trained model files
│   │   └── disease_model.pth
│   │
│   ├── requirements.txt
│   └── Dockerfile
│
├── shared/                        # Shared types (optional)
│   └── types/
│       └── api.types.ts
│
├── docs/
│   └── API.md
│
├── .gitignore
├── README.md
└── package.json                   # Root workspace config (if using monorepo)
```

---

## 6. Implementation Approach

### 6.1 Architecture Decisions

#### Decision 1: Monorepo vs Separate Repos
**Choice**: **Monorepo** with pnpm workspaces  
**Rationale**:
- Easier to share types between frontend and backend
- Single `git clone` for judges to run the project
- Simplified deployment with Vercel (auto-detects build configs)

#### Decision 2: REST vs GraphQL
**Choice**: **REST APIs**  
**Rationale**:
- Simpler to implement in 24-48 hours
- No need for complex data fetching patterns
- Express.js has better REST tooling

#### Decision 3: Server-Side vs Client-Side Disease Detection
**Choice**: **Server-Side** (FastAPI backend)  
**Rationale**:
- Larger, more accurate models possible
- Faster development (no TensorFlow.js conversion)
- Easier debugging and monitoring
- Stretch goal: Add TensorFlow.js for offline mode

#### Decision 4: Real-Time vs Polling
**Choice**: **Polling/HTTP** (no WebSockets/Socket.io)  
**Rationale**:
- Simpler architecture for MVP
- Real-time updates not critical for MVP features
- Can add later for price alerts

#### Decision 5: Native vs PWA
**Choice**: **PWA** (not React Native)  
**Rationale**:
- Single codebase for all platforms
- No app store submission (instant access via URL)
- Installable on home screen
- Service worker enables offline mode

### 6.2 Third-Party Service Integration

#### Google Cloud Setup
```typescript
// frontend/src/services/google-cloud.ts
import { SpeechClient } from '@google-cloud/speech';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';

// Backend handles credentials (not exposed to frontend)
// Frontend calls backend API which proxies to Google Cloud
```

#### Weather API Integration
```typescript
// backend/src/services/weather.service.ts
const OPENWEATHER_API = 'https://api.openweathermap.org/data/2.5';

async function getWeather(lat: number, lon: number) {
  // Check Redis cache first
  const cached = await redis.get(`weather:${lat},${lon}`);
  if (cached) return JSON.parse(cached);
  
  // Fetch from API
  const response = await axios.get(`${OPENWEATHER_API}/onecall`, {
    params: { lat, lon, appid: process.env.OPENWEATHER_KEY }
  });
  
  // Cache for 1 hour
  await redis.setex(`weather:${lat},${lon}`, 3600, JSON.stringify(response.data));
  
  return response.data;
}
```

#### Market Data Integration
```typescript
// backend/src/services/market.service.ts
const AGMARKNET_API = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';

async function getMarketPrices(crop: string, state: string) {
  // Check cache
  const cached = await redis.get(`market:${crop}:${state}`);
  if (cached) return JSON.parse(cached);
  
  // Fetch from Agmarknet
  const response = await axios.get(AGMARKNET_API, {
    params: {
      'api-key': process.env.DATA_GOV_KEY,
      format: 'json',
      filters: { commodity: crop, state }
    }
  });
  
  // Cache for 6 hours
  await redis.setex(`market:${crop}:${state}`, 21600, JSON.stringify(response.data));
  
  return response.data;
}
```

### 6.3 Internationalization (i18n) Strategy

#### Translation File Structure
```json
// public/locales/hi/translation.json
{
  "common": {
    "welcome": "स्वागत है",
    "loading": "लोड हो रहा है...",
    "error": "त्रुटि हुई"
  },
  "onboarding": {
    "selectLanguage": "अपनी भाषा चुनें",
    "enterPhone": "अपना फ़ोन नंबर दर्ज करें",
    "farmLocation": "आपका खेत कहाँ स्थित है?"
  },
  "disease": {
    "title": "रोग पहचान",
    "capture": "पत्ती की फ़ोटो लें",
    "analyzing": "विश्लेषण हो रहा है...",
    "confidence": "विश्वास स्तर"
  }
  // ... more translations
}
```

#### Usage in Components
```typescript
// frontend/src/components/HomePage.tsx
import { useTranslation } from 'react-i18next';

function HomePage() {
  const { t, i18n } = useTranslation();
  
  return (
    <div>
      <h1>{t('common.welcome')}</h1>
      <p>{t('home.subtitle')}</p>
    </div>
  );
}
```

### 6.4 Authentication Flow

```
1. User enters phone number
   ↓
2. Backend generates 6-digit OTP, stores in Redis (TTL: 10 min)
   ↓
3. Send OTP via Twilio SMS
   ↓
4. User enters OTP
   ↓
5. Backend validates OTP from Redis
   ↓
6. Generate JWT access token (expires: 1 day)
   ↓
7. Generate refresh token (expires: 30 days), store in MongoDB
   ↓
8. Return both tokens to frontend
   ↓
9. Frontend stores tokens in localStorage
   ↓
10. Include access token in Authorization header for all API calls
```

**JWT Payload**:
```typescript
{
  userId: string;
  phoneNumber: string;
  language: string;
  iat: number;
  exp: number;
}
```

### 6.5 Error Handling Strategy

#### Frontend Error Handling
```typescript
// Axios interceptor
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      authStore.logout();
      navigate('/login');
    } else if (error.response?.status === 429) {
      toast.error(t('errors.rateLimitExceeded'));
    } else {
      toast.error(t('errors.generic'));
    }
    return Promise.reject(error);
  }
);
```

#### Backend Error Handling
```typescript
// middleware/errorHandler.middleware.ts
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  logger.error(err);
  
  if (err instanceof ValidationError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.details
    });
  }
  
  if (err instanceof AuthenticationError) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Generic error
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
}
```

---

## 7. Delivery Phases

### Phase 1: Foundation (Hours 1-12)

#### Deliverables
- [x] Project scaffolding (Vite + Express + FastAPI)
- [x] MongoDB Atlas cluster setup
- [x] Redis Cloud instance setup
- [x] Basic frontend layout (header, navigation, mobile-first)
- [x] Authentication API (OTP send/verify)
- [x] JWT middleware
- [x] User model and CRUD
- [x] Deployment setup (Vercel + Railway)

#### Verification
```bash
# Backend health check
curl https://api.farmly-ai.vercel.app/health
# Expected: { "status": "ok", "timestamp": "..." }

# Frontend loads
open https://farmly-ai.vercel.app
# Expected: Language selection screen

# Auth flow works
# 1. Enter phone number
# 2. Receive OTP SMS
# 3. Verify OTP
# 4. See home page
```

### Phase 2: Core Features (Hours 13-24)

#### Deliverables
- [x] Voice interface (Google Cloud STT/TTS integration)
- [x] Disease detection backend (FastAPI + PyTorch model)
- [x] Disease detection frontend (camera, upload, results)
- [x] Weather API integration
- [x] Market prices API integration
- [x] Basic advisory logic (rule-based)
- [x] Onboarding flow (farm profile)

#### Verification
```bash
# Disease detection test
curl -X POST https://ml.farmly-ai.railway.app/ml/detect-disease \
  -H "Content-Type: application/json" \
  -d '{"image_base64": "..."}'
# Expected: { "predictions": [...], "inference_time_ms": <500 }

# Voice query test (manual)
# 1. Tap microphone
# 2. Speak "tomato price today" in Hindi
# 3. See text transcription
# 4. Hear audio response
# 5. See market prices displayed

# Market prices API
curl https://api.farmly-ai.vercel.app/api/market/prices?crop=tomato&language=hi \
  -H "Authorization: Bearer <token>"
# Expected: { "markets": [...], "priceAnalysis": {...} }
```

### Phase 3: Localization & Polish (Hours 25-36)

#### Deliverables
- [x] Complete UI translations for all 6 languages
- [x] Government schemes database (seeded with 20 schemes)
- [x] Scheme matching algorithm
- [x] Query history feature
- [x] Profile page
- [x] Loading states, error handling, empty states
- [x] Mobile responsive testing (3+ devices)
- [x] PWA manifest and service worker

#### Verification
```bash
# Translation completeness check
pnpm run i18n:check
# Expected: All keys present in all 6 language files

# Scheme matching test
curl https://api.farmly-ai.vercel.app/api/schemes/match?language=ta \
  -H "Authorization: Bearer <token>"
# Expected: { "eligibleSchemes": [...], "totalSchemes": 20 }

# PWA test
# 1. Open app in Chrome mobile
# 2. Install to home screen
# 3. Enable airplane mode
# 4. Open app
# 5. Disease detection should work offline (stretch goal)
```

### Phase 4: Demo Prep & Testing (Hours 37-48)

#### Deliverables
- [x] Create 5 test user accounts (one per language)
- [x] Seed realistic data (queries, detections, history)
- [x] End-to-end testing in all 6 languages
- [x] Performance optimization (lazy loading, code splitting)
- [x] Bug fixes from testing
- [x] Demo script (2-minute walkthrough)
- [x] Architecture diagram
- [x] README with setup instructions
- [x] Pitch deck (optional)

#### Verification
```bash
# Lighthouse audit
pnpm run lighthouse
# Targets:
# - Performance: >80
# - Accessibility: >90
# - Best Practices: >90
# - SEO: >90
# - PWA: 100

# Load test (optional)
artillery run load-test.yml
# Target: API p95 response time <2s

# Demo rehearsal
# 1. Show language selection (Tamil)
# 2. Complete onboarding in Tamil
# 3. Voice query: "தக்காளி விலை" (tomato price)
# 4. Disease detection with sample image
# 5. Show personalized recommendations
# 6. Browse government schemes
# Time: <2 minutes
```

---

## 8. Verification Approach

### 8.1 Linting & Type Checking

#### Frontend
```json
// package.json scripts
{
  "lint": "eslint src --ext .ts,.tsx",
  "lint:fix": "eslint src --ext .ts,.tsx --fix",
  "typecheck": "tsc --noEmit",
  "format": "prettier --write \"src/**/*.{ts,tsx,json,css}\""
}
```

Run before every commit:
```bash
cd frontend
pnpm run lint
pnpm run typecheck
```

#### Backend
```json
{
  "lint": "eslint src --ext .ts",
  "lint:fix": "eslint src --ext .ts --fix",
  "typecheck": "tsc --noEmit"
}
```

### 8.2 Testing Strategy (MVP Scope)

#### Manual Testing Checklist

**Authentication Flow**
- [ ] OTP sent to phone number
- [ ] OTP verification succeeds
- [ ] Invalid OTP rejected
- [ ] Expired OTP rejected
- [ ] JWT token received and stored
- [ ] Protected routes require authentication

**Voice Interface**
- [ ] Hindi: Voice recorded and transcribed correctly
- [ ] Tamil: Voice recognized (agricultural terms)
- [ ] Audio response plays back
- [ ] Fallback to text input works
- [ ] Multiple queries in same session

**Disease Detection**
- [ ] Camera capture works on mobile
- [ ] Upload from gallery works
- [ ] Disease detected with >90% confidence
- [ ] Results displayed in user's language
- [ ] Treatment recommendations shown
- [ ] Results saved to history

**Advisory System**
- [ ] Recommendations vary by crop
- [ ] Recommendations vary by location (weather)
- [ ] Recommendations vary by season
- [ ] Weather data displays correctly

**Market Prices**
- [ ] Prices fetched from Agmarknet API
- [ ] Nearest markets shown first (by distance)
- [ ] Price trends displayed
- [ ] Chart renders correctly

**Government Schemes**
- [ ] Eligible schemes matched to user profile
- [ ] Schemes displayed in user's language
- [ ] Application steps clear and actionable

**Multilingual**
- [ ] All 6 languages render correctly
- [ ] No missing translations (empty keys)
- [ ] Language switcher works
- [ ] Language persists across sessions

**Mobile Responsive**
- [ ] Works on iOS Safari
- [ ] Works on Android Chrome
- [ ] Touch targets >44px
- [ ] No horizontal scroll
- [ ] Camera works on all devices

**PWA**
- [ ] Installable on home screen
- [ ] Offline page shows when no network
- [ ] Service worker caches assets

### 8.3 Performance Targets

| Metric | Target | How to Verify |
|--------|--------|---------------|
| First Contentful Paint | <2s | Lighthouse |
| Time to Interactive | <3.5s | Lighthouse |
| API Response Time (p95) | <2s | Network tab / Backend logs |
| Disease Detection | <2s | ML API response time |
| Voice Transcription | <3s | End-to-end timing |
| Bundle Size (Frontend) | <500KB gzipped | `pnpm run build` output |
| Lighthouse Performance | >80 | `pnpm run lighthouse` |

### 8.4 Pre-Demo Checklist

**48 Hours Before Demo**
- [ ] All features deployed to production URLs
- [ ] SSL certificates valid
- [ ] Environment variables set correctly
- [ ] Database seeded with test data
- [ ] API keys have sufficient quota

**24 Hours Before Demo**
- [ ] End-to-end demo rehearsal (record video backup)
- [ ] Test on 3+ mobile devices
- [ ] Test in low network conditions (slow 3G)
- [ ] Prepare 5 demo user accounts
- [ ] Print QR code for app URL

**1 Hour Before Demo**
- [ ] Verify app loads on demo device
- [ ] Check API health endpoints
- [ ] Clear browser cache on demo device
- [ ] Charge demo device to 100%
- [ ] Have backup demo video ready

---

## 9. Risks & Mitigation

### 9.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Google Cloud API quota exceeded | Medium | High | Implement aggressive caching, use free tier wisely, have demo mode with pre-recorded audio |
| ML model inference too slow | Low | High | Optimize model (quantization), use GPU on Railway, have loading animation |
| Agmarknet API down during demo | Medium | Medium | Cache last fetched data, have fallback mock data |
| Camera not working on judge's phone | Low | High | Have pre-captured images ready, test on multiple devices |
| Translation quality poor | Medium | Medium | Get native speaker review, use professional translation service |
| OTP delivery fails | Medium | High | Use Twilio (more reliable), have demo bypass code |

### 9.2 Timeline Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Translation takes too long | High | Medium | Use Google Translate API for initial pass, manually fix critical strings |
| ML model training delayed | Low | Low | Use pre-trained model from Hugging Face/TensorFlow Hub |
| Debugging takes 6+ hours | Medium | High | Use Sentry for error tracking, extensive logging, test incrementally |
| Team member unavailable | Low | High | Clear task ownership, document APIs, use Git branches |

---

## 10. Success Criteria

### 10.1 Functional Completeness
- [x] All 5 MUST HAVE features working end-to-end
- [x] Supports all 6 languages (Hindi, Tamil, Malayalam, Telugu, Kannada, English)
- [x] Mobile responsive and PWA installable
- [x] Authentication working (OTP flow)
- [x] Database persistence working

### 10.2 Demo Readiness
- [x] 2-minute live demo script prepared
- [x] Demo runs smoothly on mobile device
- [x] Handles errors gracefully (no crashes)
- [x] Architecture diagram ready to present
- [x] Metrics ready (accuracy, performance, user count if applicable)

### 10.3 Code Quality
- [x] No TypeScript errors (`pnpm typecheck` passes)
- [x] No linting errors in critical paths
- [x] README with setup instructions
- [x] Environment variables documented
- [x] Git repo clean (no credentials committed)

---

## 11. Post-Hackathon Enhancements (Out of Scope)

These features are **explicitly excluded** from MVP but documented for future reference:

1. **Offline-First Disease Detection**: TensorFlow.js model for client-side inference
2. **WhatsApp Bot Integration**: Query via WhatsApp messages
3. **SMS-Based Queries**: Feature phone support via USSD/SMS
4. **Community Features**: Disease outbreak mapping, farmer forums
5. **Video Tutorials**: Embedded treatment demonstration videos
6. **Price Prediction ML Model**: 7-day price forecasting
7. **Automated Testing**: Unit tests, integration tests, E2E tests (Playwright)
8. **Analytics Dashboard**: User engagement metrics, disease trends
9. **Advanced NLP**: Fine-tuned BERT for better intent recognition
10. **Multi-Crop Field Management**: Track multiple crops on same farm

---

## Document Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | Feb 2026 | Initial technical specification | AI Assistant |

---

**Next Step**: Proceed to Planning phase to break down implementation into concrete tasks.
