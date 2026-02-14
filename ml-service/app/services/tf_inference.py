"""
Disease detection inference service using TensorFlow models
"""
import time
import json
import os
from typing import Dict, List, Optional

from app.services.tf_preprocessing import TFImagePreprocessor
from app.models.tf_disease_detector import TFDiseaseDetector, get_available_crops
from app.services.gemini_service import GeminiDiseaseDetector


class DiseaseInferenceService:
    """Service for disease detection inference with offline/online modes"""
    
    def __init__(self):
        """Initialize inference service"""
        self.preprocessor = TFImagePreprocessor(target_size=256)
        self.models = {}
        self.treatments = self._load_treatments()
        self.gemini = None
        self.model_version = "v2.0.0"
        
        self._load_all_models()
    
    def _load_all_models(self):
        """Preload all available crop models"""
        available_crops = get_available_crops()
        print(f"Loading models for crops: {available_crops}")
        
        for crop in available_crops:
            try:
                detector = TFDiseaseDetector(crop)
                detector.load_model()
                self.models[crop] = detector
                print(f"[OK] Loaded {crop} model")
            except Exception as e:
                print(f"[FAIL] Failed to load {crop} model: {str(e)}")
    
    def _load_treatments(self) -> Dict:
        """Load disease treatment information"""
        treatments_path = os.path.join(
            os.path.dirname(__file__), 
            '..', 
            'data', 
            'disease_treatments.json'
        )
        
        try:
            with open(treatments_path, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            print("Warning: disease_treatments.json not found")
            return {}
    
    def _init_gemini(self):
        """Initialize Gemini service lazily"""
        if self.gemini is None:
            try:
                self.gemini = GeminiDiseaseDetector()
                print("[OK] Gemini API initialized")
            except Exception as e:
                print(f"[FAIL] Failed to initialize Gemini: {str(e)}")
                self.gemini = None
    
    def detect_disease_offline(
        self, 
        image_base64: str, 
        crop: str, 
        top_k: int = 3
    ) -> Dict:
        """
        Detect disease using local TensorFlow models (offline mode)
        
        Args:
            image_base64: Base64 encoded image
            crop: Crop type (tomato, potato, pepperbell)
            top_k: Number of top predictions
            
        Returns:
            Dictionary with predictions and metadata
        """
        start_time = time.time()
        
        try:
            crop = crop.lower()
            
            if crop not in self.models:
                return {
                    "success": False,
                    "error": f"Model not available for crop: {crop}",
                    "available_crops": list(self.models.keys()),
                    "mode": "offline"
                }
            
            img_array = self.preprocessor.preprocess_from_base64(image_base64)
            preprocess_time = time.time() - start_time
            
            inference_start = time.time()
            predictions = self.models[crop].predict(img_array, top_k=top_k)
            inference_time = time.time() - inference_start
            
            for pred in predictions:
                class_name = pred.get("class_name", "")
                pred["treatments"] = self.treatments.get(class_name, {
                    "organic": ["Treatment information not available"],
                    "chemical": ["Treatment information not available"],
                    "preventive": ["Maintain good agricultural practices"]
                })
            
            total_time = time.time() - start_time
            
            return {
                "success": True,
                "predictions": predictions,
                "top_prediction": predictions[0] if predictions else None,
                "inference_time_ms": int(inference_time * 1000),
                "total_time_ms": int(total_time * 1000),
                "preprocess_time_ms": int(preprocess_time * 1000),
                "model_version": self.model_version,
                "mode": "offline",
                "crop": crop
            }
            
        except ValueError as e:
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error",
                "mode": "offline"
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Inference failed: {str(e)}",
                "error_type": "inference_error",
                "mode": "offline"
            }
    
    def detect_disease_online(
        self, 
        image_base64: str, 
        crop: Optional[str] = None
    ) -> Dict:
        """
        Detect disease using Gemini API (online mode)
        
        Args:
            image_base64: Base64 encoded image
            crop: Optional crop hint (or "other" for general detection)
            
        Returns:
            Dictionary with Gemini analysis
        """
        start_time = time.time()
        
        try:
            self._init_gemini()
            
            if self.gemini is None:
                return {
                    "success": False,
                    "error": "Gemini API not available. Please set GEMINI_API_KEY.",
                    "mode": "online"
                }
            
            result = self.gemini.detect_disease(image_base64, crop_hint=crop)
            
            total_time = time.time() - start_time
            result["total_time_ms"] = int(total_time * 1000)
            
            return result
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Online detection failed: {str(e)}",
                "mode": "online"
            }
    
    def get_available_crops(self) -> List[str]:
        """Get list of available crops for offline detection"""
        return list(self.models.keys())
    
    def get_service_info(self) -> Dict:
        """Get service information"""
        models_info = {}
        for crop, detector in self.models.items():
            models_info[crop] = detector.get_model_info()
        
        return {
            "service": "Disease Detection Service",
            "version": self.model_version,
            "mode": "hybrid (offline + online)",
            "offline_models": models_info,
            "online_available": self.gemini is not None or os.getenv("GEMINI_API_KEY") is not None,
            "preprocessor": {
                "target_size": self.preprocessor.target_size,
                "normalization": "0-1 range"
            },
            "available_crops": self.get_available_crops(),
            "treatments_loaded": len(self.treatments)
        }
    
    def health_check(self) -> Dict:
        """Health check for the service"""
        try:
            models_healthy = len(self.models) > 0
            
            gemini_available = False
            if os.getenv("GEMINI_API_KEY"):
                self._init_gemini()
                gemini_available = self.gemini is not None
            
            return {
                "status": "healthy" if models_healthy else "degraded",
                "offline_models_loaded": len(self.models),
                "available_crops": self.get_available_crops(),
                "online_mode_available": gemini_available,
                "model_version": self.model_version
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e)
            }
