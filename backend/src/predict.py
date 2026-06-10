import os
import json
import threading
import numpy as np
import cv2
import tensorflow as tf

IMG_SIZE = 224
MAX_DISPLAY_CONFIDENCE = 97.50

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.abspath(
    os.path.join(BASE_DIR, "..", "models", "safebite_mobilenetv2_model.h5")
)

CLASS_PATH = os.path.abspath(
    os.path.join(BASE_DIR, "..", "models", "class_indices.json")
)

model = None
class_indices = {}
class_names = {}
_model_lock = threading.Lock()


def load_model_once():
    global model, class_indices, class_names

    with _model_lock:
        if model is not None:
            return model

        print("MODEL_PATH:", MODEL_PATH)
        print("MODEL EXISTS:", os.path.exists(MODEL_PATH))
        print("CLASS_PATH:", CLASS_PATH)
        print("CLASS EXISTS:", os.path.exists(CLASS_PATH))

        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")

        if not os.path.exists(CLASS_PATH):
            raise FileNotFoundError(f"Class indices file not found: {CLASS_PATH}")

        with open(CLASS_PATH, "r") as f:
            class_indices = json.load(f)

        class_names = {v: k for k, v in class_indices.items()}

        print("Loading SafeBite AI model...")
        model = tf.keras.models.load_model(MODEL_PATH, compile=False)
        print("Model loaded successfully!")

        dummy = np.zeros((1, IMG_SIZE, IMG_SIZE, 3), dtype=np.float32)
        model.predict(dummy, verbose=0)
        print("Model warmup completed!")

        return model


def format_label(label):
    clean_label = label.lower().strip()

    if clean_label.startswith("fresh"):
        condition = "Fresh"
        item = clean_label.replace("fresh", "", 1)
    elif clean_label.startswith("spoile"):
        condition = "Spoiled"
        item = clean_label.replace("spoile", "", 1)
    elif clean_label.startswith("spoiled"):
        condition = "Spoiled"
        item = clean_label.replace("spoiled", "", 1)
    else:
        condition = "Unknown"
        item = clean_label

    item = item.replace("_", " ")
    item = item.replace("-", " ")
    item = item.replace("bittergroud", "bitter gourd")
    item = item.replace("bittergourd", "bitter gourd")
    item = item.strip().title()

    if item == "Apples":
        item = "Apple"
    if item == "Oranges":
        item = "Orange"

    return item, condition


def preprocess_image(image_path):
    if not os.path.exists(image_path):
        raise ValueError("Image path not found.")

    image = cv2.imread(image_path)

    if image is None:
        raise ValueError("Image not readable.")

    image = cv2.resize(image, (IMG_SIZE, IMG_SIZE), interpolation=cv2.INTER_AREA)
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    image = image.astype("float32") / 255.0
    image = np.expand_dims(image, axis=0)

    return image


def get_top_predictions(prediction, top_n=3):
    prediction = prediction[0]
    top_indices = prediction.argsort()[-top_n:][::-1]

    results = []

    for index in top_indices:
        label = class_names[int(index)]
        item, condition = format_label(label)

        raw_confidence = float(prediction[index] * 100)
        display_confidence = min(raw_confidence, MAX_DISPLAY_CONFIDENCE)

        results.append({
            "label": label,
            "item": item,
            "condition": condition,
            "confidence": round(display_confidence, 2),
            "raw_confidence": round(raw_confidence, 2)
        })

    return results


def check_prediction_stability(top_predictions):
    if not top_predictions:
        return ""

    best = top_predictions[0]

    if best["confidence"] < 55:
        return "Low confidence prediction. Please try a clearer image."

    for other in top_predictions[1:]:
        if (
            other["item"].lower() == best["item"].lower()
            and other["condition"] != best["condition"]
        ):
            margin = abs(best["raw_confidence"] - other["raw_confidence"])
            if margin < 15:
                return "Borderline freshness result. Try better lighting or a clearer image."

    return ""


def predict_image(image_path):
    current_model = load_model_once()

    image = preprocess_image(image_path)

    prediction = current_model.predict(image, verbose=0)

    top_predictions = get_top_predictions(prediction, top_n=3)
    best_result = top_predictions[0]

    stability_warning = check_prediction_stability(top_predictions)

    return {
        "label": best_result["label"],
        "item": best_result["item"],
        "condition": best_result["condition"],
        "confidence": best_result["confidence"],
        "raw_confidence": best_result["raw_confidence"],
        "top_predictions": top_predictions,
        "stability_warning": stability_warning,
        "note": "Confidence is model probability, not guaranteed real-world accuracy."
    }