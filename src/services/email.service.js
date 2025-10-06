/**
 * Email service for high-level email operations
 */
class EmailService {
  constructor() {
    this.authService = new AuthService();
    this.gmailApiService = new GmailApiService(this.authService);
    this.initialized = false;
  }

  /**
   * Initialize the email service
   * @returns {Promise<boolean>} - Initialization success
   */
  async initialize() {
    try {
      await this.authService.initialize();
      this.initialized = true;
      return true;
    } catch (error) {
      ErrorHandler.logError(error, { method: 'initialize' });
      return false;
    }
  }

  /**
   * Send email with attachment using stored configuration
   * @param {string} recipient - Recipient email address
   * @returns {Promise<Object>} - Send result
   */
  async sendEmailWithAttachment(recipient) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      // Validate recipient email
      if (!Validator.isValidEmail(recipient)) {
        throw new Error('Invalid recipient email address');
      }

      // Get email configuration
      const config = await StorageService.getEmailConfig();
      if (!config) {
        throw new Error('No email configuration found. Please configure your email template first.');
      }

      // Validate email configuration
      const configErrors = Validator.validateEmailConfig(config);
      if (configErrors.length > 0) {
        throw new Error(`Invalid email configuration: ${configErrors.join(', ')}`);
      }

      // Prepare email data
      const emailData = this._prepareEmailData(recipient, config);

      // Prepare attachments
      const attachments = await this._prepareAttachments(config);

      // Send email
      const result = await this.gmailApiService.sendEmail(emailData, attachments);

      if (result.success) {
        return {
          success: true,
          message: 'Email sent successfully!',
          messageId: result.messageId,
          recipient: recipient
        };
      } else {
        throw new Error(result.message || 'Failed to send email');
      }
    } catch (error) {
      ErrorHandler.logError(error, { method: 'sendEmailWithAttachment', recipient });
      return ErrorHandler.createErrorResponse(error, { recipient });
    }
  }

  /**
   * Prepare email data from configuration
   * @param {string} recipient - Recipient email
   * @param {Object} config - Email configuration
   * @returns {Object} - Prepared email data
   */
  _prepareEmailData(recipient, config) {
    return {
      to: recipient,
      subject: config.subject,
      body: config.body
    };
  }

  /**
   * Prepare attachments from configuration
   * @param {Object} config - Email configuration
   * @returns {Promise<Array>} - Array of attachment objects
   */
  async _prepareAttachments(config) {
    const attachments = [];

    if (config.attachmentData && config.attachmentName) {
      attachments.push({
        name: config.attachmentName,
        data: config.attachmentData,
        type: config.attachmentType || 'application/octet-stream'
      });
    }

    return attachments;
  }

  /**
   * Validate email data before sending
   * @param {Object} emailData - Email data to validate
   * @returns {Array} - Array of validation errors
   */
  validateEmailData(emailData) {
    const errors = [];

    if (!emailData) {
      errors.push('Email data is required');
      return errors;
    }

    if (!Validator.isValidEmail(emailData.to)) {
      errors.push('Valid recipient email is required');
    }

    if (!emailData.subject || !emailData.subject.trim()) {
      errors.push('Email subject is required');
    }

    if (!emailData.body || !emailData.body.trim()) {
      errors.push('Email body is required');
    }

    return errors;
  }

  /**
   * Get authentication status
   * @returns {Promise<Object>} - Authentication status
   */
  async getAuthStatus() {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      return await this.authService.getAuthStatus();
    } catch (error) {
      ErrorHandler.logError(error, { method: 'getAuthStatus' });
      return {
        isAuthenticated: false,
        hasToken: false,
        tokenValid: false,
        error: ErrorHandler.getUserMessage(error)
      };
    }
  }

  /**
   * Authenticate with Gmail
   * @param {boolean} interactive - Whether to show interactive consent
   * @returns {Promise<Object>} - Authentication result
   */
  async authenticate(interactive = true) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const token = await this.authService.authenticate(interactive);
      
      return {
        success: true,
        message: 'Authentication successful',
        token: token
      };
    } catch (error) {
      ErrorHandler.logError(error, { method: 'authenticate', interactive });
      return ErrorHandler.createErrorResponse(error, { interactive });
    }
  }

  /**
   * Clear authentication and logout
   * @returns {Promise<Object>} - Logout result
   */
  async logout() {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      await this.authService.clearTokens();
      
      return {
        success: true,
        message: 'Logged out successfully'
      };
    } catch (error) {
      ErrorHandler.logError(error, { method: 'logout' });
      return ErrorHandler.createErrorResponse(error);
    }
  }

  /**
   * Test email configuration by sending a test email
   * @param {string} recipient - Test recipient email
   * @returns {Promise<Object>} - Test result
   */
  async testEmailConfiguration(recipient) {
    try {
      if (!Validator.isValidEmail(recipient)) {
        throw new Error('Invalid test recipient email address');
      }

      if (!this.initialized) {
        await this.initialize();
      }

      // Check authentication
      const authStatus = await this.getAuthStatus();
      if (!authStatus.isAuthenticated) {
        throw new Error('Not authenticated. Please authenticate first.');
      }

      // Test API connection
      const connectionValid = await this.gmailApiService.validateConnection();
      if (!connectionValid) {
        throw new Error('Gmail API connection failed');
      }

      // Send test email
      const testResult = await this.gmailApiService.testEmailSending(recipient);
      
      return testResult;
    } catch (error) {
      ErrorHandler.logError(error, { method: 'testEmailConfiguration', recipient });
      return ErrorHandler.createErrorResponse(error, { recipient });
    }
  }

  /**
   * Get email service status and diagnostics
   * @returns {Promise<Object>} - Service status
   */
  async getServiceStatus() {
    try {
      const authStatus = await this.getAuthStatus();
      const config = await StorageService.getEmailConfig();
      const storageInfo = await StorageService.getStorageInfo();
      
      let connectionStatus = false;
      if (authStatus.isAuthenticated) {
        connectionStatus = await this.gmailApiService.validateConnection();
      }

      return {
        initialized: this.initialized,
        authentication: authStatus,
        configuration: {
          hasConfig: !!config,
          hasAttachment: !!(config && config.attachmentData),
          configValid: config ? Validator.validateEmailConfig(config).length === 0 : false
        },
        connection: {
          gmailApiConnected: connectionStatus
        },
        storage: storageInfo
      };
    } catch (error) {
      ErrorHandler.logError(error, { method: 'getServiceStatus' });
      return {
        initialized: false,
        error: ErrorHandler.getUserMessage(error)
      };
    }
  }

  /**
   * Add authentication state change listener
   * @param {Function} callback - Callback function
   */
  onAuthStateChanged(callback) {
    if (this.authService) {
      this.authService.onAuthStateChanged(callback);
    }
  }

  /**
   * Remove authentication state change listener
   * @param {Function} callback - Callback function
   */
  removeAuthStateListener(callback) {
    if (this.authService) {
      this.authService.removeAuthStateListener(callback);
    }
  }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EmailService;
} else if (typeof window !== 'undefined') {
  window.EmailService = EmailService;
}