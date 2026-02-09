# Demo Accounts Guide

This document contains the credentials and details for demo accounts used for testing and demonstrations.

## Setup

1. **Seed the demo data:**
   ```bash
   cd backend
   pnpm run seed:demo
   ```

2. **Enable demo mode** (optional):
   - Set `DEMO_MODE=true` in your `.env` file
   - Demo accounts will use a fixed OTP: `123456`
   - This bypasses Twilio SMS sending for demo accounts

## Demo Account Credentials

### Account 1: Hindi - Maharashtra
- **Phone Number:** `+919876543210`
- **Language:** Hindi (hi)
- **Location:** Pune, Maharashtra
- **Crops:** Tomato, Onion, Chili
- **Land Size:** 3 acres
- **Soil Type:** Red
- **OTP (Demo Mode):** `123456`

### Account 2: Tamil - Tamil Nadu
- **Phone Number:** `+919876543211`
- **Language:** Tamil (ta)
- **Location:** Tiruchirappalli, Tamil Nadu
- **Crops:** Rice, Sugarcane, Banana
- **Land Size:** 5 acres
- **Soil Type:** Black
- **OTP (Demo Mode):** `123456`

### Account 3: Malayalam - Kerala
- **Phone Number:** `+919876543212`
- **Language:** Malayalam (ml)
- **Location:** Alappuzha, Kerala
- **Crops:** Coconut, Rice, Banana
- **Land Size:** 2 acres
- **Soil Type:** Laterite
- **OTP (Demo Mode):** `123456`

### Account 4: Telugu - Telangana
- **Phone Number:** `+919876543213`
- **Language:** Telugu (te)
- **Location:** Medak, Telangana
- **Crops:** Cotton, Maize, Soybean
- **Land Size:** 7 acres
- **Soil Type:** Clay
- **OTP (Demo Mode):** `123456`

### Account 5: Kannada - Karnataka
- **Phone Number:** `+919876543214`
- **Language:** Kannada (kn)
- **Location:** Chikkaballapur, Karnataka
- **Crops:** Groundnut, Tomato, Maize
- **Land Size:** 4 acres
- **Soil Type:** Loamy
- **OTP (Demo Mode):** `123456`

## Demo Data Included

Each demo account includes:

- **Query History:** 2-3 sample voice queries in their respective language
  - Market price queries
  - Advisory questions (irrigation, fertilizer, pests)
  - Government scheme queries

- **Disease Detection History:** 1-2 disease detection records
  - Realistic disease predictions with confidence scores
  - Treatment recommendations (organic, chemical, preventive)
  - Sample disease images (placeholder URLs)

## Using Demo Accounts

### With Demo Mode Enabled (DEMO_MODE=true)
1. Open the app
2. Enter any of the phone numbers above
3. When prompted for OTP, enter: `123456`
4. You're logged in! The account already has:
   - Completed onboarding
   - Query history
   - Disease detection history

### Without Demo Mode (Production-like Testing)
1. Make sure MongoDB and Redis are running
2. Run `pnpm run seed:demo` to populate data
3. Use the demo phone numbers
4. You'll receive a real OTP (via Twilio or logged in console)
5. Complete authentication normally

## Notes

- **Demo Mode:** Best for hackathon demos and quick testing
- **Fixed OTP:** Only works when `DEMO_MODE=true`
- **Data Persistence:** Demo data stays in MongoDB until cleared
- **Multi-language Testing:** Use different accounts to test all 5 Indian languages
- **Realistic Scenarios:** Each account has location-specific crops and data

## Clearing Demo Data

To remove demo data and reseed:

```bash
cd backend
pnpm run seed:demo
```

This will delete existing demo data and create fresh records.

## For Hackathon Judges

These accounts are pre-configured with realistic agricultural data from different Indian states. You can:

1. Test voice queries in regional languages
2. View pre-existing disease detections
3. Check market prices for different crops
4. Browse government schemes matched to each farmer profile
5. Test all features without any setup

Simply use phone number `+919876543210` with OTP `123456` (if demo mode is enabled) to get started!
