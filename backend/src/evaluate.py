from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import ImageDataGenerator

IMG_SIZE = 224
BATCH_SIZE = 32

# Load model
model = load_model("../models/mobilenetv2_model.h5")

# Test data
test_datagen = ImageDataGenerator(
    rescale=1./255
)

test_generator = test_datagen.flow_from_directory(
    "../dataset/test",
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode='binary'
)

# Evaluate model
loss, accuracy = model.evaluate(test_generator)

print("\nTest Accuracy:", accuracy)
print("Test Loss:", loss)