# Quick Setup Guide

## Option 1: Simple Version (No OAuth Setup Required)

For immediate use without Gmail API setup, I can create a simpler version that:
- Opens Gmail compose with pre-filled content
- Shows your CV file name (you manually attach it)
- Works immediately without any setup

## Option 2: Full Gmail API Integration

To use the advanced version with automatic sending, you need:

### Step 1: Get Google OAuth Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Gmail API:
   - APIs & Services → Library → Search "Gmail API" → Enable
4. Create credentials:
   - APIs & Services → Credentials → Create Credentials → OAuth client ID
   - Application type: "Web application" (not Chrome extension)
   - Add authorized redirect URI: `https://YOUR_EXTENSION_ID.chromiumapp.org/`

### Step 2: Get Extension ID
1. Load your extension in Chrome (chrome://extensions/)
2. Copy the extension ID (long string under extension name)
3. Replace YOUR_EXTENSION_ID in the redirect URI above

### Step 3: Update manifest.json
Replace `YOUR_GOOGLE_CLIENT_ID` with your actual client ID from step 1.

### Step 4: Add CV File
Put your CV file as `cv.pdf` in the extension folder.

---

**Which option would you prefer?**
- Simple version (works immediately)
- Full API version (requires setup but auto-sends emails)