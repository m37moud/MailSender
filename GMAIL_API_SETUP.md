# Gmail API Setup Guide

To use Gmail API for direct email sending, you need to set up Google OAuth credentials.

## Quick Setup Steps:

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Gmail API:
   - Go to "APIs & Services" → "Library"
   - Search for "Gmail API" → Click "Enable"

### 2. Create OAuth Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Choose "Web application" as application type
4. Add authorized redirect URI: `https://[EXTENSION_ID].chromiumapp.org/`
   - You'll get the extension ID after loading the extension in Chrome

### 3. Get Your Extension ID

1. Load the extension in Chrome (`chrome://extensions/`)
2. Enable "Developer mode"
3. Click "Load unpacked" and select your extension folder
4. Copy the extension ID (long string under extension name)

### 4. Update OAuth Settings

1. Go back to Google Cloud Console → Credentials
2. Edit your OAuth client ID
3. Replace `[EXTENSION_ID]` in the redirect URI with your actual extension ID

### 5. Update Extension

1. Replace `YOUR_CLIENT_ID` in `manifest.json` with your actual client ID from step 2
2. Reload the extension in Chrome

## Example manifest.json:

```json
"oauth2": {
  "client_id": "123456789-abcdefghijklmnop.apps.googleusercontent.com",
  "scopes": [
    "https://www.googleapis.com/auth/gmail.send"
  ]
}
```

## Usage After Setup:

1. Click "Authenticate Gmail" (first time only)
2. Grant permissions
3. Enter recipient email
4. Click "Send Email"
5. Email sent directly via Gmail API!

## Features:

- ✅ Direct email sending (no browser tabs)
- ✅ Real file attachments (not base64 in body)
- ✅ Toast notifications
- ✅ Automatic authentication handling
- ✅ Token refresh on expiry
