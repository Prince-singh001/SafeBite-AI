import os
import json
import numpy as np
import cv2
import tensorflow as tf

from tensorflow.keras.preprocessing.image import img_to_array

IMG_SIZE = 224
MAX_DISPLAY_CONFIDENCE = 97.50

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(
    BASE_DIR,
    "../models/safebite_mobilenetv2_model.h5"
)

CLASS_PATH = os.path.join(
    BASE_DIR,
    "../models/class_indices.json"
)

# Load Model
print("Loading SafeBite AI model...")

model = tf.keras.models.load_model(
    MODEL_PATH,
    compile=False
)

print("Model loaded successfully!")

# Load Class Indices
with open(CLASS_PATH, "r") as f:
    class_indices = json.load(f)

class_names = {v: k for k, v in class_indices.items()}