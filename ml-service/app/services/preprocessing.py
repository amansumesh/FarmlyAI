"""
Image preprocessing utilities for disease detection
"""
import io
import base64
from PIL import Image
import numpy as np
import torch
from torchvision import transforms
from typing import Tuple


class ImagePreprocessor:
    """Handles image preprocessing for disease detection model"""
    
    def __init__(self, target_size: Tuple[int, int] = (224, 224)):
        """
        Initialize preprocessor with target image size
        
        Args:
            target_size: Target image dimensions (width, height)
        """
        self.target_size = target_size
        
        self.transform = transforms.Compose([
            transforms.Resize(target_size),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])
    
    def decode_base64_image(self, base64_string: str) -> Image.Image:
        """
        Decode base64 string to PIL Image
        
        Args:
            base64_string: Base64 encoded image string
            
        Returns:
            PIL Image object
        """
        try:
            if ',' in base64_string:
                base64_string = base64_string.split(',')[1]
            
            image_bytes = base64.b64decode(base64_string)
            image = Image.open(io.BytesIO(image_bytes))
            
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            return image
        except Exception as e:
            raise ValueError(f"Failed to decode base64 image: {str(e)}")
    
    def preprocess(self, image: Image.Image) -> torch.Tensor:
        """
        Preprocess image for model input
        
        Args:
            image: PIL Image object
            
        Returns:
            Preprocessed image tensor
        """
        try:
            tensor = self.transform(image)
            tensor = tensor.unsqueeze(0)
            return tensor
        except Exception as e:
            raise ValueError(f"Failed to preprocess image: {str(e)}")
    
    def preprocess_from_base64(self, base64_string: str) -> torch.Tensor:
        """
        Decode and preprocess base64 image
        
        Args:
            base64_string: Base64 encoded image
            
        Returns:
            Preprocessed image tensor
        """
        image = self.decode_base64_image(base64_string)
        return self.preprocess(image)
    
    def get_image_info(self, image: Image.Image) -> dict:
        """
        Get image metadata
        
        Args:
            image: PIL Image object
            
        Returns:
            Dictionary with image info
        """
        return {
            "width": image.width,
            "height": image.height,
            "mode": image.mode,
            "format": image.format
        }
