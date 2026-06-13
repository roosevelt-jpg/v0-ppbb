# Integration Configuration Guide - Passive Blessings Admin

## Overview
This guide covers configuring all 14 pre-configured integrations for the Passive Blessings platform. Each integration handles specific functionality from payments to messaging and analytics.

**Total Integrations: 14** (organized into 6 categories)

---

## 1. PAYMENTS (2 Integrations)

### 1.1 PayPal
**Category:** Payments  
**Purpose:** Payment processing & billing  
**Status:** Ready for configuration

**Required Fields:**
- **Client ID** - Your PayPal App Client ID (from PayPal Developer Dashboard)
- **Client Secret** - Your PayPal App Client Secret (encrypted in Firestore)
- **Mode** - Select "Sandbox" for testing or "Live" for production

**Configuration Steps:**
1. Go to https://developer.paypal.com/
2. Create/access your app in the Sandbox
3. Copy Client ID and Client Secret
4. In Admin Dashboard → Integrations → Find "PayPal"
5. Click "Configure"
6. Enter credentials and select mode
7. Click "Save Configuration"

**Fields:**
- clientId (text, required, encrypted)
- clientSecret (password, required, encrypted)
- mode (select: sandbox/live, required)

---

### 1.2 Ziina
**Category:** Payments  
**Purpose:** Middle East & Africa payment gateway  
**Status:** Ready for configuration

**Required Fields:**
- **API Key** - Your Ziina API Key (encrypted)
- **API Secret** - Your Ziina API Secret (encrypted)
- **Webhook Secret** - Optional webhook signing secret (encrypted)

**Configuration Steps:**
1. Log in to Ziina Business Dashboard (https://business.ziina.io)
2. Navigate to API Settings/Developer
3. Generate/copy your API Key and Secret
4. In Admin Dashboard → Integrations → Find "Ziina"
5. Click "Configure"
6. Enter API credentials
7. Optionally add webhook secret for event verification
8. Click "Save Configuration"

**Fields:**
- apiKey (password, required, encrypted)
- apiSecret (password, required, encrypted)
- webhookSecret (password, optional, encrypted)

---

## 2. BACKEND & DATABASE (1 Integration)

### 2.1 Firebase Admin SDK
**Category:** Backend & Database  
**Purpose:** Backend admin operations & Firestore database access  
**Status:** Ready for configuration (recommended: pre-configured)

**Required Fields:**
- **Project ID** - Your Firebase Project ID
- **Private Key ID** - From service account JSON
- **Private Key** - Complete private key (encrypted)
- **Client Email** - Service account email

**Configuration Steps:**
1. Go to Firebase Console → Project Settings
2. Click "Service Accounts" tab
3. Click "Generate New Private Key"
4. A JSON file downloads with all credentials
5. In Admin Dashboard → Integrations → Find "Firebase Admin SDK"
6. Click "Configure"
7. Enter credentials from the JSON:
   - projectId
   - privateKeyId (private_key_id)
   - privateKey (complete private key with newlines)
   - clientEmail
8. Click "Save Configuration"

**Fields:**
- projectId (text, required)
- privateKeyId (text, required, encrypted)
- privateKey (textarea, required, encrypted) - Paste entire JSON private key
- clientEmail (text, required, placeholder: firebase-adminsdk@...iam.gserviceaccount.com)

**⚠️ IMPORTANT:** This integration is critical for real-time Firestore sync. Handle credentials securely.

---

## 3. CALENDARS (3 Integrations)

### 3.1 Google Calendar
**Category:** Calendars  
**Purpose:** Google Calendar API integration for event creation  
**Status:** Ready for configuration

**Required Fields:**
- **Client ID** - Google OAuth Client ID
- **Client Secret** - Google OAuth Client Secret (encrypted)

**Configuration Steps:**
1. Go to https://console.cloud.google.com/
2. Create/select your project
3. Enable "Google Calendar API"
4. Go to Credentials → Create OAuth 2.0 Credential (Web Application)
5. Add authorized redirect URI: https://test.myflynai.com/api/calendar/google/callback
6. Copy Client ID and Secret
7. In Admin Dashboard → Integrations → Find "Google Calendar"
8. Click "Configure"
9. Enter credentials
10. Click "Save Configuration"

**Fields:**
- clientId (text, required)
- clientSecret (password, required, encrypted)

---

### 3.2 Microsoft Calendar (Outlook)
**Category:** Calendars  
**Purpose:** Microsoft Outlook calendar integration  
**Status:** Ready for configuration

**Required Fields:**
- **Client ID** - Azure AD Application Client ID
- **Client Secret** - Azure AD Client Secret (encrypted)
- **Tenant ID** - Azure AD Tenant ID

**Configuration Steps:**
1. Go to https://portal.azure.com/
2. Navigate to Azure Active Directory → App registrations
3. Create new registration
4. Copy Application (client) ID
5. Go to Certificates & secrets → New client secret
6. Copy the secret value
7. Get Tenant ID from Azure AD Overview
8. In Admin Dashboard → Integrations → Find "Microsoft Calendar"
9. Click "Configure"
10. Enter all three credentials
11. Click "Save Configuration"

**Fields:**
- clientId (text, required)
- clientSecret (password, required, encrypted)
- tenantId (text, required)

---

### 3.3 Apple Calendar
**Category:** Calendars  
**Purpose:** Apple Calendar iCal support  
**Status:** Ready for configuration

**Configuration Steps:**
Apple Calendar uses iCal format for calendar imports. No API credentials needed.
The system generates iCal files that users can import directly into Apple Calendar.

**Fields:**
- No configuration needed - works automatically

---

## 4. MESSAGING (3 Integrations)

### 4.1 WhatsApp Business
**Category:** Messaging  
**Purpose:** WhatsApp Business API messaging  
**Status:** Ready for configuration

**Required Fields:**
- **Business Account ID** - WhatsApp Business Account ID
- **API Access Token** - Permanent API Access Token (encrypted)
- **Phone Number ID** - Your WhatsApp Business Phone Number ID

**Configuration Steps:**
1. Ensure you have WhatsApp Business Account
2. Go to https://www.whatsapp.com/business/downloads
3. Access WhatsApp Business Platform
4. Generate API Access Token in Business Account settings
5. Get your Phone Number ID and Business Account ID
6. In Admin Dashboard → Integrations → Find "WhatsApp Business"
7. Click "Configure"
8. Enter credentials
9. Click "Save Configuration"

**Fields:**
- businessAccountId (text, required)
- accessToken (password, required, encrypted)
- phoneNumberId (text, required)

---

### 4.2 SendGrid Email
**Category:** Messaging  
**Purpose:** Email sending via SendGrid  
**Status:** Ready for configuration

**Required Fields:**
- **API Key** - SendGrid API Key (encrypted)
- **From Email** - Default sender email address

**Configuration Steps:**
1. Create SendGrid account at https://sendgrid.com/
2. Go to Settings → API Keys
3. Create new API key (check "Mail Send" permission)
4. Copy the API key
5. In Admin Dashboard → Integrations → Find "SendGrid Email"
6. Click "Configure"
7. Enter API key and default from email
8. Click "Save Configuration"

**Fields:**
- apiKey (password, required, encrypted)
- fromEmail (text, required, placeholder: noreply@passiveblessings.ae)

---

### 4.3 Twilio SMS
**Category:** Messaging  
**Purpose:** SMS sending via Twilio  
**Status:** Ready for configuration

**Required Fields:**
- **Account SID** - Your Twilio Account SID
- **Auth Token** - Your Twilio Auth Token (encrypted)
- **Phone Number** - Your Twilio phone number for sending SMS

**Configuration Steps:**
1. Create Twilio account at https://www.twilio.com/
2. Go to Console → Account Info
3. Copy Account SID and Auth Token
4. Get your Twilio phone number (or purchase one)
5. In Admin Dashboard → Integrations → Find "Twilio SMS"
6. Click "Configure"
7. Enter all credentials
8. Click "Save Configuration"

**Fields:**
- accountSid (text, required)
- authToken (password, required, encrypted)
- phoneNumber (text, required, placeholder: +1234567890)

---

## 5. STORAGE & ANALYTICS (4 Integrations)

### 5.1 Google Maps API
**Category:** Storage & Analytics  
**Purpose:** Maps, geocoding, location services  
**Status:** Ready for configuration

**Required Fields:**
- **API Key** - Google Maps API Key (encrypted)

**Configuration Steps:**
1. Go to https://console.cloud.google.com/
2. Create/select project
3. Enable "Maps JavaScript API", "Geocoding API", etc.
4. Go to Credentials → Create API Key
5. Restrict to your domain
6. Copy the API key
7. In Admin Dashboard → Integrations → Find "Google Maps API"
8. Click "Configure"
9. Enter API key
10. Click "Save Configuration"

**Fields:**
- apiKey (password, required, encrypted)

---

### 5.2 AWS S3 Storage
**Category:** Storage & Analytics  
**Purpose:** Cloud file storage for uploads  
**Status:** Ready for configuration

**Required Fields:**
- **Access Key ID** - AWS IAM Access Key ID
- **Secret Access Key** - AWS IAM Secret Key (encrypted)
- **Bucket Name** - S3 bucket name for uploads
- **Region** - AWS region (e.g., us-east-1)

**Configuration Steps:**
1. Go to AWS Console → IAM
2. Create new user for S3 access
3. Generate Access Key ID and Secret
4. Create S3 bucket
5. In Admin Dashboard → Integrations → Find "AWS S3 Storage"
6. Click "Configure"
7. Enter AWS credentials and bucket info
8. Click "Save Configuration"

**Fields:**
- accessKeyId (text, required, encrypted)
- secretAccessKey (password, required, encrypted)
- bucketName (text, required)
- region (text, required, placeholder: us-east-1)

---

### 5.3 YouTube Data API
**Category:** Storage & Analytics  
**Purpose:** YouTube channel management & video data  
**Status:** Ready for configuration

**Required Fields:**
- **API Key** - YouTube Data API Key (encrypted)
- **Channel ID** - Your YouTube Channel ID

**Configuration Steps:**
1. Go to https://console.cloud.google.com/
2. Enable "YouTube Data API v3"
3. Create API Key in Credentials
4. Get your YouTube Channel ID from your channel page
5. In Admin Dashboard → Integrations → Find "YouTube Data API"
6. Click "Configure"
7. Enter API key and Channel ID
8. Click "Save Configuration"

**Fields:**
- apiKey (password, required, encrypted)
- channelId (text, required)

---

### 5.4 Google Analytics
**Category:** Storage & Analytics  
**Purpose:** Website traffic & user behavior tracking  
**Status:** Ready for configuration

**Required Fields:**
- **Tracking ID** - Google Analytics tracking ID (e.g., G-XXXXXXXXXX)
- **Property ID** - GA4 Property ID (encrypted)

**Configuration Steps:**
1. Go to https://analytics.google.com/
2. Create/access your GA4 property
3. Go to Data Streams → Select your web stream
4. Copy Measurement ID (Tracking ID)
5. Get Property ID from Admin → Property settings
6. In Admin Dashboard → Integrations → Find "Google Analytics"
7. Click "Configure"
8. Enter tracking ID and property ID
9. Click "Save Configuration"

**Fields:**
- trackingId (text, required)
- propertyId (text, required, encrypted)

---

## 6. WEBHOOKS (1 Integration)

### 6.1 Custom Webhook Endpoints
**Category:** Webhooks  
**Purpose:** Custom endpoint for external service notifications  
**Status:** Ready for configuration

**Required Fields:**
- **Endpoint URL** - Your webhook receiving URL
- **Secret Token** - For signing requests (encrypted)

**Configuration Steps:**
1. Prepare your webhook receiving endpoint
2. In Admin Dashboard → Integrations → Find "Custom Webhook"
3. Click "Configure"
4. Enter your endpoint URL
5. Generate/enter a secret token for request verification
6. Click "Save Configuration"

**Fields:**
- endpointUrl (text, required)
- secretToken (password, required, encrypted)

---

## Firestore Real-Time Data Storage Setup

### Database Collections Structure

Once all integrations are configured, the following Firestore collections are used for real-time sync:

```
Firestore Collections:
├── integrations/              # Stores all configured integrations
│   ├── {userId}_{serviceId}   # Each integration document
│   │   ├── userId
│   │   ├── serviceId
│   │   ├── credentials (encrypted)
│   │   ├── status
│   │   ├── createdAt
│   │   └── updatedAt
│
├── integrationHealth/         # Real-time health status
│   ├── {serviceId}_health
│   │   ├── serviceId
│   │   ├── status (operational/degraded/down)
│   │   ├── latency (ms)
│   │   ├── lastChecked
│   │   ├── uptime90d (%)
│   │   └── incidentCount
│
└── adminUsers/                # Admin user permissions
    ├── {userId}
    │   ├── adminRole (founder_admin, admin, etc)
    │   ├── permissions []
    │   ├── createdAt
    │   └── updatedAt
```

### Real-Time Sync Features

1. **Live Integration Status:**
   - Admin dashboard shows real-time integration status
   - Health checks every 5 minutes
   - Automatic status updates across all admin sessions

2. **Credential Encryption:**
   - All credentials encrypted with AES-256-CBC
   - Random IVs for each encryption
   - Server-side encryption/decryption only
   - Credentials never logged or exposed

3. **Real-Time User Access:**
   - Firebase authentication on all endpoints
   - Automatic permission verification
   - founder_admin users auto-granted manage_integrations
   - Per-user integration isolation

---

## Security Best Practices

✓ All credentials encrypted before Firestore storage (AES-256-CBC)
✓ Server-side only operations (firebase-admin)
✓ Random IVs for each encryption
✓ Firebase ID token validation on all API calls
✓ founder_admin permission required for configuration
✓ Per-user integration scoping (userId_serviceId)
✓ Sensitive fields never logged
✓ Credentials auto-redacted in API responses

---

## Testing Configuration

### Verify Each Integration:

1. Navigate to Admin Dashboard → Integrations
2. Find the integration you want to test
3. Click the integration card
4. Click "Configure"
5. Enter/verify credentials
6. Click "Save Configuration"
7. Check Health Status dashboard to see real-time status
8. Look for green "operational" status

### Common Issues:

- **401 Unauthorized:** Check Firebase token or permissions
- **500 Error:** Check environment variables and API credentials
- **Connection Timeout:** Verify firewall rules and credentials are correct
- **Credentials Invalid:** Double-check API credentials format

---

## Deployment Checklist

- [x] All 14 integrations defined in services.ts
- [x] API routes created for CRUD operations
- [x] Server-side handlers using firebase-admin
- [x] AES-256 encryption implemented
- [x] Real-time Firestore listeners active
- [x] Health monitoring running
- [x] Admin permission system active
- [x] Modal UI for configuration
- [x] Error handling and logging
- [x] Production deployment live

---

## Support & Troubleshooting

For API credentials and detailed setup:
- PayPal: https://developer.paypal.com/
- Ziina: https://business.ziina.io/
- Firebase: https://console.firebase.google.com/
- Google: https://console.cloud.google.com/
- Azure: https://portal.azure.com/
- AWS: https://console.aws.amazon.com/
- SendGrid: https://app.sendgrid.com/
- Twilio: https://www.twilio.com/
- WhatsApp: https://www.whatsapp.com/business/

---

**Last Updated:** June 13, 2026
**Status:** Ready for Configuration
**Integration System:** Production Deployed ✓
