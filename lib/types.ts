// User roles and types
export type UserRole = 'member' | 'volunteer' | 'business' | 'admin'

// Admin role permissions
export type AdminRole = 'founder_admin' | 'manager' | 'moderator' | 'analyst'

export interface AdminUser extends User {
  adminRole: AdminRole
  permissions: AdminPermission[]
  departments?: string[]
  canApprove: boolean
  canDelete: boolean
  canViewAnalytics: boolean
  canManageUsers: boolean
  canManageContent: boolean
  canManageFinance: boolean
  adminSince: Date
}

export type AdminPermission = 
  | 'view_dashboard'
  | 'manage_users'
  | 'manage_members'
  | 'manage_volunteers'
  | 'manage_events'
  | 'manage_donations'
  | 'manage_charities'
  | 'manage_businesses'
  | 'approve_events'
  | 'approve_partnerships'
  | 'approve_charities'
  | 'approve_donations'
  | 'view_analytics'
  | 'manage_content'
  | 'moderate_community'
  | 'manage_finance'
  | 'view_reports'
  | 'manage_settings'
  | 'manage_integrations'

export interface LocationData {
  latitude?: number
  longitude?: number
  city?: string
  state?: string
  country?: string
  countryCode?: string
  address?: string
  emirate?: string
  area?: string
  postalCode?: string
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
  middleName?: string
  dateOfBirth?: string
  gender?: string
  nationality?: string
  emiratesId?: string
  emiratesIdNumber?: string
  avatar?: UploadedImage
  avatarUrl?: string
  role: UserRole
  phone?: string
  whatsappNumber?: string
  location?: LocationData
  profession?: string
  jobTitle?: string
  employer?: string
  company?: string
  university?: string
  skills?: string[] // ['Tech/IT', 'Marketing', 'Design', 'Finance', 'Teaching', 'Medical', 'Legal', 'Other']
  hourlyRate?: number
  volunteeredHours: number
  totalDonated: number
  membershipTier: 'standard' | 'gold' | 'platinum'
  memberType?: 'general' | 'volunteer' | 'member-volunteer'
  volunteerAvailability?: {
    days: string[] // ['weekdays', 'weekends', 'flexible']
    hoursPerMonth?: number
    preferredDepartment?: string
  }
  referralSource?: string
  referralSourceOther?: string
  referralCode?: string
  referralMemberName?: string
  motivation?: string
  businessProfile?: {
    businessName?: string
    businessType?: string
    businessDescription?: string
    businessRegistration?: string
    businessWebsite?: string
  }
  emergencyContact?: {
    name?: string
    phone?: string
    relationship?: string
  }
  consentTerms: boolean
  consentPrivacy: boolean
  consentLocation: boolean
  consentNotifications?: boolean
  consentWhatsapp?: boolean
  memberSince: Date
  active: boolean
  emailVerified: boolean
  lastLogin?: Date
  profileComplete: boolean
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

// Hero Slider
export interface SliderImage {
  id: string
  imageUrl: string
  image?: UploadedImage
  title: string
  subtitle?: string
  link?: string
  displayDuration: number // in seconds
  displayOrder: number
  isActive: boolean
}

export interface HeroSliderSettings {
  id: string
  transitionEffect: 'fade' | 'slide' | 'zoom' | 'fade-slide'
  transitionDuration: number // in milliseconds
  autoplay: boolean
  autoplayDuration: number // in seconds
  displayMode: 'auto' | 'manual'
  images: SliderImage[]
  createdAt: Date
  updatedAt: Date
  publishedAt?: Date
}

// YouTube Integration
export interface YouTubeVideo {
  id: string
  videoId: string
  title: string
  description: string
  thumbnailUrl: string
  viewCount: number
  publishedAt: Date
  duration: string
  channelTitle: string
}

export interface YouTubeConfig {
  id: string
  channelId: string
  apiKey: string
  maxVideosDisplay: number
  refreshInterval: number // in hours
  autoRefresh: boolean
  lastFetched?: Date
  videos: YouTubeVideo[]
  createdAt: Date
  updatedAt: Date
}

// Business Opportunities (Jobs, Internships, Gigs)
export interface BusinessOpportunity {
  id: string
  businessId: string
  businessName: string
  title: string
  type: 'job' | 'internship' | 'gig'
  description: string
  category: string
  salary?: number
  salaryRange?: { min: number; max: number }
  location?: LocationData
  remote: boolean
  duration?: string
  hoursPerWeek?: number
  requirements?: string[]
  benefits?: string[]
  applications: number
  applicants: string[]
  status: 'open' | 'closed' | 'filled' | 'archived'
  createdAt: Date
  updatedAt: Date
}

// Business Offers (Products, Services, Discounts)
export interface BusinessOffer {
  id: string
  businessId: string
  businessName: string
  title: string
  type: 'product' | 'service' | 'discount'
  description: string
  category: string
  price?: number
  discountPercentage?: number
  originalPrice?: number
  image?: UploadedImage
  imageUrl?: string
  validUntil?: Date
  targetAudience?: 'members' | 'volunteers' | 'public'
  memberBenefit?: number
  status: 'active' | 'archived'
  views: number
  conversions: number
  createdAt: Date
  updatedAt: Date
}

// Business Leads
export interface BusinessLead {
  id: string
  businessId: string
  opportunityId?: string
  offerId?: string
  name: string
  email: string
  phone?: string
  message?: string
  leadSource: 'opportunity' | 'offer' | 'direct' | 'marketplace'
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'
  notes?: string
  createdAt: Date
  updatedAt: Date
}

// Business Referrals & Commissions
export interface BusinessReferral {
  id: string
  businessId: string
  referralPercentage: number
  totalReferrals: number
  totalCommissions: number
  pendingCommission: number
  paidCommission: number
  bankDetails?: {
    accountHolder?: string
    accountNumber?: string
    bankName?: string
  }
  lastPayout?: Date
  status: 'active' | 'suspended'
  createdAt: Date
  updatedAt: Date
}

// Business Partnerships & Collaborations
export interface BusinessPartnership {
  id: string
  businessId: string
  partnerBusinessId: string
  partnerBusinessName: string
  partnerLogo?: string
  type: 'collaboration' | 'referral' | 'sponsor' | 'vendor'
  description?: string
  status: 'pending' | 'active' | 'ended'
  startDate?: Date
  endDate?: Date
  createdAt: Date
  updatedAt: Date
}

// Community Support Requests from Businesses
export interface BusinessSupportRequest {
  id: string
  businessId: string
  businessName: string
  type: 'charity' | 'community' | 'event_sponsorship' | 'partnership'
  title: string
  description: string
  targetAmount?: number
  currentAmount: number
  deadline?: Date
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  createdAt: Date
  updatedAt: Date
}

// Business Ratings & Reviews
export interface BusinessRating {
  id: string
  businessId: string
  ratedBy: string
  rating: number // 1-5
  review?: string
  category?: 'communication' | 'professionalism' | 'quality' | 'value'
  createdAt: Date
  updatedAt: Date
}

// Business Payments & Subscriptions
export interface BusinessPayment {
  id: string
  businessId: string
  type: 'subscription' | 'commission_payout' | 'referral_bonus'
  amount: number
  status: 'pending' | 'completed' | 'failed'
  paymentMethod?: 'card' | 'bank_transfer'
  stripeTransactionId?: string
  notes?: string
  dueDate?: Date
  paidDate?: Date
  createdAt: Date
  updatedAt: Date
}

// Business Analytics
export interface BusinessAnalytics {
  id: string
  businessId: string
  month: string // YYYY-MM
  opportunitiesPosted: number
  offersPosted: number
  leadsGenerated: number
  conversionRate: number
  impressions: number
  clicks: number
  referralCommissions: number
  eventAttendance: number
  networkConnections: number
  averageRating: number
  totalTransactions: number
  createdAt: Date
  updatedAt: Date
}

