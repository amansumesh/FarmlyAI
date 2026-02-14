"""
Google Gemini API integration for online disease detection
"""
import os
import base64
from typing import Dict
import google.generativeai as genai
from PIL import Image
import io


class GeminiDiseaseDetector:
    """Uses Google Gemini for plant disease detection when online"""
    
    def __init__(self):
        """Initialize Gemini API"""
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-2.0-flash')
    
    def detect_disease(self, image_base64: str, crop_hint: str = None) -> Dict:
        """
        Detect plant disease using Gemini Vision API
        
        Args:
            image_base64: Base64 encoded image
            crop_hint: Optional crop hint for better accuracy
            
        Returns:
            Dictionary with disease detection results
        """
        try:
            if ',' in image_base64:
                image_base64 = image_base64.split(',')[1]
            
            image_bytes = base64.b64decode(image_base64)
            image = Image.open(io.BytesIO(image_bytes))
            
            if crop_hint and crop_hint.lower() != "other":
                prompt = f"""Analyze this {crop_hint} plant image and identify any diseases.

Provide a detailed response in the following format:

**Crop Identified:** [crop name]
**Disease Detected:** [disease name or "Healthy"]
**Confidence:** [High/Medium/Low]
**Severity:** [Critical/High/Moderate/Low/None]

**Symptoms Observed:**
- [List visible symptoms]

**Treatment Recommendations:**

**Organic Methods:**
- [List organic treatment options]

**Chemical Methods:**
- [List chemical treatment options with dosage]

**Preventive Measures:**
- [List preventive actions]

If the plant appears healthy, state that clearly and provide general care tips."""
            else:
                prompt = """Identify this plant and analyze it for any diseases.

Provide a detailed response in the following format:

**Plant Identified:** [plant/crop name]
**Disease Detected:** [disease name or "Healthy"]
**Confidence:** [High/Medium/Low]
**Severity:** [Critical/High/Moderate/Low/None]

**Symptoms Observed:**
- [List visible symptoms if any]

**Treatment Recommendations:**

**Organic Methods:**
- [List organic treatment options]

**Chemical Methods:**
- [List chemical treatment options with dosage]

**Preventive Measures:**
- [List preventive actions]

If the plant appears healthy, state that clearly and provide general care tips."""
            
            response = self.model.generate_content([prompt, image])
            
            return {
                "success": True,
                "analysis": response.text,
                "model": "gemini-2.0-flash",
                "mode": "online"
            }
            
        except Exception as e:
            import traceback
            error_details = traceback.format_exc()
            print(f"[GEMINI ERROR] {error_details}")
            return {
                "success": False,
                "error": f"Gemini API error: {str(e)}",
                "mode": "online"
            }
    
    def check_availability(self) -> bool:
        """Check if Gemini API is available"""
        try:
            api_key = os.getenv("GEMINI_API_KEY")
            return api_key is not None and len(api_key) > 0
        except:
            return False
