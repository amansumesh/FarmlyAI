# Cloud Services Setup Checklist

Use this checklist to track your cloud services setup progress.

## Prerequisites
- [ ] Git repository created
- [ ] Node.js 20+ installed
- [ ] pnpm installed
- [ ] Python 3.11+ installed (for ML service)

## 1. MongoDB Atlas Setup
- [ ] Created MongoDB Atlas account
- [ ] Created M0 free cluster (farmly-ai-cluster)
- [ ] Created database user (farmly-admin)
- [ ] Configured network access (0.0.0.0/0)
- [ ] Copied connection string
- [ ] Added MONGODB_URI to backend/.env
- [ ] Tested connection: `cd backend && pnpm run test:db`
- [ ] Initialized database: `cd backend && pnpm run init:db`
- [ ] Verified collections in MongoDB Atlas dashboard

**MongoDB URI Format:**
```
mongodb+srv://farmly-admin:PASSWORD@farmly-ai-cluster.xxxxx.mongodb.net/farmly_ai?retryWrites=true&w=majority
```

## 2. Redis Cloud Setup
- [ ] Created Redis Cloud account
- [ ] Created free 30MB database (farmly-ai-cache)
- [ ] Copied endpoint and password
- [ ] Added REDIS_URL to backend/.env
- [ ] Tested connection: `cd backend && pnpm run test:redis`

**Redis URL Format:**
```
redis://default:PASSWORD@redis-xxxxx.c123.ap-south-1-1.ec2.cloud.redislabs.com:PORT
```

## 3. Vercel Setup (Frontend + Backend API)
- [ ] Created Vercel account
- [ ] Installed Vercel CLI: `npm install -g vercel`
- [ ] Logged in: `vercel login`
- [ ] Linked project: `vercel link`
- [ ] Added environment variables in Vercel dashboard
- [ ] Deployed: `vercel --prod`
- [ ] Tested health endpoint: `curl https://YOUR_PROJECT.vercel.app/api/health`
- [ ] Verified response shows db: "connected", redis: "connected"

**Environment Variables to Add in Vercel:**
- MONGODB_URI
- REDIS_URL
- JWT_SECRET
- JWT_REFRESH_SECRET
- ML_SERVICE_URL
- (Others as needed)

## 4. ML Service Setup (Railway or Render)

### Option A: Railway.app
- [ ] Created Railway account (via GitHub)
- [ ] Created new project from GitHub repo
- [ ] Selected ml-service directory
- [ ] Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- [ ] Added environment variables (PORT=8000)
- [ ] Deployed successfully
- [ ] Generated domain from Settings
- [ ] Tested health endpoint: `curl https://YOUR_ML_SERVICE.up.railway.app/health`
- [ ] Added ML_SERVICE_URL to Vercel environment variables
- [ ] Redeployed backend on Vercel

### Option B: Render.com
- [ ] Created Render account (via GitHub)
- [ ] Created new Web Service
- [ ] Connected GitHub repository
- [ ] Set root directory: ml-service
- [ ] Set build command: `pip install -r requirements.txt`
- [ ] Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- [ ] Selected plan (Free or Starter)
- [ ] Deployed successfully
- [ ] Tested health endpoint: `curl https://YOUR_ML_SERVICE.onrender.com/health`
- [ ] Added ML_SERVICE_URL to Vercel environment variables
- [ ] Redeployed backend on Vercel

**ML Service URL Examples:**
- Railway: `https://ml-farmly-ai-production.up.railway.app`
- Render: `https://farmly-ai-ml-service.onrender.com`

## 5. Final Verification

### Backend API Health Check
```bash
curl https://YOUR_PROJECT.vercel.app/api/health
```
**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-07T19:15:30.000Z",
  "db": "connected",
  "redis": "connected"
}
```
- [ ] Status is "ok"
- [ ] DB is "connected"
- [ ] Redis is "connected"

### ML Service Health Check
```bash
curl https://YOUR_ML_SERVICE_URL/health
```
**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-07T19:15:30.000Z",
  "model_loaded": false,
  "model_path": "./models/plant_disease_model.h5",
  "version": "1.0.0"
}
```
- [ ] Status is "ok"
- [ ] Service is responding (model_loaded can be false for now)

### Local Development Test
```bash
# Test backend locally
cd backend
pnpm run dev
# In another terminal:
curl http://localhost:4000/health
```
- [ ] Backend starts without errors
- [ ] Health endpoint returns db: "connected", redis: "connected"

```bash
# Test ML service locally
cd ml-service
pip install -r requirements.txt
uvicorn app.main:app --reload
# In another terminal:
curl http://localhost:8000/health
```
- [ ] ML service starts without errors
- [ ] Health endpoint returns status: "ok"

## 6. Environment Variables Summary

### Backend (.env)
```bash
NODE_ENV=production
PORT=4000
MONGODB_URI=mongodb+srv://...
REDIS_URL=redis://...
JWT_SECRET=generated-secret-key
JWT_REFRESH_SECRET=generated-refresh-key
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
ML_SERVICE_URL=https://your-ml-service-url
```

### ML Service (.env)
```bash
PORT=8000
MODEL_PATH=./models/plant_disease_model.h5
```

### Vercel Environment Variables
Same as Backend .env (configure in Vercel dashboard)

## Troubleshooting

### MongoDB Connection Fails
- [ ] Check username and password in URI
- [ ] Verify IP whitelist includes 0.0.0.0/0
- [ ] Ensure database name is in URI: `/farmly_ai?`
- [ ] Check MongoDB Atlas cluster is running

### Redis Connection Fails
- [ ] Verify URL format: `redis://default:password@host:port`
- [ ] Check password has no special characters that need encoding
- [ ] Ensure Redis Cloud database is active

### Vercel Deployment Fails
- [ ] Check build logs for errors
- [ ] Verify all dependencies installed: `pnpm install`
- [ ] Test build locally: `cd frontend && pnpm run build`
- [ ] Check vercel.json configuration

### ML Service Deployment Fails
- [ ] Check requirements.txt for invalid packages
- [ ] Verify Python version (3.11+)
- [ ] Check logs in Railway/Render dashboard
- [ ] Ensure start command is correct

## Next Steps

Once all items are checked:
- ✅ All cloud services configured
- ✅ Database initialized with collections
- ✅ Health endpoints verified
- ✅ Environment variables set

**You're ready to proceed with the next implementation step!**

Refer to `plan.md` for the next step: **Authentication System**
