"""
Test script to verify model predictions match your training setup
"""
import tensorflow as tf
import numpy as np
from PIL import Image
import os

IMAGE_SIZE = 256

def test_model(crop_name, model_path, test_image_path):
    """Test a model with an image"""
    print(f"\n{'='*60}")
    print(f"Testing {crop_name} model")
    print(f"{'='*60}")
    
    # Load model
    print(f"Loading model from: {model_path}")
    model = tf.saved_model.load(model_path)
    infer = model.signatures["serving_default"]
    
    # Load and preprocess image (EXACTLY like training)
    print(f"Loading test image: {test_image_path}")
    img = Image.open(test_image_path)
    img = img.convert('RGB')
    img = img.resize((IMAGE_SIZE, IMAGE_SIZE), Image.LANCZOS)
    
    # Convert to array and normalize (EXACTLY like training: 1.0/255)
    img_array = np.array(img, dtype=np.float32)
    img_array = img_array / 255.0  # Rescaling(1.0/255)
    img_array = np.expand_dims(img_array, axis=0)
    
    print(f"Input shape: {img_array.shape}")
    print(f"Input range: [{img_array.min():.3f}, {img_array.max():.3f}]")
    
    # Run inference
    input_tensor = tf.convert_to_tensor(img_array, dtype=tf.float32)
    output = infer(input_tensor)
    
    # Get predictions
    output_key = list(output.keys())[0]
    predictions = output[output_key].numpy()[0]
    
    # Show top 3 predictions
    top_3_idx = np.argsort(predictions)[-3:][::-1]
    print(f"\nTop 3 predictions:")
    for i, idx in enumerate(top_3_idx, 1):
        print(f"  {i}. Class {idx}: {predictions[idx]:.4f} ({predictions[idx]*100:.2f}%)")
    
    return predictions

# Test each model
if __name__ == "__main__":
    base_path = os.path.join(os.path.dirname(__file__), "..", "Crop disese classification")
    
    # Tomato model test
    tomato_model_path = os.path.join(base_path, "Tomato Disease Clssifier", "models", "1")
    tomato_test_img = os.path.join(base_path, "Tomato Disease Clssifier", "PlantVillage", "Tomato_healthy")
    
    # Find first image in healthy folder
    if os.path.exists(tomato_test_img):
        test_images = [f for f in os.listdir(tomato_test_img) if f.endswith(('.jpg', '.JPG', '.jpeg'))]
        if test_images:
            tomato_test_img = os.path.join(tomato_test_img, test_images[0])
            test_model("Tomato", tomato_model_path, tomato_test_img)
    
    print("\n" + "="*60)
    print("Test complete!")
    print("="*60)
