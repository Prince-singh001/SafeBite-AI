import os
import sys
import numpy as np

backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

from src.predict import predict_image, load_model_once, preprocess_image, class_names

img_path = os.path.join(backend_dir, "../frontend/static/uploads/20260618114121_a_f016.png")
if os.path.exists(img_path):
    print("Image exists!")
    try:
        model = load_model_once()
        img = preprocess_image(img_path)
        pred = model.predict(img)
        print("Raw prediction array:", pred)
        print("Prediction sum:", np.sum(pred))
        print("Class scores:")
        import src.predict as pred_mod
        for idx, score in enumerate(pred[0]):
            print(f"  {pred_mod.class_names[idx]}: {score*100:.2f}%")
        
        res = predict_image(img_path)
        print("Result from predict_image:", res)
    except Exception as e:
        print("Error during test:", e)
else:
    print("Image not found at:", img_path)
