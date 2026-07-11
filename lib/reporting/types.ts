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
    description: 'Pricing plans, tiers, and membership configuration',
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
    description: 'Offers, discounts, pricing, and listing status',
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
]

export const REPORT_CATEGORY_LABELS: Record<ReportDefinition['category'], string> = {
  community: 'Community',
  finance: 'Finance & Impact',
  engagement: 'Engagement',
  operations: 'Operations',
  compliance: 'Compliance',
}
