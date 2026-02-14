from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import uvicorn
import os
from dotenv import load_dotenv
from datetime import datetime

from app.services.tf_inference import DiseaseInferenceService

load_dotenv()

app = FastAPI(
    title="Farmly AI - ML Service",
    description="Crop disease detection service with offline/online modes",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

disease_service = DiseaseInferenceService()

class DiseaseDetectionRequest(BaseModel):
    image_base64: str
    crop: str
    mode: str = "offline"
    top_k: int = 3

class CropListResponse(BaseModel):
    crops: List[str]
    online_available: bool

@app.get("/")
async def root():
    return {
        "message": "Farmly AI ML Service",
        "version": "2.0.0",
        "status": "running",
        "endpoints": [
            "/health",
            "/ml/available-crops",
            "/ml/detect-disease",
            "/ml/service-info"
        ]
    }

@app.get("/health")
async def health():
    """Health check endpoint"""
    health_status = disease_service.health_check()
    
    return {
        "status": health_status.get("status", "unknown"),
        "timestamp": datetime.utcnow().isoformat(),
        "offline_models_loaded": health_status.get("offline_models_loaded", 0),
        "available_crops": health_status.get("available_crops", []),
        "online_mode_available": health_status.get("online_mode_available", False),
        "model_version": health_status.get("model_version", "unknown"),
        "version": "2.0.0"
    }

@app.get("/ml/available-crops", response_model=CropListResponse)
async def get_available_crops():
    """
    Get list of available crops for disease detection
    
    Returns:
        List of crop names that have loaded models (offline mode)
        Plus indication if online mode is available for "other" crops
    """
    try:
        crops = disease_service.get_available_crops()
        
        gemini_available = os.getenv("GEMINI_API_KEY") is not None
        
        return CropListResponse(
            crops=crops,
            online_available=gemini_available
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get crops: {str(e)}")

@app.post("/ml/detect-disease")
async def detect_disease(request: DiseaseDetectionRequest):
    """
    Detect crop disease from base64 encoded image
    
    Modes:
    - offline: Use local TensorFlow models (requires valid crop selection)
    - online: Use Gemini API (supports "other" crop or any crop for enhanced detection)
    
    Args:
        request: Disease detection request with image, crop, and mode
        
    Returns:
        Disease predictions or Gemini analysis based on mode
    """
    try:
        if not request.image_base64:
            raise HTTPException(status_code=400, detail="image_base64 is required")
        
        if not request.crop:
            raise HTTPException(status_code=400, detail="crop is required")
        
        if request.mode not in ["offline", "online"]:
            raise HTTPException(status_code=400, detail="mode must be 'offline' or 'online'")
        
        if request.top_k < 1 or request.top_k > 10:
            raise HTTPException(status_code=400, detail="top_k must be between 1 and 10")
        
        if request.mode == "offline":
            result = disease_service.detect_disease_offline(
                image_base64=request.image_base64,
                crop=request.crop,
                top_k=request.top_k
            )
        else:
            crop_hint = None if request.crop.lower() == "other" else request.crop
            result = disease_service.detect_disease_online(
                image_base64=request.image_base64,
                crop=crop_hint
            )
        
        if not result.get("success"):
            error_message = result.get("error", "Unknown error")
            print(f"[ERROR] Detection failed: {error_message}")
            
            if "not available" in error_message.lower() or "not found" in error_message.lower():
                raise HTTPException(status_code=404, detail=error_message)
            elif "429" in error_message or "rate limit" in error_message.lower() or "resource exhausted" in error_message.lower():
                raise HTTPException(
                    status_code=429, 
                    detail="AI service rate limit reached. Please wait a moment and try again. The free tier allows 15 requests per minute."
                )
            else:
                raise HTTPException(status_code=500, detail=error_message)
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/ml/service-info")
async def service_info():
    """
    Get ML service information
    
    Returns:
        Service configuration, loaded models, and capabilities
    """
    try:
        info = disease_service.get_service_info()
        return info
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get service info: {str(e)}")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
