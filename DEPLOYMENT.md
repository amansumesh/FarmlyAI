# FarmlyAI Deployment Guide

This guide details how to deploy the full **FarmlyAI** stack, including Frontend, Backend, ML Service, and Database.

## Architecture Overview

- **Frontend**: Vite + React (Deployed on Vercel/Netlify)
- **Backend**: Node.js + Express (Deployed on Render/Railway via Docker)
- **ML Service**: Python + FastAPI + TensorFlow (Deployed on Render/Railway via Docker)
- **Database**: MongoDB (MongoDB Atlas) & Redis (Redis Cloud/Render Redis)

---

## 1. Database Setup

### MongoDB
1. Create a free account on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a new Cluster (Shared Tier - Free).
3. Create a Database User (Username/Password).
4. whitelist IP `0.0.0.0/0` (for cloud access) or specific IPs.
5. Get the implementation string: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
6. Save this as `MONGO_URI`.

### Redis
1. Create a free account on [Redis Cloud](https://redis.com/try-free/) or use Render's Redis instance.
2. Get the connection URL: `redis://:<password>@<host>:<port>`
3. Save this as `REDIS_URL`.

---

## 2. Backend Deployment (Node.js)

We recommend using **Render** or **Railway** with Docker.

### Option A: Render (Docker)
1. Push your code to GitHub.
2. Log in to [Render](https://render.com/).
3. Click "New +" -> "Web Service".
4. Connect your GitHub repository.
5. **Root Directory**: `backend`
6. **Runtime**: Docker
7. **Environment Variables**:
   - `PORT`: `4000`
   - `MONGODB_URI`: (Your MongoDB connection string)
   - `REDIS_URL`: (Your Redis connection string)
   - `JWT_SECRET`: (A strong random string)
   - `JWT_REFRESH_SECRET`: (Another strong random string)
   - `GROQ_API_KEY`: (API Key from Groq Cloud)
   - `GEMINI_API_KEY`: (API Key from Google Gemini)
   - `ML_SERVICE_URL`: URL of your deployed ML Service (e.g. `https://farmly-ml-service.onrender.com`)
   - `NODE_ENV`: `production`
   - Optional (for full features):
     - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` (For SMS)
     - `OPENWEATHER_API_KEY` (For Weather)
     - `BLOB_READ_WRITE_TOKEN` (For Vercel Blob storage, if used)
     - `GOOGLE_CLOUD_CREDENTIALS` (If using Google Speech APIs)

### Option B: Railway
1. Keep the same environment variables.
2. Deploy from repo, set Root Directory to `backend`.
3. Railway auto-detects Dockerfile.

---

## 3. ML Service Deployment (Python)

Due to heavy dependencies (TensorFlow), the build might take time.

### Render (Docker)
1. Create a "New +" -> "Web Service".
2. Connect your GitHub repository.
3. **Root Directory**: `ml-service`
4. **Runtime**: Docker
5. **Instance Type**: Recommend at least "Starter" (Free tier *might* fail on memory with TensorFlow).
6. **Environment Variables**:
   - `PORT`: `8000`
   - `MODEL_PATH`: `./models/plant_disease_model.h5` (Ensure model is in repo or downloaded via script)
   - `GOOGLE_API_KEY`: (For Generative AI features)

**Note on Model File**:
Ensure your `models/plant_disease_model.h5` file is committed to the repo (if <100MB) or use Git LFS. If it's larger or not in git, you need a startup script to download it from S3/Google Cloud Storage.

---

## 4. Frontend Deployment (Vercel)

1. Log in to [Vercel](https://vercel.com/).
2. "Add New..." -> "Project".
3. Import your Git repository.
4. **Framework Preset**: Vite
5. **Root Directory**: `frontend`
6. **Build Command**: `npm run build` (or `pnpm run build`)
7. **Output Directory**: `dist`
8. **Environment Variables**:
   - `VITE_API_URL`: URL of your deployed Backend (e.g., `https://farmly-backend.onrender.com/api`)
   - `VITE_ML_API_URL`: URL of your deployed ML Service (optional, if frontend calls ML directly, otherwise proxy via backend).

---

## 5. Post-Deployment Checks

1. **Verify Backend Health**: Visit `https://<your-backend-url>/health`. Should return `status: ok` and DB connected.
2. **Verify ML Health**: Visit `https://<your-ml-url>/health` (if implemented) or root `/`.
3. **Frontend**: Check if API calls work (Network tab in browser).

## Troubleshooting

- **CORS Errors**: Ensure Backend `cors` configuration allows the Frontend URL.
  - In `backend/src/index.ts`, update `app.use(cors({ origin: process.env.FRONTEND_URL }))` if stricter security is needed.
- **Memory Issues**: TensorFlow in ML Service is memory hungry. If it crashes, upgrade the instance type.
