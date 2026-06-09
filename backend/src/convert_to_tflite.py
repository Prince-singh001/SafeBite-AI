import os
import tensorflow as tf

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "../models/safebite_mobilenetv2_model.h5")
TFLITE_PATH = os.path.join(BASE_DIR, "../models/safebite_mobilenetv2_model.tflite")

print("Loading Keras model...")
model = tf.keras.models.load_model(MODEL_PATH, compile=False)

print("Converting to TFLite...")
converter = tf.lite.TFLiteConverter.from_keras_model(model)

# Apply optimizations for size
converter.optimizations = [tf.lite.Optimize.DEFAULT]

tflite_model = converter.convert()

print(f"Saving TFLite model to {TFLITE_PATH}...")
with open(TFLITE_PATH, "wb") as f:
    f.write(tflite_model)

print("Conversion complete!")
