# Email Helper Chrome Extension

A simple Chrome extension that helps you send standardized emails with predefined subject and body content.

## Features

- Quick email composition with standardized content
- Simple interface - just enter the recipient email
- Opens your default email client with pre-filled content
- Email validation to ensure proper format

## Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select this folder
4. The extension icon will appear in your toolbar

## Usage

1. Click the extension icon in your Chrome toolbar
2. Enter the recipient's email address
3. Click "Send Email" or press Enter
4. Your default email client will open with the pre-filled email

## Customization

To customize the email content, edit the `EMAIL_CONFIG` object in `popup.js`:

```javascript
const EMAIL_CONFIG = {
  subject: "Your Custom Subject",
  body: `Your custom email body content here...`
};
```

## Files Structure

- `manifest.json` - Extension configuration
- `popup.html` - Extension popup interface
- `popup.js` - Main functionality and email handling
- `README.md` - This documentation

## Note

This extension uses the `mailto:` protocol to open your default email client. Make sure you have an email client configured on your system.