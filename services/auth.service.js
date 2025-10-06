/**
 * Authentication service for Gmail API OAuth flow
 */
class AuthService {
  constructor() {
    this.authStateListeners = [];
    this.currentToken = null;
  }

  /**
   * Authenticate with Gmail API
   * @param {boolean} interactive - Whether to show interactive consent screen
   * @returns {Promise<string>} - Access token
   */
  async authenticate(interactive = false) {
    try {
      const clientId = Environment.getClientId();
      
      if (!clientId) {
        throw new Error('Google Client ID not configured');
      }

      const token = await this._getAuthToken(interactive);
      
      if (token) {
        this.currentToken = token;
        await StorageService.saveAuthToken(token);
        this._notifyAuthStateChange(true, token);
        return token;
      }
      
      throw new Error('Authentication failed');
    } catch (error) {
      ErrorHandler.logError(error, { method: 'authenticate', interactive });
      
      const errorType = ErrorHandler.classifyError(error);
      if (errorType === ErrorHandler.ERROR_TYPES.AUTHENTICATION.VERIFICATION_REQUIRED) {
        throw new Error('App verification required. Please add yourself as a test user in Google Cloud Console.');
      }
      
      throw new Error('Authentication failed: ' + ErrorHandler.getUserMessage(error));
    }
  }

  /**
   * Get authentication token using Chrome Identity API
   * @param {boolean} interactive - Whether to show interactive consent
   * @returns {Promise<string>} - Access token
   */
  async _getAuthToken(interactive) {
    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({
        interactive: interactive,
        scopes: ['https://www.googleapis.com/auth/gmail.send']
      }, (token) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        
        resolve(token);
      });
    });
  }

  /**
   * Refresh authentication token
   * @returns {Promise<string>} - New access token
   */
  async refreshToken() {
    try {
      // Clear current token first
      await this.clearTokens();
      
      // Get new token
      const newToken = await this.authenticate(false);
      return newToken;
    } catch (error) {
      ErrorHandler.logError(error, { method: 'refreshToken' });
      
      // If non-interactive refresh fails, try interactive
      try {
        const interactiveToken = await this.authenticate(true);
        return interactiveToken;
      } catch (interactiveError) {
        throw new Error('Token refresh failed: ' + ErrorHandler.getUserMessage(interactiveError));
      }
    }
  }

  /**
   * Get valid authentication token
   * @returns {Promise<string>} - Valid access token
   */
  async getValidToken() {
    try {
      // Check if we have a current token
      if (this.currentToken) {
        const isValid = await this._validateToken(this.currentToken);
        if (isValid) {
          return this.currentToken;
        }
      }

      // Try to get token from storage
      const storedToken = await StorageService.getAuthToken();
      if (storedToken) {
        const isValid = await this._validateToken(storedToken);
        if (isValid) {
          this.currentToken = storedToken;
          return storedToken;
        }
      }

      // No valid token found, need to authenticate
      return await this.authenticate(true);
    } catch (error) {
      ErrorHandler.logError(error, { method: 'getValidToken' });
      throw new Error('Failed to get valid token: ' + ErrorHandler.getUserMessage(error));
    }
  }

  /**
   * Validate authentication token
   * @param {string} token - Token to validate
   * @returns {Promise<boolean>} - True if token is valid
   */
  async _validateToken(token) {
    if (!token) {
      return false;
    }

    try {
      // Make a simple API call to validate token
      const response = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' + token);
      return response.ok;
    } catch (error) {
      ErrorHandler.logError(error, { method: '_validateToken' });
      return false;
    }
  }

  /**
   * Check if token is valid without making API calls
   * @param {string} token - Token to check
   * @returns {boolean} - True if token appears valid
   */
  isTokenValid(token) {
    if (!token || typeof token !== 'string') {
      return false;
    }

    // Basic token format validation
    return token.length > 20 && token.includes('.');
  }

  /**
   * Clear all authentication tokens
   * @returns {Promise<boolean>} - Success status
   */
  async clearTokens() {
    try {
      // Clear from Chrome Identity API
      if (this.currentToken) {
        await new Promise((resolve) => {
          chrome.identity.removeCachedAuthToken({
            token: this.currentToken
          }, resolve);
        });
      }

      // Clear from storage
      await StorageService.clearAuthToken();
      
      // Clear current token
      this.currentToken = null;
      
      // Notify listeners
      this._notifyAuthStateChange(false, null);
      
      return true;
    } catch (error) {
      ErrorHandler.logError(error, { method: 'clearTokens' });
      throw new Error('Failed to clear tokens');
    }
  }

  /**
   * Get current authentication status
   * @returns {Promise<Object>} - Authentication status
   */
  async getAuthStatus() {
    try {
      const token = await StorageService.getAuthToken();
      const isAuthenticated = token ? await this._validateToken(token) : false;
      
      return {
        isAuthenticated,
        hasToken: !!token,
        tokenValid: isAuthenticated
      };
    } catch (error) {
      ErrorHandler.logError(error, { method: 'getAuthStatus' });
      return {
        isAuthenticated: false,
        hasToken: false,
        tokenValid: false
      };
    }
  }

  /**
   * Add listener for authentication state changes
   * @param {Function} callback - Callback function
   */
  onAuthStateChanged(callback) {
    if (typeof callback === 'function') {
      this.authStateListeners.push(callback);
    }
  }

  /**
   * Remove authentication state change listener
   * @param {Function} callback - Callback function to remove
   */
  removeAuthStateListener(callback) {
    const index = this.authStateListeners.indexOf(callback);
    if (index > -1) {
      this.authStateListeners.splice(index, 1);
    }
  }

  /**
   * Notify all listeners of authentication state change
   * @param {boolean} isAuthenticated - Authentication status
   * @param {string} token - Authentication token
   */
  _notifyAuthStateChange(isAuthenticated, token) {
    this.authStateListeners.forEach(callback => {
      try {
        callback(isAuthenticated, token);
      } catch (error) {
        ErrorHandler.logError(error, { method: '_notifyAuthStateChange' });
      }
    });
  }

  /**
   * Handle authentication errors with automatic recovery
   * @param {Error} error - Authentication error
   * @returns {Promise<string>} - Recovered token or throws error
   */
  async handleAuthError(error) {
    const errorType = ErrorHandler.classifyError(error);
    
    switch (errorType) {
      case ErrorHandler.ERROR_TYPES.AUTHENTICATION.TOKEN_EXPIRED:
        return await this.refreshToken();
        
      case ErrorHandler.ERROR_TYPES.AUTHENTICATION.INVALID_CREDENTIALS:
        await this.clearTokens();
        return await this.authenticate(true);
        
      case ErrorHandler.ERROR_TYPES.AUTHENTICATION.PERMISSION_DENIED:
        throw new Error('Permission denied. Please check your Google Cloud Console settings.');
        
      default:
        throw error;
    }
  }

  /**
   * Initialize authentication service
   * @returns {Promise<boolean>} - Initialization success
   */
  async initialize() {
    try {
      // Check if we have a stored token
      const storedToken = await StorageService.getAuthToken();
      
      if (storedToken) {
        const isValid = await this._validateToken(storedToken);
        if (isValid) {
          this.currentToken = storedToken;
          this._notifyAuthStateChange(true, storedToken);
        } else {
          // Token is invalid, clear it
          await StorageService.clearAuthToken();
        }
      }
      
      return true;
    } catch (error) {
      ErrorHandler.logError(error, { method: 'initialize' });
      return false;
    }
  }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AuthService;
} else if (typeof window !== 'undefined') {
  window.AuthService = AuthService;
}