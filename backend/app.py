import os
import shutil
from datetime import datetime
from flask import Flask, request, jsonify, render_template
from werkzeug.utils import secure_filename
from src.predict import predict_image

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

TEMPLATE_FOLDER = os.path.join(BASE_DIR, "../frontend/templates")
STATIC_FOLDER = os.path.join(BASE_DIR, "../frontend/static")

app = Flask(__name__, template_folder=TEMPLATE_FOLDER, static_folder=STATIC_FOLDER)
app.secret_key = "safebite_secret_key"

UPLOAD_FOLDER = os.path.join(STATIC_FOLDER, "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


import json
HISTORY_FILE = os.path.join(BASE_DIR, "history.json")


def load_history():
    if not os.path.exists(HISTORY_FILE):
        return []
    try:
        with open(HISTORY_FILE, "r") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading history: {e}")
        return []


def save_to_history(scan_record):
    history = load_history()
    history.insert(0, scan_record)
    history = history[:50]
    try:
        with open(HISTORY_FILE, "w") as f:
            json.dump(history, f, indent=4)
    except Exception as e:
        print(f"Error saving history: {e}")



@app.route("/")
def home():
    return render_template("index.html")


@app.route("/scan")
def scan():
    return render_template("scan.html")


@app.route("/about")
def about():
    return render_template("about.html")


@app.route("/features")
def features():
    return render_template("features.html")


@app.route("/contact")
def contact():
    return render_template("contact.html")


@app.route("/history")
def history():
    history_data = load_history()
    return render_template("history.html", history=history_data)


@app.route("/clear-history", methods=["POST"])
def clear_history():
    try:
        if os.path.exists(HISTORY_FILE):
            os.remove(HISTORY_FILE)
        return jsonify({"success": True, "message": "History cleared successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500



@app.route("/predict", methods=["POST"])
def predict():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "Only JPG, JPEG, PNG, WEBP allowed"}), 400

    filename = secure_filename(file.filename)
    filename = datetime.now().strftime("%Y%m%d%H%M%S_") + filename

    image_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    file.save(image_path)

    try:
        result = predict_image(image_path)

        message = (
            "Fresh food detected ✅ Safe and healthy."
            if result["condition"] == "Fresh"
            else "Spoiled food detected ⚠️ Avoid consuming this food."
        )

        # Parse selected category
        selected_cat_raw = request.form.get("selected_category", "fruit").lower().strip()
        if selected_cat_raw == "fruit":
            selected_category = "Fruit"
        elif selected_cat_raw == "vegetable":
            selected_category = "Vegetable"
        elif selected_cat_raw == "food":
            selected_category = "Food"
        else:
            selected_category = selected_cat_raw.capitalize()

        # Auto-detect category from predicted item name
        item_lower = result["item"].lower().strip()
        if item_lower in ["apple", "apples", "banana", "orange", "oranges", "mango"]:
            detected_category = "Fruit"
        elif item_lower in ["tomato", "potato", "cucumber", "bitter gourd", "bittergourd", "bittergroud"]:
            detected_category = "Vegetable"
        elif item_lower in ["pizza", "burger", "sandwich", "pasta", "rice", "bread"]:
            detected_category = "Food"
        else:
            detected_category = "Unknown"

        # Check for category mismatch
        warning = ""
        if detected_category != "Unknown" and selected_category != detected_category:
            warning = f"You selected {selected_category} Scan, but the model detected {detected_category}."

        scan_record = {
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "food_name": result["item"],
            "condition": result["condition"],
            "confidence": result["confidence"],
            "selected_category": selected_category,
            "detected_category": detected_category,
            "image_url": f"/static/uploads/{filename}",
            "warning": warning
        }
        save_to_history(scan_record)

        return jsonify({
            "food_name": result["item"],
            "condition": result["condition"],
            "confidence": result["confidence"],
            "label": result["label"],
            "message": message,
            "image_url": f"/static/uploads/{filename}",
            "selected_category": selected_category,
            "detected_category": detected_category,
            "warning": warning
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.errorhandler(404)
def not_found(error):
    return render_template("index.html"), 404


@app.route("/feedback", methods=["POST"])
def feedback():
    data = request.json or {}
    image_url = data.get("image_url")
    label = data.get("label")

    if not image_url or not label:
        return jsonify({"error": "Missing image_url or label"}), 400

    filename = os.path.basename(image_url)
    uploaded_image_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)

    if not os.path.exists(uploaded_image_path):
        return jsonify({"error": "Uploaded image not found"}), 404

    dest_dir = os.path.join(BASE_DIR, "dataset/Train", label)
    os.makedirs(dest_dir, exist_ok=True)
    dest_image_path = os.path.join(dest_dir, filename)
    
    try:
        shutil.copy(uploaded_image_path, dest_image_path)
    except Exception as e:
        return jsonify({"error": f"Failed to copy image: {str(e)}"}), 500

    import src.predict as predict_module
    import tensorflow as tf
    import numpy as np

    is_core_class = label in predict_module.class_indices
    trained_real = False

    if is_core_class:
        try:
            processed_image = predict_module.preprocess_image(uploaded_image_path)
            
            target_idx = predict_module.class_indices[label]
            y = np.zeros((1, len(predict_module.class_indices)))
            y[0, target_idx] = 1.0

            # Load the Keras model dynamically from disk for retraining
            keras_model = tf.keras.models.load_model(predict_module.MODEL_PATH, compile=False)

            keras_model.compile(
                optimizer=tf.keras.optimizers.Adam(learning_rate=1e-5),
                loss="categorical_crossentropy",
                metrics=["accuracy"]
            )
            
            keras_model.fit(processed_image, y, epochs=5, verbose=0)
            keras_model.save(predict_module.MODEL_PATH)

            # Re-convert to TFLite model dynamically after retraining
            try:
                print("Re-converting model to TFLite after retraining...")
                converter = tf.lite.TFLiteConverter.from_keras_model(keras_model)
                converter.optimizations = [tf.lite.Optimize.DEFAULT]
                tflite_model = converter.convert()
                with open(predict_module.TFLITE_PATH, "wb") as f:
                    f.write(tflite_model)
                print("TFLite model updated successfully after retraining!")
            except Exception as convert_err:
                print(f"Failed to update TFLite model: {convert_err}")

            # Reload prediction interpreter to pick up new weights
            predict_module.load_model()
            trained_real = True
        except Exception as e:
            print(f"Online retraining failed: {e}")

    return jsonify({
        "success": True,
        "label_saved": label,
        "is_core_class": is_core_class,
        "trained_real": trained_real,
        "message": f"Feedback submitted successfully! Image saved and model retrained on {label}."
    })


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)