import requests
import json
import base64
from PIL import Image
import io

def create_test_image():
    """Create a simple test image and convert to base64"""
    img = Image.new('RGB', (224, 224), color='green')
    buffered = io.BytesIO()
    img.save(buffered, format="JPEG")
    img_bytes = buffered.getvalue()
    img_base64 = base64.b64encode(img_bytes).decode('utf-8')
    return img_base64

def test_disease_detection():
    """Test the disease detection endpoint"""
    url = "http://localhost:8000/ml/detect-disease"
    
    image_base64 = create_test_image()
    
    payload = {
        "image_base64": image_base64,
        "top_k": 3
    }
    
    print("Sending request to ML service...")
    response = requests.post(url, json=payload)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response:")
    print(json.dumps(response.json(), indent=2))
    
    return response.json()

if __name__ == "__main__":
    result = test_disease_detection()
    
    if result.get("success"):
        print("\n✓ Disease detection test PASSED")
        print(f"  - Inference time: {result.get('inference_time_ms')}ms")
        print(f"  - Total time: {result.get('total_time_ms')}ms")
        print(f"  - Top prediction: {result.get('top_prediction', {}).get('disease')}")
        print(f"  - Confidence: {result.get('top_prediction', {}).get('confidence', 0) * 100:.2f}%")
    else:
        print("\n✗ Disease detection test FAILED")
        print(f"  Error: {result.get('error')}")
