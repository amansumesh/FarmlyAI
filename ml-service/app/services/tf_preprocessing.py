"""
Image preprocessing for TensorFlow models
"""
import io
import base64
from PIL import Image
import numpy as np
from typing import Tuple


class TFImagePreprocessor:
    """Handles image preprocessing for TensorFlow disease detection models"""
    
    def __init__(self, target_size: int = 256):
        """
        Initialize preprocessor with target image size
        
        Args:
            target_size: Target image dimension (width and height)
        """
        self.target_size = (target_size, target_size)
    
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
    
    def preprocess(self, image: Image.Image) -> np.ndarray:
        """
        Preprocess image for TensorFlow model input
        
        NOTE: The saved models have built-in preprocessing layers (Resizing + Rescaling).
        We only convert to numpy array - the model handles resizing and normalization.
        
        Args:
            image: PIL Image object
            
        Returns:
            Numpy array (1, height, width, 3) with values in [0, 255] range
        """
        try:
            img_array = np.array(image)
            
            img_array = img_array.astype(np.float32)
            
            img_array = np.expand_dims(img_array, axis=0)
            
            return img_array
        except Exception as e:
            raise ValueError(f"Failed to preprocess image: {str(e)}")
    
    def preprocess_from_base64(self, base64_string: str) -> np.ndarray:
        """
        Decode and preprocess base64 image
        
        Args:
            base64_string: Base64 encoded image
            
        Returns:
            Preprocessed numpy array
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
