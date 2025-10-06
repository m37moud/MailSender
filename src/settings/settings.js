/**
 * Settings controller for the Chrome extension
 */
class SettingsController {
  constructor() {
    this.elements = {};
    this.currentConfig = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the settings page
   */
  async init() {
    try {
      this._initializeElements();
      this._attachEventListeners();
      await this._loadSettings();
      
      this.isInitialized = true;
    } catch (error) {
      ErrorHandler.logError(error, { method: 'init' });
      this._showStatus('Failed to initialize settings', 'error');
    }
  }

  /**
   * Initialize DOM elements
   */
  _initializeElements() {
    this.elements = {
      form: document.getElementById('settingsForm'),
      subjectInput: document.getElementById('subjectInput'),
      bodyInput: document.getElementById('bodyInput'),
      attachmentInput: document.getElementById('attachmentInput'),
      fileInfo: document.getElementById('fileInfo'),
      saveBtn: document.getElementById('saveBtn'),
      backBtn: document.getElementById('backBtn'),
      status: document.getElementById('status')
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
    // Form submission
    this.elements.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this._handleSave();
    });

    // Save button
    this.elements.saveBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this._handleSave();
    });

    // Back button
    this.elements.backBtn.addEventListener('click', () => this._goBack());

    // File input change
    this.elements.attachmentInput.addEventListener('change', (e) => {
      this._handleFileSelection(e);
    });

    // Real-time validation
    this.elements.subjectInput.addEventListener('input', () => this._validateForm());
    this.elements.bodyInput.addEventListener('input', () => this._validateForm());
  }

  /**
   * Load existing settings
   */
  async _loadSettings() {
    try {
      const config = await StorageService.getEmailConfig();
      
      if (config) {
        this.currentConfig = config;
        this._populateForm(config);
      } else {
        this.currentConfig = this._getDefaultConfig();
        this._populateForm(this.currentConfig);
      }

      this._validateForm();
    } catch (error) {
      ErrorHandler.logError(error, { method: '_loadSettings' });
      this._showStatus('Failed to load settings', 'error');
    }
  }

  /**
   * Get default configuration
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
      attachmentName: null,
      attachmentData: null,
      attachmentType: null
    };
  }

  /**
   * Populate form with configuration data
   */
  _populateForm(config) {
    this.elements.subjectInput.value = config.subject || '';
    this.elements.bodyInput.value = config.body || '';
    
    // Show current attachment info
    if (config.attachmentName && config.attachmentData) {
      const sizeKB = Math.round(config.attachmentData.length * 0.75 / 1024);
      this.elements.fileInfo.textContent = `Current: ${config.attachmentName} (${sizeKB} KB)`;
    } else {
      this.elements.fileInfo.textContent = '';
    }
  }

  /**
   * Handle file selection
   */
  async _handleFileSelection(event) {
    const file = event.target.files[0];
    
    if (!file) {
      this.elements.fileInfo.textContent = '';
      return;
    }

    try {
      // Validate file
      const validation = FileHandler.validateFile(file);
      if (!validation.isValid) {
        this._showStatus(validation.errors.join(', '), 'error');
        this.elements.attachmentInput.value = '';
        this.elements.fileInfo.textContent = '';
        return;
      }

      // Show file info
      const sizeKB = (file.size / 1024).toFixed(2);
      this.elements.fileInfo.textContent = `Selected: ${file.name} (${sizeKB} KB)`;
      
      this._validateForm();
    } catch (error) {
      ErrorHandler.logError(error, { method: '_handleFileSelection' });
      this._showStatus('Error processing file: ' + ErrorHandler.getUserMessage(error), 'error');
    }
  }

  /**
   * Validate form inputs
   */
  _validateForm() {
    const subject = this.elements.subjectInput.value.trim();
    const body = this.elements.bodyInput.value.trim();
    
    let isValid = true;
    const errors = [];

    // Validate required fields
    if (!subject) {
      errors.push('Subject is required');
      isValid = false;
    }

    if (!body) {
      errors.push('Body is required');
      isValid = false;
    }

    // Validate lengths
    if (subject.length > 200) {
      errors.push('Subject is too long (max 200 characters)');
      isValid = false;
    }

    if (body.length > 10000) {
      errors.push('Body is too long (max 10,000 characters)');
      isValid = false;
    }

    // Update save button state
    this.elements.saveBtn.disabled = !isValid;

    // Show validation errors
    if (errors.length > 0 && (subject || body)) {
      this._showStatus(errors.join(', '), 'error');
    } else if (isValid && (subject || body)) {
      this._hideStatus();
    }

    return isValid;
  }

  /**
   * Handle save button click
   */
  async _handleSave() {
    try {
      if (!this._validateForm()) {
        return;
      }

      this._showStatus('Saving settings...', 'info');
      this.elements.saveBtn.disabled = true;

      const subject = this.elements.subjectInput.value.trim();
      const body = this.elements.bodyInput.value.trim();
      const file = this.elements.attachmentInput.files[0];

      let config = {
        subject: subject,
        body: body
      };

      // Handle file attachment
      if (file) {
        const attachmentData = await this._processFile(file);
        config = {
          ...config,
          attachmentName: attachmentData.name,
          attachmentData: attachmentData.data,
          attachmentType: attachmentData.type
        };
      } else if (this.currentConfig && this.currentConfig.attachmentData) {
        // Keep existing attachment if no new file selected
        config = {
          ...config,
          attachmentName: this.currentConfig.attachmentName,
          attachmentData: this.currentConfig.attachmentData,
          attachmentType: this.currentConfig.attachmentType
        };
      }

      // Validate final configuration
      const validationErrors = Validator.validateEmailConfig(config);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }

      // Save configuration
      await StorageService.saveEmailConfig(config);
      
      this._showStatus('✅ Settings saved successfully!', 'success');
      
      // Auto-close after success
      setTimeout(() => {
        this._goBack();
      }, 2000);

    } catch (error) {
      ErrorHandler.logError(error, { method: '_handleSave' });
      this._showStatus('Failed to save settings: ' + ErrorHandler.getUserMessage(error), 'error');
    } finally {
      this.elements.saveBtn.disabled = false;
    }
  }

  /**
   * Process selected file
   */
  async _processFile(file) {
    try {
      // Validate file again
      const validation = FileHandler.validateFile(file);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Read file as base64
      const base64Data = await FileHandler.readFileAsBase64(file);
      const mimeType = FileHandler.getFileMimeType(file);

      return {
        name: Validator.sanitizeFileName(file.name),
        data: base64Data,
        type: mimeType
      };
    } catch (error) {
      throw new Error('Failed to process file: ' + error.message);
    }
  }

  /**
   * Go back to popup
   */
  _goBack() {
    chrome.tabs.create({ 
      url: chrome.runtime.getURL('src/popup/popup.html') 
    });
    window.close();
  }

  /**
   * Show status message
   */
  _showStatus(message, type = 'info') {
    this.elements.status.textContent = message;
    this.elements.status.className = `status ${type}`;
    this.elements.status.style.display = 'block';
  }

  /**
   * Hide status message
   */
  _hideStatus() {
    this.elements.status.style.display = 'none';
  }

  /**
   * Export configuration
   */
  async _exportConfig() {
    try {
      const exportData = await StorageService.exportConfig();
      
      // Create download
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      
      const filename = `email-config-${new Date().toISOString().split('T')[0]}.json`;
      FileHandler.downloadFile(blob, filename);
      
      this._showStatus('Configuration exported successfully', 'success');
    } catch (error) {
      ErrorHandler.logError(error, { method: '_exportConfig' });
      this._showStatus('Failed to export configuration: ' + ErrorHandler.getUserMessage(error), 'error');
    }
  }

  /**
   * Import configuration
   */
  async _importConfig(file) {
    try {
      const text = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(file);
      });

      const configData = JSON.parse(text);
      await StorageService.importConfig(configData);
      
      // Reload settings
      await this._loadSettings();
      
      this._showStatus('Configuration imported successfully', 'success');
    } catch (error) {
      ErrorHandler.logError(error, { method: '_importConfig' });
      this._showStatus('Failed to import configuration: ' + ErrorHandler.getUserMessage(error), 'error');
    }
  }

  /**
   * Reset to default configuration
   */
  async _resetToDefaults() {
    try {
      const confirmed = confirm('Are you sure you want to reset to default settings? This will remove your current configuration and attachment.');
      
      if (confirmed) {
        const defaultConfig = this._getDefaultConfig();
        await StorageService.saveEmailConfig(defaultConfig);
        
        this.currentConfig = defaultConfig;
        this._populateForm(defaultConfig);
        this.elements.attachmentInput.value = '';
        
        this._showStatus('Settings reset to defaults', 'success');
      }
    } catch (error) {
      ErrorHandler.logError(error, { method: '_resetToDefaults' });
      this._showStatus('Failed to reset settings: ' + ErrorHandler.getUserMessage(error), 'error');
    }
  }
}

// Initialize settings when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const settings = new SettingsController();
    await settings.init();
  } catch (error) {
    console.error('Failed to initialize settings:', error);
    alert('Failed to initialize settings. Please reload and try again.');
  }
});