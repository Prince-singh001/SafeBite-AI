import os

backend_dir = os.path.dirname(os.path.abspath(__file__))
train_path = os.path.join(backend_dir, "dataset/Train")
test_path = os.path.join(backend_dir, "dataset/Test")

print("--- Train directory counts ---")
if os.path.exists(train_path):
    for d in sorted(os.listdir(train_path)):
        p = os.path.join(train_path, d)
        if os.path.isdir(p):
            print(f"{d}: {len(os.listdir(p))} files")
else:
    print("Train path not found")

print("\n--- Test directory counts ---")
if os.path.exists(test_path):
    for d in sorted(os.listdir(test_path)):
        p = os.path.join(test_path, d)
        if os.path.isdir(p):
            print(f"{d}: {len(os.listdir(p))} files")
else:
    print("Test path not found")
