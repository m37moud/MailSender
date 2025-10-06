# Gmail API Email Sender - Chrome Extension

A modern, secure Chrome extension for sending standardized emails with attachments via Gmail API.

## 🚀 Features

- **Direct Gmail API Integration** - Send emails without opening browser tabs
- **File Attachments** - Attach files up to 1MB with proper MIME encoding
- **Environment Configuration** - Secure credential management via .env files
- **Modular Architecture** - Clean, maintainable codebase with separation of concerns
- **Error Handling** - Comprehensive error handling with user-friendly messages
- **Authentication Management** - Automatic token refresh and secure storage
- **Real-time Validation** - Input validation with immediate feedback
- **Responsive UI** - Modern, accessible interface

## 📁 Project Structure

```
├── src/                          # Source code
│   ├── popup/                    # Popup interface
│   │   ├── popup.html
│   │   ├── popup.css
│   │   └── popup.js
│   ├── settings/                 # Settings interface
│   │   ├── settings.html
│   │   ├── settings.css
│   │   └── settings.js
│   ├── services/                 # Business logic services
│   │   ├── auth.service.js
│   │   ├── gmail-api.service.js
│   │   ├── email.service.js
│   │   └── storage.service.js
│   ├── utils/                    # Utility functions
│   │   ├── validation.js
│   │   ├── file-handler.js
│   │   └── error-handler.js
│   └── config/                   # Configuration management
│       └── environment.js
├── docs/                         # Documentation
├── .env                          # Environment variables (gitignored)
├── .env.example                  # Environment template
├── package.json                  # Dependencies and scripts
├── build.js                      # Build script
└── manifest.json                 # Chrome extension manifest (generated)
```

## 🛠️ Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your settings
nano .env
```

Required environment variables:
- `GOOGLE_CLIENT_ID` - Your Google OAuth Client ID
- `DEFAULT_SENDER_NAME` - Your name for email signatures
- `DEFAULT_SENDER_PHONE` - Your phone number for email signatures

### 3. Set up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Gmail API
4. Create OAuth client ID (Web application type)
5. Add your extension ID to authorized origins
6. Update `.env` with your client ID

### 4. Build Extension
```bash
npm run build
```

### 5. Load in Chrome
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select this project folder

## 🔧 Development

### Available Scripts
```bash
npm run build        # Build for production
npm run dev          # Build for development
npm run watch        # Auto-rebuild on changes
npm run lint         # Run ESLint
npm test             # Run tests
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | Yes |
| `EXTENSION_NAME` | Extension display name | No |
| `EXTENSION_VERSION` | Extension version | No |
| `DEFAULT_EMAIL_SUBJECT` | Default email subject | No |
| `DEFAULT_SENDER_NAME` | Default sender name | No |
| `DEFAULT_SENDER_PHONE` | Default sender phone | No |

## 📖 Usage

### First Time Setup
1. Click the extension icon
2. Click "Authenticate Gmail"
3. Grant necessary permissions
4. Click "⚙️ Setup" to configure your email template
5. Upload your CV/resume file
6. Save settings

### Sending Emails
1. Click the extension icon
2. Enter recipient email address
3. Click "Send Email"
4. Email is sent automatically with your attachment

## 🏗️ Architecture

### Service Layer
- **AuthService** - Handles Gmail OAuth authentication
- **GmailApiService** - Manages Gmail API communication
- **EmailService** - High-level email operations
- **StorageService** - Chrome storage management

### Utility Layer
- **Validator** - Input validation and sanitization
- **FileHandler** - File processing and conversion
- **ErrorHandler** - Error classification and recovery

### UI Layer
- **PopupController** - Main interface logic
- **SettingsController** - Configuration interface logic

## 🔒 Security

- Environment variables for sensitive configuration
- Secure token storage using Chrome APIs
- Input sanitization and validation
- HTTPS-only API communications
- No sensitive data in source code

## 🐛 Troubleshooting

### Common Issues

**Authentication Failed**
- Verify your Google Client ID in `.env`
- Check that Gmail API is enabled
- Ensure extension ID is added to OAuth settings

**File Too Large**
- Maximum file size is 1MB
- Compress your file or use a smaller version

**Permission Denied**
- Add yourself as a test user in Google Cloud Console
- Verify OAuth scopes are correct

### Debug Information
Click the "🐛 Debug Info" button in the popup to see:
- Authentication status
- Configuration status
- Storage usage
- API connection status

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Review the debug information
3. Check browser console for errors
4. Create an issue with detailed information