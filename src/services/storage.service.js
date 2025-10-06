/**
 * Storage service for managing Chrome extension storage
 */
class StorageService {
  // Storage keys
  static KEYS = {
    EMAIL_CONFIG: 'emailConfig',
    AUTH_TOKEN: 'gmail_access_token',
    USER_PREFERENCES: 'userPreferences'
  };

  /**
   * Get email configuration from storage
   * @returns {Promise<Object>} - Email configuration object
   */
  static async getEmailConfig() {
    try {
      const result = await chrome.storage.local.get([this.KEYS.EMAIL_CONFIG]);
      return result[this.KEYS.EMAIL_CONFIG] || null;
    } catch (error) {
      ErrorHandler.logError(error, { method: 'getEmailConfig' });
      throw new Error('Failed to retrieve email configuration');
    }
  }

  /**
   * Save email configuration to storage
   * @param {Object} config - Email configuration to save
   * @returns {Promise<boolean>} - Success status
   */
  static async saveEmailConfig(config) {
    try {
      // Validate configuration before saving
      const validationErrors = this.validateConfig(config);
      if (validationErrors.length > 0) {
        throw new Error(`Invalid configuration: ${validationErrors.join(', ')}`);
      }

      await chrome.storage.local.set({
        [this.KEYS.EMAIL_CONFIG]: config
      });

      return true;
    } catch (error) {
      ErrorHandler.logError(error, { method: 'saveEmailConfig', config });
      throw new Error('Failed to save email configuration');
    }
  }

  /**
   * Validate email configuration
   * @param {Object} config - Configuration to validate
   * @returns {Array} - Array of validation errors
   */
  static validateConfig(config) {
    if (!config || typeof config !== 'object') {
      return ['Configuration must be an object'];
    }

    const errors = [];

    // Required fields
    if (!config.subject || !config.subject.trim()) {
      errors.push('Subject is required');
    }

    if (!config.body || !config.body.trim()) {
      errors.push('Body is required');
    }

    // Optional attachment validation
    if (config.attachmentData) {
      if (!config.attachmentName) {
        errors.push('Attachment name is required when attachment data is provided');
      }
      
      if (!config.attachmentType) {
        errors.push('Attachment type is required when attachment data is provided');
      }
    }

    return errors;
  }

  /**
   * Get authentication token from storage
   * @returns {Promise<string|null>} - Authentication token or null
   */
  static async getAuthToken() {
    try {
      const result = await chrome.storage.local.get([this.KEYS.AUTH_TOKEN]);
      return result[this.KEYS.AUTH_TOKEN] || null;
    } catch (error) {
      ErrorHandler.logError(error, { method: 'getAuthToken' });
      throw new Error('Failed to retrieve authentication token');
    }
  }

  /**
   * Save authentication token to storage
   * @param {string} token - Authentication token to save
   * @returns {Promise<boolean>} - Success status
   */
  static async saveAuthToken(token) {
    try {
      if (!token || typeof token !== 'string') {
        throw new Error('Invalid token provided');
      }

      await chrome.storage.local.set({
        [this.KEYS.AUTH_TOKEN]: token
      });

      return true;
    } catch (error) {
      ErrorHandler.logError(error, { method: 'saveAuthToken' });
      throw new Error('Failed to save authentication token');
    }
  }

  /**
   * Clear authentication token from storage
   * @returns {Promise<boolean>} - Success status
   */
  static async clearAuthToken() {
    try {
      await chrome.storage.local.remove([this.KEYS.AUTH_TOKEN]);
      return true;
    } catch (error) {
      ErrorHandler.logError(error, { method: 'clearAuthToken' });
      throw new Error('Failed to clear authentication token');
    }
  }

  /**
   * Save attachment data to storage
   * @param {Object} attachmentData - Attachment data to save
   * @returns {Promise<boolean>} - Success status
   */
  static async saveAttachment(attachmentData) {
    try {
      if (!attachmentData || typeof attachmentData !== 'object') {
        throw new Error('Invalid attachment data provided');
      }

      // Get current config and update with attachment
      const currentConfig = await this.getEmailConfig() || {};
      const updatedConfig = {
        ...currentConfig,
        attachmentName: attachmentData.name,
        attachmentData: attachmentData.data,
        attachmentType: attachmentData.type
      };

      return await this.saveEmailConfig(updatedConfig);
    } catch (error) {
      ErrorHandler.logError(error, { method: 'saveAttachment', attachmentData });
      throw new Error('Failed to save attachment');
    }
  }

  /**
   * Get attachment data from storage
   * @returns {Promise<Object|null>} - Attachment data or null
   */
  static async getAttachment() {
    try {
      const config = await this.getEmailConfig();
      
      if (!config || !config.attachmentData) {
        return null;
      }

      return {
        name: config.attachmentName,
        data: config.attachmentData,
        type: config.attachmentType
      };
    } catch (error) {
      ErrorHandler.logError(error, { method: 'getAttachment' });
      throw new Error('Failed to retrieve attachment');
    }
  }

  /**
   * Clear attachment data from storage
   * @returns {Promise<boolean>} - Success status
   */
  static async clearAttachment() {
    try {
      const currentConfig = await this.getEmailConfig();
      
      if (!currentConfig) {
        return true; // Nothing to clear
      }

      const updatedConfig = { ...currentConfig };
      delete updatedConfig.attachmentName;
      delete updatedConfig.attachmentData;
      delete updatedConfig.attachmentType;

      return await this.saveEmailConfig(updatedConfig);
    } catch (error) {
      ErrorHandler.logError(error, { method: 'clearAttachment' });
      throw new Error('Failed to clear attachment');
    }
  }

  /**
   * Get storage usage information
   * @returns {Promise<Object>} - Storage usage statistics
   */
  static async getStorageInfo() {
    try {
      const usage = await chrome.storage.local.getBytesInUse();
      const quota = chrome.storage.local.QUOTA_BYTES || 5242880; // 5MB default
      
      return {
        used: usage,
        quota: quota,
        available: quota - usage,
        percentUsed: Math.round((usage / quota) * 100)
      };
    } catch (error) {
      ErrorHandler.logError(error, { method: 'getStorageInfo' });
      return {
        used: 0,
        quota: 5242880,
        available: 5242880,
        percentUsed: 0
      };
    }
  }

  /**
   * Clear all extension data
   * @returns {Promise<boolean>} - Success status
   */
  static async clearAllData() {
    try {
      await chrome.storage.local.clear();
      return true;
    } catch (error) {
      ErrorHandler.logError(error, { method: 'clearAllData' });
      throw new Error('Failed to clear all data');
    }
  }

  /**
   * Export configuration data
   * @returns {Promise<Object>} - Exported configuration
   */
  static async exportConfig() {
    try {
      const config = await this.getEmailConfig();
      
      if (!config) {
        throw new Error('No configuration to export');
      }

      // Remove sensitive data from export
      const exportData = { ...config };
      delete exportData.attachmentData; // Don't export file data
      
      return {
        ...exportData,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
    } catch (error) {
      ErrorHandler.logError(error, { method: 'exportConfig' });
      throw new Error('Failed to export configuration');
    }
  }

  /**
   * Import configuration data
   * @param {Object} configData - Configuration data to import
   * @returns {Promise<boolean>} - Success status
   */
  static async importConfig(configData) {
    try {
      if (!configData || typeof configData !== 'object') {
        throw new Error('Invalid configuration data');
      }

      // Validate imported configuration
      const validationErrors = this.validateConfig(configData);
      if (validationErrors.length > 0) {
        throw new Error(`Invalid imported configuration: ${validationErrors.join(', ')}`);
      }

      return await this.saveEmailConfig(configData);
    } catch (error) {
      ErrorHandler.logError(error, { method: 'importConfig', configData });
      throw new Error('Failed to import configuration');
    }
  }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageService;
} else if (typeof window !== 'undefined') {
  window.StorageService = StorageService;
}