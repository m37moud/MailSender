/**
 * Gmail API service for sending emails
 */
class GmailApiService {
  constructor(authService) {
    this.authService = authService;
    this.apiEndpoint = 'https://www.googleapis.com/gmail/v1/users/me/messages/send';
    this.rateLimitDelay = 1000; // 1 second delay for rate limiting
    this.maxRetries = 3;
  }

  /**
   * Send email via Gmail API
   * @param {Object} emailData - Email data object
   * @param {Array} attachments - Array of attachment objects
   * @returns {Promise<Object>} - API response
   */
  async sendEmail(emailData, attachments = []) {
    try {
      // Get valid authentication token
      const token = await this.authService.getValidToken();
      
      // Build email message
      const emailMessage = this._buildEmailMessage(emailData, attachments);
      
      // Send via API
      const response = await this._makeApiRequest(token, emailMessage);
      
      return {
        success: true,
        messageId: response.id,
        threadId: response.threadId
      };
    } catch (error) {
      return await this._handleApiError(error, emailData, attachments);
    }
  }

  /**
   * Build email message in RFC 2822 format
   * @param {Object} emailData - Email data
   * @param {Array} attachments - Attachments array
   * @returns {string} - Formatted email message
   */
  _buildEmailMessage(emailData, attachments) {
    const boundary = this._generateBoundary();
    const hasAttachments = attachments && attachments.length > 0;
    
    let message = [
      `To: ${emailData.to}`,
      `Subject: ${emailData.subject}`,
      'MIME-Version: 1.0'
    ];

    if (hasAttachments) {
      message.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
    } else {
      message.push('Content-Type: text/plain; charset=UTF-8');
    }

    message.push(''); // Empty line after headers

    if (hasAttachments) {
      // Add text part
      message = message.concat([
        `--${boundary}`,
        'Content-Type: text/plain; charset=UTF-8',
        '',
        emailData.body,
        ''
      ]);

      // Add attachments
      attachments.forEach(attachment => {
        message = message.concat([
          `--${boundary}`,
          `Content-Type: ${attachment.type || 'application/octet-stream'}`,
          `Content-Disposition: attachment; filename="${attachment.name}"`,
          'Content-Transfer-Encoding: base64',
          '',
          attachment.data,
          ''
        ]);
      });

      message.push(`--${boundary}--`);
    } else {
      message.push(emailData.body);
    }

    return message.join('\r\n');
  }

  /**
   * Make API request to Gmail
   * @param {string} token - Authentication token
   * @param {string} emailMessage - Formatted email message
   * @returns {Promise<Object>} - API response
   */
  async _makeApiRequest(token, emailMessage) {
    const encodedMessage = btoa(emailMessage)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const response = await fetch(this.apiEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        raw: encodedMessage
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.error?.message || `API request failed with status ${response.status}`);
      error.status = response.status;
      error.response = errorData;
      throw error;
    }

    return await response.json();
  }

  /**
   * Handle API errors with retry logic
   * @param {Error} error - API error
   * @param {Object} emailData - Original email data
   * @param {Array} attachments - Original attachments
   * @returns {Promise<Object>} - Error response or retry result
   */
  async _handleApiError(error, emailData, attachments) {
    const errorType = ErrorHandler.classifyError(error);
    
    ErrorHandler.logError(error, { 
      method: '_handleApiError', 
      errorType,
      emailData: { to: emailData.to, subject: emailData.subject }
    });

    // Handle authentication errors
    if (errorType === ErrorHandler.ERROR_TYPES.AUTHENTICATION.TOKEN_EXPIRED) {
      try {
        await this.authService.handleAuthError(error);
        return await this.sendEmail(emailData, attachments); // Retry with new token
      } catch (authError) {
        return ErrorHandler.createErrorResponse(authError);
      }
    }

    // Handle rate limiting
    if (errorType === ErrorHandler.ERROR_TYPES.API.RATE_LIMIT) {
      return await this._handleRateLimit(error, emailData, attachments);
    }

    // Handle network errors with retry
    if (errorType === ErrorHandler.ERROR_TYPES.API.NETWORK_ERROR) {
      return await this._retryWithBackoff(emailData, attachments, 1);
    }

    return ErrorHandler.createErrorResponse(error);
  }

  /**
   * Handle rate limiting with exponential backoff
   * @param {Error} error - Rate limit error
   * @param {Object} emailData - Email data
   * @param {Array} attachments - Attachments
   * @returns {Promise<Object>} - Retry result
   */
  async _handleRateLimit(error, emailData, attachments) {
    const retryAfter = this._extractRetryAfter(error) || this.rateLimitDelay;
    
    console.log(`Rate limited. Retrying after ${retryAfter}ms`);
    await new Promise(resolve => setTimeout(resolve, retryAfter));
    
    return await this._retryWithBackoff(emailData, attachments, 1);
  }

  /**
   * Retry API request with exponential backoff
   * @param {Object} emailData - Email data
   * @param {Array} attachments - Attachments
   * @param {number} attempt - Current attempt number
   * @returns {Promise<Object>} - Retry result
   */
  async _retryWithBackoff(emailData, attachments, attempt) {
    if (attempt > this.maxRetries) {
      return ErrorHandler.createErrorResponse(
        new Error('Maximum retry attempts exceeded'),
        { attempts: attempt }
      );
    }

    try {
      const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
      console.log(`Retry attempt ${attempt}/${this.maxRetries} after ${delay}ms`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return await this.sendEmail(emailData, attachments);
    } catch (error) {
      return await this._retryWithBackoff(emailData, attachments, attempt + 1);
    }
  }

  /**
   * Extract retry-after header from error response
   * @param {Error} error - API error
   * @returns {number} - Retry delay in milliseconds
   */
  _extractRetryAfter(error) {
    if (error.response && error.response.headers) {
      const retryAfter = error.response.headers['retry-after'];
      if (retryAfter) {
        return parseInt(retryAfter) * 1000; // Convert seconds to milliseconds
      }
    }
    return null;
  }

  /**
   * Generate boundary string for multipart messages
   * @returns {string} - Boundary string
   */
  _generateBoundary() {
    return 'boundary_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Validate connection to Gmail API
   * @returns {Promise<boolean>} - True if connection is valid
   */
  async validateConnection() {
    try {
      const token = await this.authService.getValidToken();
      
      // Make a simple API call to validate connection
      const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return response.ok;
    } catch (error) {
      ErrorHandler.logError(error, { method: 'validateConnection' });
      return false;
    }
  }

  /**
   * Get user's Gmail profile information
   * @returns {Promise<Object>} - User profile data
   */
  async getUserProfile() {
    try {
      const token = await this.authService.getValidToken();
      
      const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get user profile: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      ErrorHandler.logError(error, { method: 'getUserProfile' });
      throw new Error('Failed to get user profile: ' + ErrorHandler.getUserMessage(error));
    }
  }

  /**
   * Test email sending with a simple message
   * @param {string} to - Recipient email
   * @returns {Promise<Object>} - Test result
   */
  async testEmailSending(to) {
    const testEmailData = {
      to: to,
      subject: 'Test Email from Gmail API Extension',
      body: 'This is a test email to verify the Gmail API integration is working correctly.'
    };

    try {
      const result = await this.sendEmail(testEmailData);
      return {
        success: true,
        message: 'Test email sent successfully',
        messageId: result.messageId
      };
    } catch (error) {
      return {
        success: false,
        message: 'Test email failed: ' + ErrorHandler.getUserMessage(error),
        error: error
      };
    }
  }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GmailApiService;
} else if (typeof window !== 'undefined') {
  window.GmailApiService = GmailApiService;
}