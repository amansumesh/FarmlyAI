# Product Requirements Document - Farmly AI (Hackathon MVP)

**Version**: 1.0  
**Date**: February 2026  
**Project Type**: Hackathon Submission (24-48 Hours)  
**Target**: AgriTech + AI/ML Category

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

### Primary Persona: Ramesh Kumar
- **Demographics**: 45 years old, 3 acres in rural Maharashtra
- **Education**: Primary school (5th grade)
- **Digital Literacy**: Uses feature phone, limited smartphone experience
- **Language**: Marathi primary, limited Hindi, no English
- **Pain Points**: Cannot read complex apps, misses disease symptoms early, unaware of schemes
- **Goals**: Increase yield by 20%, reduce losses, get fair market prices

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

**Languages**: Hindi (primary), English (fallback)  
**Success Criteria**: 
- Voice recognition accuracy >90% for agricultural terms
- Query-to-response time <3 seconds

**Technical Notes**:
- Use Web Speech API for browser-native STT
- Google Cloud Speech API as fallback
- Text-to-Speech via Web Speech API or Google TTS

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
2. Language selection screen (Hindi/English with icons)
3. Audio introduction: "Welcome to Farmly AI..."
4. Phone number + OTP verification
5. Voice-guided farm profile setup:
   - "Where is your farm located?" (capture GPS or manual entry)
   - "What crop are you growing?" (voice or dropdown)
   - "How much land?" (voice or slider: 1-10 acres)
   - "What is your soil type?" (options: loamy, clay, sandy)
6. Tutorial: "Tap microphone and ask your question"
7. Suggested first query: "What should I do for my tomato crop?"

**Time**: 2-3 minutes

### 4.2 Disease Detection Flow
1. User taps camera icon from home screen
2. Instruction animation shows how to capture affected leaf (close-up, good lighting)
3. User takes photo or uploads from gallery
4. Loading screen: "Analyzing image..." (2-3 seconds)
5. Results display:
   - Disease name in Hindi + English
   - Confidence: 98%
   - Severity: Moderate
6. Treatment recommendations:
   - **Organic**: Neem oil spray (2ml per liter, spray evening)
   - **Chemical**: [Product name] (dosage, safety precautions)
   - **Prevention**: Remove infected leaves, improve ventilation
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

### 8.1 Clarifications Required

**Question 1**: What is the primary demo language?
- **Options**: Hindi only, or Hindi + one regional language (Marathi/Kannada)?
- **Impact**: Development time vs. demo impressiveness
- **Recommendation**: Start with Hindi only, add Marathi if time permits

**Question 2**: Should we use real farmer data for demo or synthetic profiles?
- **Options**: Create realistic synthetic data vs. recruit 1-2 real farmers to test
- **Impact**: Demo authenticity vs. development time
- **Recommendation**: Synthetic data for MVP, real farmer testimonial video (pre-recorded)

**Question 3**: Disease detection - client-side or server-side inference?
- **Options**: TensorFlow.js (works offline) vs. Cloud API (easier integration)
- **Impact**: Offline capability vs. development complexity
- **Recommendation**: Start with cloud API, migrate to TF.js if time permits

### 8.2 Assumptions Made (Proceeding Without User Input)

**Assumption 1**: Using Google Cloud free tier for STT/TTS
- **Rationale**: Best accuracy for Indic languages, 60 min/month free sufficient for demo
- **Alternative**: Web Speech API (inconsistent Indic language support)

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
1. Voice interface (Web Speech API, Hindi STT/TTS)
2. Disease detection (integrate pre-trained model)
3. Weather API integration
4. Basic advisory logic (rule-based)
5. Market price API integration

### Phase 3 (Hours 25-36): Polish & Integration
1. Government schemes database and matching
2. User history/saved queries
3. UI polish (loading states, error handling)
4. Mobile testing and fixes
5. Performance optimization

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

### Profile 2: Lakshmi Devi
- **Location**: Bangalore Rural, Karnataka
- **Crop**: Rice (3 acres)
- **Soil**: Clay
- **Language**: Hindi/Kannada
- **Use Case**: Weather advisory, irrigation scheduling

### Profile 3: Suresh Patel
- **Location**: Nashik, Maharashtra
- **Crop**: Onion (2 acres)
- **Soil**: Sandy loam
- **Language**: Marathi/Hindi
- **Use Case**: Government schemes, market intelligence

---

## Appendix B: Sample Voice Queries (Expected to Handle)

1. "Tamatar ke patte pe dabbe dikh rahe hain, kya karun?"  
   _(Spots on tomato leaves, what to do?)_

2. "Aaj ka mandi bhav kya hai?"  
   _(What is today's market price?)_

3. "Sarkar ki koi yojana hai kya?"  
   _(Is there any government scheme?)_

4. "Pani kab dena chahiye?"  
   _(When should I water?)_

5. "Khaad kaunsi daalun?"  
   _(Which fertilizer should I apply?)_

---

## Document History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | Feb 2026 | Initial MVP requirements | AI Assistant |

---

**Next Steps**: Proceed to Technical Specification phase to define implementation architecture based on these requirements.
