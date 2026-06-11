// User roles and types
export type UserRole = 'member' | 'volunteer' | 'business' | 'admin' | 'sponsor'

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

export interface SponsorProfile extends User {
  sponsorName: string
  sponsorType: string // 'individual' | 'company' | 'foundation' | 'ngo'
  registrationNumber?: string
  website?: string
  logo?: UploadedImage
  logoUrl?: string
  sponsorDescription: string
  sponsorEmail?: string
  sponsorPhone?: string
  sponsorLocation?: LocationData
  sponsorshipFocus?: string[] // Categories they sponsor
  totalSponsored: number
  activeSponsorships: number
  yearlySponsorshipBudget?: number
  membership: 'standard' | 'gold' | 'platinum'
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
  // SEO Fields
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string
  // Analytics
  googleAnalyticsId?: string
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

// Business Opportunities (Jobs, Internships, Gigs)
export interface BusinessOpportunity {
  id: string
  businessId: string
  businessName: string
  title: string
  slug: string
  description: string
  type: 'job' | 'internship' | 'gig' | 'contract'
  category: string
  salary?: number
  salaryRange?: { min: number; max: number }
  location?: LocationData
  remote: boolean
  duration?: string
  deadline?: Date
  requirements: string[]
  benefits?: string[]
  applications: string[] // User IDs
  accepted: string[]
  status: 'open' | 'closed' | 'filled'
  featured: boolean
  views: number
  createdAt: Date
  updatedAt: Date
}

// Business Offers (Products, Services, Discounts)
export interface BusinessOffer {
  id: string
  businessId: string
  businessName: string
  title: string
  slug: string
  description: string
  type: 'product' | 'service' | 'discount' | 'promotion'
  category: string
  price?: number
  discountPercentage?: number
  originalPrice?: number
  image?: UploadedImage
  imageUrl?: string
  quantity?: number
  isLimited: boolean
  deadline?: Date
  memberTierRequired?: 'standard' | 'gold' | 'platinum'
  targetAudience?: string[]
  status: 'active' | 'inactive' | 'archived'
  views: number
  conversions: number
  likes: number
  likedBy?: string[]
  createdAt: Date
  updatedAt: Date
}

// Business Leads & Conversions
export interface BusinessLead {
  id: string
  businessId: string
  memberId: string
  memberName: string
  memberEmail: string
  memberPhone?: string
  sourceType: 'opportunity' | 'offer' | 'partnership' | 'event' | 'direct'
  sourceId?: string
  leadStatus: 'new' | 'contacted' | 'interested' | 'quoted' | 'converted' | 'lost'
  notes?: string
  conversionValue?: number
  conversionDate?: Date
  followUpDate?: Date
  assignedTo?: string
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

// Business Referrals & Commissions
export interface BusinessReferral {
  id: string
  businessId: string
  referralCode: string
  memberId?: string // Member who referred
  conversionType: 'signup' | 'purchase' | 'event' | 'donation'
  referralAmount: number
  commissionPercentage: number
  commissionAmount: number
  referredUserId?: string
  status: 'pending' | 'confirmed' | 'paid' | 'cancelled'
  payoutDate?: Date
  notes?: string
  createdAt: Date
  updatedAt: Date
}

// Business Partnerships & Collaborations
export interface BusinessPartnership {
  id: string
  businessId: string
  partnerId: string
  partnerName: string
  partnerType: 'business' | 'nonprofit' | 'individual'
  collaborationType: 'joint_venture' | 'sponsorship' | 'co_marketing' | 'affiliate' | 'other'
  description: string
  status: 'requested' | 'pending' | 'active' | 'completed' | 'declined'
  startDate?: Date
  endDate?: Date
  value?: number
  notes?: string
  attachments?: string[]
  createdAt: Date
  updatedAt: Date
}

// Community Support Requests
export interface CommunitySupport {
  id: string
  businessId: string
  supportType: 'donation' | 'volunteering' | 'sponsorship' | 'partnership' | 'resources'
  title: string
  description: string
  targetAudience: string
  goal?: number
  status: 'requested' | 'approved' | 'in_progress' | 'completed' | 'declined'
  approvalNotes?: string
  timeline?: string
  approvedBy?: string
  createdAt: Date
  updatedAt: Date
}

// Sponsorships
export interface Sponsorship {
  id: string
  sponsorId: string
  sponsorName: string
  type: 'campaign' | 'event' | 'charity' | 'project'
  title: string
  description: string
  amount: number
  currency: string
  status: 'pending' | 'active' | 'completed' | 'cancelled'
  targetId: string // Campaign/Event/Charity ID
  targetName: string
  impactArea?: string // What the sponsorship supports
  visibilityLevel: 'public' | 'partners_only' | 'private'
  startDate: Date
  endDate?: Date
  benefits?: string[] // Benefits to sponsor
  recognition?: boolean // Featured as sponsor?
  certificateIssued?: boolean
  createdAt: Date
  updatedAt: Date
}

// Business Connections
export interface BusinessConnection {
  id: string
  businessId: string
  connectedUserId: string
  connectedUserName: string
  connectedUserType: 'member' | 'business' | 'admin'
  connectionType: 'follower' | 'partner' | 'collaborator' | 'supplier' | 'client'
  message?: string
  status: 'pending' | 'accepted' | 'blocked'
  createdAt: Date
  updatedAt: Date
}

// Business Marketplace Listings
export interface MarketplaceItem {
  id: string
  businessId: string
  businessName: string
  title: string
  description: string
  category: string
  subcategory?: string
  price?: number
  image?: UploadedImage
  imageUrl?: string
  images?: UploadedImage[]
  imageUrls?: string[]
  rating: number
  reviewCount: number
  status: 'listed' | 'sold' | 'unlisted'
  featured: boolean
  views: number
  saves: number
  savedBy?: string[]
  createdAt: Date
  updatedAt: Date
}

// Business Event Participation
export interface BusinessEventParticipation {
  id: string
  businessId: string
  eventId: string
  eventTitle: string
  participationType: 'attendee' | 'sponsor' | 'vendor' | 'organizer'
  booth?: string
  notes?: string
  leads?: number
  status: 'registered' | 'attended' | 'no_show'
  createdAt: Date
  updatedAt: Date
}
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

// Beneficiary/Charity Support Request Types
// Sensitive Document Metadata - stored separately from actual files
export interface SensitiveDocumentMetadata {
  id: string
  beneficiaryRequestId: string
  documentType: 'emirates_id' | 'passport' | 'visa' | 'salary_certificate' | 'bank_statement' | 'supporting_docs'
  fileName: string
  fileSize: number
  fileHash: string // SHA-256 for integrity verification
  uploadedAt: Date
  encryptedStoragePath: string // Path in secure cloud storage
  isEncrypted: boolean
  accessLog: {
    userId: string
    adminRole: AdminRole
    timestamp: Date
    action: 'viewed' | 'downloaded'
  }[]
}

// Beneficiary Consent & Privacy Policy
export interface BeneficiaryConsent {
  id: string
  beneficiaryRequestId: string
  userId: string
  consentGiven: boolean
  consentDate: Date
  uaePrivacyPolicyVersion: string
  privacyPolicyAccepted: boolean
  dataProcessingAgreed: boolean
  documentRetentionUnderstood: boolean
  ipAddress: string
  userAgent: string
  timestamp: Date
}

// Main Beneficiary Support Request
export interface BeneficiarySupportRequest {
  id: string
  userId: string
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'completed'
  submissionDate?: Date
  
  // Personal Information
  fullName: string
  phoneNumber: string
  email: string
  
  // Identification Documents
  emiratesId?: {
    number: string
    expiryDate: Date
    documentMetadataId: string // Reference to SensitiveDocumentMetadata
  }
  passport?: {
    number: string
    expiryDate: Date
    countryCode: string
    documentMetadataId: string
  }
  visa?: {
    number: string
    expiryDate: Date
    sponsorName?: string
    documentMetadataId: string
  }
  
  // Financial Documents
  salaryDocument?: {
    documentType: 'certificate' | 'payslip'
    documentMetadataId: string
    monthlySalary?: number
    companyName?: string
  }
  bankStatement?: {
    documentMetadataId: string
    bankName?: string
    accountType?: string
    isOptional: boolean
  }
  
  // Supporting Documents
  supportingDocuments: {
    id: string
    description: string
    documentMetadataId: string
    uploadedAt: Date
  }[]
  
  // Request Details
  reason: string
  reasonCategory: 'housing' | 'medical' | 'emergency' | 'education' | 'employment' | 'family' | 'other'
  emergencyLevel: 'low' | 'medium' | 'high' | 'critical'
  referralSource: 'self' | 'community_member' | 'business' | 'admin_referral' | 'social_media' | 'other'
  
  // Review & Approval
  reviewedBy?: string // Admin ID
  reviewDate?: Date
  reviewNotes?: string
  approvalNotes?: string
  
  // Compliance & Consent
  consentLogId: string
  hasSignedConsent: boolean
  privacyPolicyAccepted: boolean
  dataProcessingAgreed: boolean
  
  // Access Control
  visibleTo: AdminRole[] // Which admin roles can view this request
  canDownloadDocuments: AdminRole[] // Which admin roles can download sensitive docs
  
  // Audit Trail
  createdAt: Date
  updatedAt: Date
  lastAccessedAt?: Date
  lastAccessedBy?: string
}

// Access Log for Beneficiary Data
export interface BeneficiaryAccessLog {
  id: string
  beneficiaryRequestId: string
  userId: string // Admin or authorized user
  userRole: AdminRole
  userEmail: string
  action: 'viewed_request' | 'viewed_document' | 'downloaded_document' | 'updated_status' | 'added_notes' | 'approved' | 'rejected'
  documentType?: string
  timestamp: Date
  ipAddress: string
  userAgent: string
  details?: string
}

// Beneficiary Request Statistics (for dashboard)
export interface BeneficiaryRequestStats {
  id: string
  month: string // YYYY-MM
  totalRequests: number
  approvedRequests: number
  rejectedRequests: number
  underReview: number
  averageReviewTime: number // in hours
  approvalRate: number // percentage
  totalBeneficiariesServed: number
  createdAt: Date
  updatedAt: Date
}

