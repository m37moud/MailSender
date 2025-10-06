/**
 * Error handling and classification system
 */
class ErrorHandler {
  // Error type constants
  static ERROR_TYPES = {
    AUTHENTICATION: {
      TOKEN_EXPIRED: 'auth.token_expired',
      INVALID_CREDENTIALS: 'auth.invalid_credentials',
      PERMISSION_DENIED: 'auth.permission_denied',
      VERIFICATION_REQUIRED: 'auth.verification_required'
    },
    
    VALIDATION: {
      INVALID_EMAIL: 'validation.invalid_email',
      MISSING_REQUIRED_FIELD: 'validation.missing_field',
      FILE_TOO_LARGE: 'validation.file_too_large',
      INVALID_FILE_TYPE: 'validation.invalid_file_type'
    },
    
    API: {
      NETWORK_ERROR: 'api.network_error',
      RATE_LIMIT: 'api.rate_limit',
      SERVER_ERROR: 'api.server_error',
      TIMEOUT: 'api.timeout'
    },
    
    STORAGE: {
      QUOTA_EXCEEDED: 'storage.quota_exceeded',
      CORRUPTION: 'storage.corruption',
      ACCESS_DENIED: 'storage.access_denied'
    }
  };

  // Recovery strategies for different error types
  static RECOVERY_STRATEGIES = {
    [this.ERROR_TYPES.AUTHENTICATION.TOKEN_EXPIRED]: {
      action: 'refresh_token',
      userMessage: 'Session expired. Refreshing authentication...',
      autoRetry: true,
      maxRetries: 1
    },
    
    [this.ERROR_TYPES.API.RATE_LIMIT]: {
      action: 'exponential_backoff',
      userMessage: 'Rate limit reached. Retrying in a moment...',
      autoRetry: true,
      maxRetries: 3
    },
    
    [this.ERROR_TYPES.VALIDATION.FILE_TOO_LARGE]: {
      action: 'user_action_required',
      userMessage: 'File is too large. Please select a smaller file.',
      autoRetry: false
    },
    
    [this.ERROR_TYPES.API.NETWORK_ERROR]: {
      action: 'retry',
      userMessage: 'Network error. Retrying...',
      autoRetry: true,
      maxRetries: 2
    }
  };

  /**
   * Classify error based on error object or message
   * @param {Error|Object|string} error - Error to classify
   * @returns {string} - Error type classification
   */
  static classifyError(error) {
    if (!error) {
      return 'unknown';
    }

    const errorMessage = typeof error === 'string' ? error : error.message || '';
    const errorCode = error.code || error.status || '';

    // Authentication errors
    if (errorMessage.includes('token') && errorMessage.includes('expired')) {
      return this.ERROR_TYPES.AUTHENTICATION.TOKEN_EXPIRED;
    }
    
    if (errorMessage.includes('invalid_grant') || errorMessage.includes('unauthorized')) {
      return this.ERROR_TYPES.AUTHENTICATION.INVALID_CREDENTIALS;
    }
    
    if (errorMessage.includes('permission') || errorCode === 403) {
      return this.ERROR_TYPES.AUTHENTICATION.PERMISSION_DENIED;
    }

    if (errorMessage.includes('verification') || errorMessage.includes('not completed')) {
      return this.ERROR_TYPES.AUTHENTICATION.VERIFICATION_REQUIRED;
    }

    // API errors
    if (errorCode === 429 || errorMessage.includes('rate limit')) {
      return this.ERROR_TYPES.API.RATE_LIMIT;
    }
    
    if (errorCode >= 500 || errorMessage.includes('server error')) {
      return this.ERROR_TYPES.API.SERVER_ERROR;
    }
    
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return this.ERROR_TYPES.API.NETWORK_ERROR;
    }

    // Validation errors
    if (errorMessage.includes('email') && errorMessage.includes('invalid')) {
      return this.ERROR_TYPES.VALIDATION.INVALID_EMAIL;
    }
    
    if (errorMessage.includes('file') && errorMessage.includes('large')) {
      return this.ERROR_TYPES.VALIDATION.FILE_TOO_LARGE;
    }
    
    if (errorMessage.includes('required')) {
      return this.ERROR_TYPES.VALIDATION.MISSING_REQUIRED_FIELD;
    }

    // Storage errors
    if (errorMessage.includes('quota') || errorMessage.includes('QUOTA_BYTES')) {
      return this.ERROR_TYPES.STORAGE.QUOTA_EXCEEDED;
    }

    return 'unknown';
  }

  /**
   * Check if error is retryable
   * @param {string} errorType - Classified error type
   * @returns {boolean} - True if error can be retried
   */
  static isRetryableError(errorType) {
    const strategy = this.RECOVERY_STRATEGIES[errorType];
    return strategy ? strategy.autoRetry : false;
  }

  /**
   * Get user-friendly error message
   * @param {Error|Object|string} error - Error object
   * @returns {string} - User-friendly message
   */
  static getUserMessage(error) {
    const errorType = this.classifyError(error);
    const strategy = this.RECOVERY_STRATEGIES[errorType];
    
    if (strategy) {
      return strategy.userMessage;
    }

    // Fallback messages for unclassified errors
    const errorMessage = typeof error === 'string' ? error : error.message || '';
    
    if (errorMessage.includes('network')) {
      return 'Network connection error. Please check your internet connection.';
    }
    
    if (errorMessage.includes('file')) {
      return 'File processing error. Please try with a different file.';
    }
    
    return 'An unexpected error occurred. Please try again.';
  }

  /**
   * Get actionable message for user
   * @param {Error|Object|string} error - Error object
   * @returns {string} - Actionable message
   */
  static getActionableMessage(error) {
    const errorType = this.classifyError(error);
    
    const actionableMessages = {
      [this.ERROR_TYPES.AUTHENTICATION.TOKEN_EXPIRED]: 'Please click "Authenticate Gmail" to refresh your session.',
      [this.ERROR_TYPES.AUTHENTICATION.VERIFICATION_REQUIRED]: 'Please add yourself as a test user in Google Cloud Console.',
      [this.ERROR_TYPES.VALIDATION.FILE_TOO_LARGE]: 'Please select a file smaller than 1MB.',
      [this.ERROR_TYPES.VALIDATION.INVALID_EMAIL]: 'Please enter a valid email address.',
      [this.ERROR_TYPES.STORAGE.QUOTA_EXCEEDED]: 'Please select a smaller file or clear some storage.',
      [this.ERROR_TYPES.API.NETWORK_ERROR]: 'Please check your internet connection and try again.'
    };

    return actionableMessages[errorType] || 'Please try again or contact support if the problem persists.';
  }

  /**
   * Log error with context
   * @param {Error|Object|string} error - Error to log
   * @param {Object} context - Additional context information
   */
  static logError(error, context = {}) {
    const errorType = this.classifyError(error);
    const timestamp = new Date().toISOString();
    
    const logEntry = {
      timestamp,
      errorType,
      error: typeof error === 'string' ? error : error.message,
      context,
      stack: error.stack || 'No stack trace available'
    };

    console.error('Error logged:', logEntry);
    
    // In a production environment, you might want to send this to a logging service
    // this.sendToLoggingService(logEntry);
  }

  /**
   * Create standardized error response
   * @param {Error|Object|string} error - Original error
   * @param {Object} context - Additional context
   * @returns {Object} - Standardized error response
   */
  static createErrorResponse(error, context = {}) {
    const errorType = this.classifyError(error);
    const userMessage = this.getUserMessage(error);
    const actionableMessage = this.getActionableMessage(error);
    const isRetryable = this.isRetryableError(errorType);

    return {
      success: false,
      errorType,
      message: userMessage,
      actionableMessage,
      isRetryable,
      context,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Handle error with automatic recovery if possible
   * @param {Error|Object|string} error - Error to handle
   * @param {Function} retryCallback - Function to call for retry
   * @param {Object} context - Additional context
   * @returns {Promise<Object>} - Error handling result
   */
  static async handleError(error, retryCallback = null, context = {}) {
    const errorType = this.classifyError(error);
    const strategy = this.RECOVERY_STRATEGIES[errorType];
    
    this.logError(error, context);

    if (strategy && strategy.autoRetry && retryCallback) {
      const maxRetries = strategy.maxRetries || 1;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`Retry attempt ${attempt}/${maxRetries} for error: ${errorType}`);
          
          // Add delay for exponential backoff
          if (strategy.action === 'exponential_backoff') {
            const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s...
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
          const result = await retryCallback();
          console.log(`Retry attempt ${attempt} succeeded`);
          return { success: true, result };
          
        } catch (retryError) {
          console.log(`Retry attempt ${attempt} failed:`, retryError);
          
          if (attempt === maxRetries) {
            return this.createErrorResponse(retryError, { ...context, retriesExhausted: true });
          }
        }
      }
    }

    return this.createErrorResponse(error, context);
  }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ErrorHandler;
} else if (typeof window !== 'undefined') {
  window.ErrorHandler = ErrorHandler;
}