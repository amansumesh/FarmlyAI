# Demo Data Implementation Summary

## What Was Implemented

This document summarizes the demo data seeding and test accounts implementation for the Farmly AI MVP.

## Files Created/Modified

### New Files Created

1. **`src/scripts/seed-demo-data.ts`**
   - Main seed script for demo data
   - Creates 5 demo users (one per language)
   - Populates query history for each user
   - Adds disease detection history
   - Includes realistic agricultural data

2. **`src/scripts/verify-demo-data.ts`**
   - Verification script to check seeded data
   - Counts users, queries, and detections
   - Helps debug seeding issues

3. **`src/scripts/test-demo-auth.ts`**
   - Test script for demo mode authentication
   - Validates fixed OTP functionality

4. **`DEMO_ACCOUNTS.md`**
   - Comprehensive guide for demo accounts
   - Lists all 5 accounts with credentials
   - Usage instructions
   - Notes for hackathon judges

5. **`../frontend/DEMO_TESTING.md`**
   - Frontend testing guide
   - Testing checklist
   - Language testing instructions
   - Common issues and solutions

### Modified Files

1. **`src/config/index.ts`**
   - Added `demo` configuration section
   - Includes demo mode flag
   - Lists demo account phone numbers
   - Specifies fixed OTP for demo accounts

2. **`src/services/otp.service.ts`**
   - Added `isDemoAccount()` method
   - Modified `sendOTP()` to handle demo accounts
   - Returns fixed OTP (123456) for demo accounts when demo mode enabled
   - Bypasses SMS sending for demo accounts

3. **`.env.example`**
   - Added `DEMO_MODE` environment variable
   - Documented usage and purpose

4. **`package.json`**
   - Added `seed:demo` script
   - Added `verify:demo` script

## Demo Accounts Details

### 5 Pre-configured Accounts

| Phone          | Language | State        | Crops                    | Land | Soil     |
|----------------|----------|--------------|--------------------------|------|----------|
| +919876543210  | Hindi    | Maharashtra  | Tomato, Onion, Chili     | 3ac  | Red      |
| +919876543211  | Tamil    | Tamil Nadu   | Rice, Sugarcane, Banana  | 5ac  | Black    |
| +919876543212  | Malayalam| Kerala       | Coconut, Rice, Banana    | 2ac  | Laterite |
| +919876543213  | Telugu   | Telangana    | Cotton, Maize, Soybean   | 7ac  | Clay     |
| +919876543214  | Kannada  | Karnataka    | Groundnut, Tomato, Maize | 4ac  | Loamy    |

### Data Seeded Per Account

- **Onboarding:** Completed
- **Queries:** 1-3 voice queries in native language
- **Disease Detections:** 1-2 with full recommendations
- **Location:** GPS coordinates and address
- **Farm Profile:** Crops, land size, soil type

## Query Examples Seeded

### Hindi (+919876543210)
- "टमाटर की कीमत क्या है?" (Tomato price query)
- "मेरे खेत में पानी कब देना चाहिए?" (Irrigation advice)
- "पीएम किसान योजना के बारे में बताइए" (Scheme query)

### Tamil (+919876543211)
- "அரிசி விலை என்ன?" (Rice price query)
- "கரும்பு பயிருக்கு உரம் எப்போது இட வேண்டும்?" (Fertilizer advice)

### Malayalam (+919876543212)
- "തെങ്ങിന് എന്ത് രോഗം വരാം?" (Disease query)

### Telugu (+919876543213)
- "పత్తికి తెగుళ్ళు ఎలా నివారించాలి?" (Pest prevention)
- "మొక్కజొన్న ధర ఎలా ఉంది?" (Price query)

### Kannada (+919876543214)
- "ಕಡಲೆಕಾಯಿ ಬೆಲೆ ಏನು?" (Groundnut price query)

## Disease Detection Samples

### Diseases Included
1. **Tomato Late Blight** (High severity)
2. **Cotton Leaf Curl Virus** (Critical severity)
3. **Rice Blast** (Moderate severity)

Each detection includes:
- Disease name in English and all 5 languages
- Confidence score (89-96%)
- Severity level
- Organic treatment recommendations
- Chemical treatment recommendations
- Preventive measures

## Demo Mode Configuration

### Environment Variable
```env
DEMO_MODE=true  # Enable for demos/testing
DEMO_MODE=false # Use in production
```

### When Demo Mode is Enabled
- Demo accounts use fixed OTP: `123456`
- No Twilio SMS sending
- OTP logged to console
- Instant authentication for demos

### When Demo Mode is Disabled
- Normal OTP flow
- Real SMS via Twilio
- Rate limiting applies
- Production-like behavior

## Usage Instructions

### Initial Setup
```bash
# 1. Seed demo data
cd backend
pnpm run seed:demo

# 2. Enable demo mode (optional)
echo "DEMO_MODE=true" >> .env

# 3. Start backend
pnpm run dev
```

### Verification
```bash
# Check demo data
pnpm run verify:demo

# Expected output:
# ✓ Found 5 demo users
# Total demo queries: 9
# Total demo disease detections: 5
```

### Testing Login
1. Open frontend app
2. Enter phone: `+919876543210`
3. Request OTP
4. Enter: `123456` (if DEMO_MODE=true)
5. Access pre-populated account

## Benefits for Hackathon

### For Judges
- ✅ Instant access with fixed OTP
- ✅ Pre-populated realistic data
- ✅ No SMS setup required
- ✅ Test all 5 Indian languages
- ✅ See complete user journey

### For Developers
- ✅ Fast iteration without OTP delays
- ✅ Reproducible test data
- ✅ Multi-language testing
- ✅ Reset data anytime
- ✅ No Twilio costs during dev

### For Demo Presentation
- ✅ Zero setup time
- ✅ Predictable data
- ✅ Multiple scenarios ready
- ✅ Professional appearance
- ✅ Fallback if SMS fails

## Technical Implementation Details

### Seed Script Architecture
```typescript
// 1. Clear existing demo data (queries, detections, users)
// 2. Create 5 demo users with farm profiles
// 3. Insert sample queries for each user
// 4. Create disease detections matching user crops
// 5. Log summary with credentials
```

### OTP Service Integration
```typescript
// Check if account is demo account
if (isDemoAccount(phoneNumber) && config.demo.enabled) {
  return fixedOTP; // 123456
}
// Otherwise, generate random OTP and send SMS
```

### Data Relationships
- Each User has: location, crops, soil type
- Each Query links to: userId, has transcription and response
- Each Detection links to: userId, has image and recommendations
- Detections match user's crops for realism

## Seed Data Statistics

### Users
- Total: 5
- States covered: 5 (Maharashtra, Tamil Nadu, Kerala, Telangana, Karnataka)
- Languages: 5 (hi, ta, ml, te, kn)
- Land sizes: 2-7 acres
- Crops variety: 11 different crops

### Queries
- Total: 9
- Types: Voice queries
- Intents: price_query, irrigation_advice, scheme_query, pest_prevention, fertilizer_advice, disease_query
- Languages: All 5 Indian languages
- Time range: Last 7 days (randomized)

### Disease Detections
- Total: 5
- Diseases: 3 types (Tomato Late Blight, Cotton Leaf Curl, Rice Blast)
- Confidence: 89-96%
- Recommendations: Organic, Chemical, Preventive
- Time range: Last 14 days (randomized)

## Maintenance

### Updating Demo Data
```bash
# Just re-run seed script
pnpm run seed:demo
# Old demo data is automatically deleted first
```

### Adding More Demo Accounts
1. Add phone number to `config.demo.accounts` array
2. Add user data to `demoUsers` array in seed script
3. Add language-specific queries to `sampleQueries` object
4. Re-run seed script

### Customizing OTP
Change `config.demo.otp` in `config/index.ts`

## Production Considerations

### Before Deploying
- [ ] Set `DEMO_MODE=false` in production `.env`
- [ ] Keep demo data in database for judge access (optional)
- [ ] Document demo credentials in submission
- [ ] Consider separate demo/production databases

### Security Notes
- Demo mode should never be enabled in production
- Fixed OTP is acceptable only for demo accounts
- Real users must always receive unique, expiring OTPs
- Rate limiting still applies in demo mode

## Success Metrics

✅ **All objectives completed:**
- 5 demo users created
- 9 queries populated
- 5 disease detections added
- Demo mode configuration implemented
- Fixed OTP for demo accounts working
- Documentation comprehensive
- Verification script available
- Ready for hackathon demo

## Next Steps

After this implementation:
1. ✅ Demo data ready for testing
2. ✅ Frontend can test with real backend data
3. ✅ Hackathon judges can evaluate easily
4. ✅ Multi-language testing enabled
5. ⏭️ Next: Performance optimization
6. ⏭️ Next: End-to-end testing
7. ⏭️ Next: Demo preparation

## Files Reference

**Documentation:**
- `backend/DEMO_ACCOUNTS.md` - Account credentials
- `backend/DEMO_IMPLEMENTATION_SUMMARY.md` - This file
- `frontend/DEMO_TESTING.md` - Frontend testing guide

**Scripts:**
- `backend/src/scripts/seed-demo-data.ts` - Main seed script
- `backend/src/scripts/verify-demo-data.ts` - Verification
- `backend/src/scripts/test-demo-auth.ts` - Auth testing

**Configuration:**
- `backend/src/config/index.ts` - Demo mode config
- `backend/src/services/otp.service.ts` - OTP with demo support
- `backend/.env.example` - Environment template

## Contact for Issues

If demo data seeding fails:
1. Check MongoDB connection
2. Check Redis connection
3. Run `pnpm run verify:demo`
4. Check logs in console
5. Re-run `pnpm run seed:demo`

---

**Implementation Date:** February 9, 2026  
**Status:** ✅ Complete  
**Ready for:** Hackathon Demo & Testing
