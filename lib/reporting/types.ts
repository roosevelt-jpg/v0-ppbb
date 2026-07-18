export type ReportDateRange = 'week' | 'month' | 'year' | 'all'

export type ReportType =
  | 'members'
  | 'donations'
  | 'events'
  | 'volunteers'
  | 'businesses'
  | 'marketplace'
  | 'referrals'
  | 'memberships'
  | 'communities'
  | 'contact'
  | 'sponsors'
  | 'certificates'
  | 'charity'
  | 'opportunities'
  | 'audit'
  | 'partnerships'
  | 'vendors'
  | 'subscriptions'
  | 'event_registrations'
  | 'marketplace_orders'
  | 'promo_codes'
  | 'beneficiary_requests'
  | 'donation_verification'
  | 'advertising'
  | 'job_applications'
  | 'newsletters'
  | 'moderation'
  | 'business_payments'
  | 'learning'

export type ReportRow = Record<string, string | number>

export interface ReportPayload {
  type: string
  description: string
  total: number
  totalAmount?: number
  summary?: Record<string, string | number>
  details: ReportRow[]
  generatedAt: string
  dateRange: ReportDateRange
}

export type ExportFormat = 'csv' | 'pdf' | 'docx'

export interface ReportDefinition {
  type: ReportType
  title: string
  description: string
  category: 'community' | 'finance' | 'engagement' | 'operations' | 'compliance'
}

export const REPORT_DEFINITIONS: ReportDefinition[] = [
  {
    type: 'members',
    title: 'Member Analytics',
    description: 'Demographics, roles, join dates, and account status',
    category: 'community',
  },
  {
    type: 'volunteers',
    title: 'Volunteer Metrics',
    description: 'Volunteer roster, hours logged, and activity status',
    category: 'community',
  },
  {
    type: 'memberships',
    title: 'Membership Plans',
    description: 'Pricing plan configuration (tiers, prices, billing periods)',
    category: 'finance',
  },
  {
    type: 'donations',
    title: 'Donation Reports',
    description: 'Contributions, amounts, donors, and payment status',
    category: 'finance',
  },
  {
    type: 'charity',
    title: 'Charity & Causes',
    description: 'Active causes, fundraising cases, and charity partners',
    category: 'finance',
  },
  {
    type: 'events',
    title: 'Event Performance',
    description: 'Events schedule, attendance, and status',
    category: 'engagement',
  },
  {
    type: 'communities',
    title: 'Communities',
    description: 'Community directory, ownership, and status',
    category: 'engagement',
  },
  {
    type: 'businesses',
    title: 'Business Directory',
    description: 'Registered businesses, categories, and verification',
    category: 'operations',
  },
  {
    type: 'marketplace',
    title: 'Marketplace Offers',
    description: 'Offer listings, discounts, pricing, and listing status',
    category: 'operations',
  },
  {
    type: 'referrals',
    title: 'Referral Performance',
    description: 'Business referrals, conversions, and commission status',
    category: 'finance',
  },
  {
    type: 'sponsors',
    title: 'Sponsors CRM',
    description: 'Sponsor accounts, packages, and partnership status',
    category: 'operations',
  },
  {
    type: 'opportunities',
    title: 'Opportunities',
    description: 'Job and volunteer opportunity listings',
    category: 'engagement',
  },
  {
    type: 'certificates',
    title: 'Certificates Issued',
    description: 'Volunteer certificates and milestone awards',
    category: 'community',
  },
  {
    type: 'contact',
    title: 'Contact & Enquiries',
    description: 'Contact form submissions and support requests',
    category: 'operations',
  },
  {
    type: 'partnerships',
    title: 'Partnerships',
    description: 'Partnership applications and collaboration status',
    category: 'operations',
  },
  {
    type: 'vendors',
    title: 'Vendor Applications',
    description: 'Vendor onboarding pipeline and review status',
    category: 'operations',
  },
  {
    type: 'audit',
    title: 'Audit Logs',
    description: 'Admin actions for compliance and security review',
    category: 'compliance',
  },
  {
    type: 'subscriptions',
    title: 'Membership Subscriptions',
    description: 'Active paid plans, renewals, cancel status, and billing periods',
    category: 'finance',
  },
  {
    type: 'event_registrations',
    title: 'Event Registrations & Revenue',
    description: 'Tickets sold, payment status, check-ins, and registration revenue',
    category: 'finance',
  },
  {
    type: 'marketplace_orders',
    title: 'Marketplace Orders',
    description: 'Purchase GMV, fulfillment, and order payment status',
    category: 'finance',
  },
  {
    type: 'promo_codes',
    title: 'Promo Code Performance',
    description: 'Membership promo codes, redemption counts, and caps',
    category: 'finance',
  },
  {
    type: 'beneficiary_requests',
    title: 'Beneficiary Request Pipeline',
    description: 'Charity support requests by status and submission volume',
    category: 'operations',
  },
  {
    type: 'donation_verification',
    title: 'Donation Verification Queue',
    description: 'Manual donation proofs pending review, approved, or rejected',
    category: 'finance',
  },
  {
    type: 'advertising',
    title: 'Advertising Requests',
    description: 'Homepage ad requests, pricing, and publish status',
    category: 'operations',
  },
  {
    type: 'job_applications',
    title: 'Job Applications Funnel',
    description: 'Applications by opportunity, business, and review status',
    category: 'engagement',
  },
  {
    type: 'newsletters',
    title: 'Newsletters & Unsubscribes',
    description: 'Campaign sends, opens/clicks, and unsubscribe list',
    category: 'engagement',
  },
  {
    type: 'moderation',
    title: 'Community Moderation',
    description: 'Reported users/content and resolution status',
    category: 'compliance',
  },
  {
    type: 'business_payments',
    title: 'Business Payments & Payouts',
    description: 'Business billing, commission payouts, and event revenue payouts',
    category: 'finance',
  },
  {
    type: 'learning',
    title: 'Learning & Recordings Catalog',
    description: 'Workshops, recordings, and learning resources inventory',
    category: 'engagement',
  },
]

export const REPORT_CATEGORY_LABELS: Record<ReportDefinition['category'], string> = {
  community: 'Community',
  finance: 'Finance & Impact',
  engagement: 'Engagement',
  operations: 'Operations',
  compliance: 'Compliance',
}
