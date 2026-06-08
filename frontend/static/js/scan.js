console.log("SafeBite AI Scan Page Loaded");

const themeToggle = document.getElementById("themeToggle");
const menuBtn = document.getElementById("menuBtn");
const navLinks = document.getElementById("navLinks");

const scanBtn = document.getElementById("scanBtn");
const scanMenu = document.getElementById("scanMenu");

const tabButtons = document.querySelectorAll(".tab-btn");
const scanTitle = document.getElementById("scanTitle");
const scanDesc = document.getElementById("scanDesc");
const resultSelectedCategory = document.getElementById("resultSelectedCategory");
const resultDetectedCategory = document.getElementById("resultDetectedCategory");
const categoryWarningBox = document.getElementById("categoryWarningBox");
const categoryWarningMessage = document.getElementById("categoryWarningMessage");

const foodImage = document.getElementById("foodImage");
const previewBox = document.getElementById("previewBox");
const scanNow = document.getElementById("scanNow");
const resetScan = document.getElementById("resetScan");

const resultStatus = document.getElementById("resultStatus");
const resultConfidence = document.getElementById("resultConfidence");
const foodName = document.getElementById("foodName");
const resultMessage = document.getElementById("resultMessage");

// Feedback & Retraining Elements
const feedbackSection = document.getElementById("feedbackSection");
const feedbackYes = document.getElementById("feedbackYes");
const feedbackNo = document.getElementById("feedbackNo");
const correctionSection = document.getElementById("correctionSection");
const correctionLabelSelect = document.getElementById("correctionLabelSelect");
const correctionConditionSelect = document.getElementById("correctionConditionSelect");
const submitCorrection = document.getElementById("submitCorrection");
const trainingStatus = document.getElementById("trainingStatus");
const trainingStatusText = document.getElementById("trainingStatusText");

let lastImageUrl = null;
let lastPredictedLabel = null;

// Live Scan Elements
const liveScan = document.getElementById("liveScan");
const uploadArea = document.getElementById("uploadArea");
const cameraArea = document.getElementById("cameraArea");
const webcam = document.getElementById("webcam");
const captureImage = document.getElementById("captureImage");
let localStream = null;

function stopWebcam() {
  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
    localStream = null;
  }
  if (webcam) {
    webcam.srcObject = null;
  }
  if (cameraArea) cameraArea.style.display = "none";
  if (uploadArea) uploadArea.style.display = "flex";
}

// Theme
const savedTheme = localStorage.getItem("theme");

if (savedTheme) {
  document.documentElement.setAttribute("data-theme", savedTheme);
  if (themeToggle)
    themeToggle.textContent = savedTheme === "dark" ? "☀️" : "🌙";
}

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";

    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    themeToggle.textContent = newTheme === "dark" ? "☀️" : "🌙";
  });
}

// Mobile menu
if (menuBtn && navLinks) {
  menuBtn.addEventListener("click", () => {
    navLinks.classList.toggle("active");
  });
}

// Dropdown
if (scanBtn && scanMenu) {
  scanBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    scanMenu.classList.toggle("show");
  });

  scanMenu.addEventListener("click", (e) => e.stopPropagation());

  document.addEventListener("click", () => {
    scanMenu.classList.remove("show");
  });
}

// Scan Data
const scanData = {
  fruit: {
    title: "Fruit Freshness Scan",
    desc: "Upload fruit image like apple, banana or orange.",
    category: "Fruit",
  },
  vegetable: {
    title: "Vegetable Freshness Scan",
    desc: "Upload vegetable image like tomato, potato, cucumber or bitter gourd.",
    category: "Vegetable",
  },
  food: {
    title: "Food Freshness Scan",
    desc: "Upload food image for AI freshness detection.",
    category: "Food",
  },
};

function resetResultOnly() {
  if (foodName) foodName.textContent = "Waiting...";
  if (resultDetectedCategory) resultDetectedCategory.textContent = "Waiting...";
  if (resultStatus) {
    resultStatus.textContent = "Waiting...";
    resultStatus.className = "fresh";
  }
  if (resultConfidence) resultConfidence.textContent = "--%";
  if (categoryWarningBox) categoryWarningBox.style.display = "none";
  if (categoryWarningMessage) categoryWarningMessage.textContent = "";
  if (resultMessage)
    resultMessage.textContent = "Upload an image and click Analyze Image.";

  // Hide feedback and correction modules
  if (feedbackSection) feedbackSection.style.display = "none";
  if (correctionSection) correctionSection.style.display = "none";
  if (trainingStatus) trainingStatus.style.display = "none";
  if (correctionLabelSelect) correctionLabelSelect.selectedIndex = 0;
  if (correctionConditionSelect) correctionConditionSelect.selectedIndex = 0;
  
  const uploadScannerLine = document.getElementById("uploadScannerLine");
  if (uploadScannerLine) uploadScannerLine.style.display = "none";
  
  lastImageUrl = null;
  lastPredictedLabel = null;
}

function changeScanType(type) {
  if (!scanData[type]) return;

  tabButtons.forEach((btn) => {
    btn.classList.remove("active");
    if (btn.dataset.type === type) btn.classList.add("active");
  });

  if (scanTitle) scanTitle.textContent = scanData[type].title;
  if (scanDesc) scanDesc.textContent = scanData[type].desc;
  if (resultSelectedCategory) resultSelectedCategory.textContent = scanData[type].category;

  stopWebcam();
  resetResultOnly();
}

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const type = btn.dataset.type;
    changeScanType(type);
    window.history.pushState(
      {},
      "",
      `${window.location.pathname}?type=${type}`,
    );
  });
});

// URL type auto select
const urlParams = new URLSearchParams(window.location.search);
const selectedType = urlParams.get("type");
if (selectedType) changeScanType(selectedType);

// Image preview
if (foodImage && previewBox) {
  foodImage.addEventListener("change", () => {
    const file = foodImage.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (e) {
      previewBox.innerHTML = `<img src="${e.target.result}" alt="Uploaded Food Image">`;
    };

    reader.readAsDataURL(file);
    resetResultOnly();
  });
}

// Real backend prediction
if (scanNow) {
  scanNow.addEventListener("click", async () => {
    if (!foodImage || !foodImage.files[0]) {
      alert("Please upload an image first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", foodImage.files[0]);

    // Add selected category to the formData
    const activeTab = document.querySelector(".tab-btn.active");
    const selectedCategory = activeTab ? activeTab.dataset.type : "fruit";
    formData.append("selected_category", selectedCategory);

    scanNow.disabled = true;
    scanNow.textContent = "Analyzing...";

    const uploadScannerLine = document.getElementById("uploadScannerLine");
    if (uploadScannerLine) uploadScannerLine.style.display = "block";

    if (foodName) foodName.textContent = "Detecting...";
    if (resultDetectedCategory) resultDetectedCategory.textContent = "Detecting...";
    if (resultStatus) {
      resultStatus.textContent = "Analyzing...";
      resultStatus.className = "fresh";
    }
    if (resultConfidence) resultConfidence.textContent = "Processing...";
    if (categoryWarningBox) categoryWarningBox.style.display = "none";
    if (categoryWarningMessage) categoryWarningMessage.textContent = "";
    if (resultMessage)
      resultMessage.textContent = "AI model is analyzing the uploaded image...";

    try {
      const response = await fetch("/predict", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Prediction failed.");
      }

      if (foodName) foodName.textContent = data.food_name || "Unknown";
      if (resultSelectedCategory) resultSelectedCategory.textContent = data.selected_category || "Waiting...";
      if (resultDetectedCategory) resultDetectedCategory.textContent = data.detected_category || "Waiting...";

      if (resultStatus) {
        resultStatus.textContent =
          data.condition === "Fresh" ? "Fresh ✅" : "Spoiled ⚠️";

        resultStatus.className =
          data.condition === "Fresh" ? "fresh" : "spoiled";
      }

      if (resultConfidence) {
        resultConfidence.textContent = `${data.confidence}%`;
      }

      // Handle Category Warnings
      if (data.warning) {
        if (categoryWarningMessage) categoryWarningMessage.textContent = data.warning;
        if (categoryWarningBox) categoryWarningBox.style.display = "flex";
      } else {
        if (categoryWarningBox) categoryWarningBox.style.display = "none";
      }

      if (resultMessage) {
        resultMessage.textContent = data.message || "Prediction completed.";
      }

      // Record prediction details for retraining
      lastImageUrl = data.image_url;
      lastPredictedLabel = data.label;

      // Render feedback query UI
      if (feedbackSection) feedbackSection.style.display = "block";
    } catch (error) {
      if (foodName) foodName.textContent = "Error";
      if (resultDetectedCategory) resultDetectedCategory.textContent = "Error";
      if (resultStatus) {
        resultStatus.textContent = "Failed ❌";
        resultStatus.className = "spoiled";
      }
      if (resultConfidence) resultConfidence.textContent = "--%";
      if (categoryWarningBox) categoryWarningBox.style.display = "none";
      if (resultMessage) resultMessage.textContent = error.message;
    } finally {
      scanNow.disabled = false;
      scanNow.textContent = "Analyze Image";
      const uploadScannerLine = document.getElementById("uploadScannerLine");
      if (uploadScannerLine) uploadScannerLine.style.display = "none";
    }
  });
}

// Reset scan
if (resetScan) {
  resetScan.addEventListener("click", () => {
    stopWebcam();
    if (foodImage) foodImage.value = "";

    if (previewBox) {
      previewBox.innerHTML = `
        <span class="upload-icon">📷</span>
        <h3>Click to Upload Image</h3>
        <p>Supported: JPG, PNG, JPEG, WEBP</p>
      `;
    }

    resetResultOnly();
  });
}

// Live Camera Scan Event Listeners
if (liveScan) {
  liveScan.addEventListener("click", async () => {
    // Toggle off if camera is already running
    if (localStream) {
      stopWebcam();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      localStream = stream;
      if (webcam) webcam.srcObject = stream;
      if (uploadArea) uploadArea.style.display = "none";
      if (cameraArea) cameraArea.style.display = "block";
      resetResultOnly();
    } catch (err) {
      alert("Camera permission denied or camera not available: " + err.message);
    }
  });
}

if (captureImage) {
  captureImage.addEventListener("click", () => {
    if (!localStream || !webcam) return;

    const canvas = document.createElement("canvas");
    canvas.width = webcam.videoWidth || 640;
    canvas.height = webcam.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(webcam, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const filename = "captured_food_" + Date.now() + ".jpg";
        const capturedFile = new File([blob], filename, { type: "image/jpeg" });

        // Programmatically set files list using DataTransfer
        const dt = new DataTransfer();
        dt.items.add(capturedFile);
        if (foodImage) foodImage.files = dt.files;

        if (previewBox) {
          previewBox.innerHTML = `<img src="${canvas.toDataURL("image/jpeg")}" alt="Captured Food Image">`;
        }

        stopWebcam();
        resetResultOnly();
      }
    }, "image/jpeg", 0.95);
  });
}

// User Feedback loops
if (feedbackYes) {
  feedbackYes.addEventListener("click", async () => {
    if (!lastImageUrl || !lastPredictedLabel) return;

    if (feedbackSection) feedbackSection.style.display = "none";
    if (trainingStatus) {
      if (trainingStatusText) trainingStatusText.textContent = "Saving image to dataset...";
      trainingStatus.style.display = "flex";
    }

    try {
      const response = await fetch("/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_url: lastImageUrl,
          label: lastPredictedLabel,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit feedback.");
      }

      if (resultMessage) {
        resultMessage.textContent = data.message || "Thank you! Image saved successfully.";
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      if (trainingStatus) trainingStatus.style.display = "none";
    }
  });
}

if (feedbackNo) {
  feedbackNo.addEventListener("click", () => {
    if (feedbackSection) feedbackSection.style.display = "none";
    if (correctionSection) correctionSection.style.display = "block";
  });
}

if (submitCorrection) {
  submitCorrection.addEventListener("click", async () => {
    if (!lastImageUrl) return;

    const itemVal = correctionLabelSelect ? correctionLabelSelect.value : "";
    const condVal = correctionConditionSelect ? correctionConditionSelect.value : "";

    if (!itemVal || !condVal) {
      alert("Please select both correct item and condition.");
      return;
    }

    const prefix = condVal === "fresh" ? "fresh" : "spoile";
    const targetLabel = prefix + itemVal;

    if (submitCorrection) submitCorrection.disabled = true;
    if (trainingStatus) {
      if (trainingStatusText) trainingStatusText.textContent = "Retraining model weights on this image...";
      trainingStatus.style.display = "flex";
    }

    try {
      const response = await fetch("/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_url: lastImageUrl,
          label: targetLabel,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to retrain model.");
      }

      if (correctionSection) correctionSection.style.display = "none";
      if (resultMessage) {
        resultMessage.textContent = "Model retrained successfully! Upload the image again to predict correctly. ✅";
      }
    } catch (err) {
      alert("Retraining Error: " + err.message);
    } finally {
      if (submitCorrection) submitCorrection.disabled = false;
      if (trainingStatus) trainingStatus.style.display = "none";
    }
  });
}

// Sample image buttons functionality
const sampleButtons = document.querySelectorAll(".sample-btn");
sampleButtons.forEach((btn) => {
  btn.addEventListener("click", async () => {
    const imageUrl = btn.getAttribute("data-image");
    const itemType = btn.getAttribute("data-type");

    changeScanType(itemType);
    window.history.pushState(
      {},
      "",
      `${window.location.pathname}?type=${itemType}`,
    );

    if (previewBox) {
      previewBox.innerHTML = `<img src="${imageUrl}" alt="Loading Sample Image...">`;
    }

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const filename = imageUrl.substring(imageUrl.lastIndexOf("/") + 1);
      const sampleFile = new File([blob], filename, { type: "image/jpeg" });

      const dt = new DataTransfer();
      dt.items.add(sampleFile);
      if (foodImage) foodImage.files = dt.files;

      if (scanNow) scanNow.click();
    } catch (err) {
      console.error("Failed to load sample image: ", err);
      alert("Failed to load sample image.");
    }
  });
});

