"""Test script to verify models load correctly"""
import sys
sys.path.insert(0, '.')

print("Testing model loading...")

try:
    from app.models.tf_disease_detector import get_available_crops, TFDiseaseDetector
    
    crops = get_available_crops()
    print(f"\nAvailable crops: {crops}")
    
    for crop in crops:
        print(f"\n--- Testing {crop} model ---")
        try:
            detector = TFDiseaseDetector(crop)
            detector.load_model()
            print(f"[OK] {crop} model loaded successfully")
            print(f"  Classes: {len(detector.classes)}")
        except Exception as e:
            print(f"[FAIL] {crop} model failed: {str(e)}")
    
    print("\n=== Model loading test complete ===")
    
except Exception as e:
    print(f"Error: {str(e)}")
    import traceback
    traceback.print_exc()
