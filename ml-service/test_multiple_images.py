"""
Test model with multiple images to verify predictions
"""
import tensorflow as tf
import numpy as np
from PIL import Image
import os

IMAGE_SIZE = 256

def test_image(model, infer, image_path, expected_class):
    """Test a single image"""
    # Load and preprocess
    img = Image.open(image_path)
    img = img.convert('RGB')
    img = img.resize((IMAGE_SIZE, IMAGE_SIZE), Image.LANCZOS)
    img_array = np.array(img, dtype=np.float32) / 255.0
    img_array = np.expand_dims(img_array, axis=0)
    
    # Predict
    input_tensor = tf.convert_to_tensor(img_array, dtype=tf.float32)
    output = infer(input_tensor)
    predictions = output[list(output.keys())[0]].numpy()[0]
    
    # Get top prediction
    top_idx = np.argmax(predictions)
    confidence = predictions[top_idx]
    
    status = "[OK]" if top_idx == expected_class else "[FAIL]"
    print(f"{status} {os.path.basename(image_path)[:40]:<40} | Expected: Class {expected_class} | Got: Class {top_idx} ({confidence*100:.1f}%)")
    
    return top_idx == expected_class

# Load Tomato model
base_path = os.path.join(os.path.dirname(__file__), "..", "Crop disese classification", "Tomato Disease Clssifier")
model_path = os.path.join(base_path, "models", "1")
model = tf.saved_model.load(model_path)
infer = model.signatures["serving_default"]

class_names = [
    "Tomato_Bacterial_spot",           # 0
    "Tomato_Early_blight",              # 1
    "Tomato_Late_blight",               # 2
    "Tomato_Leaf_Mold",                 # 3
    "Tomato_Septoria_leaf_spot",        # 4
    "Tomato_Spider_mites_Two_spotted_spider_mite",  # 5
    "Tomato__Target_Spot",              # 6
    "Tomato__Tomato_YellowLeaf__Curl_Virus",  # 7
    "Tomato__Tomato_mosaic_virus",      # 8
    "Tomato_healthy"                    # 9
]

print("Testing Tomato Disease Detection Model")
print("=" * 100)

correct = 0
total = 0

# Test each class
for expected_idx, class_name in enumerate(class_names):
    class_folder = os.path.join(base_path, "PlantVillage", class_name)
    
    if os.path.exists(class_folder):
        images = [f for f in os.listdir(class_folder) if f.endswith(('.jpg', '.JPG', '.jpeg'))][:3]  # Test 3 images per class
        
        print(f"\nClass {expected_idx}: {class_name}")
        for img_file in images:
            img_path = os.path.join(class_folder, img_file)
            if test_image(model, infer, img_path, expected_idx):
                correct += 1
            total += 1

print("\n" + "=" * 100)
print(f"Accuracy: {correct}/{total} ({correct/total*100:.1f}%)")
