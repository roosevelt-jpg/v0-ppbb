// User roles and types
export type UserRole = 'member' | 'volunteer' | 'business' | 'admin' | 'sponsor' | 'super_admin'

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
  lastLoginAt?: Date
  lastLoginIP?: string
  lastLoginLocation?: string
  loginAttempts: number
  isLocked?: boolean
}

export interface AdminAccessCode {
  id: string
  code: string
  adminEmail: string
  adminName: string
  adminRole: 'super_admin' | 'admin' | 'moderator'
  permissions: string[]
  createdAt: Date
  expiresAt: Date
  isUsed: boolean
  usedAt?: Date
  usedIP?: string
  usedLocation?: string
  createdBy: string
  status: 'active' | 'used' | 'expired'
}

export interface AdminLoginLog {
  id: string
  adminId: string
  adminEmail: string
  adminName: string
  timestamp: Date
  ipAddress: string
  userAgent: string
  deviceInfo: {
    browser?: string
    os?: string
    osVersion?: string
    deviceType?: 'desktop' | 'mobile' | 'tablet'
  }
  location?: {
    city?: string
    state?: string
    country?: string
    countryCode?: string
    latitude?: number
    longitude?: number
    timezone?: string
  }
  status: 'success' | 'failed' | 'locked'
  failureReason?: string
  accessCodeId?: string
  sessionId: string
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
  // Additional roles a user holds beyond their primary role (e.g. a member who
  // also runs a business). Used to grant access to the business portal.
  roles?: UserRole[]
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
  // Priority 1 - Sponsor Tags
  tags: SponsorTag[]
  // Priority 2 - Sponsor Management
  campaignIds: string[]
  isRecurring: boolean
  recurringStartDate?: Date
  recurringEndDate?: Date
  externalSponsor: boolean
  mediaKitUrl?: string
}

export interface VolunteerProfile extends User {
  volunteerDepartmentId?: string
  volunteerDepartmentName?: string
  volunteeredTotalHours: number
  certifications?: string[]
  languagesSpoken?: string[]
  preferredSkills?: VolunteerSkill[]
  hasBackgroundCheck: boolean
  backgroundCheckDate?: Date
  leaderboardRank?: number
  leaderboardPoints: number
  // Priority 4 - Leaderboard
  monthlyHours: number
  yearlyHours: number
  contributionStreak: number // Days in a row volunteered
  badgesEarned: VolunteerBadge[]
}

export interface VolunteerBadge {
  id: string
  name: string
  icon: string
  earnedDate: Date
  description: string
}

// Priority 4 - Admin Analytics
export interface AdminAnalytics {
  id: string
  period: 'daily' | 'weekly' | 'monthly' | 'yearly'
  date: Date
  totalReferrals: number
  totalVolunteerHours: number
  totalDonations: number
  topBusinesses: Array<{ id: string; name: string; referrals: number }>
  topVolunteers: Array<{ id: string; name: string; hours: number }>
  topSponsors: Array<{ id: string; name: string; contribution: number }>
  conversionRate: number
  revenueContribution: number
  businessLeaderboard: BusinessLeaderboardEntry[]
  referralAnalytics: ReferralAnalytics
}

export interface BusinessLeaderboardEntry {
  businessId: string
  businessName: string
  rank: number
  referrals: number
  earnings: number
  activeOffers: number
  satisfaction: number // 0-100
}

export interface ReferralAnalytics {
  totalReferrals: number
  activeReferrals: number
  conversionCount: number
  totalCommission: number
  topReferrers: Array<{ id: string; count: number; commission: number }>
}

// Priority 5 - Sponsorship Page
export interface SponsorshipTier {
  id: string
  name: string
  monthlyAmount: number
  yearlyAmount: number
  benefits: string[]
  icon: string
  color: string
  order: number
  isPopular: boolean
}

export interface SponsorshipInquiry {
  id: string
  name: string
  email: string
  phone: string
  companyName: string
  message: string
  preferredTier?: string
  submittedAt: Date
  status: 'new' | 'contacted' | 'interested' | 'declined'
  adminNotes?: string
}

// Priority 6 - AI Matching & Advanced Features
export interface AIMatchingResult {
  id: string
  volunteerId: string
  opportunityId: string
  matchScore: number // 0-100
  reasons: string[]
  createdAt: Date
  viewed: boolean
}

export interface CommunityReputation {
  userId: string
  score: number
  level: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'
  contributions: {
    volunteering: number
    donations: number
    referrals: number
    community: number
  }
  badges: VolunteerBadge[]
}

export interface DigitalWallet {
  userId: string
  balance: number
  currency: string
  transactions: WalletTransaction[]
  lastUpdated: Date
}

export interface WalletTransaction {
  id: string
  type: 'earn' | 'spend'
  amount: number
  description: string
  source: string // 'referral', 'reward', 'purchase', etc.
  date: Date
}

export interface VolunteerDepartment {
  id: string
  name: string
  description?: string
  icon?: string
  color?: string
  requiresTraining: boolean
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
  // Pricing and Payment Configuration
  ticketType?: 'free' | 'paid' | 'rsvp'
  ticketPrice?: number
  ticketCurrency?: string
  paymentGateway?: 'stripe' | 'paypal' | 'ziina'
  stripeProductId?: string
  stripePriceId?: string
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
  // Menu configuration
  menuLocation?: 'navbar' | 'footer-quicklinks' | 'footer-getinvolved' | 'footer-legal' | 'none'
  showInMenu: boolean
  menuLabel?: string
  menuOrder: number
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
    youtube?: string
    discord?: string
    tiktok?: string
    snapchat?: string
  }
  footerText: string
  maintenanceMode: boolean
  // SEO Fields
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string
  // Analytics
  googleAnalyticsId?: string
  // Email Configuration (Gmail SMTP)
  emailConfig?: {
    enabled: boolean
    gmailEmail?: string
    gmailAppPassword?: string
    fromName?: string
  }
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
  title: string
  subject: string
  content: string
  template: 'classic' | 'modern' | 'minimal' | 'highlight' | 'newsletter'
  status: 'draft' | 'scheduled' | 'sent'
  scheduledFor?: Date
  sentAt?: Date
  recipientCount: number
  openedCount: number
  clickedCount: number
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface NewsletterTemplate {
  id: string
  title: string
  subject: string
  content: string
  css?: string
  html: string
  category: string
  thumbnail?: string
  createdAt: Date
}

export interface NewsletterSubscriber {
  id: string
  email: string
  subscribedAt: Date
  unsubscribedAt?: Date
  isActive: boolean
}

export interface Conversation {
  id: string
  userId: string
  userEmail?: string
  userRole: string
  title: string
  messages: Array<{
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
    faqSourceId?: string
  }>
  status: 'active' | 'archived' | 'resolved'
  category?: string
  sentiment?: string
  faqSourceId?: string
  createdAt: Date
  lastMessageAt: Date
  adminReply?: string
  adminResolved?: boolean
  adminReplyAt?: Date
  updatedAt: Date
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
  businessLogoUrl?: string
  title: string
  type: 'job' | 'internship' | 'gig' | 'volunteer' | 'contract'
  description: string
  category: string
  salary?: number
  salaryRange?: { min: number; max: number }
  compensation?: string
  location?: LocationData
  locationText?: string
  remote: boolean
  duration?: string
  hoursPerWeek?: number
  requirements?: string[]
  benefits?: string[]
  deadline?: Date
  featured?: boolean
  views?: number
  applications: number
  applicants: string[]
  status: 'open' | 'closed' | 'filled' | 'archived'
  createdAt: Date
  updatedAt: Date
}

// A member's application to a business opportunity
export interface JobApplication {
  id: string
  opportunityId: string
  opportunityTitle: string
  businessId: string
  businessName: string
  applicantId: string
  applicantName: string
  applicantEmail: string
  applicantPhone?: string
  applicantAvatarUrl?: string
  coverLetter?: string
  resumeUrl?: string
  status: 'pending' | 'reviewing' | 'shortlisted' | 'accepted' | 'rejected'
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
  dateOfBirth?: Date
  currentEmirateArea?: string
  
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
  amountNeeded?: number // AED amount requested
  employmentStatus?: 'employed' | 'self_employed' | 'unemployed' | 'retired' | 'student'
  monthlyIncome?: number // AED
  numberOfDependents?: number
  reason: string
  reasonCategory: 'housing' | 'medical' | 'emergency' | 'education' | 'employment' | 'family' | 'other'
  emergencyLevel: 'low' | 'medium' | 'high' | 'critical'
  referralSource: 'self' | 'community_member' | 'business' | 'admin_referral' | 'social_media' | 'other'
  referralPersonName?: string
  
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


// Workshops - Educational events with registrations
export interface Workshop {
  id: string
  title: string
  description: string
  category: string
  instructorName: string
  instructorEmail: string
  date: Date
  time: string // HH:MM format
  duration: number // minutes
  location: string
  capacity: number
  registered: number
  image?: string
  status: 'draft' | 'published' | 'archived'
  registrations: WorkshopRegistration[]
  createdAt: Date
  updatedAt: Date
  publishedAt?: Date
}

export interface WorkshopRegistration {
  id: string
  workshopId: string
  userId: string
  userName: string
  userEmail: string
  registeredAt: Date
  attended: boolean
  attendanceTime?: Date
}

// Recordings - Educational video content
export interface Recording {
  id: string
  title: string
  description: string
  category: string
  videoUrl: string // URL to hosted video
  thumbnail?: string
  duration: number // seconds
  instructor: string
  views: number
  likes: number
  status: 'draft' | 'published' | 'archived'
  tags: string[]
  transcript?: string
  createdAt: Date
  updatedAt: Date
  publishedAt?: Date
}

// EU Data Protection Policy - GDPR Compliance
export interface EUDataProtectionPolicy {
  id: string
  title: string
  content: string
  htmlContent?: string
  version: number
  status: 'draft' | 'active' | 'archived'
  effectiveDate: Date
  lastUpdated: Date
  createdBy: string
  updatedBy: string
  requiresAcceptance: boolean
  acceptanceRequired: boolean
}

// User Policy Acceptance Tracking
export interface UserPolicyAcceptance {
  id: string
  userId: string
  userEmail: string
  policyId: string
  policyVersion: number
  acceptedAt: Date
  ipAddress?: string
  userAgent?: string
}

// FAQ System - Brain of Passive Blessings
export interface FAQ {
  id: string
  question: string
  answer: string
  category: 'general' | 'community' | 'sponsorship' | 'volunteering' | 'support' | 'technical'
  keywords: string[]
  order: number
  isActive: boolean
  views: number
  helpful: number
  notHelpful: number
  createdAt: Date
  updatedAt: Date
}
