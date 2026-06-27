// Plan types and schema for Firestore

export interface PricingPlan {
  id: string
  name: string
  description?: string
  price: number // in cents for Stripe
  currency: string // USD, GBP, etc
  billingPeriod: 'monthly' | 'yearly'
  features: string[] // array of feature descriptions
  benefits: string[] // array of benefit descriptions
  icon?: string // emoji or icon name
  color?: string // hex color for UI
  paymentGateway?: 'stripe' | 'paypal' | 'ziina' // which gateway collects payment for this plan
  stripeProductId?: string
  stripePriceId?: string
  paypalPlanId?: string
  ziinaPlanId?: string
  active: boolean
  order: number // for sorting on frontend
  createdAt?: any
  updatedAt?: any
}

export interface UserSubscription {
  id: string
  userId: string
  planId: string
  planName: string
  status: 'active' | 'canceled' | 'expired' | 'pending'
  currentPeriodStart: any
  currentPeriodEnd: any
  stripeSubscriptionId?: string
  paymentGateway: 'stripe' | 'paypal' | 'ziina'
  canceledAt?: any
  createdAt: any
  updatedAt: any
}

export interface PaymentGatewayConfig {
  gateway: 'stripe' | 'paypal' | 'ziina'
  isConfigured: boolean
  lastUpdated: any
  // Gateway-specific fields
  stripePublishableKey?: string
  stripeSecretKey?: string
  paypalClientId?: string
  paypalSecret?: string
  ziinaPublicKey?: string
  ziinaPrivateKey?: string
  ziinaApiKey?: string
}
