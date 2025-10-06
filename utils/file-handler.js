/**
 * File handling utilities for attachment processing
 */
class FileHandler {
  /**
   * Read file as base64 string
   * @param {File} file - File object to read
   * @returns {Promise<string>} - Base64 encoded file data
   */
  static async readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error('No file provided'));
        return;
      }

      const reader = new FileReader();
      
      reader.onload = function(e) {
        try {
          // Remove data URL prefix (data:type;base64,)
          const base64Data = e.target.result.split(',')[1];
          resolve(base64Data);
        } catch (error) {
          reject(new Error('Failed to process file data'));
        }
      };
      
      reader.onerror = function() {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsDataURL(file);
    });
  }

  /**
   * Convert base64 string to Blob
   * @param {string} base64Data - Base64 encoded data
   * @param {string} mimeType - MIME type of the data
   * @returns {Blob} - Blob object
   */
  static base64ToBlob(base64Data, mimeType) {
    try {
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      return new Blob([byteArray], { type: mimeType });
    } catch (error) {
      throw new Error('Failed to convert base64 to blob: ' + error.message);
    }
  }

  /**
   * Convert Blob to base64 string
   * @param {Blob} blob - Blob object to convert
   * @returns {Promise<string>} - Base64 encoded string
   */
  static async blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = function(e) {
        try {
          const base64Data = e.target.result.split(',')[1];
          resolve(base64Data);
        } catch (error) {
          reject(new Error('Failed to convert blob to base64'));
        }
      };
      
      reader.onerror = function() {
        reject(new Error('Failed to read blob'));
      };
      
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Get file MIME type
   * @param {File} file - File object
   * @returns {string} - MIME type
   */
  static getFileMimeType(file) {
    if (!file) {
      return 'application/octet-stream';
    }

    // Use file.type if available
    if (file.type) {
      return file.type;
    }

    // Fallback to extension-based detection
    const extension = file.name.split('.').pop().toLowerCase();
    const mimeTypes = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'txt': 'text/plain',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif'
    };

    return mimeTypes[extension] || 'application/octet-stream';
  }

  /**
   * Format file size for display
   * @param {number} bytes - File size in bytes
   * @returns {string} - Formatted file size
   */
  static formatFileSize(bytes) {
    if (!bytes || bytes === 0) {
      return '0 B';
    }

    const units = ['B', 'KB', 'MB', 'GB'];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + units[i];
  }

  /**
   * Validate file before processing
   * @param {File} file - File to validate
   * @returns {Object} - Validation result with isValid and errors
   */
  static validateFile(file) {
    const errors = Validator.validateAttachment(file);
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Create download link for file
   * @param {Blob} blob - File blob
   * @param {string} filename - Filename for download
   * @returns {string} - Download URL
   */
  static createDownloadUrl(blob, filename) {
    const url = URL.createObjectURL(blob);
    
    // Create temporary download link
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    return url;
  }

  /**
   * Trigger file download
   * @param {Blob} blob - File blob
   * @param {string} filename - Filename for download
   */
  static downloadFile(blob, filename) {
    const url = this.createDownloadUrl(blob, filename);
    
    // Create temporary link and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up URL after download
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  /**
   * Compress file if it's too large (basic implementation)
   * @param {File} file - File to compress
   * @param {Object} options - Compression options
   * @returns {Promise<File>} - Compressed file
   */
  static async compressFile(file, options = {}) {
    // For now, just return the original file
    // In a full implementation, you could use libraries like pako for compression
    console.warn('File compression not implemented yet');
    return file;
  }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FileHandler;
} else if (typeof window !== 'undefined') {
  window.FileHandler = FileHandler;
}