"""
Disease detection model class
"""
import torch
import torch.nn as nn
import torchvision.models as models
import json
import os
from typing import List, Dict, Tuple
import numpy as np


class DiseaseDetectionModel:
    """Disease detection model wrapper"""
    
    def __init__(self, num_classes: int = 25, model_path: str = None):
        """
        Initialize disease detection model
        
        Args:
            num_classes: Number of disease classes
            model_path: Path to saved model weights (optional)
        """
        self.num_classes = num_classes
        self.model_path = model_path
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = None
        self.classes = self._load_classes()
        
    def _load_classes(self) -> List[Dict]:
        """Load disease classes from JSON file"""
        classes_path = os.path.join(
            os.path.dirname(__file__), 
            '..', 
            'data', 
            'disease_classes.json'
        )
        
        with open(classes_path, 'r') as f:
            data = json.load(f)
        
        return data['classes']
    
    def _create_model(self) -> nn.Module:
        """Create MobileNetV2 based model"""
        model = models.mobilenet_v2(pretrained=True)
        
        num_features = model.classifier[1].in_features
        model.classifier[1] = nn.Linear(num_features, self.num_classes)
        
        return model
    
    def load_model(self):
        """Load or create model"""
        self.model = self._create_model()
        
        if self.model_path and os.path.exists(self.model_path):
            print(f"Loading model from {self.model_path}")
            state_dict = torch.load(self.model_path, map_location=self.device)
            self.model.load_state_dict(state_dict)
            print("Model loaded successfully")
        else:
            print("Using pre-trained MobileNetV2 base model (fine-tuning needed for production)")
        
        self.model.to(self.device)
        self.model.eval()
        
        return self.model
    
    def predict(self, image_tensor: torch.Tensor, top_k: int = 3) -> List[Dict]:
        """
        Predict disease from image tensor
        
        Args:
            image_tensor: Preprocessed image tensor
            top_k: Number of top predictions to return
            
        Returns:
            List of prediction dictionaries
        """
        if self.model is None:
            self.load_model()
        
        image_tensor = image_tensor.to(self.device)
        
        with torch.no_grad():
            outputs = self.model(image_tensor)
            probabilities = torch.nn.functional.softmax(outputs, dim=1)
            
            top_probs, top_indices = torch.topk(probabilities, top_k, dim=1)
            
            top_probs = top_probs.cpu().numpy()[0]
            top_indices = top_indices.cpu().numpy()[0]
        
        predictions = []
        for prob, idx in zip(top_probs, top_indices):
            class_info = self.classes[idx]
            
            severity = self._calculate_severity(prob, class_info)
            
            predictions.append({
                "disease": class_info["disease"],
                "crop": class_info["crop"],
                "confidence": float(prob),
                "severity": severity,
                "class_name": class_info["name"]
            })
        
        return predictions
    
    def _calculate_severity(self, confidence: float, class_info: Dict) -> str:
        """
        Calculate severity based on confidence and thresholds
        
        Args:
            confidence: Prediction confidence
            class_info: Class information with thresholds
            
        Returns:
            Severity level string
        """
        if class_info["disease"] == "Healthy":
            return "none"
        
        thresholds = class_info["severity_threshold"]
        
        if confidence >= thresholds["critical"]:
            return "critical"
        elif confidence >= thresholds["high"]:
            return "high"
        elif confidence >= thresholds["moderate"]:
            return "moderate"
        elif confidence >= thresholds["low"]:
            return "low"
        else:
            return "uncertain"
    
    def get_model_info(self) -> Dict:
        """Get model information"""
        return {
            "num_classes": self.num_classes,
            "device": str(self.device),
            "model_loaded": self.model is not None,
            "model_type": "MobileNetV2",
            "classes": len(self.classes)
        }


class MockDiseaseDetectionModel:
    """Mock model for testing when real model is not available"""
    
    def __init__(self):
        """Initialize mock model"""
        self.device = "cpu"
        self.model = None
        self.classes = self._load_classes()
        
    def _load_classes(self) -> List[Dict]:
        """Load disease classes from JSON file"""
        classes_path = os.path.join(
            os.path.dirname(__file__), 
            '..', 
            'data', 
            'disease_classes.json'
        )
        
        with open(classes_path, 'r') as f:
            data = json.load(f)
        
        return data['classes']
    
    def load_model(self):
        """Mock load model"""
        print("Using mock disease detection model for development")
        self.model = "mock_model"
        return self.model
    
    def predict(self, image_tensor: torch.Tensor, top_k: int = 3) -> List[Dict]:
        """
        Mock prediction - returns realistic fake predictions
        
        Args:
            image_tensor: Preprocessed image tensor (ignored)
            top_k: Number of top predictions to return
            
        Returns:
            List of mock prediction dictionaries
        """
        if self.model is None:
            self.load_model()
        
        np.random.seed(42)
        
        selected_indices = np.random.choice(len(self.classes), min(top_k, len(self.classes)), replace=False)
        
        confidences = np.random.dirichlet(np.ones(top_k))
        confidences = np.sort(confidences)[::-1]
        
        predictions = []
        for idx, conf in zip(selected_indices, confidences):
            class_info = self.classes[idx]
            
            severity = self._calculate_severity(conf, class_info)
            
            predictions.append({
                "disease": class_info["disease"],
                "crop": class_info["crop"],
                "confidence": float(conf),
                "severity": severity,
                "class_name": class_info["name"]
            })
        
        return predictions
    
    def _calculate_severity(self, confidence: float, class_info: Dict) -> str:
        """Calculate severity (same as real model)"""
        if class_info["disease"] == "Healthy":
            return "none"
        
        thresholds = class_info["severity_threshold"]
        
        if confidence >= thresholds["critical"]:
            return "critical"
        elif confidence >= thresholds["high"]:
            return "high"
        elif confidence >= thresholds["moderate"]:
            return "moderate"
        elif confidence >= thresholds["low"]:
            return "low"
        else:
            return "uncertain"
    
    def get_model_info(self) -> Dict:
        """Get model information"""
        return {
            "num_classes": 25,
            "device": "cpu",
            "model_loaded": True,
            "model_type": "MockModel",
            "classes": len(self.classes),
            "note": "This is a mock model for development"
        }
