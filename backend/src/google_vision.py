import os
import base64
import requests

# Set of terms commonly associated with food, fruits, or vegetables to filter vision results
FOOD_KEYWORDS = {
    "food", "fruit", "vegetable", "produce", "plant", "cuisine", "dish", "ingredient", 
    "onion", "carrot", "mango", "grapes", "strawberry", "blueberry", "pineapple", 
    "watermelon", "pear", "peach", "plum", "cherry", "broccoli", "spinach", 
    "cabbage", "lettuce", "pepper", "chili", "garlic", "ginger", "lemon", "lime",
    "coconut", "mushroom", "radish", "turnip", "avocado", "pumpkin", "squash",
    "corn", "peas", "beans", "potato", "tomato", "cucumber", "banana", "apple",
    "orange", "pizza", "burger", "sandwich", "pasta", "rice", "bread", "cheese",
    "egg", "meat", "chicken", "fish", "salad", "soup", "curry", "sushi"
}

def detect_food_with_google_lens(image_path):
    """
    Attempts to identify the food and get the detection accuracy (score) using Google Cloud Vision API.
    If GOOGLE_VISION_API_KEY is not set, falls back to a smart local mock detection for demo purposes.
    """
    api_key = os.environ.get("GOOGLE_VISION_API_KEY")
    
    if not api_key:
        print("GOOGLE_VISION_API_KEY not found in environment. Using Smart Mock Fallback...")
        return smart_mock_detect(image_path)
    
    try:
        # Encode image to base64
        with open(image_path, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode("utf-8")
            
        url = f"https://vision.googleapis.com/v1/images:annotate?key={api_key}"
        
        payload = {
            "requests": [
                {
                    "image": {
                        "content": encoded_string
                    },
                    "features": [
                        {
                            "type": "LABEL_DETECTION",
                            "maxResults": 15
                        },
                        {
                            "type": "OBJECT_LOCALIZATION",
                            "maxResults": 5
                        }
                    ]
                }
            ]
        }
        
        response = requests.post(url, json=payload, timeout=10)
        
        if response.status_code != 200:
            print(f"Google Vision API returned status code {response.status_code}: {response.text}")
            return smart_mock_detect(image_path)
            
        result = response.json()
        annotations = result.get("responses", [{}])[0].get("labelAnnotations", [])
        
        if not annotations:
            print("No label annotations returned from Google Vision API.")
            return smart_mock_detect(image_path)
            
        # Try to find the first food-related label
        best_label = None
        for ann in annotations:
            desc = ann.get("description", "").lower().strip()
            score = ann.get("score", 0.0) * 100
            
            # Match either direct keywords or check if the word is in our FOOD_KEYWORDS set
            words = desc.split()
            is_food = any(w in FOOD_KEYWORDS for w in words)
            
            if is_food and desc not in ["food", "fruit", "vegetable", "produce", "plant", "cuisine", "dish", "ingredient"]:
                best_label = {
                    "food_name": desc.title(),
                    "confidence": round(score, 2),
                    "source": "Google Vision API"
                }
                break
        
        # Fallback to the top overall label if no specific food match was found
        if not best_label and annotations:
            top_ann = annotations[0]
            best_label = {
                "food_name": top_ann.get("description", "").title(),
                "confidence": round(top_ann.get("score", 0.0) * 100, 2),
                "source": "Google Vision API (Top Label)"
            }
            
        return best_label
        
    except Exception as e:
        print(f"Error calling Google Vision API: {e}. Falling back to Smart Mock...")
        return smart_mock_detect(image_path)

def smart_mock_detect(image_path):
    """
    Simulates Google Lens detection based on filename keywords or patterns.
    """
    filename = os.path.basename(image_path).lower()
    
    # Map common filename keywords to clean display names and category labels
    mock_keywords = {
        "onion": ("Onion", 95.40),
        "carrot": ("Carrot", 92.15),
        "grapes": ("Grapes", 94.80),
        "strawberry": ("Strawberry", 96.20),
        "pineapple": ("Pineapple", 91.50),
        "mango": ("Mango", 95.80),
        "peach": ("Peach", 89.90),
        "pear": ("Pear", 91.00),
        "plum": ("Plum", 88.50),
        "broccoli": ("Broccoli", 93.45),
        "spinach": ("Spinach", 90.30),
        "cabbage": ("Cabbage", 87.20),
        "garlic": ("Garlic", 91.80),
        "ginger": ("Ginger", 86.40),
        "lemon": ("Lemon", 94.30),
        "lime": ("Lime", 92.00),
        "avocado": ("Avocado", 95.10),
        "corn": ("Corn", 93.50),
        "coconut": ("Coconut", 89.20),
        "mushroom": ("Mushroom", 91.40),
        "bellpepper": ("Bell Pepper", 94.60),
        "pepper": ("Pepper", 92.70),
        "apple": ("Apple", 97.20),
        "banana": ("Banana", 96.80),
        "orange": ("Orange", 95.95),
        "tomato": ("Tomato", 96.10),
        "potato": ("Potato", 95.30),
        "cucumber": ("Cucumber", 94.20),
        "bittergourd": ("Bitter Gourd", 92.50),
        "bittergroud": ("Bitter Gourd", 92.50),
        "pizza": ("Pizza", 98.40),
        "burger": ("Burger", 97.80),
        "sandwich": ("Sandwich", 96.50),
        "pasta": ("Pasta", 95.20),
        "rice": ("Rice", 91.30),
        "bread": ("Bread", 94.00)
    }
    
    for kw, (name, confidence) in mock_keywords.items():
        if kw in filename:
            return {
                "food_name": name,
                "confidence": confidence,
                "source": "Google Vision Smart Mock (Filename Match)"
            }
            
    # Default fallback if no keyword matches
    return {
        "food_name": "Unknown Food Item",
        "confidence": 75.00,
        "source": "Google Vision Smart Mock (Default)"
    }
