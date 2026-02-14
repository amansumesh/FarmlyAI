"""Test disease detection with actual models"""
import requests
import json
import base64
from PIL import Image
import io

def create_test_image(color='red'):
    """Create a simple test image and convert to base64"""
    img = Image.new('RGB', (256, 256), color=color)
    buffered = io.BytesIO()
    img.save(buffered, format="JPEG")
    img_bytes = buffered.getvalue()
    img_base64 = base64.b64encode(img_bytes).decode('utf-8')
    return img_base64

def test_offline_detection(crop='tomato'):
    """Test offline disease detection"""
    url = "http://localhost:8000/ml/detect-disease"
    
    image_base64 = create_test_image('red' if crop == 'tomato' else 'brown')
    
    payload = {
        "image_base64": image_base64,
        "crop": crop,
        "mode": "offline",
        "top_k": 3
    }
    
    print(f"\n--- Testing {crop} (Offline Mode) ---")
    response = requests.post(url, json=payload)
    
    print(f"Status Code: {response.status_code}")
    result = response.json()
    
    if result.get("success"):
        print(f"[OK] Detection successful")
        print(f"  Top prediction: {result['top_prediction']['disease']}")
        print(f"  Confidence: {result['top_prediction']['confidence'] * 100:.2f}%")
        print(f"  Severity: {result['top_prediction']['severity']}")
        print(f"  Inference time: {result['inference_time_ms']}ms")
        print(f"\n  All predictions:")
        for i, pred in enumerate(result['predictions'], 1):
            print(f"    {i}. {pred['disease']} - {pred['confidence']*100:.2f}%")
    else:
        print(f"[FAIL] {result.get('error')}")
    
    return result

def test_online_detection(crop='other'):
    """Test online disease detection with Gemini"""
    url = "http://localhost:8000/ml/detect-disease"
    
    image_base64 = create_test_image('green')
    
    payload = {
        "image_base64": image_base64,
        "crop": crop,
        "mode": "online",
        "top_k": 3
    }
    
    print(f"\n--- Testing {crop} (Online Mode - Gemini) ---")
    response = requests.post(url, json=payload)
    
    print(f"Status Code: {response.status_code}")
    result = response.json()
    
    if result.get("success"):
        print(f"[OK] Online detection successful")
        print(f"  Analysis:\n{result.get('analysis', 'N/A')[:500]}...")
    else:
        print(f"[INFO] {result.get('error')}")
        print(f"  (This is expected if GEMINI_API_KEY is not set)")
    
    return result

if __name__ == "__main__":
    print("=== Disease Detection API Test ===")
    
    print("\n1. Testing Available Crops")
    response = requests.get("http://localhost:8000/ml/available-crops")
    crops_data = response.json()
    print(f"Available crops: {crops_data['crops']}")
    print(f"Online mode available: {crops_data['online_available']}")
    
    print("\n2. Testing Offline Detection")
    for crop in ['tomato', 'potato', 'pepperbell']:
        test_offline_detection(crop)
    
    print("\n3. Testing Online Detection (Gemini)")
    test_online_detection('other')
    
    print("\n\n=== All tests complete ===")
