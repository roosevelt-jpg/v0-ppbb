import React from 'react'
import { Card } from '@/components/ui/card'
import { ChevronDown, ExternalLink, Copy, Check } from 'lucide-react'

const INTEGRATION_GUIDES: Record<string, {
  name: string
  description: string
  steps: string[]
  learnMoreUrl: string
  docsUrl: string
  estimatedTime: string
}> = {
  anthropic: {
    name: 'Anthropic Claude',
    description: 'Set up AI-powered features with Claude',
    steps: [
      'Visit console.anthropic.com and create an account',
      'Go to API Keys section in your account settings',
      'Click "Create Key" and copy the generated API key',
      'Return to integrations and paste the key in the Anthropic field',
      'Click "Check Health" to verify the connection',
      'Start using Claude in your application',
    ],
    learnMoreUrl: 'https://console.anthropic.com',
    docsUrl: 'https://docs.anthropic.com',
    estimatedTime: '5 minutes',
  },
  openai: {
    name: 'OpenAI',
    description: 'Integrate GPT models for AI features',
    steps: [
      'Go to platform.openai.com and sign in',
      'Navigate to API keys page',
      'Create a new API key and copy it',
      'Add the key to your integrations panel',
      'Set up organization ID if needed',
      'Test with a simple API call to verify',
    ],
    learnMoreUrl: 'https://platform.openai.com',
    docsUrl: 'https://platform.openai.com/docs',
    estimatedTime: '5 minutes',
  },
  stripe: {
    name: 'Stripe',
    description: 'Enable payment processing',
    steps: [
      'Create or log into your Stripe account at stripe.com',
      'Go to the API Keys section in Settings',
      'Copy your Secret Key (not the publishable key)',
      'Paste into the Stripe integration field',
      'For webhooks, add https://yoursite.com/api/webhooks/stripe',
      'Check health to confirm connection',
    ],
    learnMoreUrl: 'https://stripe.com',
    docsUrl: 'https://stripe.com/docs/api',
    estimatedTime: '10 minutes',
  },
  sendgrid: {
    name: 'SendGrid',
    description: 'Set up email delivery',
    steps: [
      'Sign in to sendgrid.com',
      'Go to Settings > API Keys',
      'Create a new API key with Mail Send permissions',
      'Copy the key and add to integrations',
      'Verify your sender email address',
      'Test email sending from your application',
    ],
    learnMoreUrl: 'https://sendgrid.com',
    docsUrl: 'https://docs.sendgrid.com',
    estimatedTime: '8 minutes',
  },
  youtube: {
    name: 'YouTube',
    description: 'Embed and manage YouTube content',
    steps: [
      'Go to console.developers.google.com',
      'Create a new project',
      'Enable YouTube Data API v3',
      'Create OAuth 2.0 credentials',
      'Copy the API key',
      'Add to integrations and configure channel IDs',
    ],
    learnMoreUrl: 'https://console.developers.google.com',
    docsUrl: 'https://developers.google.com/youtube/v3',
    estimatedTime: '15 minutes',
  },
  google_maps: {
    name: 'Google Maps',
    description: 'Add location services and mapping',
    steps: [
      'Visit console.developers.google.com',
      'Create a new project and enable Maps API',
      'Go to Credentials and create an API key',
      'Restrict the key to your domain',
      'Copy and add to integrations',
      'Test map rendering on your application',
    ],
    learnMoreUrl: 'https://console.developers.google.com',
    docsUrl: 'https://developers.google.com/maps',
    estimatedTime: '10 minutes',
  },
  twilio: {
    name: 'Twilio',
    description: 'Enable SMS and phone features',
    steps: [
      'Create account at twilio.com',
      'Go to Account SID and Auth Token',
      'Copy both the SID and Token',
      'Add Account SID as API Key, Token as API Secret',
      'Configure sender phone number',
      'Test SMS sending capability',
    ],
    learnMoreUrl: 'https://www.twilio.com',
    docsUrl: 'https://www.twilio.com/docs',
    estimatedTime: '12 minutes',
  },
  paypal: {
    name: 'PayPal',
    description: 'Alternative payment gateway',
    steps: [
      'Log into developer.paypal.com',
      'Go to Apps & Credentials',
      'Select Sandbox or Live environment',
      'Copy your Client ID',
      'Copy your Client Secret',
      'Add to integrations and test payments',
    ],
    learnMoreUrl: 'https://developer.paypal.com',
    docsUrl: 'https://developer.paypal.com/docs',
    estimatedTime: '10 minutes',
  },
}

interface IntegrationDocProps {
  serviceName: string
}

interface ExpandedState {
  [key: string]: boolean
}

export function IntegrationDocumentation({ serviceName }: IntegrationDocProps) {
  const guide = INTEGRATION_GUIDES[serviceName]
  const [expanded, setExpanded] = React.useState<ExpandedState>({})
  const [copied, setCopied] = React.useState<Record<string, boolean>>({})

  if (!guide) {
    return <div className="text-neutral-600 text-sm">No documentation available</div>
  }

  const toggleStep = (stepIndex: number) => {
    setExpanded(prev => ({
      ...prev,
      [stepIndex]: !prev[stepIndex],
    }))
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(prev => ({ ...prev, [id]: true }))
    setTimeout(() => {
      setCopied(prev => ({ ...prev, [id]: false }))
    }, 2000)
  }

  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card style={{ borderColor: '#E4E1DA' }} className="border p-4 rounded-lg">
        <div className="flex items-start justify-between">
          <div>
            <h3 style={{ color: '#333333' }} className="font-medium">
              {guide.name}
            </h3>
            <p style={{ color: '#888888' }} className="text-xs mt-1">
              {guide.description}
            </p>
            <p style={{ color: '#888888' }} className="text-xs mt-2 flex items-center gap-2">
              Estimated setup time: {guide.estimatedTime}
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <a
              href={guide.learnMoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 border rounded text-xs font-medium"
              style={{ borderColor: '#E4E1DA', color: '#1565C0' }}
            >
              Visit Site
              <ExternalLink className="w-3 h-3 inline ml-1" />
            </a>
            <a
              href={guide.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 border rounded text-xs font-medium"
              style={{ borderColor: '#E4E1DA', color: '#1565C0' }}
            >
              Docs
              <ExternalLink className="w-3 h-3 inline ml-1" />
            </a>
          </div>
        </div>
      </Card>

      {/* Steps */}
      <div className="space-y-2">
        <h4 style={{ color: '#333333' }} className="font-medium text-sm">
          Setup Instructions
        </h4>
        {guide.steps.map((step, idx) => (
          <div key={idx} className="border rounded-lg" style={{ borderColor: '#E4E1DA' }}>
            <button
              onClick={() => toggleStep(idx)}
              className="w-full p-3 flex items-center justify-between hover:bg-neutral-50 transition"
            >
              <div className="text-left">
                <span style={{ color: '#333333' }} className="font-medium text-xs">
                  Step {idx + 1}
                </span>
                <p style={{ color: '#888888' }} className="text-xs mt-1">
                  {step}
                </p>
              </div>
              <ChevronDown
                className="w-4 h-4 flex-shrink-0"
                style={{
                  color: '#888888',
                  transform: expanded[idx] ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                }}
              />
            </button>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <Card style={{ borderColor: '#E4E1DA' }} className="border p-4 rounded-lg">
        <p style={{ color: '#333333' }} className="font-medium text-xs">
          Quick Reference
        </p>
        <div className="space-y-2 mt-3">
          <button
            onClick={() => copyToClipboard(guide.learnMoreUrl, 'site')}
            className="w-full flex items-center justify-between p-2 border rounded text-xs"
            style={{ borderColor: '#E4E1DA' }}
          >
            <span style={{ color: '#1565C0' }}>Service Website</span>
            {copied['site'] ? (
              <Check className="w-3 h-3" style={{ color: '#2E7D32' }} />
            ) : (
              <Copy className="w-3 h-3" style={{ color: '#888888' }} />
            )}
          </button>
          <button
            onClick={() => copyToClipboard(guide.docsUrl, 'docs')}
            className="w-full flex items-center justify-between p-2 border rounded text-xs"
            style={{ borderColor: '#E4E1DA' }}
          >
            <span style={{ color: '#1565C0' }}>API Documentation</span>
            {copied['docs'] ? (
              <Check className="w-3 h-3" style={{ color: '#2E7D32' }} />
            ) : (
              <Copy className="w-3 h-3" style={{ color: '#888888' }} />
            )}
          </button>
        </div>
      </Card>
    </div>
  )
}
