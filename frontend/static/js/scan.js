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
const categoryWarningMessage = document.getElementById(
  "categoryWarningMessage",
);

const liveScan = document.getElementById("liveScan");
const cameraArea = document.getElementById("cameraArea");
const webcam = document.getElementById("webcam");
const captureImage = document.getElementById("captureImage");

let localStream = null;

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

// Theme
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

  document.addEventListener("click", () => {
    scanMenu.classList.remove("show");
  });

  scanMenu.addEventListener("click", (e) => {
    e.stopPropagation();
  });
}

// Tabs
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

// URL type
const urlParams = new URLSearchParams(window.location.search);
const selectedType = urlParams.get("type");

if (selectedType) {
  changeScanType(selectedType);
}

// Image preview
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

// Analyze image
if (scanNow) {
  scanNow.addEventListener("click", async () => {
    console.log("Analyze button clicked");

    if (!foodImage || !foodImage.files || !foodImage.files[0]) {
      alert("Please upload an image first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", foodImage.files[0]);
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

    try {
      console.log("Sending request to /predict");

      const response = await fetch("/predict", {
        method: "POST",
        body: formData,
      });

      console.log("Response received:", response.status);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Prediction failed.");
      }

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

      if (data.warning) {
        if (categoryWarningMessage) {
          categoryWarningMessage.textContent = data.warning;
        }

        if (categoryWarningBox) {
          categoryWarningBox.style.display = "flex";
        }
      } else {
        if (categoryWarningBox) {
          categoryWarningBox.style.display = "none";
        }
      }

      if (resultMessage) {
        resultMessage.textContent = data.message || "Prediction completed.";
      }
    } catch (error) {
      console.error("Prediction error:", error);

      if (foodName) foodName.textContent = "Error";
      if (resultDetectedCategory) resultDetectedCategory.textContent = "Error";

      if (resultStatus) {
        resultStatus.textContent = "Failed ❌";
        resultStatus.className = "spoiled";
      }

      if (resultConfidence) resultConfidence.textContent = "--%";

      if (resultMessage) {
        resultMessage.textContent =
          "Prediction failed. Please try again after a few seconds.";
      }
    } finally {
      scanNow.disabled = false;
      scanNow.textContent = "🔍 Analyze Image";
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

// Live camera
if (liveScan) {
  liveScan.addEventListener("click", async () => {
    try {
      localStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      if (webcam) webcam.srcObject = localStream;
      if (cameraArea) cameraArea.style.display = "block";
    } catch (error) {
      alert("Camera access denied or not available.");
      console.error(error);
    }
  });
}

// Capture camera image
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
