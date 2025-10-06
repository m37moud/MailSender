/**
 * Environment Configuration Manager
 * Handles loading and validation of environment variables
 */
class Environment {
  static _config = null;

  /**
   * Load configuration from environment variables
   * In a Chrome extension, we'll need to inject these at build time
   */
  static loadFromEnv() {
    if (this._config) {
      return this._config;
    }

    // These will be injected at build time from .env file
    this._config = {
      googleClientId: process.env.GOOGLE_CLIENT_ID || '',
      extensionName: process.env.EXTENSION_NAME || 'Gmail API Email Sender',
      extensionVersion: process.env.EXTENSION_VERSION || '3.0',
      extensionDescription: process.env.EXTENSION_DESCRIPTION || 'Send emails directly via Gmail API with attachments',
      defaultEmailSubject: process.env.DEFAULT_EMAIL_SUBJECT || 'Android Developer Position',
      defaultSenderName: process.env.DEFAULT_SENDER_NAME || '',
      defaultSenderPhone: process.env.DEFAULT_SENDER_PHONE || ''
    };

    return this._config;
  }

  /**
   * Get Google OAuth Client ID
   */
  static getClientId() {
    const config = this.loadFromEnv();
    return config.googleClientId;
  }

  /**
   * Get extension name
   */
  static getExtensionName() {
    const config = this.loadFromEnv();
    return config.extensionName;
  }

  /**
   * Get extension version
   */
  static getVersion() {
    const config = this.loadFromEnv();
    return config.extensionVersion;
  }

  /**
   * Get extension description
   */
  static getDescription() {
    const config = this.loadFromEnv();
    return config.extensionDescription;
  }

  /**
   * Get default email configuration
   */
  static getDefaultConfig() {
    const config = this.loadFromEnv();
    return {
      subject: config.defaultEmailSubject,
      senderName: config.defaultSenderName,
      senderPhone: config.defaultSenderPhone
    };
  }

  /**
   * Validate that all required environment variables are present
   */
  static validateEnvironment() {
    const config = this.loadFromEnv();
    const errors = [];

    if (!config.googleClientId) {
      errors.push('GOOGLE_CLIENT_ID is required');
    }

    if (!config.extensionName) {
      errors.push('EXTENSION_NAME is required');
    }

    if (errors.length > 0) {
      throw new Error(`Environment validation failed: ${errors.join(', ')}`);
    }

    return true;
  }

  /**
   * Check if we're in development mode
   */
  static isDevelopment() {
    return process.env.NODE_ENV === 'development';
  }

  /**
   * Check if we're in production mode
   */
  static isProduction() {
    return process.env.NODE_ENV === 'production';
  }
}

// For Chrome extension compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Environment;
} else if (typeof window !== 'undefined') {
  window.Environment = Environment;
}