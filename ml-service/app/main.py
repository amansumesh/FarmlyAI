from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import os
from dotenv import load_dotenv
from datetime import datetime

from app.services.inference import DiseaseDetectionService

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Farmly AI - ML Service",
    description="Disease detection and ML inference service",
    version="1.0.0"
)

# CORS Settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # in production, replace with frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model settings
use_mock = os.getenv("USE_MOCK_MODEL", "false").lower() == "true"
print("✅ USE_MOCK_MODEL:", use_mock)

# Initialize ML service
disease_service = DiseaseDetectionService(use_mock=use_mock)


# Request Schema
class DiseaseDetectionRequest(BaseModel):
    image_base64: str
    top_k: int = 3


# Response Schema
class DiseaseDetectionResponse(BaseModel):
    success: bool
    predictions: list = None
    top_prediction: dict = None
    inference_time_ms: int = None
    total_time_ms: int = None
    preprocess_time_ms: int = None
    model_version: str = None
    model_type: str = None
    error: str = None
    error_type: str = None


@app.get("/")
async def root():
    return {
        "message": "Farmly AI ML Service",
        "version": "1.0.0",
        "status": "running",
        "model_type": "mock" if use_mock else "real",
        "endpoints": [
            "/health",
            "/ml/detect-disease",
            "/ml/service-info"
        ]
    }


@app.get("/health")
async def health():
    health_status = disease_service.health_check()

    return {
        "status": health_status.get("status", "unknown"),
        "timestamp": datetime.utcnow().isoformat(),
        "model_loaded": health_status.get("model_loaded", False),
        "inference_working": health_status.get("inference_working", False),
        "model_version": health_status.get("model_version", "unknown"),
        "model_type": "mock" if use_mock else "real",
        "version": "1.0.0"
    }


@app.post("/ml/detect-disease", response_model=DiseaseDetectionResponse)
async def detect_disease(request: DiseaseDetectionRequest):
    """
    Detect crop disease from base64 encoded image
    """
    try:
        if not request.image_base64:
            raise HTTPException(status_code=400, detail="image_base64 is required")

        if request.top_k < 1 or request.top_k > 10:
            raise HTTPException(status_code=400, detail="top_k must be between 1 and 10")

        result = disease_service.detect_disease(
            image_base64=request.image_base64,
            top_k=request.top_k
        )

        if not result.get("success"):
            error_type = result.get("error_type", "unknown_error")

            if error_type == "validation_error":
                raise HTTPException(status_code=400, detail=result.get("error"))
            else:
                raise HTTPException(status_code=500, detail=result.get("error"))

        return DiseaseDetectionResponse(**result)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/ml/service-info")
async def service_info():
    """
    Get ML service information
    """
    try:
        info = disease_service.get_service_info()
        return info
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get service info: {str(e)}")


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=True
    )