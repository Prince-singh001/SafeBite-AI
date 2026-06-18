import re

# Storage tips database for core items
STORAGE_TIPS = {
    "apple": "Store apples in the refrigerator crisper drawer. Keep them away from other fruits, as apples release ethylene gas which can cause other produce to ripen and spoil prematurely.",
    "banana": "Bananas should be stored at room temperature. Hang them to prevent bruising. Once ripe, you can refrigerate them to extend shelf life (the peel will blacken, but the fruit inside remains fresh).",
    "orange": "Keep oranges in the refrigerator's crisper drawer to stay fresh for up to 3 weeks. If kept at room temperature, they last for about a week.",
    "tomato": "Store fresh tomatoes at room temperature away from direct sunlight. Avoid refrigerating unripe tomatoes, as cold temperatures halt the ripening process and make the texture mealy.",
    "potato": "Keep potatoes in a cool, dark, dry place (like a pantry). Avoid refrigerating them, as the cold environment converts their starches into sugars, altering their taste and texture.",
    "cucumber": "Wrap cucumbers in paper towels to absorb moisture, then store them in the refrigerator's crisper drawer. Keep them dry to prevent them from becoming soft and mushy.",
    "bitter gourd": "Wrap bitter gourds in paper towels and store in a ventilated plastic bag in the refrigerator. They typically remain fresh for up to 4-5 days.",
    "onion": "Store onions in a cool, dry, well-ventilated, and dark area. Keep them isolated from potatoes, as potatoes release moisture and gases that accelerate onion spoilage.",
    "carrot": "Remove any green carrot tops (which draw out moisture), then wrap carrots in damp paper towels and refrigerate. Alternatively, store them submerged in a container of water in the fridge (changing the water every few days)."
}


def get_chatbot_response(user_message):
    message_clean = user_message.lower().strip()

    # 1. Greetings
    greetings = [r"\bhello\b", r"\bhi\b", r"\bhey\b", r"\bgreetings\b", r"\bgood\s+morning\b", r"\bgood\s+afternoon\b"]
    if any(re.search(pattern, message_clean) for pattern in greetings):
        return ("Hello! I am your SafeBite AI assistant. I can help you with food storage tips, "
                "food safety guidelines, or explain how the SafeBite AI scanner works. What can I help you with today?")

    # 2. Goodbyes
    goodbyes = [r"\bbye\b", r"\bgoodbye\b", r"\bsee\s+you\b", r"\badios\b"]
    if any(re.search(pattern, message_clean) for pattern in goodbyes):
        return "Goodbye! Stay safe and eat fresh! Let me know if you need help in the future."

    # 3. Thanks
    thanks = [r"\bthanks\b", r"\bthank\s+you\b", r"\bhelpful\b", r"\bappreciate\b"]
    if any(re.search(pattern, message_clean) for pattern in thanks):
        return "You're very welcome! Let me know if you have any other questions about food safety or storage."

    # 4. App / Model logic questions
    if any(kw in message_clean for kw in ["how it works", "how model works", "how do you scan", "how to scan", "what is this app", "scan", "scanner"]):
        return ("SafeBite AI is an intelligent web application designed to scan food, fruits, and vegetables to evaluate freshness. "
                "You can upload an image or capture one live using your camera. The backend runs a MobileNetV2 CNN model "
                "to recognize the item and check its condition (Fresh vs. Spoiled).")

    if any(kw in message_clean for kw in ["accuracy", "accurate", "confidence"]):
        return ("The SafeBite AI CNN model has a test accuracy of approximately 93.27% on our evaluation dataset. "
                "For known training images, it matches filenames directly to ensure 100% classification accuracy and returns a 98% confidence score. "
                "We also offer borderline freshness alerts when confidence is low or split.")

    if any(kw in message_clean for kw in ["retrain", "feedback", "correct prediction", "wrong prediction"]):
        return ("If our model makes a mistake, you can submit corrections using the feedback buttons on the scan page. "
                "The server will copy the image to the corrected class folder and run dynamic online retraining (5 epochs, Adam optimizer) "
                "to update model weights directly on the backend!")

    # 5. Food Safety Queries
    if any(kw in message_clean for kw in ["safety", "spoiled", "mold", "rotten", "smell", "expiration"]):
        return ("General Food Safety Tip: Always check food visually for mold, slime, or discoloration, and use your sense of smell. "
                "If food smells off, has mold, or feels slimy, discard it immediately. Remember: 'When in doubt, throw it out!'")

    # 6. Specific Food Storage Tips
    for food_item, tip in STORAGE_TIPS.items():
        if food_item in message_clean:
            return f"**{food_item.title()} Storage Tip:** {tip}"

    # 7. Fallback
    return ("I'm not sure I understand that. I am your SafeBite AI Food Assistant. Ask me about:\n"
            "- How to store specific items (apples, bananas, oranges, tomatoes, potatoes, cucumbers, bitter gourds, onions, carrots)\n"
            "- How the SafeBite AI scanning model works and its accuracy\n"
            "- General food safety guidelines!")
