# Cloud Services Setup Guide

This guide walks through setting up all cloud services required for Farmly AI.

## Table of Contents
1. [MongoDB Atlas Setup](#1-mongodb-atlas-setup)
2. [Redis Cloud Setup](#2-redis-cloud-setup)
3. [Vercel Deployment](#3-vercel-deployment)
4. [ML Service Deployment (Railway)](#4-ml-service-deployment-railway)
5. [Environment Variables](#5-environment-variables)
6. [Verification](#6-verification)

---

## 1. MongoDB Atlas Setup

### Step 1: Create Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up with your email or Google account
3. Complete the registration form

### Step 2: Create Free Cluster (M0)
1. Click **"Build a Database"**
2. Select **"Shared"** (Free tier)
3. Choose **M0 Sandbox** (0 GB Storage, Free Forever)
4. Select cloud provider: **AWS**
5. Select region: Choose closest to your target users (e.g., **Mumbai** for India)
6. Cluster Name: `farmly-ai-cluster`
7. Click **"Create Cluster"**

### Step 3: Create Database User
1. Go to **Database Access** (left sidebar)
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Username: `farmly-admin`
5. Password: Generate a strong password (save it securely!)
6. Database User Privileges: **"Atlas Admin"**
7. Click **"Add User"**

### Step 4: Configure Network Access
1. Go to **Network Access** (left sidebar)
2. Click **"Add IP Address"**
3. Choose **"Allow Access from Anywhere"** (0.0.0.0/0)
   - For production, restrict to specific IPs (Vercel IPs)
4. Click **"Confirm"**

### Step 5: Get Connection String
1. Go to **Database** → **Connect**
2. Choose **"Connect your application"**
3. Driver: **Node.js**, Version: **5.5 or later**
4. Copy connection string:
   ```
   mongodb+srv://farmly-admin:<password>@farmly-ai-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<password>` with your database user password
6. Add database name: `farmly_ai` (replace `/?retry...` with `/farmly_ai?retry...`)

### Step 6: Initialize Database
1. Add the connection string to `.env`:
   ```bash
   MONGODB_URI=mongodb+srv://farmly-admin:YOUR_PASSWORD@farmly-ai-cluster.xxxxx.mongodb.net/farmly_ai?retryWrites=true&w=majority
   ```
2. Run initialization script:
   ```bash
   cd backend
   pnpm run init:db
   ```
3. Verify collections created in MongoDB Atlas dashboard

---

## 2. Redis Cloud Setup

### Step 1: Create Account
1. Go to [Redis Cloud](https://redis.com/try-free/)
2. Sign up with your email or Google account
3. Complete the registration

### Step 2: Create Free Database
1. Click **"Create Database"**
2. Select **"Free"** plan (30MB, Free Forever)
3. Cloud vendor: **AWS**
4. Region: Same as MongoDB (e.g., **ap-south-1** for Mumbai)
5. Database name: `farmly-ai-cache`
6. Click **"Create Database"**

### Step 3: Get Connection Details
1. Wait for database to provision (~2 minutes)
2. Click on your database name
3. Go to **Configuration** tab
4. Copy:
   - **Endpoint**: `redis-xxxxx.c123.ap-south-1-1.ec2.cloud.redislabs.com:12345`
   - **Default user password**: Click "Show" to reveal

### Step 4: Configure Connection
1. Add to `.env`:
   ```bash
   REDIS_URL=redis://default:YOUR_PASSWORD@redis-xxxxx.c123.ap-south-1-1.ec2.cloud.redislabs.com:12345
   ```
2. Test connection:
   ```bash
   cd backend
   pnpm run test:redis
   ```

---

## 3. Vercel Deployment

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Create Project
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your Git repository (GitHub/GitLab/Bitbucket)
4. Or use Vercel CLI:
   ```bash
   cd farmly-ai-7a37
   vercel
   ```

### Step 4: Configure Project
1. Framework Preset: **Other**
2. Root Directory: `./`
3. Build Command: `pnpm run build` (if applicable)
4. Output Directory: `frontend/dist`
5. Install Command: `pnpm install`

### Step 5: Set Environment Variables
1. Go to **Project Settings** → **Environment Variables**
2. Add all variables from `backend/.env.example`:
   - `MONGODB_URI`
   - `REDIS_URL`
   - `JWT_SECRET`
   - `JWT_REFRESH_SECRET`
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_PHONE_NUMBER`
   - `GOOGLE_CLOUD_PROJECT_ID`
   - `GOOGLE_CLOUD_CREDENTIALS`
   - `OPENWEATHER_API_KEY`
   - `ML_SERVICE_URL`
   - `BLOB_READ_WRITE_TOKEN`
3. Select environments: **Production**, **Preview**, **Development**

### Step 6: Deploy
```bash
vercel --prod
```

Your API will be available at: `https://your-project.vercel.app/api`

---

## 4. ML Service Deployment (Railway)

### Option A: Railway.app (Recommended)

#### Step 1: Create Account
1. Go to [Railway.app](https://railway.app/)
2. Sign up with GitHub

#### Step 2: Create New Project
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your repository
4. Railway will auto-detect services

#### Step 3: Configure ML Service
1. Select the `ml-service` directory
2. Railway will detect Python and `requirements.txt`
3. Set start command:
   ```
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

#### Step 4: Set Environment Variables
1. Go to **Variables** tab
2. Add:
   ```
   PORT=8000
   PYTHONUNBUFFERED=1
   ```

#### Step 5: Deploy
1. Railway will automatically deploy
2. Get the public URL from **Settings** → **Domains**
3. Example: `https://ml-farmly-ai-production.up.railway.app`

#### Step 6: Update Backend
1. Add ML service URL to Vercel environment variables:
   ```
   ML_SERVICE_URL=https://ml-farmly-ai-production.up.railway.app
   ```
2. Redeploy backend

### Option B: Render.com

#### Step 1: Create Account
1. Go to [Render.com](https://render.com/)
2. Sign up with GitHub

#### Step 2: Create Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your repository
3. Name: `farmly-ai-ml-service`
4. Root Directory: `ml-service`
5. Environment: **Python 3**
6. Build Command: `pip install -r requirements.txt`
7. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

#### Step 3: Choose Plan
- Free tier: Select **Free** ($0/month, auto-sleeps after 15 min)
- Paid tier: **Starter** ($7/month, no sleep) - recommended for hackathon

#### Step 4: Deploy
1. Click **"Create Web Service"**
2. Wait for deployment (~5 minutes)
3. Get URL: `https://farmly-ai-ml-service.onrender.com`

---

## 5. Environment Variables

### Backend (.env)
```bash
NODE_ENV=production
PORT=4000

# MongoDB Atlas
MONGODB_URI=mongodb+srv://farmly-admin:PASSWORD@farmly-ai-cluster.xxxxx.mongodb.net/farmly_ai?retryWrites=true&w=majority

# Redis Cloud
REDIS_URL=redis://default:PASSWORD@redis-xxxxx.c123.ap-south-1-1.ec2.cloud.redislabs.com:12345

# JWT Secrets (generate using: openssl rand -base64 32)
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Twilio (configure in Step 7)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Google Cloud (configure in Step 8)
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_CREDENTIALS=./path/to/service-account-key.json

# OpenWeatherMap (configure in Step 9)
OPENWEATHER_API_KEY=your-api-key

# ML Service
ML_SERVICE_URL=https://ml-farmly-ai-production.up.railway.app

# Vercel Blob Storage (configure in Vercel dashboard)
BLOB_READ_WRITE_TOKEN=vercel_blob_xxxxxxxx
```

### ML Service (.env)
```bash
PORT=8000
MODEL_PATH=./models/plant_disease_model.h5
```

---

## 6. Verification

### Check MongoDB Connection
```bash
cd backend
pnpm run test:db
```
Expected output:
```
✅ MongoDB connected successfully
Existing collections:
  - users
  - queries
  - diseasedetections
  - schemes
✅ All MongoDB operations working correctly!
```

### Check Redis Connection
```bash
cd backend
pnpm run test:redis
```
Expected output:
```
✅ Redis connected successfully
✓ Set operation successful
✓ Get operation successful
✅ All Redis operations working correctly!
```

### Check Backend API Health
```bash
curl https://your-project.vercel.app/api/health
```
Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-02-07T12:00:00.000Z",
  "db": "connected",
  "redis": "connected"
}
```

### Check ML Service Health
```bash
curl https://ml-farmly-ai-production.up.railway.app/health
```
Expected response:
```json
{
  "status": "ok",
  "model_loaded": true,
  "version": "1.0.0"
}
```

---

## Troubleshooting

### MongoDB Connection Issues
- **Error: "Authentication failed"**
  - Verify username and password in connection string
  - Check Database User exists in MongoDB Atlas
  
- **Error: "Connection timeout"**
  - Verify IP whitelist includes 0.0.0.0/0 or your IP
  - Check network firewall settings

### Redis Connection Issues
- **Error: "ECONNREFUSED"**
  - Verify Redis URL format: `redis://default:password@host:port`
  - Check Redis Cloud database is running

- **Error: "Authentication failed"**
  - Verify password in connection string
  - Regenerate password in Redis Cloud dashboard

### Vercel Deployment Issues
- **Build fails**
  - Check build logs in Vercel dashboard
  - Verify all dependencies in package.json
  - Run `pnpm install` and `pnpm run build` locally first

- **API routes not working**
  - Verify `vercel.json` routing configuration
  - Check environment variables are set in Vercel

### ML Service Issues
- **Service crashes**
  - Check logs in Railway/Render dashboard
  - Verify `requirements.txt` has all dependencies
  - Ensure model file exists in `models/` directory

- **Timeout errors**
  - Free tier services auto-sleep after inactivity
  - First request after sleep takes longer (~30s)
  - Consider upgrading to paid tier for hackathon demo

---

## Cost Summary (Free Tier)

| Service | Free Tier | Limits | Cost if Exceeded |
|---------|-----------|--------|------------------|
| MongoDB Atlas | M0 Cluster | 512MB storage | $9/month for M2 |
| Redis Cloud | 30MB database | 30 concurrent connections | $5/month for 100MB |
| Vercel | Hobby plan | 100GB bandwidth, 6,000 build minutes | $20/month for Pro |
| Railway | $5 free credit/month | ~500 hours uptime | $0.000463/min after |
| Render | Free tier | Auto-sleep after 15 min | $7/month for always-on |

**Total Monthly Cost (all free tiers)**: **$0** ✅

For hackathon demo, free tiers are sufficient for ~1,000 users and demo traffic.

---

## Next Steps

After completing this setup:
1. ✅ MongoDB Atlas configured with collections and indexes
2. ✅ Redis Cloud configured and tested
3. ✅ Vercel deployment with environment variables
4. ✅ ML service deployed on Railway/Render
5. ✅ Health endpoints verified

Continue with **Authentication System** implementation (next step in plan.md).
