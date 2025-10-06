# How to Bypass Gmail API Verification

The "App not verified" error can be bypassed. Here are the solutions:

## Method 1: Add Yourself as Test User (Recommended)

1. **Go to Google Cloud Console**
2. **Navigate to:** APIs & Services → OAuth consent screen
3. **Click "ADD USERS" under Test users**
4. **Add your Gmail address** (the one you want to send emails from)
5. **Save changes**
6. **Try authentication again** - should work now!

## Method 2: Use Internal App Type

1. **Go to:** APIs & Services → OAuth consent screen
2. **Change User Type to "Internal"** (if available)
3. **This bypasses verification completely**
4. **Note:** Only works if you have a Google Workspace account

## Method 3: Continue Despite Warning

1. **When you see the verification warning**
2. **Click "Advanced" at the bottom**
3. **Click "Go to [App Name] (unsafe)"**
4. **Continue with authentication**
5. **Grant permissions**

## Method 4: Create New Project with Different Name

1. **Create a new Google Cloud project**
2. **Use a generic name like "Personal Email Tool"**
3. **Enable Gmail API**
4. **Create new OAuth credentials**
5. **Update manifest.json with new client ID**

## Current Setup Status:

Your extension is configured with:
- Client ID: `694485948569-omc85fgb45e7ipkhoslvpruukks9st62.apps.googleusercontent.com`
- Scopes: Gmail send permission
- Ready to use once verification is bypassed

## Quick Fix Steps:

1. **Add yourself as test user** (Method 1 above)
2. **Reload the extension** in Chrome
3. **Click "Authenticate Gmail"**
4. **Should work without verification error**

## If Still Having Issues:

The extension includes better error handling now and will:
- Show specific error messages
- Handle token expiration
- Retry authentication automatically
- Work even with verification warnings

**Try Method 1 first - it's the most reliable solution!**