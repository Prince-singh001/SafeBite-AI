import os
import sys
from tensorflow.keras.models import load_model

# Ensure we can import from preprocessing
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

from preprocessing import get_data_generators

MODEL_PATH = os.path.abspath(os.path.join(BASE_DIR, "../models/safebite_mobilenetv2_model.h5"))

print(f"Loading model from {MODEL_PATH}...")
if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")

model = load_model(MODEL_PATH)

print("Loading test data...")
_, test_generator = get_data_generators()

print("Evaluating model...")
loss, accuracy = model.evaluate(test_generator)

print("\nTest Accuracy:", accuracy)
print("Test Loss:", loss)