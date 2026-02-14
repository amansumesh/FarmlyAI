"""
Inspect the saved model signature to understand expected inputs
"""
import tensorflow as tf
import os

model_path = os.path.join(os.path.dirname(__file__), "..", "Crop disese classification", "Tomato Disease Clssifier", "models", "1")

print("Loading model...")
model = tf.saved_model.load(model_path)

print("\nAvailable signatures:")
print(list(model.signatures.keys()))

print("\nDefault signature details:")
infer = model.signatures["serving_default"]
print(f"\nInputs: {infer.structured_input_signature}")
print(f"\nOutputs: {infer.structured_outputs}")

print("\n" + "="*60)
print("Input specs:")
for key, spec in infer.structured_input_signature[1].items():
    print(f"  {key}: shape={spec.shape}, dtype={spec.dtype}")

print("\nOutput specs:")
for key, spec in infer.structured_outputs.items():
    print(f"  {key}: shape={spec.shape}, dtype={spec.dtype}")
