// User roles and types
export type UserRole = 'member' | 'volunteer' | 'business' | 'admin'

export interface LocationData {
  latitude: number
  longitude: number
  city: string
  state: string
  country: string
  countryCode: string
  address: string
}

export interface UploadedImage {
  base64: string
  fileName: string
  fileSize: number
  mimeType: string
  uploadedAt: number
}

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  dateOfBirth?: string
  gender?: string
  nationality?: string
  emiratesId?: string
  avatar?: UploadedImage
  avatarUrl?: string
  role: UserRole
  phone?: string
  whatsappNumber?: string
  location?: LocationData
  profession?: string
  employer?: string
  skills?: string[]
  hourlyRate?: number
  volunteeredHours: number
  totalDonated: number
  membershipTier: 'standard' | 'gold' | 'platinum'
  memberType?: 'general' | 'volunteer' | 'member-volunteer'
  volunteerAvailability?: {
    days: string[] // ['weekdays', 'weekends']
    hoursPerMonth?: number
    preferredDepartment?: string
  }
  referralSource?: string
  referralMemberName?: string
  motivation?: string
  businessProfile?: {
    businessName?: string
    businessType?: string
    businessDescription?: string
  }
  consentTerms: boolean
  consentPrivacy: boolean
  consentLocation: boolean
  consentNotifications?: boolean
  memberSince: Date
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export interface BusinessProfile extends User {
  businessName: string
  businessType: string
  registrationNumber?: string
  website?: string
  logo?: UploadedImage
  logoUrl?: string
  businessDescription: string
  businessEmail?: string
  businessPhone?: string
  businessLocation?: LocationData
  activeOpportunities: number
  revenue?: number
  referralEarnings: number
  conversionRate: number
  membership: 'partner' | 'gold' | 'platinum'
}

// Events
export interface Event {
  id: string
  title: string
  slug: string
  description: string
  image?: UploadedImage
  imageUrl?: string
  location: string
  date: Date
  time: string
  endTime: string
  capacity: number
  registered: number
  eventType: 'community' | 'fundraiser' | 'workshop' | 'charity'
  category: string
  organizerId: string
  status: 'draft' | 'published' | 'active' | 'completed' | 'cancelled'
  attendees: string[]
  createdAt: Date
  updatedAt: Date
}

// Opportunities (volunteer/job opportunities)
export interface Opportunity {
  id: string
  title: string
  slug: string
  description: string
  type: 'volunteer' | 'job' | 'gig'
  category: string
  businessId: string
  applications: number
  accepted: number
  duration?: string
  hoursPerMonth?: number
  applicants: string[]
  status: 'open' | 'closed' | 'filled'
  createdAt: Date
  updatedAt: Date
}

// Donations
export interface Donation {
  id: string
  donorId: string
  campaignId: string
  amount: number
  currency: string
  paymentMethod: 'card' | 'bank_transfer'
  status: 'pending' | 'completed' | 'failed'
  stripeTransactionId?: string
  notes?: string
  isAnonymous: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Campaign {
  id: string
  title: string
  description: string
  goal: number
  raised: number
  currency: string
  status: 'active' | 'completed' | 'paused'
  image?: UploadedImage
  imageUrl?: string
  createdAt: Date
  endsAt: Date
  updatedAt: Date
}

// CMS Pages
export interface Page {
  id: string
  slug: string
  title: string
  description: string
  content: string
  seoTitle: string
  seoDescription: string
  keywords: string[]
  image?: UploadedImage
  imageUrl?: string
  status: 'draft' | 'published'
  order: number
  createdAt: Date
  updatedAt: Date
}

// Legal Policies
export interface Policy {
  id: string
  type: 'privacy' | 'terms' | 'codeofconduct' | 'other'
  title: string
  slug: string
  content: string
  version: number
  lastUpdated: Date
  effectiveDate: Date
  status: 'active' | 'archived'
  createdAt: Date
  updatedAt: Date
}

// Site Settings & Admin Config
export interface SiteSettings {
  id: string
  siteName: string
  siteDescription: string
  logo?: UploadedImage
  logoUrl: string
  logoDark?: UploadedImage
  logoUrlDark: string
  favicon?: UploadedImage
  faviconUrl: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  email: string
  phone: string
  address: string
  socialLinks: {
    facebook?: string
    twitter?: string
    instagram?: string
    linkedin?: string
  }
  footerText: string
  maintenanceMode: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ApiConfig {
  id: string
  serviceName: string
  apiKey: string
  apiSecret?: string
  endpoint?: string
  status: 'active' | 'inactive'
  lastChecked: Date
  isHealthy: boolean
  errorMessage?: string
  createdAt: Date
  updatedAt: Date
}

// Newsletter
export interface Newsletter {
  id: string
  email: string
  subscribedAt: Date
  unsubscribedAt?: Date
  isActive: boolean
}

export interface NewsletterTemplate {
  id: string
  title: string
  subject: string
  content: string
  createdAt: Date
}

// System Health
export interface SystemHealth {
  id: string
  serviceName: string
  status: 'healthy' | 'degraded' | 'down'
  lastChecked: Date
  responseTime?: number
  errorMessage?: string
  metadata?: Record<string, any>
}

// Admin Actions Log
export interface AuditLog {
  id: string
  adminId: string
  action: string
  target: string
  targetId: string
  changes?: Record<string, any>
  timestamp: Date
  ipAddress?: string
}

