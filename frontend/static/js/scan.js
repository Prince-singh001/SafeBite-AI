console.log("SafeBite AI Scan Page Loaded");

const themeToggle = document.getElementById("themeToggle");
const menuBtn = document.getElementById("menuBtn");
const navLinks = document.getElementById("navLinks");

const scanBtn = document.getElementById("scanBtn");
const scanMenu = document.getElementById("scanMenu");

const tabButtons = document.querySelectorAll(".tab-btn");
const scanTitle = document.getElementById("scanTitle");
const scanDesc = document.getElementById("scanDesc");

const resultSelectedCategory =
  document.getElementById("resultSelectedCategory") ||
  document.getElementById("resultCategory");

const resultDetectedCategory =
  document.getElementById("resultDetectedCategory") ||
  document.getElementById("detectedCategory");

const foodImage = document.getElementById("foodImage");
const previewBox = document.getElementById("previewBox");
const scanNow = document.getElementById("scanNow");
const resetScan = document.getElementById("resetScan");

const resultStatus = document.getElementById("resultStatus");
const resultConfidence = document.getElementById("resultConfidence");
const foodName = document.getElementById("foodName");
const resultMessage = document.getElementById("resultMessage");

const categoryWarningBox = document.getElementById("categoryWarningBox");
const categoryWarningMessage = document.getElementById("categoryWarningMessage");

// Stability warning elements
const stabilityWarningBox = document.getElementById("stabilityWarningBox");
const stabilityWarningMessage = document.getElementById("stabilityWarningMessage");

// Top-3 match breakdown elements
const topPredictionsContainer = document.getElementById("topPredictionsContainer");
const topPredictionsList = document.getElementById("topPredictionsList");

// Progress elements
const progressOverlay = document.getElementById("progressOverlay");
const progressStepText = document.getElementById("progressStepText");
const progressBarInner = document.getElementById("progressBarInner");

// Feedback elements
const feedbackSection = document.getElementById("feedbackSection");
const feedbackYes = document.getElementById("feedbackYes");
const feedbackNo = document.getElementById("feedbackNo");
const correctionSection = document.getElementById("correctionSection");
const correctionLabelSelect = document.getElementById("correctionLabelSelect");
const correctionConditionSelect = document.getElementById("correctionConditionSelect");
const submitCorrection = document.getElementById("submitCorrection");
const trainingStatus = document.getElementById("trainingStatus");
const trainingStatusText = document.getElementById("trainingStatusText");

const liveScan = document.getElementById("liveScan");
const cameraArea = document.getElementById("cameraArea");
const webcam = document.getElementById("webcam");
const captureImage = document.getElementById("captureImage");

let localStream = null;
let currentImageUrl = "";
let currentPredictedLabel = "";
let progressInterval = null;

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

function stopWebcam() {
  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
    localStream = null;
  }

  if (webcam) webcam.srcObject = null;
  if (cameraArea) cameraArea.style.display = "none";
}

function resetResultOnly() {
  if (foodName) foodName.textContent = "Waiting...";
  if (resultDetectedCategory) resultDetectedCategory.textContent = "Waiting...";

  if (resultStatus) {
    resultStatus.textContent = "Waiting...";
    resultStatus.className = "fresh";
  }

  if (resultConfidence) resultConfidence.textContent = "--%";

  if (resultMessage) {
    resultMessage.textContent = "Upload an image and click Analyze Image.";
  }

  if (categoryWarningBox) categoryWarningBox.style.display = "none";
  if (categoryWarningMessage) categoryWarningMessage.textContent = "";

  if (stabilityWarningBox) stabilityWarningBox.style.display = "none";
  if (stabilityWarningMessage) stabilityWarningMessage.textContent = "";

  if (topPredictionsContainer) topPredictionsContainer.style.display = "none";
  if (topPredictionsList) topPredictionsList.innerHTML = "";

  if (feedbackSection) feedbackSection.style.display = "none";
  if (correctionSection) correctionSection.style.display = "none";
  if (trainingStatus) trainingStatus.style.display = "none";

  stopProgressAnimation(false);
}

function startProgressAnimation() {
  if (progressOverlay) progressOverlay.style.display = "flex";
  let progress = 0;
  if (progressBarInner) progressBarInner.style.width = "0%";
  if (progressStepText) progressStepText.textContent = "Uploading image...";

  clearInterval(progressInterval);
  progressInterval = setInterval(() => {
    if (progress < 92) {
      progress += Math.floor(Math.random() * 6) + 2;
      if (progress > 92) progress = 92;
      if (progressBarInner) progressBarInner.style.width = `${progress}%`;

      if (progressStepText) {
        if (progress < 25) {
          progressStepText.textContent = "Uploading food image to server...";
        } else if (progress < 55) {
          progressStepText.textContent = "AI model running inference (MobileNetV2)...";
        } else if (progress < 80) {
          progressStepText.textContent = "Analyzing predicted label & conditions...";
        } else {
          progressStepText.textContent = "Compiling match probability breakdown...";
        }
      }
    }
  }, 250);
}

function stopProgressAnimation(success = true) {
  clearInterval(progressInterval);
  if (progressOverlay) {
    if (success) {
      if (progressBarInner) progressBarInner.style.width = "100%";
      if (progressStepText) progressStepText.textContent = "Success! Predictions Loaded.";
      setTimeout(() => {
        progressOverlay.style.display = "none";
      }, 550);
    } else {
      progressOverlay.style.display = "none";
    }
  }
}

function changeScanType(type) {
  if (!scanData[type]) return;

  tabButtons.forEach((btn) => {
    btn.classList.remove("active");
    if (btn.dataset.type === type) btn.classList.add("active");
  });

  if (scanTitle) scanTitle.textContent = scanData[type].title;
  if (scanDesc) scanDesc.textContent = scanData[type].desc;
  if (resultSelectedCategory) {
    resultSelectedCategory.textContent = scanData[type].category;
  }

  resetResultOnly();
}

function getSelectedType() {
  const activeTab = document.querySelector(".tab-btn.active");
  return activeTab ? activeTab.dataset.type : "fruit";
}

// Theme management
const savedTheme = localStorage.getItem("theme");

if (savedTheme) {
  document.documentElement.setAttribute("data-theme", savedTheme);
  if (themeToggle) {
    themeToggle.textContent = savedTheme === "dark" ? "☀️" : "🌙";
  }
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

// Mobile menu toggle
if (menuBtn && navLinks) {
  menuBtn.addEventListener("click", () => {
    navLinks.classList.toggle("active");
  });
}

// Scan dropdown navigation
if (scanBtn && scanMenu) {
  scanBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    scanMenu.classList.toggle("show");
  });

  document.addEventListener("click", () => {
    scanMenu.classList.remove("show");
  });

  scanMenu.addEventListener("click", (e) => {
    e.stopPropagation();
  });
}

// Tab selections
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

// Load type from URL if specified
const urlParams = new URLSearchParams(window.location.search);
const selectedType = urlParams.get("type");

if (selectedType) {
  changeScanType(selectedType);
}

// Image file upload preview handler
if (foodImage && previewBox) {
  foodImage.addEventListener("change", () => {
    const file = foodImage.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (e) {
      previewBox.innerHTML = `
        <img src="${e.target.result}" alt="Uploaded Food Image">
      `;
    };

    reader.readAsDataURL(file);
    resetResultOnly();
  });
}

// Hook Sample Buttons directly to input simulation
document.querySelectorAll(".sample-btn").forEach((btn) => {
  btn.addEventListener("click", async (e) => {
    resetResultOnly();
    const imageUrl = btn.getAttribute("data-image");
    const category = btn.getAttribute("data-type");

    changeScanType(category);

    previewBox.innerHTML = `
      <img src="${imageUrl}" alt="Sample Food Image">
    `;

    // Fetch the image from local static folder and convert to a File object
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], imageUrl.split("/").pop(), { type: blob.type });

      const dt = new DataTransfer();
      dt.items.add(file);
      foodImage.files = dt.files;
    } catch (err) {
      console.error("Failed to load sample image into file input:", err);
    }
  });
});

// Analyze image triggering
if (scanNow) {
  scanNow.addEventListener("click", async () => {
    console.log("Analyze button clicked");

    if (!foodImage || !foodImage.files || !foodImage.files[0]) {
      alert("Please upload an image first.");
      return;
    }

    const formData = new FormData();
    const file = foodImage.files[0];
    let fileName = file.name || "image.jpg";
    if (!fileName.includes(".")) {
      fileName += ".jpg";
    }
    formData.append("file", file, fileName);
    formData.append("selected_category", getSelectedType());

    scanNow.disabled = true;
    scanNow.textContent = "Analyzing...";

    if (foodName) foodName.textContent = "Detecting...";
    if (resultDetectedCategory)
      resultDetectedCategory.textContent = "Detecting...";

    if (resultStatus) {
      resultStatus.textContent = "Analyzing...";
      resultStatus.className = "fresh";
    }

    if (resultConfidence) resultConfidence.textContent = "Processing...";
    if (resultMessage) {
      resultMessage.textContent = "AI model is analyzing the uploaded image...";
    }

    // Abort controller for 90-second timeout limit (essential for Render wake-up times)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 90000);

    startProgressAnimation();

    try {
      console.log("Sending request to /predict");

      const response = await fetch("/predict", {
        method: "POST",
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log("Response received:", response.status);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Prediction failed.");
      }

      stopProgressAnimation(true);

      // Save references for feedback
      currentImageUrl = data.image_url || "";
      currentPredictedLabel = data.label || "";

      if (foodName) foodName.textContent = data.food_name || "Unknown";

      if (resultSelectedCategory) {
        resultSelectedCategory.textContent =
          data.selected_category || scanData[getSelectedType()].category;
      }

      if (resultDetectedCategory) {
        resultDetectedCategory.textContent =
          data.detected_category || "Detected";
      }

      if (resultStatus) {
        resultStatus.textContent =
          data.condition === "Fresh" ? "Fresh ✅" : "Spoiled ⚠️";

        resultStatus.className =
          data.condition === "Fresh" ? "fresh" : "spoiled";
      }

      if (resultConfidence) {
        resultConfidence.textContent = `${data.confidence}%`;
      }

      // 1. Mismatch Warning Box
      if (data.warning) {
        if (categoryWarningMessage) categoryWarningMessage.textContent = data.warning;
        if (categoryWarningBox) categoryWarningBox.style.display = "flex";
      } else {
        if (categoryWarningBox) categoryWarningBox.style.display = "none";
      }

      // 2. Stability Warning Box
      if (data.stability_warning) {
        if (stabilityWarningMessage) stabilityWarningMessage.textContent = data.stability_warning;
        if (stabilityWarningBox) stabilityWarningBox.style.display = "flex";
      } else {
        if (stabilityWarningBox) stabilityWarningBox.style.display = "none";
      }

      // 3. Match Probability Breakdown progress-bars
      if (data.top_predictions && data.top_predictions.length > 0) {
        if (topPredictionsList) {
          topPredictionsList.innerHTML = "";
          data.top_predictions.forEach(pred => {
            const isFresh = pred.condition === "Fresh";
            const colorClass = isFresh ? "fresh" : "spoiled";
            const rowHtml = `
              <div class="pred-breakdown-row">
                <div class="pred-breakdown-labels">
                  <span class="pred-item-name">${pred.item} (${pred.condition})</span>
                  <span class="pred-percentage">${pred.confidence}%</span>
                </div>
                <div class="pred-bar-track">
                  <div class="pred-bar-fill ${colorClass}" style="width: ${pred.confidence}%"></div>
                </div>
              </div>
            `;
            topPredictionsList.insertAdjacentHTML("beforeend", rowHtml);
          });
        }
        if (topPredictionsContainer) topPredictionsContainer.style.display = "block";
      } else {
        if (topPredictionsContainer) topPredictionsContainer.style.display = "none";
      }

      if (resultMessage) {
        resultMessage.textContent = data.message || "Prediction completed.";
      }

      // Reveal feedback form
      if (feedbackSection) feedbackSection.style.display = "block";

    } catch (error) {
      clearTimeout(timeoutId);
      console.error("Prediction error:", error);
      stopProgressAnimation(false);

      if (foodName) foodName.textContent = "Error";
      if (resultDetectedCategory) resultDetectedCategory.textContent = "Error";

      if (resultStatus) {
        resultStatus.textContent = "Failed ❌";
        resultStatus.className = "spoiled";
      }

      if (resultConfidence) resultConfidence.textContent = "--%";

      if (error.name === "AbortError") {
        if (resultMessage) {
          resultMessage.innerHTML = `
            <span style="color:var(--danger);font-weight:bold;">Request timed out (90s).</span><br>
            The Render backend did not respond in time. It might be taking longer to wake up from inactivity.<br>
            <strong>Please click "Analyze Image" again to retry.</strong>
          `;
        }
      } else {
        if (resultMessage) {
          resultMessage.textContent =
            error.message || "Prediction failed. Please try again after a few seconds.";
        }
      }
    } finally {
      scanNow.disabled = false;
      scanNow.textContent = "🔍 Analyze Image";
    }
  });
}

// Reset scan page
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

// Live webcam camera trigger
if (liveScan) {
  liveScan.addEventListener("click", async () => {
    try {
      localStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      if (webcam) webcam.srcObject = localStream;
      if (cameraArea) cameraArea.style.display = "block";
    } catch (error) {
      alert("Camera access denied or not available. Please ensure camera permissions are active.");
      console.error(error);
    }
  });
}

// Capture image from webcam video stream
if (captureImage) {
  captureImage.addEventListener("click", () => {
    if (!localStream || !webcam) return;

    const canvas = document.createElement("canvas");
    canvas.width = webcam.videoWidth || 640;
    canvas.height = webcam.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(webcam, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;

        const file = new File([blob], "captured_food.jpg", {
          type: "image/jpeg",
        });

        const dt = new DataTransfer();
        dt.items.add(file);

        if (foodImage) foodImage.files = dt.files;

        if (previewBox) {
          previewBox.innerHTML = `
            <img src="${canvas.toDataURL("image/jpeg")}" alt="Captured Food Image">
          `;
        }

        stopWebcam();
        resetResultOnly();
      },
      "image/jpeg",
      0.95,
    );
  });
}

// Feedback Yes handler
if (feedbackYes) {
  feedbackYes.addEventListener("click", async () => {
    if (!currentImageUrl || !currentPredictedLabel) return;

    feedbackYes.disabled = true;
    feedbackNo.disabled = true;

    try {
      const response = await fetch("/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: currentImageUrl,
          label: currentPredictedLabel
        })
      });

      const data = await response.json();
      if (feedbackSection) {
        feedbackSection.innerHTML = `<p style="color:var(--primary);font-weight:bold;">✅ Thank you! Feedback recorded.</p>`;
      }
    } catch (err) {
      console.error("Feedback submit failed:", err);
      if (feedbackSection) {
        feedbackSection.innerHTML = `<p style="color:var(--danger);font-weight:bold;">Failed to submit feedback.</p>`;
      }
    }
  });
}

// Feedback No handler -> Opens correction dropdowns
if (feedbackNo) {
  feedbackNo.addEventListener("click", () => {
    if (feedbackSection) feedbackSection.style.display = "none";
    if (correctionSection) correctionSection.style.display = "block";
  });
}

// Submit correction & trigger online retraining
if (submitCorrection) {
  submitCorrection.addEventListener("click", async () => {
    const item = correctionLabelSelect.value;
    const condition = correctionConditionSelect.value;

    if (!item || !condition) {
      alert("Please select both the item name and freshness condition.");
      return;
    }

    // Construct label target (e.g. "spoileapples" or "freshbanana")
    // Keep it exactly aligned with class_indices spelling (no 'd' in spoile for most labels)
    let conditionLabel = condition === "spoiled" ? "spoile" : "fresh";
    
    // Exception mapping for model classes indices consistency
    let finalLabel = "";
    if (item === "apples" || item === "oranges") {
      finalLabel = `${conditionLabel}${item}`; // e.g. "spoileapples"
    } else {
      finalLabel = `${conditionLabel}${item}`; // e.g. "spoilebanana", "spoilebittergroud"
    }

    submitCorrection.disabled = true;
    if (trainingStatus) trainingStatus.style.display = "flex";
    if (trainingStatusText) trainingStatusText.textContent = "Online retraining in progress...";

    try {
      const response = await fetch("/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: currentImageUrl,
          label: finalLabel
        })
      });

      const data = await response.json();

      if (trainingStatus) {
        trainingStatus.style.borderColor = "var(--primary)";
        trainingStatus.style.background = "rgba(20, 241, 149, 0.08)";
        trainingStatus.style.color = "var(--primary)";
      }
      
      const spinnerEl = trainingStatus.querySelector(".spinner");
      if (spinnerEl) spinnerEl.textContent = "✅";
      
      if (trainingStatusText) {
        if (data.trained_real) {
          trainingStatusText.textContent = "Model retrained successfully! Refresh to see improvements.";
        } else {
          trainingStatusText.textContent = "Feedback saved. Offline training queued.";
        }
      }
    } catch (err) {
      console.error("Correction retraining submission failed:", err);
      if (trainingStatus) {
        trainingStatus.style.borderColor = "var(--danger)";
        trainingStatus.style.background = "rgba(255, 92, 124, 0.08)";
        trainingStatus.style.color = "var(--danger)";
      }
      const spinnerEl = trainingStatus.querySelector(".spinner");
      if (spinnerEl) spinnerEl.textContent = "❌";
      if (trainingStatusText) trainingStatusText.textContent = "Retraining failed. Please retry.";
    } finally {
      submitCorrection.disabled = false;
    }
  });
}
