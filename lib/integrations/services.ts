import { IntegrationService } from './types'

export const INTEGRATION_SERVICES: Record<string, IntegrationService> = {
  // Payments
  paypal: {
    id: 'paypal',
    name: 'PayPal',
    category: 'payments',
    description: 'Payment processing & billing',
    icon: '💳',
    fields: [
      { name: 'clientId', label: 'Client ID', type: 'text', required: true, encrypt: true },
      { name: 'clientSecret', label: 'Client Secret', type: 'password', required: true, encrypt: true },
      { name: 'mode', label: 'Mode', type: 'select', required: true, options: [{ label: 'Sandbox', value: 'sandbox' }, { label: 'Live', value: 'live' }] },
    ],
  },
  stripe: {
    id: 'stripe',
    name: 'Stripe',
    category: 'payments',
    description: 'Payment processing & subscriptions',
    icon: '🎯',
    fields: [
      { name: 'publishableKey', label: 'Publishable Key', type: 'text', required: true, placeholder: 'pk_test_...' },
      { name: 'secretKey', label: 'Secret Key', type: 'password', required: true, encrypt: true, placeholder: 'sk_test_...' },
      { name: 'mode', label: 'Mode', type: 'select', required: true, options: [{ label: 'Test', value: 'test' }, { label: 'Live', value: 'live' }] },
      { name: 'webhookSecret', label: 'Webhook Secret', type: 'password', required: false, encrypt: true, placeholder: 'whsec_...' },
    ],
  },
  ziina: {
    id: 'ziina',
    name: 'Ziina',
    category: 'payments',
    description: 'Middle East & Africa gateway',
    icon: '🌍',
    fields: [
      { name: 'apiKey', label: 'API Key', type: 'password', required: true, encrypt: true },
      { name: 'apiSecret', label: 'API Secret', type: 'password', required: true, encrypt: true },
      { name: 'webhookSecret', label: 'Webhook Secret', type: 'password', required: false, encrypt: true },
    ],
  },
  // Backend & Database
  firebase: {
    id: 'firebase',
    name: 'Firebase Admin SDK',
    category: 'backend',
    description: 'Backend admin & database',
    icon: '🔥',
    fields: [
      {
        name: 'serviceAccountJson',
        label: 'Service Account JSON',
        type: 'textarea',
        required: true,
        encrypt: true,
        placeholder: '{"type":"service_account","project_id":"your-project","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n","client_email":"...@....iam.gserviceaccount.com"}',
        help: 'Paste your entire Firebase service account JSON file contents here',
      },
    ],
  },
  firebaseClient: {
    id: 'firebaseClient',
    name: 'Firebase Client SDK',
    category: 'backend',
    description: 'Web app config (auth, firestore)',
    icon: '🔆',
    fields: [
      { name: 'apiKey', label: 'API Key', type: 'text', required: true, placeholder: 'AIza...' },
      { name: 'authDomain', label: 'Auth Domain', type: 'text', required: true, placeholder: 'your-project.firebaseapp.com' },
      { name: 'projectId', label: 'Project ID', type: 'text', required: true, placeholder: 'your-project' },
      { name: 'storageBucket', label: 'Storage Bucket', type: 'text', required: false, placeholder: 'your-project.appspot.com' },
      { name: 'messagingSenderId', label: 'Messaging Sender ID', type: 'text', required: false, placeholder: '1234567890' },
      { name: 'appId', label: 'App ID', type: 'text', required: true, placeholder: '1:1234567890:web:abc123' },
    ],
    docs: 'https://firebase.google.com/docs/web/setup',
  },
  googleAuth: {
    id: 'googleAuth',
    name: 'Google Sign-In',
    category: 'backend',
    description: 'Continue with Google on login & signup',
    icon: '🔐',
    fields: [
      {
        name: 'webClientId',
        label: 'OAuth Web Client ID',
        type: 'text',
        required: true,
        placeholder: '123456789-abc.apps.googleusercontent.com',
      },
      {
        name: 'webClientSecret',
        label: 'OAuth Client Secret',
        type: 'password',
        required: false,
        encrypt: true,
        placeholder: 'Optional — stored for admin reference',
      },
      {
        name: 'enabled',
        label: 'Enable Google Sign-In on login page',
        type: 'checkbox',
        required: false,
      },
    ],
    docs: 'https://firebase.google.com/docs/auth/web/google-signin',
    help: 'Create OAuth Web credentials in Google Cloud Console, enable Google in Firebase Authentication → Sign-in method with the same Client ID, then save Client ID here and keep this integration Active with Enable checked.',
  },
  facebookAuth: {
    id: 'facebookAuth',
    name: 'Facebook Login',
    category: 'backend',
    description: 'Currently disabled on login & signup (not live)',
    icon: '🔐',
    fields: [
      { name: 'appId', label: 'Facebook App ID', type: 'text', required: true, placeholder: '1234567890123456' },
      {
        name: 'appSecret',
        label: 'Facebook App Secret',
        type: 'password',
        required: true,
        encrypt: true,
      },
      {
        name: 'enabled',
        label: 'Enable Facebook Login (ignored — Facebook is hard-disabled in the app)',
        type: 'checkbox',
        required: false,
      },
    ],
    docs: 'https://firebase.google.com/docs/auth/web/facebook-login',
    help: 'Facebook Login buttons are hidden on login/signup. Credentials can be saved for later; re-enable requires a code change after Meta/Firebase setup works.',
  },
  // AI
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic (Claude)',
    category: 'ai',
    description: 'Powers the support chatbot with conversational AI (falls back to FAQ-only matching when not configured)',
    icon: '🤖',
    fields: [
      {
        name: 'apiKey',
        label: 'API Key',
        type: 'password',
        required: true,
        encrypt: true,
        placeholder: 'sk-ant-...',
      },
    ],
    docs: 'https://console.anthropic.com/settings/keys',
    help: 'Create a key in the Anthropic Console and paste it here. Once saved, the support chatbot (Admin → Chatbot) will use Claude to answer conversationally from your FAQs and training docs instead of plain keyword matching.',
  },
  // Calendars
  googleCalendar: {
    id: 'googleCalendar',
    name: 'Google Calendar',
    category: 'calendars',
    description: 'Google Calendar API integration',
    icon: '📅',
    fields: [
      { name: 'clientId', label: 'OAuth Client ID', type: 'text', required: true, encrypt: true },
      { name: 'clientSecret', label: 'OAuth Client Secret', type: 'password', required: true, encrypt: true },
      { name: 'redirectUrl', label: 'Redirect URL', type: 'text', required: false, placeholder: 'https://yourapp.com/api/calendar/google/callback' },
    ],
  },
  microsoftCalendar: {
    id: 'microsoftCalendar',
    name: 'Microsoft Calendar',
    category: 'calendars',
    description: 'Outlook via Azure AD',
    icon: '📆',
    fields: [
      { name: 'tenantId', label: 'Tenant ID', type: 'text', required: true, encrypt: true },
      { name: 'clientId', label: 'Application ID', type: 'text', required: true, encrypt: true },
      { name: 'clientSecret', label: 'Client Secret', type: 'password', required: true, encrypt: true },
    ],
  },
  appleCalendar: {
    id: 'appleCalendar',
    name: 'Apple Calendar',
    category: 'calendars',
    description: 'iCloud calendar integration',
    icon: '🍎',
    fields: [
      { name: 'appPassword', label: 'App-Specific Password', type: 'password', required: true, encrypt: true },
      { name: 'applId', label: 'Apple ID', type: 'text', required: true },
    ],
  },
  // Messaging & Notifications
  whatsapp: {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    category: 'messaging',
    description: 'WhatsApp messaging',
    icon: '💬',
    fields: [
      { name: 'phoneNumberId', label: 'Phone Number ID', type: 'text', required: true },
      { name: 'accessToken', label: 'Access Token', type: 'password', required: true, encrypt: true },
      { name: 'webhookToken', label: 'Webhook Token', type: 'password', required: false, encrypt: true },
    ],
  },
  sendgrid: {
    id: 'sendgrid',
    name: 'SendGrid',
    category: 'messaging',
    description: 'Bulk newsletter & campaign email via SendGrid (separate from Gmail SMTP for admin invites)',
    icon: '📧',
    fields: [
      { name: 'provider', label: 'Provider', type: 'select', required: true, options: [{ label: 'SendGrid', value: 'sendgrid' }, { label: 'SMTP', value: 'smtp' }] },
      { name: 'apiKey', label: 'SendGrid API Key', type: 'password', required: true, encrypt: true },
      { name: 'fromAddress', label: 'From Address', type: 'text', required: true, placeholder: 'noreply@passiveblessings.ae' },
    ],
    help: 'Emails are sent with display name "Passive Blessings". Verify your from address in SendGrid.',
  },
  gmailSmtp: {
    id: 'gmailSmtp',
    name: 'Gmail SMTP',
    category: 'messaging',
    description: 'Gmail SMTP for admin invitations & notifications',
    icon: '📧',
    fields: [
      { name: 'gmailEmail', label: 'Gmail Email Address', type: 'email', required: true, placeholder: 'your-email@gmail.com' },
      { name: 'gmailAppPassword', label: 'Gmail App Password', type: 'password', required: true, encrypt: true, placeholder: '16-character app password' },
      { name: 'fromName', label: 'From Name', type: 'text', required: false, placeholder: 'Passive Blessings' },
    ],
    docs: 'https://support.google.com/accounts/answer/185833',
    help: 'Use an App Password (not your Gmail password). Enable 2FA on your Google account, then generate an App Password in Security settings.',
  },
  twilio: {
    id: 'twilio',
    name: 'SMS (Twilio/Nexmo)',
    category: 'messaging',
    description: 'SMS messaging service',
    icon: '📱',
    fields: [
      { name: 'provider', label: 'Provider', type: 'select', required: true, options: [{ label: 'Twilio', value: 'twilio' }, { label: 'Nexmo', value: 'nexmo' }] },
      { name: 'accountSid', label: 'Account SID / API Key', type: 'text', required: true, encrypt: true },
      { name: 'authToken', label: 'Auth Token / Secret', type: 'password', required: true, encrypt: true },
    ],
  },
  firebaseCloudMessaging: {
    id: 'firebaseCloudMessaging',
    name: 'Firebase Cloud Messaging (FCM)',
    category: 'messaging',
    description: 'Push notifications for web & mobile',
    icon: '🔔',
    fields: [
      { name: 'serverKey', label: 'Server Key (Legacy)', type: 'password', required: false, encrypt: true, placeholder: 'AAAA...' },
      { name: 'senderId', label: 'Sender ID', type: 'text', required: true, placeholder: '1234567890', help: 'Project number from Firebase Console' },
      { name: 'serviceAccountJson', label: 'Service Account JSON', type: 'textarea', required: true, encrypt: true, placeholder: '{"type":"service_account",...}', help: 'Firebase service account with FCM permissions' },
      { name: 'enabled', label: 'Enable Push Notifications', type: 'checkbox', required: false },
    ],
    docs: 'https://firebase.google.com/docs/cloud-messaging',
  },
  // Storage & Maps & Analytics
  googleMaps: {
    id: 'googleMaps',
    name: 'Google Maps API',
    category: 'storage',
    description: 'Maps, geocoding & location',
    icon: '🗺️',
    fields: [
      { name: 'apiKey', label: 'API Key', type: 'password', required: true, encrypt: true },
      { name: 'allowedOrigins', label: 'Allowed Origins', type: 'textarea', required: false, placeholder: 'https://yourapp.com' },
    ],
  },
  cloudStorage: {
    id: 'cloudStorage',
    name: 'AWS S3 Storage',
    category: 'storage',
    description: 'Amazon S3 for event photos & videos (used when Event Asset Storage is set to AWS)',
    icon: '☁️',
    fields: [
      { name: 'accessKeyId', label: 'Access Key ID', type: 'text', required: true, encrypt: true },
      { name: 'secretAccessKey', label: 'Secret Access Key', type: 'password', required: true, encrypt: true },
      { name: 'bucketName', label: 'Bucket Name', type: 'text', required: true },
      { name: 'region', label: 'AWS Region', type: 'text', required: false, placeholder: 'us-east-1' },
      {
        name: 'publicBaseUrl',
        label: 'Public CDN URL (optional)',
        type: 'text',
        required: false,
        placeholder: 'https://cdn.yoursite.com',
      },
    ],
  },
  googleCloudStorage: {
    id: 'googleCloudStorage',
    name: 'Google Cloud Storage',
    category: 'storage',
    description: 'Dedicated GCS bucket for event assets (Firebase bucket used by default)',
    icon: '🪣',
    fields: [
      { name: 'bucketName', label: 'Bucket Name', type: 'text', required: true, placeholder: 'your-project.appspot.com' },
      {
        name: 'serviceAccountJson',
        label: 'Service Account JSON (optional)',
        type: 'textarea',
        required: false,
        encrypt: true,
        help: 'Leave empty to use the Firebase Admin bucket already configured for this project.',
      },
    ],
  },
  googleDrive: {
    id: 'googleDrive',
    name: 'Google Drive',
    category: 'storage',
    description: 'Sync event assets to a shared Google Drive folder',
    icon: '📁',
    fields: [
      { name: 'folderId', label: 'Drive Folder ID', type: 'text', required: true, placeholder: '1abc...' },
      {
        name: 'serviceAccountJson',
        label: 'Service Account JSON',
        type: 'textarea',
        required: true,
        encrypt: true,
        help: 'Service account with Drive API access, shared on the target folder.',
      },
      { name: 'folderUrl', label: 'Folder URL (reference)', type: 'text', required: false },
    ],
    help: 'Share the target Drive folder with the service account email. Enable the Google Drive API in Google Cloud Console.',
  },
  eventAssetsStorage: {
    id: 'eventAssetsStorage',
    name: 'Event Asset Storage',
    category: 'storage',
    description: 'Choose where event photos & videos are stored (Firebase is cheapest if already on Firebase)',
    icon: '🖼️',
    fields: [
      {
        name: 'provider',
        label: 'Active provider',
        type: 'select',
        required: true,
        options: [
          { label: 'Firebase / Google Cloud (default — included with Firebase)', value: 'firebase' },
          { label: 'AWS S3', value: 'aws_s3' },
          { label: 'Google Cloud Storage', value: 'google_cloud' },
          { label: 'Google Drive', value: 'google_drive' },
        ],
      },
      {
        name: 'notes',
        label: 'Notes',
        type: 'textarea',
        required: false,
        placeholder: 'e.g. Use S3 for large video archives; Firebase for day-to-day uploads.',
      },
    ],
    help: 'Configure AWS S3, GCS, or Drive credentials separately, then select the active provider here.',
  },
  youtubeApi: {
    id: 'youtubeApi',
    name: 'YouTube Data API',
    category: 'storage',
    description: 'YouTube content & analytics',
    icon: '▶️',
    fields: [
      { name: 'apiKey', label: 'API Key', type: 'password', required: true, encrypt: true },
      { name: 'channelId', label: 'Channel ID', type: 'text', required: false },
    ],
  },
  googleAnalytics: {
    id: 'googleAnalytics',
    name: 'Google Analytics',
    category: 'storage',
    description: 'Analytics & tracking',
    icon: '📊',
    fields: [
      { name: 'measurementId', label: 'Measurement ID', type: 'text', required: true },
      { name: 'apiSecret', label: 'API Secret', type: 'password', required: true, encrypt: true },
      { name: 'propertyId', label: 'Property ID', type: 'text', required: false },
    ],
  },
  // Webhooks
  customWebhook: {
    id: 'customWebhook',
    name: 'Custom Webhook',
    category: 'webhooks',
    description: 'Custom webhook integrations',
    icon: '🪝',
    fields: [
      { name: 'endpointUrl', label: 'Endpoint URL', type: 'text', required: true, placeholder: 'https://your-service.com/webhook' },
      { name: 'method', label: 'HTTP Method', type: 'select', required: true, options: [{ label: 'POST', value: 'POST' }, { label: 'PUT', value: 'PUT' }] },
      { name: 'secretToken', label: 'Secret Token', type: 'password', required: false, encrypt: true },
    ],
  },
}

export function getServiceDefinition(serviceId: string): IntegrationService | null {
  return INTEGRATION_SERVICES[serviceId] || null
}

export function getAllServices(): IntegrationService[] {
  const services = Object.values(INTEGRATION_SERVICES)
  if (typeof window !== 'undefined') {
    console.log('[v0] getAllServices returning', services.length, 'services')
  }
  return services
}

export function getServicesByCategory(category: IntegrationService['category']): IntegrationService[] {
  return Object.values(INTEGRATION_SERVICES).filter((s) => s.category === category)
}

export const CATEGORIES = ['payments', 'backend', 'ai', 'calendars', 'messaging', 'storage', 'webhooks'] as const
