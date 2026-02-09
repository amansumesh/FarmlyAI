# Demo Testing Guide

## Quick Start for Testing

Use these pre-configured demo accounts to test the application without setting up SMS or going through full registration.

## Demo Accounts

| Phone Number    | Language   | Region       | Primary Crops          | OTP (Demo Mode) |
|----------------|------------|--------------|------------------------|-----------------|
| +919876543210  | Hindi      | Maharashtra  | Tomato, Onion, Chili   | 123456          |
| +919876543211  | Tamil      | Tamil Nadu   | Rice, Sugarcane, Banana| 123456          |
| +919876543212  | Malayalam  | Kerala       | Coconut, Rice, Banana  | 123456          |
| +919876543213  | Telugu     | Telangana    | Cotton, Maize, Soybean | 123456          |
| +919876543214  | Kannada    | Karnataka    | Groundnut, Tomato, Maize| 123456         |

## Setup Instructions

### 1. Backend Setup

First, seed the demo data:

```bash
cd backend
pnpm run seed:demo
```

### 2. Enable Demo Mode (Optional)

Add to `backend/.env`:

```env
DEMO_MODE=true
```

When enabled:
- Demo accounts use fixed OTP: `123456`
- No SMS sending required (bypasses Twilio)
- Perfect for local development and demos

### 3. Start the Application

```bash
# Terminal 1 - Backend
cd backend
pnpm run dev

# Terminal 2 - Frontend
cd frontend
pnpm run dev
```

## Testing Workflow

### Login Test

1. Open app at `http://localhost:5173`
2. Enter phone: `+919876543210`
3. Click "Send OTP"
4. Enter OTP: `123456` (if DEMO_MODE=true)
5. You should be logged in!

### Feature Testing

Each demo account already has:

✅ **Completed Onboarding**
- Farm profile filled
- Location set
- Crops selected

✅ **Query History**
- 1-3 voice queries in native language
- Market price queries
- Advisory questions
- Scheme queries

✅ **Disease Detection History**
- 1-2 disease detections
- Treatment recommendations
- Sample images (placeholder URLs)

### Language Testing

Test each language by using different accounts:

```javascript
// Hindi Testing
Phone: +919876543210
Expected: All UI text in Hindi (हिंदी)
Test: Voice query "टमाटर की कीमत क्या है?"

// Tamil Testing  
Phone: +919876543211
Expected: All UI text in Tamil (தமிழ்)
Test: Voice query "அரிசி விலை என்ன?"

// Malayalam Testing
Phone: +919876543212
Expected: All UI text in Malayalam (മലയാളം)
Test: Voice query "തെങ്ങിന് എന്ത് രോഗം വരാം?"

// Telugu Testing
Phone: +919876543213
Expected: All UI text in Telugu (తెలుగు)
Test: Voice query "పత్తికి తెగుళ్ళు ఎలా నివారించాలి?"

// Kannada Testing
Phone: +919876543214
Expected: All UI text in Kannada (ಕನ್ನಡ)
Test: Voice query "ಕಡಲೆಕಾಯಿ ಬೆಲೆ ಏನು?"
```

## Verification Commands

Check demo data status:

```bash
cd backend
pnpm run verify:demo
```

Expected output:
```
✓ Found 5 demo users
  - +919876543210 (hi): 3 queries, 1 detections
  - +919876543211 (ta): 2 queries, 1 detections
  - +919876543212 (ml): 1 queries, 1 detections
  - +919876543213 (te): 2 queries, 1 detections
  - +919876543214 (kn): 1 queries, 1 detections

Total demo queries: 9
Total demo disease detections: 5
```

## Resetting Demo Data

If demo data gets corrupted or you want fresh data:

```bash
cd backend
pnpm run seed:demo
```

This will:
1. Delete existing demo data
2. Create fresh demo users
3. Populate query history
4. Add disease detections

## Testing Checklist

### Authentication Flow
- [ ] Login with demo phone number
- [ ] Receive/enter OTP
- [ ] Successfully authenticated
- [ ] Redirected to home page

### Home Page
- [ ] User name displayed correctly
- [ ] Language matches account language
- [ ] Feature cards visible
- [ ] Recent queries shown

### Voice Interface
- [ ] Microphone button works
- [ ] Can record audio
- [ ] Transcription appears
- [ ] Response received
- [ ] Audio response plays

### Disease Detection
- [ ] Camera opens
- [ ] Can capture/upload image
- [ ] Results displayed
- [ ] Confidence score shown
- [ ] Recommendations shown
- [ ] History shows previous detections

### Market Prices
- [ ] Crop selector works
- [ ] Prices displayed for nearby markets
- [ ] Distance calculated correctly
- [ ] Trend chart visible
- [ ] Recommendations shown

### Government Schemes
- [ ] Eligible schemes shown
- [ ] Localized scheme names
- [ ] Benefits listed
- [ ] Application steps clear
- [ ] Documents list shown

### Profile Management
- [ ] User details displayed
- [ ] Can edit farm profile
- [ ] Language switcher works
- [ ] Query history visible
- [ ] Logout works

## Common Issues

### OTP Not Working
**Issue:** OTP `123456` not accepted  
**Solution:** Ensure `DEMO_MODE=true` in backend `.env`

### No Demo Data
**Issue:** Empty history, no detections  
**Solution:** Run `pnpm run seed:demo` from backend folder

### Wrong Language
**Issue:** UI not in expected language  
**Solution:** Each account has fixed language. Hindi=210, Tamil=211, etc.

### Cannot Login
**Issue:** "User not found" error  
**Solution:** Verify backend is running and MongoDB is connected

## Production Note

⚠️ **Important:** Set `DEMO_MODE=false` in production!

Demo mode should only be used for:
- Local development
- Testing
- Hackathon demonstrations
- QA environments

In production, users must receive real OTPs via SMS.

## For Hackathon Judges

To quickly test the app:

1. Use phone: `+919876543210`
2. Enter OTP: `123456`
3. Explore the pre-populated features
4. Try voice queries in Hindi
5. Check disease detection history
6. Browse market prices
7. View eligible government schemes

Everything is pre-configured for instant testing!
