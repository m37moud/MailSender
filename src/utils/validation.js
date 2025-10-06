/**
 * Validation utilities for email, files, and user input
 */
class Validator {
  /**
   * Validate email address format
   * @param {string} email - Email address to validate
   * @returns {boolean} - True if valid email format
   */
  static isValidEmail(email) {
    if (!email || typeof email !== 'string') {
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  /**
   * Validate email configuration object
   * @param {Object} config - Email configuration
   * @returns {Array} - Array of validation errors
   */
  static validateEmailConfig(config) {
    const errors = [];
    
    if (!config) {
      errors.push('Configuration is required');
      return errors;
    }

    if (!config.subject || !config.subject.trim()) {
      errors.push('Email subject is required');
    }

    if (!config.body || !config.body.trim()) {
      errors.push('Email body is required');
    }

    if (config.subject && config.subject.length > 200) {
      errors.push('Email subject is too long (max 200 characters)');
    }

    if (config.body && config.body.length > 10000) {
      errors.push('Email body is too long (max 10,000 characters)');
    }

    return errors;
  }

  /**
   * Validate file attachment
   * @param {File} file - File object to validate
   * @returns {Array} - Array of validation errors
   */
  static validateAttachment(file) {
    const errors = [];
    
    if (!file) {
      errors.push('File is required');
      return errors;
    }

    // Check file size (1MB limit)
    const maxSize = 1024 * 1024; // 1MB
    if (file.size > maxSize) {
      errors.push(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds limit (1MB)`);
    }

    // Check file type
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      errors.push(`File type ${fileExtension} is not allowed. Allowed types: ${allowedTypes.join(', ')}`);
    }

    // Check file name
    if (file.name.length > 100) {
      errors.push('File name is too long (max 100 characters)');
    }

    return errors;
  }

  /**
   * Validate file size
   * @param {number} size - File size in bytes
   * @param {number} maxSize - Maximum allowed size in bytes
   * @returns {boolean} - True if size is valid
   */
  static validateFileSize(size, maxSize) {
    return size > 0 && size <= maxSize;
  }

  /**
   * Sanitize user input to prevent XSS
   * @param {string} input - User input to sanitize
   * @returns {string} - Sanitized input
   */
  static sanitizeInput(input) {
    if (!input || typeof input !== 'string') {
      return '';
    }

    return input
      .replace(/[<>]/g, '') // Remove < and > characters
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  /**
   * Sanitize file name
   * @param {string} fileName - File name to sanitize
   * @returns {string} - Sanitized file name
   */
  static sanitizeFileName(fileName) {
    if (!fileName || typeof fileName !== 'string') {
      return 'attachment';
    }

    return fileName
      .replace(/[<>:"/\\|?*]/g, '_') // Replace invalid characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .trim();
  }

  /**
   * Validate required fields in an object
   * @param {Object} obj - Object to validate
   * @param {Array} requiredFields - Array of required field names
   * @returns {Array} - Array of missing field errors
   */
  static validateRequiredFields(obj, requiredFields) {
    const errors = [];
    
    if (!obj || typeof obj !== 'object') {
      errors.push('Invalid object provided');
      return errors;
    }

    requiredFields.forEach(field => {
      if (!obj[field] || (typeof obj[field] === 'string' && !obj[field].trim())) {
        errors.push(`${field} is required`);
      }
    });

    return errors;
  }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Validator;
} else if (typeof window !== 'undefined') {
  window.Validator = Validator;
}