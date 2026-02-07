"""
Disease detection inference service
"""
import time
import json
import os
from typing import Dict, List
import torch

from app.services.preprocessing import ImagePreprocessor
from app.models.disease_detector import DiseaseDetectionModel, MockDiseaseDetectionModel


class DiseaseDetectionService:
    """Service for disease detection inference"""
    
    def __init__(self, use_mock: bool = False):
        """
        Initialize disease detection service
        
        Args:
            use_mock: Whether to use mock model (for development)
        """
        self.preprocessor = ImagePreprocessor(target_size=(224, 224))
        self.use_mock = use_mock
        
        if use_mock:
            self.model = MockDiseaseDetectionModel()
        else:
            model_path = os.getenv("MODEL_PATH", None)
            self.model = DiseaseDetectionModel(num_classes=25, model_path=model_path)
        
        self.model.load_model()
        
        self.treatments = self._load_treatments()
        
        self.model_version = "v1.0.0"
        
    def _load_treatments(self) -> Dict:
        """Load disease treatment information"""
        treatments_path = os.path.join(
            os.path.dirname(__file__), 
            '..', 
            'data', 
            'disease_treatments.json'
        )
        
        with open(treatments_path, 'r') as f:
            return json.load(f)
    
    def detect_disease(self, image_base64: str, top_k: int = 3) -> Dict:
        """
        Detect disease from base64 encoded image
        
        Args:
            image_base64: Base64 encoded image string
            top_k: Number of top predictions to return
            
        Returns:
            Dictionary with predictions and metadata
        """
        start_time = time.time()
        
        try:
            image_tensor = self.preprocessor.preprocess_from_base64(image_base64)
            
            preprocess_time = time.time() - start_time
            
            inference_start = time.time()
            predictions = self.model.predict(image_tensor, top_k=top_k)
            inference_time = time.time() - inference_start
            
            for pred in predictions:
                class_name = pred.get("class_name", "")
                pred["treatments"] = self.treatments.get(class_name, {
                    "organic": ["No treatment information available"],
                    "chemical": ["No treatment information available"],
                    "preventive": ["No treatment information available"]
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
                "model_type": "mock" if self.use_mock else "real"
            }
            
        except ValueError as e:
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Inference failed: {str(e)}",
                "error_type": "inference_error"
            }
    
    def get_service_info(self) -> Dict:
        """Get service information"""
        model_info = self.model.get_model_info()
        
        return {
            "service": "Disease Detection Service",
            "version": self.model_version,
            "model_info": model_info,
            "preprocessor": {
                "target_size": self.preprocessor.target_size,
                "normalization": "ImageNet"
            },
            "available_classes": len(self.model.classes),
            "treatments_loaded": len(self.treatments)
        }
    
    def health_check(self) -> Dict:
        """Health check for the service"""
        try:
            dummy_image = self._create_dummy_image()
            result = self.detect_disease(dummy_image, top_k=1)
            
            return {
                "status": "healthy" if result["success"] else "unhealthy",
                "model_loaded": self.model.model is not None,
                "inference_working": result["success"],
                "model_version": self.model_version
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e)
            }
    
    def _create_dummy_image(self) -> str:
        """Create a dummy base64 image for testing"""
        from PIL import Image
        import io
        import base64
        
        img = Image.new('RGB', (224, 224), color='green')
        
        buffered = io.BytesIO()
        img.save(buffered, format="JPEG")
        img_bytes = buffered.getvalue()
        
        img_base64 = base64.b64encode(img_bytes).decode('utf-8')
        
        return img_base64
