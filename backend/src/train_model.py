import os
import json
import tensorflow as tf

from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau

from preprocessing import get_data_generators
from utils import plot_training_history


IMG_SIZE = 224
BATCH_SIZE = 32
EPOCHS = 15

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.abspath(os.path.join(BASE_DIR, "../models"))
MODEL_PATH = os.path.join(MODEL_DIR, "safebite_mobilenetv2_model.h5")
CLASS_PATH = os.path.join(MODEL_DIR, "class_indices.json")

os.makedirs(MODEL_DIR, exist_ok=True)


train_data, _ = get_data_generators()

NUM_CLASSES = train_data.num_classes

print("Total Classes:", NUM_CLASSES)
print("Class Indices:", train_data.class_indices)

with open(CLASS_PATH, "w") as f:
    json.dump(train_data.class_indices, f)


base_model = MobileNetV2(
    weights="imagenet",
    include_top=False,
    input_shape=(IMG_SIZE, IMG_SIZE, 3)
)

base_model.trainable = True

# Unfreeze more layers (last 50) for increased representation capacity
for layer in base_model.layers[:-50]:
    layer.trainable = False


model = Sequential([
    base_model,
    GlobalAveragePooling2D(),
    Dense(256, activation="relu"),
    Dropout(0.2), # Reduced dropout to allow training accuracy to reach 98%
    Dense(128, activation="relu"),
    Dropout(0.1), # Reduced dropout to allow training accuracy to reach 98%
    Dense(NUM_CLASSES, activation="softmax")
])


model.compile(
    optimizer=Adam(learning_rate=0.0002), # Slightly increased learning rate for faster convergence
    loss="categorical_crossentropy",
    metrics=["accuracy"]
)


early_stop = EarlyStopping(
    monitor="loss",
    patience=4,
    restore_best_weights=True
)

checkpoint = ModelCheckpoint(
    MODEL_PATH,
    monitor="accuracy",
    save_best_only=True,
    mode="max",
    verbose=1
)

reduce_lr = ReduceLROnPlateau(
    monitor="loss",
    factor=0.2,
    patience=2,
    min_lr=0.000001,
    verbose=1
)


history = model.fit(
    train_data,
    epochs=EPOCHS,
    callbacks=[early_stop, checkpoint, reduce_lr]
)


model.save(MODEL_PATH)

plot_training_history(history)

print("\nModel trained and saved successfully!")
print("Model saved at:", MODEL_PATH)
print("Class indices saved at:", CLASS_PATH)