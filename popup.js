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

let EMAIL_CONFIG = DEFAULT_CONFIG;
let accessToken = null;

document.addEventListener("DOMContentLoaded", function () {
  const emailInput = document.getElementById("emailInput");
  const sendButton = document.getElementById("sendEmail");
  const setupButton = document.getElementById("setupButton");
  const debugButton = document.getElementById("debugButton");

  // Load settings and check auth
  loadSettings();
  checkAuthStatus();

  sendButton.addEventListener("click", function () {
    const email = emailInput.value.trim();

    if (!email) {
      showToast("Please enter an email address", "error");
      return;
    }

    if (!isValidEmail(email)) {
      showToast("Please enter a valid email address", "error");
      return;
    }

    if (!accessToken) {
      authenticateGmail();
      return;
    }

    sendEmailViaGmailAPI(email);
  });

  setupButton.addEventListener("click", function () {
    chrome.tabs.create({ url: chrome.runtime.getURL("settings.html") });
  });

  // Debug button to check stored data
  debugButton.addEventListener("click", function () {
    chrome.storage.local.get(['emailConfig'], function(result) {
      const config = result.emailConfig || {};
      const debugInfo = `
Subject: ${config.subject || 'Not set'}
Body length: ${config.body ? config.body.length : 0} chars
Attachment name: ${config.attachmentName || 'Not set'}
Attachment data: ${config.attachmentData ? 'Present (' + Math.round(config.attachmentData.length * 0.75 / 1024) + ' KB)' : 'Missing'}
Attachment type: ${config.attachmentType || 'Not set'}
Access Token: ${accessToken ? 'Present' : 'Missing'}
      `;
      alert(debugInfo);
    });
  });
});

function loadSettings() {
  chrome.storage.local.get(['emailConfig'], function(result) {
    EMAIL_CONFIG = result.emailConfig || DEFAULT_CONFIG;
    
    // Update preview
    document.getElementById("previewSubject").textContent = EMAIL_CONFIG.subject;
    document.getElementById("previewBody").textContent = EMAIL_CONFIG.body.substring(0, 100) + "...";
    
    // Update attachment display
    const attachmentDisplay = document.querySelector('.attachment-info');
    if (attachmentDisplay) {
      if (EMAIL_CONFIG.attachmentData) {
        const sizeKB = Math.round(EMAIL_CONFIG.attachmentData.length * 0.75 / 1024);
        attachmentDisplay.textContent = `📎 Attachment ready: ${EMAIL_CONFIG.attachmentName} (${sizeKB} KB)`;
        attachmentDisplay.style.color = "#28a745"; // Green for ready
      } else {
        attachmentDisplay.textContent = `⚠️ No file selected - Click Setup to choose file`;
        attachmentDisplay.style.color = "#dc3545"; // Red for missing
      }
    }
  });
}

function checkAuthStatus() {
  chrome.storage.local.get(['gmail_access_token'], function(result) {
    if (result.gmail_access_token) {
      accessToken = result.gmail_access_token;
      updateSendButton("Send Email", true);
    } else {
      updateSendButton("Authenticate Gmail", false);
    }
  });
}

function updateSendButton(text, isAuthenticated) {
  const sendButton = document.getElementById("sendEmail");
  sendButton.textContent = text;
  
  if (!isAuthenticated) {
    sendButton.style.backgroundColor = "#ffc107";
    sendButton.style.color = "#000";
  } else {
    sendButton.style.backgroundColor = "#4285f4";
    sendButton.style.color = "#fff";
  }
}

function authenticateGmail() {
  showToast("Authenticating with Gmail...", "info");
  
  // Use getAuthToken with interactive: true to force consent screen
  chrome.identity.getAuthToken({ 
    interactive: true,
    scopes: ['https://www.googleapis.com/auth/gmail.send']
  }, function(token) {
    if (chrome.runtime.lastError) {
      console.error("Auth error:", chrome.runtime.lastError);
      
      // Try to handle specific errors
      if (chrome.runtime.lastError.message.includes('not completed')) {
        showToast("App needs verification. Adding you as test user...", "info");
        // Continue with the flow - sometimes it works anyway
      } else {
        showToast("Authentication failed: " + chrome.runtime.lastError.message, "error");
        return;
      }
    }
    
    if (token) {
      accessToken = token;
      chrome.storage.local.set({ gmail_access_token: token });
      
      showToast("✅ Gmail authenticated successfully!", "success");
      updateSendButton("Send Email", true);
    }
  });
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function showToast(message, type = "info") {
  // Create toast element
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 6px;
    color: white;
    font-weight: bold;
    z-index: 10000;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    transition: all 0.3s ease;
  `;

  // Set background color based on type
  if (type === "success") {
    toast.style.backgroundColor = "#28a745";
  } else if (type === "error") {
    toast.style.backgroundColor = "#dc3545";
  } else {
    toast.style.backgroundColor = "#007bff";
  }

  document.body.appendChild(toast);

  // Auto remove after 3 seconds
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

async function sendEmailViaGmailAPI(recipientEmail) {
  if (!EMAIL_CONFIG.attachmentData) {
    showToast("Please go to Setup and select an attachment file first!", "error");
    return;
  }

  showToast("Sending email via Gmail API...", "info");

  try {
    // Create email with attachment
    const email = createEmailWithAttachment(recipientEmail);
    
    // Send via Gmail API
    const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        raw: btoa(email).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
      })
    });

    if (response.ok) {
      const result = await response.json();
      showToast("✅ Email sent successfully!", "success");
      document.getElementById("emailInput").value = "";
      
      // Close popup after 2 seconds
      setTimeout(() => {
        window.close();
      }, 2000);
    } else {
      const error = await response.json();
      console.error("API Error:", error);
      
      if (response.status === 401) {
        // Token expired, re-authenticate
        chrome.storage.local.remove(['gmail_access_token']);
        accessToken = null;
        updateSendButton("Authenticate Gmail", false);
        showToast("Authentication expired. Please authenticate again.", "error");
      } else if (response.status === 403) {
        showToast("Access denied. App may need verification or you need to be added as test user.", "error");
      } else {
        showToast("Failed to send email: " + (error.error?.message || "Unknown error"), "error");
      }
    }
  } catch (error) {
    console.error("Send error:", error);
    showToast("Error sending email: " + error.message, "error");
  }
}

function createEmailWithAttachment(to) {
  const boundary = "boundary_" + Math.random().toString(36).substr(2, 9);
  
  let email = [
    `To: ${to}`,
    `Subject: ${EMAIL_CONFIG.subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset=UTF-8`,
    ``,
    EMAIL_CONFIG.body,
    ``
  ];

  // Add attachment if present
  if (EMAIL_CONFIG.attachmentData) {
    email = email.concat([
      `--${boundary}`,
      `Content-Type: ${EMAIL_CONFIG.attachmentType || 'application/octet-stream'}`,
      `Content-Disposition: attachment; filename="${EMAIL_CONFIG.attachmentName}"`,
      `Content-Transfer-Encoding: base64`,
      ``,
      EMAIL_CONFIG.attachmentData,
      ``
    ]);
  }

  email.push(`--${boundary}--`);
  
  return email.join('\r\n');
}