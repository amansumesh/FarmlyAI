from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="Farmly AI - ML Service",
    description="Disease detection and ML inference service",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "message": "Farmly AI ML Service",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health():
    import os.path
    from datetime import datetime
    
    model_path = os.getenv("MODEL_PATH", "./models/plant_disease_model.h5")
    model_exists = os.path.exists(model_path)
    
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
        "model_loaded": model_exists,
        "model_path": model_path,
        "version": "1.0.0"
    }

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
