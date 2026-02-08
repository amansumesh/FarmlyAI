# 🔑 API Keys Setup Guide

All API keys should be added to **`backend/.env`**

---

## 📋 Quick Reference

| Service | Used For | Cost | Required For |
|---------|----------|------|--------------|
| **Google Cloud** | Voice recognition & TTS | Free tier: 60 mins/month | Voice interface backend |
| **Twilio** | OTP SMS | Pay-as-you-go: $0.0075/SMS | Phone authentication |
| **OpenWeatherMap** | Weather data | Free: 1000 calls/day | Weather advisory |
| **Vercel Blob** | Image storage | Free: 1GB | Disease image uploads |

---

## 1️⃣ Google Cloud (Speech-to-Text & Text-to-Speech)

**Used for**: Converting voice to text and generating audio responses

### Setup Steps:

1. **Go to**: [Google Cloud Console](https://console.cloud.google.com)

2. **Create a new project** (or use existing):
   - Click "Select a project" → "New Project"
   - Name: `farmly-ai`
   - Click "Create"

3. **Enable APIs**:
   - Search for "Cloud Speech-to-Text API" → Enable
   - Search for "Cloud Text-to-Speech API" → Enable

4. **Create Service Account**:
   - Go to "IAM & Admin" → "Service Accounts"
   - Click "Create Service Account"
   - Name: `farmly-voice-service`
   - Grant roles:
     - `Cloud Speech-to-Text Admin`
     - `Cloud Text-to-Speech Admin`
   - Click "Done"

5. **Generate Key**:
   - Click on the service account you just created
   - Go to "Keys" tab
   - Click "Add Key" → "Create new key"
   - Choose **JSON**
   - Save the file

6. **Add to project**:
   ```bash
   # Create credentials folder in backend
   mkdir backend/credentials
   
   # Move downloaded JSON file there
   # Rename it to: google-cloud-key.json
   ```

7. **Update `.env`**:
   ```env
   GOOGLE_CLOUD_PROJECT_ID=your-project-id-from-json
   GOOGLE_CLOUD_CREDENTIALS=./credentials/google-cloud-key.json
   ```

**Free Tier**: 60 minutes of speech recognition per month

---

## 2️⃣ Twilio (SMS/OTP)

**Used for**: Sending OTP codes to users' phones for authentication

### Setup Steps:

1. **Go to**: [Twilio Console](https://console.twilio.com)

2. **Sign up** (get $15 free trial credit)

3. **Get credentials**:
   - After signup, you'll see:
     - `Account SID`
     - `Auth Token`
   - Copy both

4. **Get phone number**:
   - Go to "Phone Numbers" → "Buy a number"
   - Select country (India: +91)
   - Choose SMS capability
   - Buy number (uses free credit)

5. **Update `.env`**:
   ```env
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_auth_token_here
   TWILIO_PHONE_NUMBER=+1234567890
   ```

**Cost**: ~$0.0075 per SMS in India

**Alternative for Development**: Use [Firebase Phone Auth](https://firebase.google.com/docs/auth/web/phone-auth) (free test mode)

---

## 3️⃣ OpenWeatherMap

**Used for**: Weather forecasts for farm advisory

### Setup Steps:

1. **Go to**: [OpenWeatherMap](https://openweathermap.org/api)

2. **Sign up** for free account

3. **Get API key**:
   - Go to [API Keys](https://home.openweathermap.org/api_keys)
   - Copy your default API key (or create new one)

4. **Update `.env`**:
   ```env
   OPENWEATHER_API_KEY=abcdef1234567890abcdef1234567890
   ```

**Free Tier**: 1,000 API calls per day

---

## 4️⃣ Vercel Blob Storage

**Used for**: Storing uploaded disease detection images

### Setup Steps:

1. **Go to**: [Vercel Dashboard](https://vercel.com/dashboard)

2. **Sign up** with GitHub

3. **Create Blob Store**:
   - Go to "Storage" → "Create Database"
   - Select "Blob"
   - Name: `farmly-images`
   - Create

4. **Get token**:
   - Click on your blob store
   - Go to "Settings" → "Tokens"
   - Create new token with "Read & Write" access
   - Copy the token

5. **Update `.env`**:
   ```env
   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxx
   ```

**Free Tier**: 1GB storage

---

## 5️⃣ MongoDB Atlas (Already Configured ✅)

Your MongoDB URI is already in `.env`:
```env
MONGODB_URI=mongodb+srv://ravisiva1064_db_user:Itachi2005@...
```

---

## 6️⃣ Redis Cloud (Already Configured ✅)

Your Redis URL is already in `.env`:
```env
REDIS_URL=redis://default:k3ErAoEqAaC602TcqoeJcRRzBIrsQXp8@...
```

---

## 🚀 Quick Start (Minimum Required)

For **MVP/Demo**, you only need:

1. ✅ **MongoDB** (already set)
2. ✅ **Redis** (already set)
3. ⚠️ **Google Cloud** (for voice backend)
4. ⚠️ **Twilio** (for OTP - or skip and use demo mode)

**OpenWeatherMap** and **Vercel Blob** can be added later.

---

## 🧪 Testing Without API Keys

The frontend **voice interface already works** without backend API keys because:
- Browser Speech Recognition (no API needed)
- Demo mode with keyword matching
- Mock responses

To test backend APIs, you'll need the actual keys.

---

## 🔒 Security Checklist

- [x] `.env` is in `.gitignore` ✅
- [ ] Never commit API keys to Git
- [ ] Use different keys for development/production
- [ ] Rotate keys regularly
- [ ] Set up billing alerts for paid services

---

## 💰 Cost Estimate (Monthly)

| Service | Free Tier | Expected Usage | Cost |
|---------|-----------|----------------|------|
| Google Cloud | 60 mins | ~100 queries | **$0** |
| Twilio | $15 credit | 500 OTPs | **~$3.75** |
| OpenWeatherMap | 1000/day | 50/day | **$0** |
| Vercel Blob | 1GB | <100MB | **$0** |
| **Total** | | | **~$3.75/month** |

---

## 📞 Need Help?

- **Google Cloud**: [Documentation](https://cloud.google.com/speech-to-text/docs)
- **Twilio**: [Quickstart](https://www.twilio.com/docs/sms/quickstart)
- **OpenWeatherMap**: [API Docs](https://openweathermap.org/api)
- **Vercel Blob**: [Documentation](https://vercel.com/docs/storage/vercel-blob)
