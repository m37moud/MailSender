/**
 * Popup controller for the Chrome extension
 */
class PopupController {
  constructor() {
    this.emailService = new EmailService();
    this.elements = {};
    this.isInitialized = false;
  }

  /**
   * Initialize the popup
   */
  async init() {
    try {
      this._initializeElements();
      this._attachEventListeners();
      
      await this.emailService.initialize();
      await this._loadConfiguration();
      await this._updateAuthStatus();
      
      this.isInitialized = true;
    } catch (error) {
      ErrorHandler.logError(error, { method: 'init' });
      this._showToast('Failed to initialize extension', 'error');
    }
  }

  /**
   * Initialize DOM elements
   */
  _initializeElements() {
    this.elements = {
      emailInput: document.getElementById('emailInput'),
      sendButton: document.getElementById('sendEmail'),
      setupButton: document.getElementById('setupButton'),
      debugButton: document.getElementById('debugButton'),
      attachmentInfo: document.getElementById('attachmentInfo'),
      previewSubject: document.getElementById('previewSubject'),
      previewBody: document.getElementById('previewBody')
    };

    // Validate all required elements exist
    for (const [key, element] of Object.entries(this.elements)) {
      if (!element) {
        throw new Error(`Required element not found: ${key}`);
      }
    }
  }

  /**
   * Attach event listeners
   */
  _attachEventListeners() {
    // Send email button
    this.elements.sendButton.addEventListener('click', () => this._handleSendEmail());
    
    // Setup button
    this.elements.setupButton.addEventListener('click', () => this._openSettings());
    
    // Debug button
    this.elements.debugButton.addEventListener('click', () => this._showDebugInfo());
    
    // Email input validation
    this.elements.emailInput.addEventListener('input', () => this._validateEmailInput());
    this.elements.emailInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this._handleSendEmail();
      }
    });

    // Authentication state changes
    this.emailService.onAuthStateChanged((isAuthenticated) => {
      this._updateAuthStatus(isAuthenticated);
    });
  }

  /**
   * Load email configuration and update UI
   */
  async _loadConfiguration() {
    try {
      const config = await StorageService.getEmailConfig();
      
      if (config) {
        this._updatePreview(config);
        this._updateAttachmentStatus(config);
      } else {
        this._updatePreview(this._getDefaultConfig());
        this._updateAttachmentStatus(null);
      }
    } catch (error) {
      ErrorHandler.logError(error, { method: '_loadConfiguration' });
      this._showToast('Failed to load configuration', 'error');
    }
  }

  /**
   * Get default configuration from environment
   */
  _getDefaultConfig() {
    const envDefaults = Environment.getDefaultConfig();
    return {
      subject: envDefaults.subject,
      body: `Hello,
I hope this email finds you well.
I am writing to express my interest in the position.
With my extensive experience, I believe I can significantly contribute to your organization.
Attached is my CV, which provides further details about how my career background aligns with your requirements.
I would welcome the opportunity to discuss my application with you in person.
Thank you for considering my application.
I look forward to hearing from you soon.
Best regards,
${envDefaults.senderName}
Tel: ${envDefaults.senderPhone}`,
      attachmentName: null
    };
  }

  /**
   * Update email preview
   */
  _updatePreview(config) {
    if (config) {
      this.elements.previewSubject.textContent = config.subject || 'No subject';
      this.elements.previewBody.textContent = 
        (config.body || 'No body content').substring(0, 100) + '...';
    }
  }

  /**
   * Update attachment status display
   */
  _updateAttachmentStatus(config) {
    const hasAttachment = config && config.attachmentData;
    
    if (hasAttachment) {
      const sizeKB = Math.round(config.attachmentData.length * 0.75 / 1024);
      this.elements.attachmentInfo.textContent = 
        `📎 Attachment ready: ${config.attachmentName} (${sizeKB} KB)`;
      this.elements.attachmentInfo.className = 'attachment-info ready';
    } else {
      this.elements.attachmentInfo.textContent = 
        '⚠️ No file selected - Click Setup to choose file';
      this.elements.attachmentInfo.className = 'attachment-info missing';
    }
  }

  /**
   * Update authentication status
   */
  async _updateAuthStatus(isAuthenticated = null) {
    try {
      if (isAuthenticated === null) {
        const authStatus = await this.emailService.getAuthStatus();
        isAuthenticated = authStatus.isAuthenticated;
      }

      if (isAuthenticated) {
        this.elements.sendButton.textContent = 'Send Email';
        this.elements.sendButton.disabled = false;
        this.elements.sendButton.className = 'primary-btn';
      } else {
        this.elements.sendButton.textContent = 'Authenticate Gmail';
        this.elements.sendButton.disabled = false;
        this.elements.sendButton.className = 'primary-btn';
        this.elements.sendButton.style.backgroundColor = '#ffc107';
        this.elements.sendButton.style.color = '#000';
      }
    } catch (error) {
      ErrorHandler.logError(error, { method: '_updateAuthStatus' });
    }
  }

  /**
   * Handle send email button click
   */
  async _handleSendEmail() {
    try {
      const email = this.elements.emailInput.value.trim();

      // Validate email input
      if (!email) {
        this._showToast('Please enter an email address', 'error');
        this.elements.emailInput.focus();
        return;
      }

      if (!Validator.isValidEmail(email)) {
        this._showToast('Please enter a valid email address', 'error');
        this.elements.emailInput.focus();
        return;
      }

      // Check authentication status
      const authStatus = await this.emailService.getAuthStatus();
      
      if (!authStatus.isAuthenticated) {
        await this._handleAuthentication();
        return;
      }

      // Send email
      await this._sendEmail(email);
      
    } catch (error) {
      ErrorHandler.logError(error, { method: '_handleSendEmail' });
      this._showToast('Failed to send email: ' + ErrorHandler.getUserMessage(error), 'error');
    }
  }

  /**
   * Handle Gmail authentication
   */
  async _handleAuthentication() {
    try {
      this._showToast('Authenticating with Gmail...', 'info');
      this.elements.sendButton.disabled = true;

      const result = await this.emailService.authenticate(true);
      
      if (result.success) {
        this._showToast('✅ Gmail authenticated successfully!', 'success');
        await this._updateAuthStatus(true);
      } else {
        throw new Error(result.message || 'Authentication failed');
      }
    } catch (error) {
      ErrorHandler.logError(error, { method: '_handleAuthentication' });
      
      const errorType = ErrorHandler.classifyError(error);
      if (errorType === ErrorHandler.ERROR_TYPES.AUTHENTICATION.VERIFICATION_REQUIRED) {
        this._showToast('App verification required. Please add yourself as a test user in Google Cloud Console.', 'error');
      } else {
        this._showToast('Authentication failed: ' + ErrorHandler.getUserMessage(error), 'error');
      }
    } finally {
      this.elements.sendButton.disabled = false;
    }
  }

  /**
   * Send email to recipient
   */
  async _sendEmail(recipient) {
    try {
      this._showToast('Sending email...', 'info');
      this.elements.sendButton.disabled = true;

      const result = await this.emailService.sendEmailWithAttachment(recipient);
      
      if (result.success) {
        this._showToast('✅ Email sent successfully!', 'success');
        this.elements.emailInput.value = '';
        
        // Close popup after success
        setTimeout(() => {
          window.close();
        }, 2000);
      } else {
        throw new Error(result.message || 'Failed to send email');
      }
    } catch (error) {
      ErrorHandler.logError(error, { method: '_sendEmail', recipient });
      this._showToast('Failed to send email: ' + ErrorHandler.getUserMessage(error), 'error');
    } finally {
      this.elements.sendButton.disabled = false;
    }
  }

  /**
   * Validate email input in real-time
   */
  _validateEmailInput() {
    const email = this.elements.emailInput.value.trim();
    
    if (email && !Validator.isValidEmail(email)) {
      this.elements.emailInput.style.borderColor = '#ea4335';
    } else {
      this.elements.emailInput.style.borderColor = '#e8eaed';
    }
  }

  /**
   * Open settings page
   */
  _openSettings() {
    chrome.tabs.create({ 
      url: chrome.runtime.getURL('src/settings/settings.html') 
    });
  }

  /**
   * Show debug information
   */
  async _showDebugInfo() {
    try {
      const serviceStatus = await this.emailService.getServiceStatus();
      const config = await StorageService.getEmailConfig();
      
      const debugInfo = {
        'Service Status': serviceStatus.initialized ? 'Initialized' : 'Not initialized',
        'Authentication': serviceStatus.authentication.isAuthenticated ? 'Authenticated' : 'Not authenticated',
        'Configuration': serviceStatus.configuration.hasConfig ? 'Present' : 'Missing',
        'Attachment': serviceStatus.configuration.hasAttachment ? 'Present' : 'Missing',
        'Gmail API': serviceStatus.connection.gmailApiConnected ? 'Connected' : 'Disconnected',
        'Storage Used': `${serviceStatus.storage.percentUsed}% (${FileHandler.formatFileSize(serviceStatus.storage.used)})`,
        'Extension Version': Environment.getVersion(),
        'Client ID': Environment.getClientId() ? 'Present' : 'Missing'
      };

      const debugText = Object.entries(debugInfo)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');

      alert('Debug Information:\n\n' + debugText);
    } catch (error) {
      ErrorHandler.logError(error, { method: '_showDebugInfo' });
      alert('Failed to get debug information: ' + ErrorHandler.getUserMessage(error));
    }
  }

  /**
   * Show toast notification
   */
  _showToast(message, type = 'info') {
    // Remove existing toasts
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => toast.remove());

    // Create new toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    document.body.appendChild(toast);

    // Auto-remove toast
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const popup = new PopupController();
    await popup.init();
  } catch (error) {
    console.error('Failed to initialize popup:', error);
    alert('Failed to initialize extension. Please reload and try again.');
  }
});