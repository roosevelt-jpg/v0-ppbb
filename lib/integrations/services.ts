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
    name: 'Email (SMTP/SendGrid)',
    category: 'messaging',
    description: 'Email delivery service',
    icon: '📧',
    fields: [
      { name: 'provider', label: 'Provider', type: 'select', required: true, options: [{ label: 'SendGrid', value: 'sendgrid' }, { label: 'SMTP', value: 'smtp' }] },
      { name: 'apiKey', label: 'API Key / Password', type: 'password', required: true, encrypt: true },
      { name: 'fromAddress', label: 'From Address', type: 'text', required: true, placeholder: 'noreply@passiveblessings.ae' },
    ],
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
    name: 'Cloud Storage (S3)',
    category: 'storage',
    description: 'AWS S3 file storage',
    icon: '☁️',
    fields: [
      { name: 'provider', label: 'Provider', type: 'select', required: true, options: [{ label: 'AWS S3', value: 'aws' }, { label: 'Other', value: 'other' }] },
      { name: 'accessKeyId', label: 'Access Key ID', type: 'text', required: true, encrypt: true },
      { name: 'secretAccessKey', label: 'Secret Access Key', type: 'password', required: true, encrypt: true },
      { name: 'bucketName', label: 'Bucket Name', type: 'text', required: true },
    ],
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

export const CATEGORIES = ['payments', 'backend', 'calendars', 'messaging', 'storage', 'webhooks'] as const
