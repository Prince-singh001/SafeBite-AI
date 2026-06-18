import os
import sys
import numpy as np
import tensorflow as tf

backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

from src.predict import preprocess_image, CLASS_PATH, TFLITE_PATH, MODEL_PATH
import json

with open(CLASS_PATH, "r") as f:
    class_indices = json.load(f)
class_names = {v: k for k, v in class_indices.items()}

img_path = os.path.join(backend_dir, "../frontend/static/uploads/20260618114121_a_f016.png")

# TFLite
interpreter = tf.lite.Interpreter(model_path=TFLITE_PATH)
interpreter.allocate_tensors()
input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

img = preprocess_image(img_path)
interpreter.set_tensor(input_details[0]['index'], img)
interpreter.invoke()
pred_tflite = interpreter.get_tensor(output_details[0]['index'])[0]

print("TFLite prediction:", pred_tflite)
print("TFLite class scores:")
for idx, score in enumerate(pred_tflite):
    print(f"  {class_names[idx]}: {score*100:.2f}%")
