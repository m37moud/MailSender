// Default email configuration
const DEFAULT_CONFIG = {
  subject: "Android Developer Position",
  body: `Hello,
I hope this email finds you well.
I am writing to express my interest in the Android Developer position.
With my extensive experience in mobile software development, I believe I can significantly contribute to your organization.
Attached is my CV, which provides further details about how my career background aligns with your requirements.
I would welcome the opportunity to discuss my application with you in person.
Thank you for considering my application.
I look forward to hearing from you soon.
Best regards,
Mahmoud Ali
Tel: +201148588723`,
  attachmentName: "Mahmoud_Ali_CV.pdf"
};

document.addEventListener("DOMContentLoaded", function () {
  const subjectInput = document.getElementById("subjectInput");
  const bodyInput = document.getElementById("bodyInput");
  const attachmentInput = document.getElementById("attachmentInput");
  const fileInfo = document.getElementById("fileInfo");
  const saveBtn = document.getElementById("saveBtn");
  const backBtn = document.getElementById("backBtn");
  const statusDiv = document.getElementById("status");

  // Load existing settings
  loadSettings();

  // Handle file selection
  attachmentInput.addEventListener("change", function(e) {
    const file = e.target.files[0];
    if (file) {
      const sizeKB = (file.size / 1024).toFixed(2);
      fileInfo.textContent = `Selected: ${file.name} (${sizeKB} KB)`;
    } else {
      fileInfo.textContent = "";
    }
  });

  saveBtn.addEventListener("click", saveSettings);
  backBtn.addEventListener("click", () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("popup.html") });
    window.close();
  });
});

function loadSettings() {
  chrome.storage.local.get(['emailConfig'], function(result) {
    const config = result.emailConfig || DEFAULT_CONFIG;
    
    document.getElementById("subjectInput").value = config.subject;
    document.getElementById("bodyInput").value = config.body;
    
    // Show current attachment info if exists
    if (config.attachmentName) {
      const sizeKB = config.attachmentData ? Math.round(config.attachmentData.length * 0.75 / 1024) : 0;
      document.getElementById("fileInfo").textContent = `Current: ${config.attachmentName} (${sizeKB} KB)`;
    }
  });
}

function saveSettings() {
  const subject = document.getElementById("subjectInput").value.trim();
  const body = document.getElementById("bodyInput").value.trim();
  const fileInput = document.getElementById("attachmentInput");
  const file = fileInput.files[0];

  // Validate inputs
  if (!subject) {
    showStatus("Please enter an email subject", "error");
    return;
  }

  if (!body) {
    showStatus("Please enter email body content", "error");
    return;
  }

  if (file) {
    // Check file size (limit to 1MB for storage)
    if (file.size > 1024 * 1024) {
      showStatus("File too large! Please select a file smaller than 1MB", "error");
      return;
    }

    // New file selected - read and save it
    const reader = new FileReader();
    reader.onload = function(e) {
      const config = {
        subject: subject,
        body: body,
        attachmentName: file.name,
        attachmentData: e.target.result.split(',')[1], // base64 data
        attachmentType: file.type
      };

      saveConfigToStorage(config);
    };
    reader.readAsDataURL(file);
  } else {
    // No new file selected - check if we have existing attachment
    chrome.storage.local.get(['emailConfig'], function(result) {
      const existingConfig = result.emailConfig || DEFAULT_CONFIG;
      
      if (!existingConfig.attachmentName) {
        showStatus("Please select an attachment file", "error");
        return;
      }

      const config = {
        subject: subject,
        body: body,
        attachmentName: existingConfig.attachmentName,
        attachmentData: existingConfig.attachmentData,
        attachmentType: existingConfig.attachmentType
      };

      saveConfigToStorage(config);
    });
  }
}

function saveConfigToStorage(config) {
  chrome.storage.local.set({ emailConfig: config }, function() {
    if (chrome.runtime.lastError) {
      showStatus("Error saving settings: " + chrome.runtime.lastError.message, "error");
      return;
    }
    
    showStatus("✅ Settings saved successfully!", "success");
    
    // Auto-close after 2 seconds
    setTimeout(() => {
      window.close();
    }, 2000);
  });
}

function showStatus(message, type = "info") {
  const statusDiv = document.getElementById("status");
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  statusDiv.style.display = "block";
  
  if (type === "success") {
    setTimeout(() => {
      statusDiv.style.display = "none";
    }, 3000);
  }
}