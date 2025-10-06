// Static email configuration
const EMAIL_CONFIG = {
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
  // Static attachment info
  attachmentName: "Mahmoud_Ali_CV.pdf",
};

document.addEventListener("DOMContentLoaded", function () {
  const emailInput = document.getElementById("emailInput");
  const sendButton = document.getElementById("sendEmail");
  const previewSubject = document.getElementById("previewSubject");
  const previewBody = document.getElementById("previewBody");

  // Update preview
  previewSubject.textContent = EMAIL_CONFIG.subject;
  previewBody.textContent = EMAIL_CONFIG.body.substring(0, 100) + "...";

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

    sendEmailViaGmail(email);
  });

  // Allow Enter key to send email
  emailInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      sendButton.click();
    }
  });
});

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

function sendEmailViaGmail(recipientEmail) {
  showToast("Opening Gmail...", "info");

  const subject = encodeURIComponent(EMAIL_CONFIG.subject);
  const body = encodeURIComponent(
    EMAIL_CONFIG.body + `\n\n[Please attach: ${EMAIL_CONFIG.attachmentName}]`
  );

  // Open Gmail compose
  const gmailUrl = `https://mail.google.com/mail/?view=cm&to=${recipientEmail}&su=${subject}&body=${body}`;

  chrome.tabs.create({ url: gmailUrl }, function (tab) {
    // Show success message
    showToast(
      `✅ Gmail opened! Please attach ${EMAIL_CONFIG.attachmentName} and send`,
      "success"
    );

    // Close popup after 2 seconds
    setTimeout(() => {
      window.close();
    }, 2000);
  });
}
