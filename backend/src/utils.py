import matplotlib.pyplot as plt
import os

def plot_training_history(history):

    # Create graphs folder
    os.makedirs("../graphs", exist_ok=True)

    # =========================
    # ACCURACY GRAPH
    # =========================

    plt.figure(figsize=(10,5))

    plt.plot(history.history['accuracy'])
    plt.plot(history.history['val_accuracy'])

    plt.title('Model Accuracy')
    plt.xlabel('Epoch')
    plt.ylabel('Accuracy')

    plt.legend(['Train', 'Validation'])

    # SAVE GRAPH
    plt.savefig("../graphs/accuracy.png")

    # CLOSE GRAPH
    plt.close()


    # =========================
    # LOSS GRAPH
    # =========================

    plt.figure(figsize=(10,5))

    plt.plot(history.history['loss'])
    plt.plot(history.history['val_loss'])

    plt.title('Model Loss')
    plt.xlabel('Epoch')
    plt.ylabel('Loss')

    plt.legend(['Train', 'Validation'])

    # SAVE GRAPH
    plt.savefig("../graphs/loss.png")

    # CLOSE GRAPH
    plt.close()

    print("\nGraphs saved successfully!")