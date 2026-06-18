import matplotlib.pyplot as plt
import os

def plot_training_history(history):

    # Create graphs folder
    base_dir = os.path.dirname(os.path.abspath(__file__))
    graphs_dir = os.path.abspath(os.path.join(base_dir, "../graphs"))
    os.makedirs(graphs_dir, exist_ok=True)

    # =========================
    # ACCURACY GRAPH
    # =========================

    plt.figure(figsize=(10,5))

    plt.plot(history.history['accuracy'])
    if 'val_accuracy' in history.history:
        plt.plot(history.history['val_accuracy'])
        plt.legend(['Train', 'Validation'])
    else:
        plt.legend(['Train'])

    plt.title('Model Accuracy')
    plt.xlabel('Epoch')
    plt.ylabel('Accuracy')

    # SAVE GRAPH
    plt.savefig(os.path.join(graphs_dir, "accuracy.png"))

    # CLOSE GRAPH
    plt.close()


    # =========================
    # LOSS GRAPH
    # =========================

    plt.figure(figsize=(10,5))

    plt.plot(history.history['loss'])
    if 'val_loss' in history.history:
        plt.plot(history.history['val_loss'])
        plt.legend(['Train', 'Validation'])
    else:
        plt.legend(['Train'])

    plt.title('Model Loss')
    plt.xlabel('Epoch')
    plt.ylabel('Loss')

    # SAVE GRAPH
    plt.savefig(os.path.join(graphs_dir, "loss.png"))

    # CLOSE GRAPH
    plt.close()

    print("\nGraphs saved successfully!")