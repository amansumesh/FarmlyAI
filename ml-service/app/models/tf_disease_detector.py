"""
TensorFlow-based disease detection model
"""
import os
import json
import numpy as np
from typing import List, Dict, Optional
import tensorflow as tf


class TFDiseaseDetector:
    """TensorFlow disease detection model wrapper"""
    
    def __init__(self, crop: str):
        """
        Initialize disease detector for a specific crop
        
        Args:
            crop: Crop name (tomato, potato, pepperbell)
        """
        self.crop = crop.lower()
        self.model = None
        self.classes = []
        self.display_names = {}
        self.crop_config = self._load_crop_config()
        
    def _load_crop_config(self) -> Dict:
        """Load crop configuration from JSON file"""
        config_path = os.path.join(
            os.path.dirname(__file__), 
            '..', 
            'data', 
            'crop_classes.json'
        )
        
        with open(config_path, 'r') as f:
            all_configs = json.load(f)
        
        if self.crop not in all_configs:
            raise ValueError(f"Unknown crop: {self.crop}. Available: {list(all_configs.keys())}")
        
        return all_configs[self.crop]
    
    def load_model(self):
        """Load TensorFlow SavedModel"""
        model_path = os.path.join(
            os.path.dirname(__file__),
            '..',
            '..',
            self.crop_config['model_path']
        )
        
        model_path = os.path.normpath(model_path)
        
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model not found at: {model_path}")
        
        print(f"Loading {self.crop_config['name']} model from {model_path}")
        self.model = tf.saved_model.load(model_path)
        
        self.classes = self.crop_config['classes']
        self.display_names = self.crop_config['display_names']
        
        print(f"Model loaded successfully. Classes: {len(self.classes)}")
        
        return self.model
    
    def predict(self, image_array: np.ndarray, top_k: int = 3) -> List[Dict]:
        """
        Predict disease from preprocessed image array
        
        Args:
            image_array: Preprocessed image (1, 256, 256, 3)
            top_k: Number of top predictions to return
            
        Returns:
            List of prediction dictionaries
        """
        if self.model is None:
            self.load_model()
        
        infer = self.model.signatures["serving_default"]
        
        input_tensor = tf.convert_to_tensor(image_array, dtype=tf.float32)
        
        output = infer(input_tensor)
        
        output_key = list(output.keys())[0]
        predictions = output[output_key].numpy()[0]
        
        top_indices = np.argsort(predictions)[-top_k:][::-1]
        top_probs = predictions[top_indices]
        
        results = []
        for idx, prob in zip(top_indices, top_probs):
            class_name = self.classes[idx]
            display_name = self.display_names.get(class_name, class_name)
            
            is_healthy = "healthy" in class_name.lower()
            severity = self._calculate_severity(float(prob), is_healthy)
            
            results.append({
                "disease": display_name,
                "crop": self.crop_config['name'],
                "confidence": float(prob),
                "severity": severity,
                "class_name": class_name
            })
        
        return results
    
    def _calculate_severity(self, confidence: float, is_healthy: bool) -> str:
        """
        Calculate severity based on confidence
        
        Args:
            confidence: Prediction confidence
            is_healthy: Whether this is a healthy prediction
            
        Returns:
            Severity level string
        """
        if is_healthy:
            return "none"
        
        if confidence >= 0.90:
            return "critical"
        elif confidence >= 0.75:
            return "high"
        elif confidence >= 0.60:
            return "moderate"
        elif confidence >= 0.40:
            return "low"
        else:
            return "uncertain"
    
    def get_model_info(self) -> Dict:
        """Get model information"""
        return {
            "crop": self.crop_config['name'],
            "num_classes": len(self.classes),
            "model_loaded": self.model is not None,
            "model_type": "TensorFlow SavedModel",
            "classes": self.classes
        }


def get_available_crops() -> List[str]:
    """Get list of available crops"""
    config_path = os.path.join(
        os.path.dirname(__file__), 
        '..', 
        'data', 
        'crop_classes.json'
    )
    
    with open(config_path, 'r') as f:
        configs = json.load(f)
    
    return list(configs.keys())
