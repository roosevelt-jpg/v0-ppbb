// API Service Definitions for Admin Dashboard
export interface ServiceDefinition {
  id: string
  name: string
  description: string
  icon: string
  category: 'AI' | 'Payment' | 'Email' | 'Maps' | 'Media' | 'Database' | 'Other'
  fields: FormField[]
  testEndpoint?: string
  healthCheck: boolean
}

export interface FormField {
  name: string
  label: string
  type: 'text' | 'password' | 'url' | 'number' | 'email'
  required: boolean
  placeholder?: string
  help?: string
  validation?: string // regex pattern or validation rule
}

export const API_SERVICES: Record<string, ServiceDefinition> = {
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic (Claude)',
    description: 'AI-powered language model for text generation and analysis',
    icon: 'Brain',
    category: 'AI',
    healthCheck: true,
    fields: [
      {
        name: 'apiKey',
        label: 'API Key',
        type: 'password',
        required: true,
        placeholder: 'sk-ant-...',
        help: 'Your Anthropic API key from console.anthropic.com',
        validation: '^sk-ant-',
      },
    ],
    testEndpoint: 'https://api.anthropic.com/v1/messages',
  },

  openai: {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT models and other OpenAI services for AI applications',
    icon: 'Zap',
    category: 'AI',
    healthCheck: true,
    fields: [
      {
        name: 'apiKey',
        label: 'API Key',
        type: 'password',
        required: true,
        placeholder: 'sk-...',
        help: 'Your OpenAI API key from platform.openai.com',
        validation: '^sk-',
      },
      {
        name: 'organization',
        label: 'Organization ID (Optional)',
        type: 'text',
        required: false,
        placeholder: 'org-...',
        help: 'Optional OpenAI organization ID',
      },
    ],
    testEndpoint: 'https://api.openai.com/v1/models',
  },

  stripe: {
    id: 'stripe',
    name: 'Stripe',
    description: 'Payment processing and billing platform',
    icon: 'CreditCard',
    category: 'Payment',
    healthCheck: true,
    fields: [
      {
        name: 'apiKey',
        label: 'Secret Key',
        type: 'password',
        required: true,
        placeholder: 'sk_live_...',
        help: 'Your Stripe secret API key',
        validation: '^sk_(live|test)_',
      },
      {
        name: 'webhookSecret',
        label: 'Webhook Secret',
        type: 'password',
        required: false,
        placeholder: 'whsec_...',
        help: 'Webhook signing secret for verifying events',
      },
    ],
    testEndpoint: 'https://api.stripe.com/v1/account',
  },

  sendgrid: {
    id: 'sendgrid',
    name: 'SendGrid',
    description: 'Email delivery and management service',
    icon: 'Mail',
    category: 'Email',
    healthCheck: true,
    fields: [
      {
        name: 'apiKey',
        label: 'API Key',
        type: 'password',
        required: true,
        placeholder: 'SG.xxxx...',
        help: 'Your SendGrid API key from app.sendgrid.com',
        validation: '^SG\\.',
      },
    ],
    testEndpoint: 'https://api.sendgrid.com/v3/user/account',
  },

  youtube: {
    id: 'youtube',
    name: 'YouTube API',
    description: 'Search and manage YouTube content',
    icon: 'Play',
    category: 'Media',
    healthCheck: true,
    fields: [
      {
        name: 'apiKey',
        label: 'API Key',
        type: 'password',
        required: true,
        placeholder: 'AIzaSy...',
        help: 'Your YouTube Data API key from Google Cloud Console',
        validation: '^AIzaSy',
      },
    ],
    testEndpoint: 'https://www.googleapis.com/youtube/v3/search',
  },

  googlemaps: {
    id: 'googlemaps',
    name: 'Google Maps API',
    description: 'Maps, geocoding, and location services',
    icon: 'MapPin',
    category: 'Maps',
    healthCheck: true,
    fields: [
      {
        name: 'apiKey',
        label: 'API Key',
        type: 'password',
        required: true,
        placeholder: 'AIzaSy...',
        help: 'Your Google Maps API key from Google Cloud Console',
        validation: '^AIzaSy',
      },
    ],
    testEndpoint: 'https://maps.googleapis.com/maps/api/geocode/json',
  },

  firebase_admin: {
    id: 'firebase_admin',
    name: 'Firebase Admin SDK',
    description: 'Firebase backend administration and database access',
    icon: 'Database',
    category: 'Database',
    healthCheck: false,
    fields: [
      {
        name: 'project_id',
        label: 'Project ID',
        type: 'text',
        required: true,
        placeholder: 'my-project-id',
        help: 'Your Firebase project ID',
      },
      {
        name: 'private_key_id',
        label: 'Private Key ID',
        type: 'text',
        required: true,
        placeholder: '...',
        help: 'From your Firebase service account JSON',
      },
      {
        name: 'private_key',
        label: 'Private Key',
        type: 'password',
        required: true,
        placeholder: '-----BEGIN PRIVATE KEY-----...',
        help: 'From your Firebase service account JSON',
      },
      {
        name: 'client_email',
        label: 'Client Email',
        type: 'email',
        required: true,
        placeholder: 'firebase-adminsdk@...iam.gserviceaccount.com',
        help: 'Service account email',
      },
    ],
  },

  paypal: {
    id: 'paypal',
    name: 'PayPal',
    description: 'PayPal payment processing and billing platform',
    icon: 'CreditCard',
    category: 'Payment',
    healthCheck: true,
    fields: [
      {
        name: 'clientId',
        label: 'Client ID',
        type: 'password',
        required: true,
        placeholder: 'AZxxx...',
        help: 'Your PayPal Client ID from developer.paypal.com',
      },
      {
        name: 'clientSecret',
        label: 'Client Secret',
        type: 'password',
        required: true,
        placeholder: 'EFxxx...',
        help: 'Your PayPal Client Secret from developer.paypal.com',
      },
      {
        name: 'mode',
        label: 'Mode',
        type: 'text',
        required: true,
        placeholder: 'sandbox or live',
        help: 'Use "sandbox" for testing or "live" for production',
        validation: '^(sandbox|live)$',
      },
    ],
    testEndpoint: 'https://api.paypal.com/v1/oauth2/token',
  },

  ziina: {
    id: 'ziina',
    name: 'Ziina',
    description: 'Ziina payment gateway for Middle East and Africa',
    icon: 'CreditCard',
    category: 'Payment',
    healthCheck: true,
    fields: [
      {
        name: 'publicKey',
        label: 'Public Key',
        type: 'text',
        required: true,
        placeholder: 'pk_...',
        help: 'Your Ziina public key from your Ziina dashboard',
      },
      {
        name: 'privateKey',
        label: 'Private Key',
        type: 'password',
        required: true,
        placeholder: 'sk_...',
        help: 'Your Ziina private key from your Ziina dashboard',
      },
      {
        name: 'apiKey',
        label: 'API Key',
        type: 'password',
        required: true,
        placeholder: 'api_...',
        help: 'Your Ziina API key for server-to-server requests',
      },
      {
        name: 'webhookSecret',
        label: 'Webhook Secret',
        type: 'password',
        required: false,
        placeholder: 'whsec_...',
        help: 'Webhook signing secret for verifying events',
      },
    ],
    testEndpoint: 'https://api.ziina.me/v1/account',
  },

  webhook: {
    id: 'webhook',
    name: 'Custom Webhook',
    description: 'Generic webhook endpoint configuration',
    icon: 'Plug',
    category: 'Other',
    healthCheck: false,
    fields: [
      {
        name: 'webhookUrl',
        label: 'Webhook URL',
        type: 'url',
        required: true,
        placeholder: 'https://your-server.com/webhook',
        help: 'URL where webhook events should be sent',
      },
      {
        name: 'secret',
        label: 'Secret Key (Optional)',
        type: 'password',
        required: false,
        placeholder: '...',
        help: 'Optional secret for signing webhook payloads',
      },
    ],
  },
}

export function getServiceDefinition(serviceId: string): ServiceDefinition | null {
  return API_SERVICES[serviceId] || null
}

export function getAllServiceDefinitions(): ServiceDefinition[] {
  return Object.values(API_SERVICES)
}

export function getServicesByCategory(category: ServiceDefinition['category']): ServiceDefinition[] {
  return Object.values(API_SERVICES).filter((service) => service.category === category)
}
