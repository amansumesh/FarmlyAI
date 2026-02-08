# Full SDD workflow

## Configuration
- **Artifacts Path**: {@artifacts_path} → `.zenflow/tasks/{task_id}`

---

## Workflow Steps

### [x] Step: Requirements
<!-- chat-id: f1d25d55-fd69-48be-8802-a8e6ea442cb2 -->

Create a Product Requirements Document (PRD) based on the feature description.

1. Review existing codebase to understand current architecture and patterns
2. Analyze the feature definition and identify unclear aspects
3. Ask the user for clarifications on aspects that significantly impact scope or user experience
4. Make reasonable decisions for minor details based on context and conventions
5. If user can't clarify, make a decision, state the assumption, and continue

Save the PRD to `{@artifacts_path}/requirements.md`.

### [x] Step: Technical Specification

Create a technical specification based on the PRD in `{@artifacts_path}/requirements.md`.

1. Review existing codebase architecture and identify reusable components
2. Define the implementation approach

Save to `{@artifacts_path}/spec.md` with:
- Technical context (language, dependencies)
- Implementation approach referencing existing code patterns
- Source code structure changes
- Data model / API / interface changes
- Delivery phases (incremental, testable milestones)
- Verification approach using project lint/test commands

### [x] Step: Planning
<!-- chat-id: 85db538a-76e4-494d-a3d7-f1487d74c235 -->

Create a detailed implementation plan based on `{@artifacts_path}/spec.md`.

1. Break down the work into concrete tasks
2. Each task should reference relevant contracts and include verification steps
3. Replace the Implementation step below with the planned tasks

Rule of thumb for step size: each step should represent a coherent unit of work (e.g., implement a component, add an API endpoint). Avoid steps that are too granular (single function) or too broad (entire feature).

Important: unit tests must be part of each implementation task, not separate tasks. Each task should implement the code and its tests together, if relevant.

If the feature is trivial and doesn't warrant full specification, update this workflow to remove unnecessary steps and explain the reasoning to the user.

Save to `{@artifacts_path}/plan.md`.

---

## Implementation Plan

The following steps break down the Farmly AI MVP implementation based on the 4 delivery phases outlined in `spec.md`. Each step is designed to be a coherent unit of work with clear verification criteria.

### [x] Step: Project Foundation Setup
<!-- chat-id: e6491e33-bf59-415e-904f-10e9a44a8a77 -->

**Objective**: Initialize the monorepo project structure with all necessary tooling and configurations.

**Tasks**:
- Initialize monorepo with pnpm workspaces
- Setup frontend (React + Vite + TypeScript + Tailwind)
- Setup backend (Express + TypeScript)
- Setup ML service (FastAPI + Python)
- Configure ESLint, Prettier, and TypeScript strict mode
- Create `.gitignore` with node_modules, dist, build, .env, etc.
- Create environment variable templates (`.env.example`)
- Setup basic folder structure per `spec.md` Section 5

**Verification**:
```bash
pnpm install
cd frontend && pnpm run dev  # Should start dev server
cd backend && pnpm run dev   # Should start API server
cd ml-service && python -m uvicorn app.main:app --reload  # Should start ML API
pnpm run typecheck  # Should pass with no errors
pnpm run lint       # Should pass with no errors
```

**References**: spec.md Section 5 (Source Code Structure), Section 1.2 (Tech Stack)

---

### [x] Step: Database and Cloud Services Setup
<!-- chat-id: 0be9556f-f0c4-4d96-bdcf-9a191506d324 -->

**Objective**: Configure MongoDB Atlas, Redis Cloud, and deployment platforms.

**Tasks**:
- Create MongoDB Atlas M0 free cluster
- Create database `farmly_ai` with collections: `users`, `queries`, `diseaseDetections`, `schemes`
- Setup geospatial index on `users.farmProfile.location`
- Create Redis Cloud free instance (30MB)
- Setup Vercel project for frontend and backend API
- Setup Railway.app/Render.com project for ML service
- Configure environment variables in deployment platforms
- Test database connections from backend

**Verification**:
```bash
# Test MongoDB connection
node backend/src/utils/db.ts
# Expected: "MongoDB connected successfully"

# Test Redis connection
node backend/src/utils/redis.ts
# Expected: "Redis connected successfully"

# Test health endpoints after deployment
curl https://api.farmly-ai.vercel.app/health
curl https://ml.farmly-ai.railway.app/health
```

**References**: spec.md Section 1.2 (Database), Section 3.1 (MongoDB Collections), Section 3.2 (Redis Cache)

---

### [x] Step: Authentication System
<!-- chat-id: 0a9b9e6c-be35-45f5-8c9c-ea5a5fc3105c -->

**Objective**: Implement OTP-based authentication with JWT tokens.

**Tasks**:
- **Backend**: Create User model (`backend/src/models/user.model.ts`) per spec.md Section 3.1
- **Backend**: Implement OTP service with Twilio (`backend/src/services/otp.service.ts`)
- **Backend**: Implement JWT service for token generation and validation (`backend/src/services/jwt.service.ts`)
- **Backend**: Create auth middleware (`backend/src/middleware/auth.middleware.ts`)
- **Backend**: Implement auth routes and controller:
  - `POST /api/auth/send-otp` (spec.md Section 4.1)
  - `POST /api/auth/verify-otp` (spec.md Section 4.1)
- **Backend**: Store OTP in Redis with 10-minute TTL
- **Frontend**: Create auth store with Zustand (`frontend/src/store/authStore.ts`)
- **Frontend**: Create auth service (`frontend/src/services/auth.service.ts`)
- **Frontend**: Build OTP input UI components
- **Frontend**: Implement token storage in localStorage with refresh logic

**Verification**:
```bash
# Manual test flow:
# 1. Open app, enter phone number
# 2. Check phone for OTP SMS
# 3. Enter OTP
# 4. Verify JWT token is stored in localStorage
# 5. Verify protected route requires token

# API test:
curl -X POST https://api.farmly-ai.vercel.app/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+919876543210"}'
# Expected: {"success": true, "message": "OTP sent", "expiresIn": 600}
```

**References**: spec.md Section 4.1 (Auth APIs), Section 6.4 (Auth Flow), Section 3.1 (User Model)

---

### [x] Step: User Onboarding Flow
<!-- chat-id: adae022a-2622-4226-bda4-f25a8af06125 -->

**Objective**: Create onboarding experience for new users to setup their farm profile.

**Tasks**:
- **Backend**: Implement user profile routes:
  - `GET /api/user/profile` (spec.md Section 4.2)
  - `PUT /api/user/profile` (spec.md Section 4.2)
- **Frontend**: Create language selection component (`frontend/src/components/common/LanguageSelector.tsx`)
- **Frontend**: Setup i18next with 6 language files (hi, ta, ml, te, kn, en) - basic translations only
- **Frontend**: Build onboarding page (`frontend/src/pages/OnboardingPage.tsx`):
  - Language selection screen (icon-based)
  - Farm location input (geolocation API + manual entry)
  - Crop selection (multi-select)
  - Land size input
  - Soil type selection
- **Frontend**: Implement geolocation hook (`frontend/src/hooks/useGeolocation.ts`)
- **Frontend**: Create user store (`frontend/src/store/userStore.ts`)

**Verification**:
```bash
# Manual test:
# 1. Complete authentication
# 2. See language selection screen
# 3. Select Hindi
# 4. Complete farm profile form
# 5. Verify data saved to MongoDB
# 6. Verify user.onboardingCompleted = true

# Check MongoDB:
db.users.findOne({"phoneNumber": "+919876543210"})
# Expected: farmProfile populated with location, crops, landSize, soilType
```

**References**: spec.md Section 4.2 (User Profile APIs), Section 3.1 (User Model), Section 6.3 (i18n Strategy)

---

### [x] Step: Disease Detection - ML Backend
<!-- chat-id: 5f130454-093b-4938-8715-ceefbdc10f0c -->

**Objective**: Build and deploy the ML service for crop disease detection.

**Tasks**:
- **ML Service**: Setup FastAPI project structure (`ml-service/app/`)
- **ML Service**: Download pre-trained plant disease model (MobileNetV3 or ResNet from TensorFlow Hub/Hugging Face)
- **ML Service**: Implement disease detector service (`ml-service/app/services/inference.py`)
- **ML Service**: Implement image preprocessing (`ml-service/app/services/preprocessing.py`)
- **ML Service**: Create FastAPI endpoint `POST /ml/detect-disease` (spec.md Section 4.8)
- **ML Service**: Add disease-to-treatment mapping (JSON file with organic/chemical recommendations)
- **ML Service**: Optimize model inference (<2s response time)
- Deploy ML service to Railway.app/Render.com

**Verification**:
```bash
# Test ML API directly:
curl -X POST https://ml.farmly-ai.railway.app/ml/detect-disease \
  -H "Content-Type: application/json" \
  -d '{"image_base64": "<base64_encoded_image>"}'
# Expected: {
#   "predictions": [{
#     "disease": "Tomato Late Blight",
#     "crop": "Tomato",
#     "confidence": 0.96,
#     "severity": "high"
#   }],
#   "inference_time_ms": 420,
#   "model_version": "mobilenetv3_v1"
# }

# Inference time target: <500ms
```

**References**: spec.md Section 4.8 (ML Service API), Section 6.2 (ML Integration), Section 8.3 (Performance Targets)

---

### [x] Step: Disease Detection - API Integration
<!-- chat-id: 6a1f0720-6449-4f6b-8632-be8e77fd2a93 -->

**Objective**: Connect backend API to ML service and implement file upload handling.

**Tasks**:
- **Backend**: Setup Vercel Blob Storage configuration
- **Backend**: Implement storage service (`backend/src/services/storage.service.ts`)
- **Backend**: Implement ML service client (`backend/src/services/ml.service.ts`)
- **Backend**: Create DiseaseDetection model (`backend/src/models/disease.model.ts`) per spec.md Section 3.1
- **Backend**: Implement disease detection controller and routes:
  - `POST /api/disease/detect` (spec.md Section 4.4)
  - Handle multipart/form-data with Multer
  - Upload image to Vercel Blob
  - Forward image to ML service
  - Enrich response with localized disease names and treatments
  - Save detection to MongoDB
- **Backend**: Add rate limiting middleware (max 10 detections per hour per user)

**Verification**:
```bash
# Test via API:
curl -X POST https://api.farmly-ai.vercel.app/api/disease/detect \
  -H "Authorization: Bearer <token>" \
  -F "image=@tomato_leaf.jpg" \
  -F "language=hi"
# Expected: Full disease detection response with localized names

# Check MongoDB:
db.diseaseDetections.find({"userId": ObjectId("<user_id>")})
# Expected: Detection record saved with imageUrl, predictions, recommendations
```

**References**: spec.md Section 4.4 (Disease Detection API), Section 3.1 (DiseaseDetection Model)

---

### [x] Step: Disease Detection - Frontend
<!-- chat-id: ca63e9e5-8baa-4761-b4c3-d45d464e4c55 -->

**Objective**: Build user interface for disease detection with camera capture.

**Tasks**:
- **Frontend**: Create camera capture component (`frontend/src/components/disease/CameraCapture.tsx`)
- **Frontend**: Implement camera hook (`frontend/src/hooks/useCamera.ts`)
- **Frontend**: Create disease result component (`frontend/src/components/disease/DiseaseResult.tsx`)
- **Frontend**: Create treatment card component (`frontend/src/components/disease/TreatmentCard.tsx`)
- **Frontend**: Build disease detection page (`frontend/src/pages/DiseaseDetectionPage.tsx`):
  - Camera capture UI
  - Image upload from gallery
  - Loading state during inference
  - Results display with confidence bar
  - Treatment recommendations (organic, chemical, preventive)
  - Save to history button
- **Frontend**: Create disease service (`frontend/src/services/disease.service.ts`)
- **Frontend**: Add disease detection translations to all 6 language files

**Verification**:
```bash
# Manual test on mobile:
# 1. Navigate to disease detection page
# 2. Tap camera button
# 3. Capture photo of diseased plant leaf
# 4. See loading animation (<2s)
# 5. See disease name in selected language
# 6. See confidence percentage
# 7. See treatment recommendations
# 8. Tap save, verify it appears in history

# Test on 3+ devices (iOS, Android)
# Verify camera permissions handled correctly
```

**References**: spec.md Section 4.4 (Disease Detection API), PRD Section 3.2 (Disease Detection Feature)

---

### [x] Step: Voice Interface - Google Cloud Integration
<!-- chat-id: f57896de-ebfa-4405-8676-a06b8a9ebd9b -->

**Objective**: Integrate Google Cloud Speech-to-Text and Text-to-Speech.

**Tasks**:
- **Backend**: Setup Google Cloud project and enable APIs
- **Backend**: Create Google Cloud service account with STT and TTS permissions
- **Backend**: Implement Google Cloud service (`backend/src/services/google-cloud.service.ts`):
  - Speech-to-Text with Hindi/Tamil/Telugu/Kannada/Malayalam support
  - Text-to-Speech with regional voices
  - Add agricultural vocabulary hints for better recognition
- **Backend**: Implement voice query controller:
  - `POST /api/query/voice` (spec.md Section 4.3)
  - Accept audio file upload
  - Transcribe with Google Cloud STT
  - Process query (intent recognition - simple keyword matching for MVP)
  - Generate text response
  - Synthesize audio with TTS
  - Store query in MongoDB
- **Backend**: Implement basic intent recognition (keyword-based):
  - Price queries → fetch market data
  - Disease queries → suggest using camera
  - Scheme queries → show government schemes
  - General → return helpful message

**Verification**:
```bash
# Test voice API:
curl -X POST https://api.farmly-ai.vercel.app/api/query/voice \
  -H "Authorization: Bearer <token>" \
  -F "audio=@query_hindi.wav" \
  -F "language=hi"
# Expected: {
#   "query": {"transcription": "टमाटर की कीमत", "intent": "price_query"},
#   "response": {"text": "...", "audioUrl": "https://..."},
#   "processingTime": 2800
# }

# Target: <3s end-to-end
```

**References**: spec.md Section 4.3 (Voice Query API), Section 6.2 (Google Cloud Integration)

---

### [x] Step: Voice Interface - Frontend
<!-- chat-id: 1d5bab8e-909f-4c53-9675-195e365a0c2b -->

**Objective**: Build voice input UI with recording and playback.

**Tasks**:
- **Frontend**: Create voice input component (`frontend/src/components/voice/VoiceInput.tsx`):
  - Microphone button with recording animation
  - Audio recording using Web Audio API or MediaRecorder
  - Transcription display for verification
  - Re-record option
- **Frontend**: Create audio player component (`frontend/src/components/voice/AudioPlayer.tsx`)
- **Frontend**: Implement voice hook (`frontend/src/hooks/useVoice.ts`)
- **Frontend**: Create voice service (`frontend/src/services/voice.service.ts`)
- **Frontend**: Integrate voice input on home page
- **Frontend**: Add voice query translations to all language files
- **Frontend**: Handle microphone permissions gracefully

**Verification**:
```bash
# Manual test:
# 1. Open app on mobile
# 2. Tap microphone button
# 3. Grant microphone permission
# 4. Speak in Hindi: "टमाटर की कीमत क्या है?"
# 5. See transcription appear
# 6. See text response
# 7. Hear audio response play automatically
# 8. Tap replay button to hear again

# Test in all 6 languages with native speakers (if possible)
# Verify agricultural terms recognized correctly
```

**References**: spec.md Section 4.3 (Voice Query API), PRD Section 3.1 (Voice Interface)

---

### [x] Step: Weather API Integration
<!-- chat-id: 723195d9-c53e-4bf6-8490-0eeadbc8506d -->

**Objective**: Integrate OpenWeatherMap API with caching.

**Tasks**:
- **Backend**: Create weather service (`backend/src/services/weather.service.ts`):
  - Integrate OpenWeatherMap API (free tier)
  - Fetch current weather and 7-day forecast
  - Implement Redis caching (TTL: 1 hour) per spec.md Section 3.2
  - Handle geolocation from user profile
- **Backend**: Create weather endpoint:
  - `GET /api/weather/forecast` (spec.md Section 4.8)
  - Return current conditions and forecast
- **Frontend**: Create weather display component
- **Frontend**: Add weather translations

**Verification**:
```bash
# Test weather API:
curl https://api.farmly-ai.vercel.app/api/weather/forecast \
  -H "Authorization: Bearer <token>"
# Expected: {
#   "current": {"temp": 28, "humidity": 65, "description": "Partly cloudy"},
#   "forecast": [...]
# }

# Verify Redis cache:
redis-cli GET "weather:18.5204,73.8567"
# Should return cached data after first call
```

**References**: spec.md Section 6.2 (Weather Integration), Section 3.2 (Redis Cache)

---

### [x] Step: Market Prices - API Integration
<!-- chat-id: ab5f320d-7063-437e-bf26-03b0a916a03a -->

**Objective**: Integrate Agmarknet API and implement price intelligence.

**Tasks**:
- **Backend**: Create market service (`backend/src/services/market.service.ts`):
  - Integrate Agmarknet API (data.gov.in)
  - Fetch market prices by crop and location
  - Calculate distance from user location to markets
  - Implement Redis caching (TTL: 6 hours)
  - Calculate price trends (compare last 7 days)
  - Generate recommendations (sell now vs. hold)
- **Backend**: Implement market routes:
  - `GET /api/market/prices` (spec.md Section 4.6)
  - Return nearest 5 markets sorted by distance
  - Include price analysis and trends
- **Backend**: Add fallback mock data in case API is down

**Verification**:
```bash
# Test market API:
curl "https://api.farmly-ai.vercel.app/api/market/prices?crop=tomato&language=hi" \
  -H "Authorization: Bearer <token>"
# Expected: {
#   "markets": [
#     {"name": "Pune Mandi", "distance": 12, "price": 25, "trend": "up"},
#     ...
#   ],
#   "priceAnalysis": {
#     "average": 23,
#     "trend": "rising",
#     "recommendation": "अच्छा समय है बेचने के लिए"
#   }
# }

# Verify cache works
# Second call should be faster (<100ms)
```

**References**: spec.md Section 4.6 (Market API), Section 6.2 (Market Integration)

---

### [x] Step: Market Prices - Frontend
<!-- chat-id: 5d8b6d07-5776-4750-a99e-8ab3116ef6d0 -->

**Objective**: Build market prices UI with charts and recommendations.

**Tasks**:
- **Frontend**: Create price card component (`frontend/src/components/market/PriceCard.tsx`)
- **Frontend**: Create price chart component using Chart.js or Recharts (`frontend/src/components/market/PriceChart.tsx`)
- **Frontend**: Build market page (`frontend/src/pages/MarketPage.tsx`):
  - Crop selection dropdown
  - Market list with distance sorting
  - Price comparison table
  - Trend chart (last 30 days)
  - AI recommendation card
- **Frontend**: Create market service (`frontend/src/services/market.service.ts`)
- **Frontend**: Add market translations to all 6 language files

**Verification**:
```bash
# Manual test:
# 1. Navigate to market page
# 2. Select crop (tomato)
# 3. See nearest markets with prices
# 4. See price trend chart
# 5. See recommendation to sell or hold
# 6. Verify prices in local currency format
# 7. Change language, verify all text translated
```

**References**: spec.md Section 4.6 (Market API), PRD Section 3.4 (Market Intelligence)

---

### [x] Step: Advisory Recommendations System
<!-- chat-id: 554ffd04-8ec1-4eaa-aa9e-18b102a4e22c -->

**Objective**: Implement personalized farm advisory with rule-based logic.

**Tasks**:
- **Backend**: Create advisory service (`backend/src/services/advisory.service.ts`):
  - Implement rule-based recommendation engine
  - Consider: crop type, location, weather, soil type, current season
  - Generate recommendations for: irrigation, fertilizer, pest prevention, harvest timing
  - Prioritize recommendations (high/medium/low)
  - Include actionBy dates
- **Backend**: Implement advisory route:
  - `GET /api/advisory/recommendations` (spec.md Section 4.5)
  - Return personalized recommendations based on user profile
  - Include weather forecast in response
- **Frontend**: Create recommendation card component (`frontend/src/components/advisory/RecommendationCard.tsx`)
- **Frontend**: Build advisory page (`frontend/src/pages/AdvisoryPage.tsx`)
- **Frontend**: Create advisory service (`frontend/src/services/advisory.service.ts`)
- **Frontend**: Add advisory translations

**Verification**:
```bash
# Test advisory API:
curl "https://api.farmly-ai.vercel.app/api/advisory/recommendations?language=hi" \
  -H "Authorization: Bearer <token>"
# Expected: {
#   "recommendations": [
#     {
#       "type": "irrigation",
#       "title": "सिंचाई की आवश्यकता",
#       "description": "...",
#       "priority": "high",
#       "actionBy": "2026-02-10"
#     },
#     ...
#   ],
#   "weather": {...}
# }

# Manual test:
# 1. Create 2 users with different crops (tomato vs wheat)
# 2. Verify recommendations differ based on crop
# 3. Verify recommendations include weather context
```

**References**: spec.md Section 4.5 (Advisory API), PRD Section 3.3 (Personalized Advisory)

---

### [x] Step: Government Schemes System
<!-- chat-id: 7d017aba-b967-4ec4-b624-65b13ce9f04e -->

**Objective**: Build government scheme database and matching system.

**Tasks**:
- **Backend**: Create Scheme model (`backend/src/models/scheme.model.ts`) per spec.md Section 3.1
- **Backend**: Create seed script (`backend/scripts/seed-schemes.ts`):
  - Add 20 major schemes (PM-KISAN, Fasal Bima, KCC, etc.)
  - Include translations for all 6 languages
  - Define eligibility criteria
  - Add application process steps
- **Backend**: Implement scheme matching service:
  - Compare user profile against eligibility criteria
  - Calculate match percentage
  - Sort by relevance
- **Backend**: Implement schemes route:
  - `GET /api/schemes/match` (spec.md Section 4.7)
  - Return eligible schemes for user
- **Backend**: Run seed script to populate database
- **Frontend**: Create scheme card component (`frontend/src/components/schemes/SchemeCard.tsx`)
- **Frontend**: Build schemes page (`frontend/src/pages/SchemesPage.tsx`)
- **Frontend**: Create schemes service (`frontend/src/services/schemes.service.ts`)
- **Frontend**: Add schemes translations

**Verification**:
```bash
# Seed database:
cd backend && pnpm run seed:schemes
# Expected: "20 schemes inserted successfully"

# Test schemes API:
curl "https://api.farmly-ai.vercel.app/api/schemes/match?language=ta" \
  -H "Authorization: Bearer <token>"
# Expected: {
#   "eligibleSchemes": [
#     {
#       "name": "பிரதான் மந்திரி கிசான் சம்மன் நிதி",
#       "description": "...",
#       "benefits": ["₹6,000 per year"],
#       "eligibilityMatch": 100
#     },
#     ...
#   ],
#   "totalSchemes": 8
# }

# Manual test:
# 1. Create users with different land sizes (2 acres vs 10 acres)
# 2. Verify different schemes matched based on eligibility
```

**References**: spec.md Section 4.7 (Schemes API), Section 3.1 (Scheme Model), PRD Section 3.5 (Government Schemes)

---

### [x] Step: Home Page and Navigation
<!-- chat-id: daccd742-fe7f-4de5-8dc2-12cbd47f678d -->

**Objective**: Build main home page with navigation to all features.

**Tasks**:
- **Frontend**: Create home page (`frontend/src/pages/HomePage.tsx`):
  - Welcome message with user name
  - Voice input button (prominent)
  - Feature cards: Disease Detection, Advisory, Market Prices, Schemes
  - Recent queries/history section
  - Weather widget
- **Frontend**: Implement routing with React Router:
  - `/` - Landing page
  - `/onboarding` - Onboarding flow
  - `/home` - Main home page (after login)
  - `/disease` - Disease detection
  - `/advisory` - Farm advisory
  - `/market` - Market prices
  - `/schemes` - Government schemes
  - `/profile` - User profile
- **Frontend**: Create navigation header component
- **Frontend**: Create bottom navigation for mobile
- **Frontend**: Add protected route wrapper (requires auth)

**Verification**:
```bash
# Manual test:
# 1. Complete login and onboarding
# 2. See home page with all feature cards
# 3. Tap each feature card, verify navigation works
# 4. Use browser back button, verify navigation history
# 5. Tap profile icon, see user details
# 6. Test on mobile, verify bottom navigation works
```

**References**: spec.md Section 5 (Source Code Structure - pages)

---

### [x] Step: Profile and History Management

**Objective**: Build user profile page and query history.

**Tasks**:
- **Backend**: Implement query history endpoint:
  - `GET /api/query/history` - Return user's past queries with pagination
- **Backend**: Update query service to save all queries to MongoDB
- **Frontend**: Build profile page (`frontend/src/pages/ProfilePage.tsx`):
  - Display user information
  - Edit farm profile button
  - Language switcher
  - Logout button
- **Frontend**: Create query history list component
- **Frontend**: Add query history section to home page
- **Frontend**: Implement edit profile modal
- **Frontend**: Add profile translations

**Verification**:
```bash
# Manual test:
# 1. Make several queries (voice, disease detection)
# 2. Navigate to profile page
# 3. See user details (phone, language, farm info)
# 4. Tap edit, update crop selection
# 5. Save and verify update in MongoDB
# 6. See query history with timestamps
# 7. Change language, verify app language updates
# 8. Logout, verify redirected to login
```

**References**: spec.md Section 4.2 (User Profile API)

---

### [x] Step: Complete i18n Translations
<!-- chat-id: ff240a1e-ca60-4ee6-9d90-14eb17cec466 -->

**Objective**: Complete all translations for 6 languages.

**Tasks**:
- **Frontend**: Complete translation files for all languages (hi, ta, ml, te, kn, en):
  - Common strings (buttons, labels, errors)
  - Onboarding flow
  - Disease detection
  - Advisory system
  - Market prices
  - Government schemes
  - Profile and settings
- Use Google Translate API for initial translations, then manual review
- Create translation completeness check script
- Test all pages in all 6 languages

**Verification**:
```bash
# Run translation check:
cd frontend && pnpm run i18n:check
# Expected: "All translation keys present in all 6 languages"

# Manual test:
# 1. Switch to each language (hi, ta, ml, te, kn, en)
# 2. Navigate through all pages
# 3. Verify no English text appears (except proper nouns)
# 4. Verify text doesn't overflow containers
# 5. Verify right-to-left scripts render correctly (if applicable)
```

**References**: spec.md Section 6.3 (i18n Strategy), Section 8.2 (Multilingual Testing)

---

### [x] Step: PWA Configuration and Offline Support
<!-- chat-id: 71422ab4-c9a0-4bfc-8712-16261d93d8a4 -->

**Objective**: Configure Progressive Web App features and offline capabilities.

**Tasks**:
- **Frontend**: Configure Vite PWA plugin in `vite.config.ts`
- **Frontend**: Create PWA manifest (`public/manifest.json`):
  - App name, description, icons
  - Theme colors
  - Start URL
  - Display mode: standalone
- **Frontend**: Generate app icons (512x512, 192x192, etc.)
- **Frontend**: Configure Workbox service worker:
  - Cache static assets (JS, CSS, images)
  - Cache API responses (market prices, weather) with stale-while-revalidate
  - Network-first for user data
  - Offline fallback page
- **Frontend**: Add "Install App" prompt
- **Frontend**: Test offline functionality

**Verification**:
```bash
# Build and test PWA:
cd frontend && pnpm run build && pnpm run preview

# Chrome DevTools > Application:
# 1. Check Manifest - all fields populated
# 2. Check Service Worker - registered and activated
# 3. Check Cache Storage - assets cached
# 4. Install app to desktop/home screen
# 5. Enable offline mode
# 6. Verify cached pages still load
# 7. Verify offline banner shows

# Lighthouse PWA score:
pnpm run lighthouse
# Target: PWA score = 100
```

**References**: spec.md Section 6.5 (PWA), Section 8.3 (Performance Targets)

---

### [x] Step: Error Handling and Loading States
<!-- chat-id: aad0716f-0ac0-4bc6-b4fb-1455e8c1e862 -->

**Objective**: Implement comprehensive error handling and loading states.

**Tasks**:
- **Backend**: Implement error handling middleware (`backend/src/middleware/errorHandler.middleware.ts`)
- **Backend**: Add structured logging with winston or pino
- **Backend**: Implement rate limiting middleware (express-rate-limit)
- **Frontend**: Create error boundary component
- **Frontend**: Create loading spinner component (`frontend/src/components/common/LoadingSpinner.tsx`)
- **Frontend**: Create toast notification system (react-hot-toast or sonner)
- **Frontend**: Add loading states to all async operations
- **Frontend**: Add error states to all API calls
- **Frontend**: Create empty state components (no data)
- **Frontend**: Implement Axios interceptors for global error handling

**Verification**:
```bash
# Manual test error scenarios:
# 1. Turn off WiFi, try to load market prices → see offline error
# 2. Invalid token → redirected to login
# 3. Upload invalid image → see validation error
# 4. Rate limit exceeded → see rate limit message
# 5. Server error → see generic error message
# 6. Slow 3G → see loading spinners appropriately

# Test empty states:
# 1. New user with no history → see "No queries yet" empty state
# 2. Crop with no market data → see "No prices available" message
```

**References**: spec.md Section 6.5 (Error Handling)

---

### [x] Step: Mobile Responsive Testing and Polish
<!-- chat-id: 12ed7c86-36fe-49b7-9760-ca66de426867 -->

**Objective**: Ensure excellent mobile experience and UI polish.

**Tasks**:
- **Frontend**: Test on iOS Safari, Android Chrome, and mobile Firefox
- **Frontend**: Verify all touch targets ≥44px
- **Frontend**: Verify no horizontal scrolling
- **Frontend**: Test camera functionality on all devices
- **Frontend**: Test microphone functionality on all devices
- **Frontend**: Optimize images (WebP format, lazy loading)
- **Frontend**: Implement code splitting for route-based chunks
- **Frontend**: Add loading skeletons for better perceived performance
- **Frontend**: Polish animations and transitions
- **Frontend**: Ensure consistent spacing and typography
- **Frontend**: Test with slow 3G throttling

**Verification**:
```bash
# Lighthouse mobile audit:
cd frontend && pnpm run lighthouse:mobile
# Targets:
# - Performance: >80
# - Accessibility: >90
# - Best Practices: >90
# - SEO: >90

# Manual mobile testing checklist (spec.md Section 8.2):
# - [ ] Works on iOS Safari
# - [ ] Works on Android Chrome
# - [ ] Touch targets >44px
# - [ ] No horizontal scroll
# - [ ] Camera works on all devices
# - [ ] Microphone works on all devices
```

**References**: spec.md Section 8.2 (Mobile Testing), Section 8.3 (Performance Targets)

---

### [ ] Step: Demo Data Seeding and Test Accounts

**Objective**: Prepare demo environment with realistic data.

**Tasks**:
- **Backend**: Create demo data seed script:
  - 5 test user accounts (one per language: hi, ta, ml, te, kn)
  - Populate query history for each user
  - Add disease detection history with sample images
  - Create realistic farm profiles (different crops, locations)
- **Backend**: Create demo mode flag in config (bypass OTP for demo accounts)
- **Backend**: Prepare sample disease images (10-15 common diseases)
- **Backend**: Ensure 20 government schemes are seeded
- **Frontend**: Pre-load sample queries for demo
- Document test account credentials in README

**Verification**:
```bash
# Run seed script:
cd backend && pnpm run seed:demo-data
# Expected: "5 demo users created with history"

# Manual test each demo account:
# 1. Login with demo phone numbers (no OTP required in demo mode)
# 2. Verify query history populated
# 3. Verify disease detection history shows
# 4. Verify each user has different crop/location
# 5. Verify recommendations differ based on profile
```

**References**: spec.md Section 7 (Delivery Phases - Phase 4)

---

### [ ] Step: Performance Optimization

**Objective**: Optimize application performance to meet targets.

**Tasks**:
- **Frontend**: Implement lazy loading for routes
- **Frontend**: Optimize bundle size with code splitting
- **Frontend**: Compress images and use WebP format
- **Frontend**: Implement virtual scrolling for long lists (if applicable)
- **Frontend**: Memoize expensive computations with useMemo/useCallback
- **Backend**: Add database indexes for frequent queries
- **Backend**: Optimize API response payloads (remove unnecessary fields)
- **Backend**: Implement API response compression (gzip)
- **ML Service**: Optimize model inference (quantization if needed)
- Run Lighthouse audits and address issues

**Verification**:
```bash
# Frontend bundle analysis:
cd frontend && pnpm run build
# Check output for bundle sizes
# Target: Main bundle <500KB gzipped

# Lighthouse audit:
pnpm run lighthouse
# Targets (spec.md Section 8.3):
# - First Contentful Paint: <2s
# - Time to Interactive: <3.5s
# - Performance: >80

# API performance test:
# Measure response times for each endpoint
# Target: p95 <2s
curl -w "@curl-format.txt" https://api.farmly-ai.vercel.app/api/market/prices?crop=tomato
```

**References**: spec.md Section 8.3 (Performance Targets)

---

### [ ] Step: Documentation and README

**Objective**: Create comprehensive documentation for judges and future developers.

**Tasks**:
- Create main README.md:
  - Project overview and value proposition
  - Features list
  - Tech stack
  - Architecture diagram (mermaid or image)
  - Setup instructions for local development
  - Environment variables documentation
  - Deployment instructions
  - Demo account credentials
  - Screenshots/GIFs of key features
- Create API documentation (`docs/API.md`)
- Document all environment variables in `.env.example` files
- Create architecture diagram (use mermaid, draw.io, or excalidraw)
- Add code comments for complex logic
- Create troubleshooting guide

**Verification**:
```bash
# Test setup instructions:
# 1. Clone repo on fresh machine
# 2. Follow README instructions exactly
# 3. Verify app runs locally
# 4. Verify all features work

# README should answer:
# - What is Farmly AI?
# - Why is it innovative?
# - How do I run it locally?
# - How do I deploy it?
# - What are the demo credentials?
```

**References**: spec.md Section 10.3 (Code Quality - README requirement)

---

### [ ] Step: End-to-End Testing and Bug Fixes

**Objective**: Perform comprehensive testing and fix all critical bugs.

**Tasks**:
- Test complete user journey in all 6 languages:
  1. Registration and OTP flow
  2. Onboarding with farm profile
  3. Voice query in regional language
  4. Disease detection with camera
  5. View advisory recommendations
  6. Check market prices
  7. Browse government schemes
  8. View query history
  9. Edit profile
  10. Logout and login again
- Test on multiple devices (iOS, Android, different screen sizes)
- Test edge cases (poor network, invalid inputs, expired tokens)
- Fix all critical bugs found
- Create bug tracking list and resolve P0/P1 issues
- Verify all API endpoints work correctly
- Check MongoDB data integrity
- Verify all external APIs (Google Cloud, OpenWeather, Agmarknet) working

**Verification**:
```bash
# Manual testing checklist (spec.md Section 8.2):
# Authentication Flow:
# - [x] OTP sent and received
# - [x] OTP verification works
# - [x] Invalid/expired OTP rejected
# - [x] JWT token stored

# Voice Interface:
# - [x] Hindi voice recognized
# - [x] Tamil voice recognized
# - [x] Audio response plays
# - [x] Multiple queries work

# Disease Detection:
# - [x] Camera works
# - [x] Disease detected >90% confidence
# - [x] Results in user's language
# - [x] Treatments shown

# All other checklists in spec.md Section 8.2

# No critical bugs remaining
# All P0 issues resolved
```

**References**: spec.md Section 8.2 (Testing Strategy), Section 8.4 (Pre-Demo Checklist)

---

### [ ] Step: Demo Preparation and Rehearsal

**Objective**: Prepare and practice the live demo for judges.

**Tasks**:
- Create 2-minute demo script covering:
  1. Problem statement (30 seconds)
  2. Voice query in Hindi (30 seconds)
  3. Disease detection with camera (30 seconds)
  4. Market intelligence and recommendation (20 seconds)
  5. Impact metrics and innovation points (10 seconds)
- Record backup demo video (in case of technical issues)
- Prepare demo device (phone):
  - Charge to 100%
  - Install app on home screen
  - Login with demo account
  - Clear cache and notifications
  - Prepare sample diseased leaf image
- Create slide deck (5-7 slides):
  - Problem and solution
  - Architecture diagram
  - Key features
  - Innovation points
  - Impact metrics
  - Tech stack
  - Future roadmap
- Practice demo 3-5 times
- Prepare answers for common judge questions:
  - How is this different from existing solutions?
  - How do you ensure AI accuracy?
  - What's your go-to-market strategy?
  - How will you scale this?
- Create QR code for app URL
- Test demo flow on presentation screen

**Verification**:
```bash
# Demo rehearsal checklist (spec.md Section 11.8):
# - [ ] Demo runs in <2 minutes
# - [ ] All features work on demo device
# - [ ] Voice recognition works with presenter's voice
# - [ ] Backup video ready
# - [ ] Slide deck finalized
# - [ ] QR code printed/displayed
# - [ ] Judge Q&A answers prepared

# Pre-demo final check (1 hour before):
# - [ ] App loads on demo device
# - [ ] APIs healthy (check /health endpoints)
# - [ ] Demo account works
# - [ ] Phone charged 100%
# - [ ] Backup video accessible
```

**References**: spec.md Section 8.4 (Pre-Demo Checklist), Section 11.6 (Demo Script)

---

### [ ] Step: Final Deployment and Production Readiness

**Objective**: Deploy all services to production and verify everything works.

**Tasks**:
- **Frontend**: Deploy to Vercel production
  - Configure custom domain (if available)
  - Setup environment variables
  - Enable HTTPS
  - Configure caching headers
- **Backend**: Deploy API to Vercel Serverless
  - Configure environment variables
  - Setup CORS properly
  - Enable rate limiting
  - Configure logging (Sentry or LogRocket)
- **ML Service**: Deploy to Railway/Render
  - Configure environment variables
  - Ensure GPU available (if needed)
  - Setup health check endpoint
  - Configure auto-scaling
- **Database**: Verify MongoDB Atlas production cluster
  - Setup database backups
  - Configure IP whitelist (allow Vercel, Railway IPs)
  - Verify indexes created
  - Monitor connection limits
- **Redis**: Verify Redis Cloud production instance
  - Configure proper TTL values
  - Monitor memory usage
- Final smoke test of all features in production
- Setup monitoring and alerts
- Document production URLs

**Verification**:
```bash
# Production health checks:
curl https://farmly-ai.vercel.app/health
# Expected: 200 OK

curl https://api.farmly-ai.vercel.app/health
# Expected: {"status": "ok", "db": "connected", "redis": "connected"}

curl https://ml.farmly-ai.railway.app/health
# Expected: {"status": "ok", "model_loaded": true}

# Full production test:
# 1. Open app on mobile device
# 2. Complete full user journey
# 3. Verify all features work
# 4. Check performance (Lighthouse)
# 5. Monitor error logs (should be zero critical errors)

# Success criteria (spec.md Section 10):
# - [x] All 5 core features working
# - [x] All 6 languages supported
# - [x] Mobile responsive and PWA
# - [x] Authentication working
# - [x] Database persistence working
# - [x] No TypeScript errors
# - [x] README complete
# - [x] Demo ready
```

**References**: spec.md Section 10 (Success Criteria), Section 8.4 (Pre-Demo Checklist)
