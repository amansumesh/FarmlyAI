# Farmly AI - Quick Start Guide

Get Farmly AI up and running in 30 minutes.

## Prerequisites

- **Node.js 20+** and **pnpm** installed
- **Python 3.11+** installed
- **Git** installed
- Free accounts on: MongoDB Atlas, Redis Cloud, Vercel, Railway/Render

## Step 1: Clone and Install (5 minutes)

```bash
# Clone the repository
git clone <your-repo-url>
cd farmly-ai-7a37

# Install all dependencies
pnpm install
```

## Step 2: Setup MongoDB Atlas (5 minutes)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Create M0 Free Cluster → Name: `farmly-ai-cluster`
3. Create Database User → Username: `farmly-admin`, Password: (generate secure password)
4. Network Access → Allow from Anywhere (0.0.0.0/0)
5. Get Connection String:
   ```
   mongodb+srv://farmly-admin:PASSWORD@farmly-ai-cluster.xxxxx.mongodb.net/farmly_ai?retryWrites=true&w=majority
   ```

## Step 3: Setup Redis Cloud (5 minutes)

1. Go to [Redis Cloud](https://redis.com/try-free/)
2. Create Free 30MB Database → Name: `farmly-ai-cache`
3. Get Connection Details:
   ```
   redis://default:PASSWORD@redis-xxxxx.c123.ap-south-1-1.ec2.cloud.redislabs.com:PORT
   ```

## Step 4: Configure Environment Variables (3 minutes)

Create `.env` file in `backend/` directory:

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and add your credentials:

```bash
# MongoDB Atlas
MONGODB_URI=mongodb+srv://farmly-admin:YOUR_PASSWORD@farmly-ai-cluster.xxxxx.mongodb.net/farmly_ai?retryWrites=true&w=majority

# Redis Cloud
REDIS_URL=redis://default:YOUR_PASSWORD@redis-xxxxx.c123.ap-south-1-1.ec2.cloud.redislabs.com:PORT

# JWT Secrets (generate using: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
JWT_SECRET=generate-a-random-secret-here
JWT_REFRESH_SECRET=generate-another-random-secret-here

# Leave others as default for now
```

## Step 5: Initialize Database (2 minutes)

```bash
cd backend

# Test MongoDB connection
pnpm run test:db
# Should output: "✅ MongoDB connected successfully"

# Test Redis connection
pnpm run test:redis
# Should output: "✅ Redis connected successfully"

# Initialize database collections and indexes
pnpm run init:db
# Should create: users, queries, diseasedetections, schemes
```

## Step 6: Run Locally (2 minutes)

Open 3 terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
pnpm run dev
# Server should start on http://localhost:4000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
pnpm run dev
# Frontend should start on http://localhost:5173
```

**Terminal 3 - ML Service:**
```bash
cd ml-service
pip install -r requirements.txt
uvicorn app.main:app --reload
# ML service should start on http://localhost:8000
```

## Step 7: Verify Local Setup (2 minutes)

Open browser or use curl:

```bash
# Check backend health
curl http://localhost:4000/health
# Expected: {"status":"ok","db":"connected","redis":"connected"}

# Check ML service health
curl http://localhost:8000/health
# Expected: {"status":"ok","model_loaded":false}

# Open frontend
# Navigate to: http://localhost:5173
```

## Step 8: Deploy to Vercel (5 minutes)

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod

# Follow prompts:
# - Link to existing project or create new
# - Set root directory to: ./
# - Vercel will auto-detect framework
```

**Add Environment Variables in Vercel Dashboard:**
1. Go to your project → Settings → Environment Variables
2. Add all variables from `backend/.env`
3. Redeploy: `vercel --prod`

## Step 9: Deploy ML Service to Railway (5 minutes)

1. Go to [Railway.app](https://railway.app/)
2. Sign up with GitHub
3. New Project → Deploy from GitHub repo
4. Select your repository
5. Select `ml-service` directory
6. Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
7. Add environment variable: `PORT=8000`
8. Get public URL from Settings → Domains
9. Update `ML_SERVICE_URL` in Vercel environment variables
10. Redeploy backend: `vercel --prod`

## Step 10: Final Verification (1 minute)

```bash
# Test deployed backend
curl https://your-project.vercel.app/api/health
# Expected: {"status":"ok","db":"connected","redis":"connected"}

# Test deployed ML service
curl https://your-ml-service.up.railway.app/health
# Expected: {"status":"ok","model_loaded":false}

# Open deployed frontend
# Navigate to: https://your-project.vercel.app
```

## Troubleshooting

### "MongoDB connection failed"
- Verify connection string is correct (check password)
- Ensure IP whitelist includes 0.0.0.0/0
- Check network firewall

### "Redis connection failed"
- Verify URL format: `redis://default:password@host:port`
- Check password doesn't have special characters
- Ensure Redis database is active

### "Vercel deployment failed"
- Check build logs for errors
- Verify `pnpm install` works locally
- Ensure all environment variables set

### "Railway/Render ML service crashes"
- Check service logs
- Verify requirements.txt
- Ensure start command is correct

## Next Steps

✅ **Setup Complete!** You're ready to start developing.

**Continue with implementation steps in `plan.md`:**
1. ✅ Project Foundation Setup
2. ✅ Database and Cloud Services Setup
3. ⏭️ Authentication System
4. ⏭️ User Onboarding Flow
5. ... (see plan.md for full list)

## Useful Commands

```bash
# Backend
cd backend
pnpm run dev              # Start dev server
pnpm run test:db          # Test MongoDB connection
pnpm run test:redis       # Test Redis connection
pnpm run init:db          # Initialize database
pnpm run typecheck        # Check TypeScript
pnpm run lint             # Lint code

# Frontend
cd frontend
pnpm run dev              # Start dev server
pnpm run build            # Build for production
pnpm run typecheck        # Check TypeScript
pnpm run lint             # Lint code

# ML Service
cd ml-service
uvicorn app.main:app --reload    # Start dev server
```

## Support

- See [CLOUD_SETUP.md](./CLOUD_SETUP.md) for detailed cloud setup instructions
- See [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md) for step-by-step checklist
- Check logs in respective service dashboards
- Review error messages carefully

---

**Total Setup Time: ~30 minutes** ⏱️

Happy coding! 🚀
