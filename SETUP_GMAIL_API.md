# Gmail API Setup Guide

To enable direct Gmail integration, you need to set up Google OAuth credentials.

## Steps:

### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Gmail API:
   - Go to "APIs & Services" > "Library"
   - Search for "Gmail API"
   - Click "Enable"

### 2. Create OAuth Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Choose "Chrome Extension" as application type
4. Add your extension ID (you'll get this after loading the extension)

### 3. Update Extension
1. Copy your Client ID from Google Cloud Console
2. Replace `YOUR_GOOGLE_CLIENT_ID` in `manifest.json` with your actual client ID
3. Add your CV file as `cv.pdf` in the extension folder

### 4. Add Extension ID to OAuth
1. Load the extension in Chrome (chrome://extensions/)
2. Copy the extension ID from the extension card
3. Go back to Google Cloud Console > Credentials
4. Edit your OAuth client ID
5. Add the extension ID to authorized origins

## File Structure:
```
extension/
├── manifest.json
├── popup.html
├── popup.js
├── cv.pdf          <- Your CV file here
└── README.md
```

## Usage:
1. First time: Click "Authenticate Gmail" to connect
2. Enter recipient email
3. Click "Send Email"
4. Get success notification when sent!

## Features:
- ✅ Direct Gmail API integration
- ✅ Static CV attachment
- ✅ Toast notifications
- ✅ No browser tabs opened
- ✅ Automatic authentication