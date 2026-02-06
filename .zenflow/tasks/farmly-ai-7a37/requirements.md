# Product Requirements Document - Farmly AI (Hackathon MVP)

**Version**: 1.1  
**Date**: February 2026  
**Project Type**: Hackathon Submission (24-48 Hours)  
**Target**: AgriTech + AI/ML Category

**Document Purpose**: This PRD is an MVP-focused implementation specification derived from the comprehensive Product Requirements Document provided in the task description. It narrows scope to features achievable within a 24-48 hour hackathon timeline while maintaining the core innovation pillars.

---

## 1. Executive Summary

### Problem Statement
Over 85% of Indian farmers lack access to timely agricultural expertise due to:
- Language barriers and low digital literacy
- Delayed crop disease identification (15-20% annual losses)
- Lack of awareness about government schemes and market opportunities
- Limited reach of traditional extension services (<30% coverage)

### Solution Overview
Farmly AI is a **voice-first, multilingual AI agricultural advisory system** designed for farmers with limited digital literacy. The hackathon MVP demonstrates core innovation through:
- Voice interface supporting Indian regional languages
- AI-powered crop disease detection
- Personalized farm recommendations
- Real-time market intelligence
- Government scheme discovery

### Key Innovation Points
1. **Dialect-aware voice interface** - Natural language queries in regional languages
2. **On-device disease detection** - Works offline with 98% accuracy target
3. **Progressive Web App** - Low data usage (5MB/month), offline-first
4. **Farmer-centric UX** - Zero learning curve for illiterate users
5. **Context-aware recommendations** - Personalized by location, soil, weather

---

## 2. Target Users

### Primary Persona: Ramesh Kumar (North/West India)
- **Demographics**: 45 years old, 3 acres in rural Maharashtra
- **Education**: Primary school (5th grade)
- **Digital Literacy**: Uses feature phone, limited smartphone experience
- **Language**: Hindi primary, no English
- **Pain Points**: Cannot read complex apps, misses disease symptoms early, unaware of schemes
- **Goals**: Increase yield by 20%, reduce losses, get fair market prices

### Secondary Persona: Murugan (South India - Tamil Nadu)
- **Demographics**: 38 years old, 4 acres in rural Tamil Nadu
- **Education**: 8th grade
- **Digital Literacy**: Uses smartphone for WhatsApp
- **Language**: Tamil primary, limited English, no Hindi
- **Pain Points**: Existing apps are in Hindi/English, cannot access local crop advice
- **Goals**: Adopt modern farming techniques, connect with local agricultural experts

### Tertiary Persona: Ravi Kumar (South India - Karnataka)
- **Demographics**: 42 years old, 5 acres in Karnataka
- **Education**: 10th grade
- **Digital Literacy**: Comfortable with smartphone apps
- **Language**: Kannada primary, understands Telugu and Tamil, limited Hindi
- **Pain Points**: Market price information not localized, disease detection doesn't work for regional crops
- **Goals**: Maximize profit through better market timing, reduce crop losses

### MVP User Flow Assumption
**Decision**: For the hackathon MVP, we'll design for smartphone users first, with voice as the primary input method to accommodate low literacy. Feature phone support (SMS) is deferred to post-hackathon.

---

## 3. MVP Scope (24-48 Hour Implementation)

### 3.1 MUST HAVE Features (Critical for Demo)

#### Feature 1: Voice-First Multilingual Interface
**Description**: Voice-based interaction for agricultural queries

**Functional Requirements**:
- User taps microphone button to speak query in Hindi/regional language
- System transcribes speech to text and displays for verification
- AI processes query and generates contextual response
- Response is spoken back with option to replay
- Text fallback for manual input

**Languages (Total: 6)**: 
- **Regional**: Hindi, Tamil, Malayalam, Telugu, Kannada (5 languages)
- **Fallback**: English

**Success Criteria**: 
- Voice recognition accuracy >90% for agricultural terms across all 6 supported languages
- Query-to-response time <3 seconds
- Complete UI localization in all 6 languages

**Technical Specification**:
- **STT (Speech-to-Text)**: Google Cloud Speech-to-Text API
  - Supports all 6 languages with agricultural vocabulary
  - Free tier: 60 minutes/month (sufficient for demo)
  - Fallback: Web Speech API for English only (free, unlimited)
- **TTS (Text-to-Speech)**: Google Cloud Text-to-Speech API
  - Regional voices for all 5 Indian languages
  - Free tier: 4 million characters/month (sufficient for demo)
- **Language Selection**: Manual selection during onboarding (6-option screen)
- **NLP Intent Recognition**: Multilingual BERT model or rule-based system with translated patterns

#### Feature 2: AI-Powered Crop Disease Detection
**Description**: Computer vision for instant disease identification via camera

**Functional Requirements**:
- User taps camera icon and captures/uploads image of affected plant
- System processes image and identifies disease
- Display disease name, confidence score, severity level
- Show treatment recommendations (organic first, then chemical)
- Save to user history for tracking

**Supported Crops**: Tomato, Potato, Rice, Wheat, Cotton (5 major crops)  
**Diseases**: 20-25 common diseases across these crops  
**Success Criteria**: Detection accuracy >95%, inference time <2 seconds

**Technical Notes**:
- Use pre-trained MobileNetV3 model from TensorFlow Hub
- Fine-tune on PlantVillage dataset (publicly available)
- Deploy as TensorFlow.js for on-device inference
- Cloud fallback for complex cases

#### Feature 3: Personalized Farm Advisory
**Description**: Context-aware recommendations based on farm profile and weather

**Functional Requirements**:
- User completes farm profile during onboarding (location, crop, land size, soil type)
- System fetches real-time weather for user location
- Provide recommendations on:
  - Crop selection for current season
  - Irrigation scheduling based on weather
  - Fertilizer application timing
  - Pest prevention alerts
- Recommendations update daily based on weather changes

**Data Sources**:
- Weather: OpenWeatherMap API (free tier)
- Soil: Manual user input (government data integration deferred)
- Agricultural knowledge: Rule-based system using ICAR guidelines

**Success Criteria**: Recommendations vary by location and crop, show weather context

#### Feature 4: Market Intelligence
**Description**: Real-time market prices for informed selling decisions

**Functional Requirements**:
- Display current prices for user's crop from nearest mandis
- Show 3-5 nearby markets with price comparison
- Display 7-day price trend chart
- Provide simple sell/hold recommendation

**Data Source**: Agmarknet API (government data)  
**Success Criteria**: Show live prices, update daily

#### Feature 5: Government Scheme Navigator
**Description**: Simplified interface to discover eligible schemes

**Functional Requirements**:
- Show schemes user is eligible for based on profile
- Display scheme benefits in simple language
- Provide application steps and required documents
- Link to official application portals

**Scheme Database**: Static list of top 15-20 central schemes  
**Success Criteria**: Match at least 3 schemes to demo user profiles

### 3.2 SHOULD HAVE Features (If Time Permits)

- **Offline Mode**: Service worker for PWA, cache disease detection model
- **Community Features**: Show nearby disease outbreak alerts
- **Query History**: Save past queries and recommendations
- **WhatsApp Sharing**: Share recommendations via WhatsApp

### 3.3 WON'T HAVE in MVP (Post-Hackathon)

- SMS-based interaction
- Multi-crop field management
- Yield prediction ML model
- Satellite imagery analysis
- Contract farming marketplace
- Video tutorials library
- Extension officer dashboard
- Payment/e-commerce integration

---

## 4. User Journey (Demo Flow)

### 4.1 First-Time User Onboarding
1. User opens app URL on smartphone
2. Language selection screen with visual icons:
   - **हिन्दी** (Hindi)
   - **தமிழ்** (Tamil)
   - **മലയാളം** (Malayalam)
   - **తెలుగు** (Telugu)
   - **ಕನ್ನಡ** (Kannada)
   - **English**
3. Audio introduction in selected language: "Welcome to Farmly AI..." (localized)
4. Phone number + OTP verification
5. Voice-guided farm profile setup (all prompts in selected language):
   - "Where is your farm located?" (capture GPS or manual entry)
   - "What crop are you growing?" (voice or dropdown with regional crop names)
   - "How much land?" (voice or slider: 1-10 acres)
   - "What is your soil type?" (options: loamy, clay, sandy)
6. Tutorial: "Tap microphone and ask your question" (in selected language)
7. Suggested first query in user's language (e.g., Hindi: "What should I do for my tomato crop?", Tamil: "என் தக்காளி பயிருக்கு என்ன செய்ய வேண்டும்?")

**Time**: 2-3 minutes

### 4.2 Disease Detection Flow
1. User taps camera icon from home screen
2. Instruction animation shows how to capture affected leaf (close-up, good lighting)
3. User takes photo or uploads from gallery
4. Loading screen: "Analyzing image..." (2-3 seconds)
5. Results display (in user's selected language + scientific name):
   - Disease name: "தக்காளி இலை சுருள் வைரஸ்" (Tamil) / "Tomato Leaf Curl Virus"
   - Confidence: 98%
   - Severity: Moderate (மிதமான)
6. Treatment recommendations (localized):
   - **Organic**: Neem oil spray (2ml per liter, spray evening) - வேப்ப எண்ணெய்
   - **Chemical**: [Product name] (dosage, safety precautions) - localized
   - **Prevention**: Remove infected leaves, improve ventilation - localized
7. Option to save, share, or ask follow-up question

**Time**: 30-45 seconds

### 4.3 Voice Query Flow
1. User taps microphone on home screen
2. Speaks: "Tamatar ke patte pe dabbe dikh rahe hain, kya karun?"  
   (Translation: "Spots appearing on tomato leaves, what to do?")
3. Transcription displayed: "टमाटर के पत्ते पे दब्बे दिख रहे हैं, क्या करूं?"
4. AI processes and responds (voice + text):
   - "This could be early blight. I recommend taking a photo for accurate diagnosis. You can also spray neem oil solution as a preventive measure."
5. Follow-up suggestions:
   - "Take a photo for diagnosis"
   - "Tell me more about symptoms"
   - "Show me how to make neem spray"

**Time**: 10-15 seconds

### 4.4 Market Price Check Flow
1. User asks: "Tomato price today" (voice or text)
2. System shows:
   - Nearest mandi: Pune APMC - ₹18/kg (12 km away)
   - Other markets: Nashik ₹16/kg, Satara ₹20/kg
   - 7-day trend chart (prices rising)
   - Recommendation: "Hold for 2-3 days - prices expected to rise 10-15%"
3. Option to set price alert

**Time**: 5-10 seconds

### 4.5 Government Scheme Discovery
1. User taps "Schemes" from menu or asks: "What government help is available?"
2. System shows personalized matches:
   - **PM-KISAN**: You're eligible for ₹6,000/year  
     "Submit Aadhaar and land records at nearest Jan Seva Kendra"
   - **Fasal Bima Yojana**: Crop insurance for ₹500 premium  
     "Apply before sowing season through your bank"
   - **Soil Health Card**: Free soil testing  
     "Visit district agriculture office with soil sample"
3. Each scheme shows: Benefits, Eligibility, Documents needed, How to apply

**Time**: 20-30 seconds to scan

---

## 5. Non-Functional Requirements

### 5.1 Performance
- **Page Load**: <3 seconds on 3G connection
- **API Response**: p95 < 2 seconds
- **Disease Detection**: <2 seconds inference time
- **Voice Response**: <3 seconds end-to-end

### 5.2 Accessibility
- **Voice-First**: All core features accessible via voice
- **Visual Design**: High contrast, large touch targets (min 44px)
- **Language**: All UI text in Hindi + English
- **Literacy**: No critical text-only information

### 5.3 Mobile Experience
- **Responsive**: Works on screens 360px+ width
- **Touch Optimized**: All buttons min 44x44px
- **PWA**: Installable on home screen
- **Data Usage**: <2MB initial load, <500KB per session

### 5.4 Reliability
- **Uptime**: 95%+ during demo period (best effort)
- **Error Handling**: Graceful fallbacks for API failures
- **Offline**: Disease detection works without internet (stretch goal)

### 5.5 Security
- **Authentication**: OTP-based phone verification
- **Data Privacy**: No sharing of personal data with third parties
- **API Keys**: Secure storage, not exposed in client code

---

## 6. Technical Constraints & Assumptions

### 6.1 Assumptions
1. **Users have smartphones** with camera and microphone (Android/iOS)
2. **Intermittent internet** is available (3G minimum during usage)
3. **Farmers can speak** one of the supported languages fluently
4. **Demo environment** will have stable internet for judges
5. **Pre-trained models** are sufficient (no time for custom ML training)

### 6.2 Constraints
1. **Timeline**: 24-48 hours total development time
2. **Budget**: Free tiers only (no paid services beyond free limits)
3. **Team Size**: Assume 2-4 developers
4. **Data**: Use publicly available datasets (PlantVillage, Agmarknet)
5. **Infrastructure**: Serverless/PaaS only (no complex DevOps)

### 6.3 Technology Boundaries
- **No custom ML training**: Use pre-trained models only
- **No native apps**: Web-based PWA only
- **No complex backend**: Serverless functions preferred
- **No paid APIs**: Stick to free tiers (Google, OpenWeather, etc.)

---

## 7. Success Metrics (Demo Criteria)

### 7.1 Functionality Demonstration
- [ ] Voice query in Hindi successfully answered
- [ ] Disease detection identifies crop disease from image
- [ ] Recommendations change based on different farm profiles
- [ ] Market prices displayed from live API
- [ ] Government schemes matched to user profile
- [ ] Works on mobile device (not just desktop)

### 7.2 Hackathon Judging Alignment

| Criteria | Target Score | How We Deliver |
|----------|--------------|----------------|
| **Innovation** | 9/10 | Voice-first design, offline ML, regional language support |
| **Impact** | 9/10 | Addresses 300M+ farmers, reduces 15-20% crop losses |
| **Technical Excellence** | 8/10 | ML integration, PWA, microservices architecture |
| **User Experience** | 9/10 | Zero learning curve, voice-first, works for illiterate users |
| **Completeness** | 8/10 | All 5 core features functional end-to-end |
| **Scalability** | 7/10 | Cloud-native, can discuss path to 1M+ users |
| **Market Potential** | 8/10 | Clear B2B2C and B2G revenue models |

### 7.3 Demo Success Indicators
- **Wow Moment**: Disease detection works in <2 seconds with high accuracy
- **Accessibility**: Judge's parents could use it without help
- **Completeness**: End-to-end user journey works live
- **Impact Story**: Show before/after farmer testimonial video
- **Technical Depth**: Architecture diagram + model metrics ready

---

## 8. Open Questions & Decisions Needed

### 8.1 Clarifications Resolved

**Question 1 [RESOLVED]**: What is the primary demo language?
- **User Decision**: Support all 5 major South Indian languages + Hindi + English (6 total)
- **Languages**: Hindi, Tamil, Malayalam, Telugu, Kannada, English
- **Impact**: Increased development effort for translations and TTS/STT integration
- **Implementation**: Use Google Cloud APIs for consistent quality across all languages

**Question 2**: Should we use real farmer data for demo or synthetic profiles?
- **Options**: Create realistic synthetic data vs. recruit 1-2 real farmers to test
- **Impact**: Demo authenticity vs. development time
- **Recommendation**: Synthetic data for MVP, real farmer testimonial video (pre-recorded)

**Question 3 [DECIDED]**: Disease detection - client-side or server-side inference?
- **Decision**: Server-side inference initially, client-side as stretch goal
- **Primary**: Python FastAPI backend with TensorFlow/PyTorch
- **Stretch Goal**: TensorFlow.js for offline capability
- **Rationale**: Server-side is faster to implement and allows larger, more accurate models

### 8.2 Assumptions Made and Decisions

**Decision 1**: Using Google Cloud APIs for Voice (NOT Web Speech API)
- **STT**: Google Cloud Speech-to-Text API for all 6 languages
- **TTS**: Google Cloud Text-to-Speech API for all 6 languages
- **Rationale**: Consistent quality across all Indic languages, free tier sufficient for hackathon demo
- **Cost Control**: 60 min STT + 4M characters TTS free/month
- **Alternative Rejected**: Web Speech API (poor/no support for Tamil, Malayalam, Telugu, Kannada)

**Assumption 2**: Mobile-first responsive design, not separate native app
- **Rationale**: Faster development, cross-platform, PWA meets "works like native" requirement
- **Alternative**: React Native (requires more setup time)

**Assumption 3**: Authentication via phone OTP, not email/password
- **Rationale**: Farmers prefer phone-based, no email literacy required
- **Alternative**: Demo mode without authentication (risky - doesn't show security)

**Assumption 4**: Static scheme database, not live scraping
- **Rationale**: Live scraping is fragile, static data is reliable for demo
- **Alternative**: Manual scheme database with 20 pre-loaded schemes

**Assumption 5**: Agmarknet API for market data
- **Rationale**: Official government data, free, covers all mandis
- **Alternative**: Mock data (less impressive), web scraping (unreliable)

---

## 9. Out of Scope (Explicitly Excluded)

To maintain focus on core MVP, the following are **explicitly excluded** from the hackathon submission:

### Deferred to Post-Hackathon
- SMS-based interaction (feature phone support)
- WhatsApp bot integration
- Multi-language support beyond Hindi+English
- Custom ML model training (using pre-trained only)
- User analytics dashboard
- Payment/e-commerce features
- Community forums/social features
- Video tutorial library (may include 1-2 embedded videos)
- Satellite imagery integration
- IoT sensor integration
- Extension officer admin portal

### Not Applicable to MVP
- Multi-tenancy for enterprise customers
- White-labeling for government clients
- Advanced financial services (loans, insurance underwriting)
- Blockchain-based traceability
- Carbon credit marketplace

---

## 10. Acceptance Criteria

The MVP is considered **COMPLETE** when:

### Functional Completeness
- [ ] All 5 MUST HAVE features are implemented and working
- [ ] User can complete full onboarding flow on mobile device
- [ ] Voice query in Hindi returns accurate response with voice output
- [ ] Disease detection correctly identifies at least 3 different diseases
- [ ] Farm profile affects recommendations (tested with 2 different profiles)
- [ ] Market prices load from live API
- [ ] At least 10 government schemes are in database and matched correctly

### Technical Completeness
- [ ] Application is deployed and accessible via public URL
- [ ] Works on Android and iOS mobile browsers
- [ ] No critical bugs or crashes during demo flow
- [ ] API response times meet performance requirements (<3s)
- [ ] Security: API keys not exposed, basic input validation present

### Demo Readiness
- [ ] Demo script created with 2-minute walkthrough
- [ ] Sample farm profiles created (2-3 personas)
- [ ] Sample disease images prepared (5-6 test cases)
- [ ] Error states handled gracefully (network failure, invalid input)
- [ ] Loading states present (no blank screens during API calls)

### Documentation
- [ ] README with setup instructions exists
- [ ] Architecture diagram created
- [ ] Model performance metrics documented
- [ ] Known limitations listed

---

## 11. Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| API rate limits exceeded during demo | Medium | High | Cache responses, prepare fallback demo data |
| Voice recognition fails for judge's Hindi accent | Medium | High | Always show text transcription, have manual input fallback |
| Disease detection model too large (slow download) | Medium | Medium | Use quantized model (<10MB), progressive loading |
| No time to implement all 5 features | Low | High | Prioritize: Disease detection + Voice first, drop schemes if needed |
| Mobile browser compatibility issues | Low | Medium | Test on 3+ devices early, use polyfills |
| OTP service (Twilio) costs money | Low | Low | Use demo mode bypass for judges, or free Twilio trial |

---

## 12. Development Priorities

### Phase 1 (Hours 1-12): Foundation
1. Project setup (React + Vite, Express, MongoDB Atlas)
2. Basic UI layout (mobile-first, navigation)
3. Authentication (phone OTP or demo mode)
4. Farm profile onboarding flow
5. Deploy to Vercel (continuous deployment setup)

### Phase 2 (Hours 13-24): Core Features
1. Voice interface (Google Cloud Speech API for all 6 languages)
2. Disease detection (integrate pre-trained model via backend API)
3. Weather API integration (OpenWeatherMap)
4. Basic advisory logic (rule-based system)
5. Market price API integration (Agmarknet)

### Phase 3 (Hours 25-36): Localization & Polish
1. Complete UI translations for all 6 languages
2. Government schemes database and matching
3. Test voice interface in all 6 languages
4. UI polish (loading states, error handling, language-specific formatting)
5. Mobile testing on multiple devices and language settings

### Phase 4 (Hours 37-48): Demo Prep
1. Create demo data and test scenarios
2. Record farmer testimonial video (optional)
3. Prepare architecture diagram and metrics
4. Create pitch deck
5. Rehearse demo script (2 min live walkthrough)

---

## Appendix A: Sample User Profiles (For Testing)

### Profile 1: Ramesh Kumar
- **Location**: Pune, Maharashtra
- **Crop**: Tomato (1.5 acres)
- **Soil**: Loamy
- **Language**: Hindi
- **Use Case**: Disease detection, market prices

### Profile 2: Murugan
- **Location**: Coimbatore, Tamil Nadu
- **Crop**: Rice (4 acres)
- **Soil**: Clay
- **Language**: Tamil
- **Use Case**: Disease detection, weather advisory

### Profile 3: Ravi Kumar
- **Location**: Mysore, Karnataka
- **Crop**: Sugarcane (5 acres)
- **Soil**: Red soil
- **Language**: Kannada
- **Use Case**: Market intelligence, government schemes

### Profile 4: Venu Gopal
- **Location**: Wayanad, Kerala
- **Crop**: Pepper (2 acres)
- **Soil**: Laterite
- **Language**: Malayalam
- **Use Case**: Disease detection, organic farming advice

### Profile 5: Rajesh Reddy
- **Location**: Guntur, Andhra Pradesh
- **Crop**: Cotton (6 acres)
- **Soil**: Black cotton soil
- **Language**: Telugu
- **Use Case**: Pest management, market prices

---

## Appendix B: Sample Voice Queries (Expected to Handle)

### Hindi Queries
1. "Tamatar ke patte pe dabbe dikh rahe hain, kya karun?"  
   _(Spots on tomato leaves, what to do?)_

2. "Aaj ka mandi bhav kya hai?"  
   _(What is today's market price?)_

3. "Sarkar ki koi yojana hai kya?"  
   _(Is there any government scheme?)_

### Tamil Queries
4. "தக்காளி இலையில் புள்ளிகள் தெரிகிறது, என்ன செய்வது?"  
   _(Spots appearing on tomato leaves, what to do?)_

5. "இன்றைய சந்தை விலை என்ன?"  
   _(What is today's market price?)_

6. "அரசு திட்டம் ஏதாவது உள்ளதா?"  
   _(Is there any government scheme?)_

### Malayalam Queries
7. "തക്കാളി ഇലയിൽ പാടുകൾ കാണുന്നു, എന്ത് ചെയ്യണം?"  
   _(Spots on tomato leaves, what to do?)_

8. "ഇന്നത്തെ മാർക്കറ്റ് വില എന്താണ്?"  
   _(What is today's market price?)_

9. "എന്തെങ്കിലും സർക്കാർ പദ്ധതി ഉണ്ടോ?"  
   _(Is there any government scheme?)_

### Telugu Queries
10. "టమాటా ఆకులపై మచ్చలు కనిపిస్తున్నాయి, ఏం చేయాలి?"  
    _(Spots on tomato leaves, what to do?)_

11. "ఈరోజు మార్కెట్ ధర ఎంత?"  
    _(What is today's market price?)_

12. "ప్రభుత్వ పథకం ఏదైనా ఉందా?"  
    _(Is there any government scheme?)_

### Kannada Queries
13. "ಟೊಮೇಟೊ ಎಲೆಗಳ ಮೇಲೆ ಕಲೆಗಳು ಕಾಣುತ್ತಿವೆ, ಏನು ಮಾಡಬೇಕು?"  
    _(Spots on tomato leaves, what to do?)_

14. "ಇಂದಿನ ಮಾರುಕಟ್ಟೆ ಬೆಲೆ ಎಷ್ಟು?"  
    _(What is today's market price?)_

15. "ಯಾವುದಾದರೂ ಸರ್ಕಾರಿ ಯೋಜನೆ ಇದೆಯೇ?"  
    _(Is there any government scheme?)_

---

## Document History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | Feb 2026 | Initial MVP requirements | AI Assistant |

---

**Next Steps**: Proceed to Technical Specification phase to define implementation architecture based on these requirements.
