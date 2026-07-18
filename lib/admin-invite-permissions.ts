import type { User } from '@/lib/types'

/** Permission IDs used on /admin/management invitation form */
export type InvitePermissionId =
  | 'manage_members'
  | 'manage_events'
  | 'manage_admins'
  | 'manage_settings'
  | 'view_reports'
  | 'manage_content'
  | 'manage_integrations'
  | 'manage_beneficiary'
  | 'full_access'

/**
 * Exact route ownership for invite permissions.
 * Deny-by-default: a path is allowed only if the user holds at least one
 * permission whose prefix matches. No bare `/admin/cms` catch-all (that would
 * leak Global Settings under Manage Content).
 */
export const PERMISSION_ROUTE_PREFIXES: Record<InvitePermissionId, string[]> = {
  full_access: ['/admin'],

  manage_members: [
    '/admin/members',
    '/admin/membership',
    '/admin/promo-codes',
    '/admin/volunteers',
    '/admin/moderation',
    '/admin/businesses',
    '/admin/vendor-applications',
    '/admin/approvals',
    '/admin/pricing',
    '/admin/sponsors',
    '/admin/partnerships',
  ],

  manage_events: [
    '/admin/events',
    '/admin/workshops',
    '/admin/recordings',
    '/admin/opportunities',
    '/admin/marketplace',
    '/admin/communities',
    '/admin/finance/events',
    '/admin/assets',
  ],

  manage_admins: [
    '/admin/management',
    '/admin/security-center',
    '/admin/audit-logs',
  ],

  manage_settings: [
    '/admin/cms/global-settings',
    '/admin/settings',
    '/admin/location-config',
    '/admin/health',
  ],

  view_reports: [
    '/admin/analytics',
    '/admin/reporting',
    '/admin/finance/referrals',
    '/admin/referrals',
    '/admin/integration-analytics',
    '/admin/dashboard-enhanced',
  ],

  manage_content: [
    '/admin/cms/homepage',
    '/admin/cms/advertising',
    '/admin/cms/about',
    '/admin/cms/events',
    '/admin/cms/marketplace',
    '/admin/cms/partners',
    '/admin/cms/donations',
    '/admin/cms/transparency',
    '/admin/cms/shop',
    '/admin/cms/volunteer',
    '/admin/cms/learning',
    '/admin/cms/certificates',
    '/admin/cms/navigation',
    '/admin/cms/testimonials',
    '/admin/cms/news',
    '/admin/faq',
    '/admin/pages',
    '/admin/policies',
    '/admin/team',
    '/admin/partners',
    '/admin/forms',
    '/admin/eu-data-protection',
    '/admin/youtube-config',
    '/admin/newsletters',
    '/admin/chatbot',
    '/admin/contact-submissions',
    '/admin/contact-requests',
  ],

  manage_integrations: [
    '/admin/integrations',
  ],

  manage_beneficiary: [
    '/admin/beneficiary-requests',
    '/admin/charity',
    '/admin/causes',
    '/admin/donation-verification',
    '/admin/donations',
    '/admin/charity-partners',
    '/admin/finance/donations',
  ],
}

/** Human labels for the invite form (single source of truth) */
export const INVITE_PERMISSION_OPTIONS: {
  id: Exclude<InvitePermissionId, 'full_access'>
  label: string
  description: string
}[] = [
  { id: 'manage_members', label: 'Manage Members', description: 'Add, edit, and remove members' },
  { id: 'manage_events', label: 'Manage Events', description: 'Create, edit, and delete events' },
  { id: 'manage_admins', label: 'Manage Admins', description: 'Create and manage admin accounts' },
  { id: 'manage_settings', label: 'Manage Settings', description: 'Update site settings and configurations' },
  { id: 'view_reports', label: 'View Reports', description: 'Access analytics and reporting dashboard' },
  { id: 'manage_content', label: 'Manage Content', description: 'Edit pages, FAQs, and content' },
  { id: 'manage_integrations', label: 'Manage Integrations', description: 'Configure external services' },
  {
    id: 'manage_beneficiary',
    label: 'Manage Beneficiary Requests',
    description: 'Review welfare applications and sensitive documents',
  },
]

type PermissionUser = Pick<User, 'role' | 'permissions'> | null | undefined

function normalizePath(pathname: string): string {
  const path = pathname.split('?')[0].replace(/\/+$/, '') || '/'
  return path
}

function pathMatchesPrefix(path: string, prefix: string): boolean {
  if (prefix === '/admin') return path === '/admin' || path.startsWith('/admin/')
  return path === prefix || path.startsWith(`${prefix}/`)
}

/** Permissions whose prefixes match this path (deny-by-default owners). */
export function permissionsOwningPath(pathname: string): InvitePermissionId[] {
  const path = normalizePath(pathname)
  const owners: InvitePermissionId[] = []
  for (const [perm, prefixes] of Object.entries(PERMISSION_ROUTE_PREFIXES) as [
    InvitePermissionId,
    string[],
  ][]) {
    if (perm === 'full_access') continue
    if (prefixes.some((prefix) => pathMatchesPrefix(path, prefix))) {
      owners.push(perm)
    }
  }
  return owners
}

/**
 * Empty checkboxes → role default.
 * Only `super_admin` is always full access (checkboxes ignored).
 */
export function defaultPermissionsForInviteRole(role?: string): string[] {
  if (role === 'super_admin') return ['full_access']
  if (role === 'welfare' || role === 'founder' || role === 'coordinator') {
    return ['manage_beneficiary']
  }
  return ['full_access']
}

export function getEffectiveInvitePermissions(
  permissions: string[] | undefined,
  role?: string
): string[] {
  if (role === 'super_admin') return ['full_access']

  const selected = Array.isArray(permissions)
    ? permissions.map(String).map((p) => p.trim()).filter(Boolean)
    : []

  if (selected.length > 0) {
    if (selected.includes('full_access')) return ['full_access']
    return Array.from(new Set(selected))
  }

  return defaultPermissionsForInviteRole(role)
}

export function hasInvitePermission(
  user: PermissionUser,
  permission: InvitePermissionId
): boolean {
  if (!user) return false
  const effective = getEffectiveInvitePermissions(user.permissions, user.role)
  if (effective.includes('full_access')) return true
  return effective.includes(permission)
}

/**
 * Strict path gate: allowed only via full_access / super_admin, or an owning
 * permission the user actually holds. Unmapped admin routes are denied.
 */
export function canAccessAdminPath(user: PermissionUser, pathname: string): boolean {
  if (!user) return false
  if (user.role === 'super_admin') return true

  const path = normalizePath(pathname)
  if (path === '/admin/setup' || path === '/admin/login') return true

  const effective = getEffectiveInvitePermissions(user.permissions, user.role)
  if (effective.includes('full_access')) return true

  // Home overview for any scoped admin
  if (path === '/admin') {
    return effective.length > 0
  }

  const owners = permissionsOwningPath(path)
  if (owners.length === 0) {
    // Unknown /admin/* route — deny (no bypass)
    return false
  }

  return owners.some((perm) => effective.includes(perm))
}

export function filterAdminMenuByPermissions<
  T extends { href: string; label: string }
>(items: T[], user: PermissionUser): T[] {
  if (!user) return []
  if (user.role === 'super_admin') return items
  const effective = getEffectiveInvitePermissions(user.permissions, user.role)
  if (effective.includes('full_access')) return items
  return items.filter((item) => canAccessAdminPath(user, item.href))
}

/**
 * API path → required invite permission(s). Longest matching prefix wins.
 * Unmapped `/api/admin/*` routes require full_access (deny-by-default).
 */
export const API_PERMISSION_PREFIXES: {
  prefix: string
  permissions: Exclude<InvitePermissionId, 'full_access'>[]
}[] = [
  // Members / users
  { prefix: '/api/members', permissions: ['manage_members'] },
  { prefix: '/api/admin/businesses', permissions: ['manage_members'] },
  { prefix: '/api/admin/vendor-applications', permissions: ['manage_members'] },
  { prefix: '/api/admin/approvals', permissions: ['manage_members'] },
  { prefix: '/api/admin/partnerships', permissions: ['manage_members'] },
  { prefix: '/api/admin/discounts', permissions: ['manage_members'] },
  { prefix: '/api/admin/promo-codes', permissions: ['manage_members'] },
  { prefix: '/api/community-moderation', permissions: ['manage_members'] },

  // Events / community
  { prefix: '/api/admin/opportunities', permissions: ['manage_events'] },
  { prefix: '/api/admin/offers', permissions: ['manage_events'] },
  { prefix: '/api/admin/community-approvals', permissions: ['manage_events'] },
  { prefix: '/api/admin/community-members', permissions: ['manage_events'] },
  { prefix: '/api/admin/assets', permissions: ['manage_events'] },
  { prefix: '/api/admin/certificates', permissions: ['manage_events'] },
  { prefix: '/api/events', permissions: ['manage_events'] },
  { prefix: '/api/workshops', permissions: ['manage_events'] },
  { prefix: '/api/recordings', permissions: ['manage_events'] },
  { prefix: '/api/communities', permissions: ['manage_events'] },
  { prefix: '/api/groups', permissions: ['manage_events'] },

  // Admins / security
  { prefix: '/api/admin/management', permissions: ['manage_admins'] },
  { prefix: '/api/admin/admins', permissions: ['manage_admins'] },
  { prefix: '/api/admin/audit-log', permissions: ['manage_admins'] },
  { prefix: '/api/admin/login-history', permissions: ['manage_admins'] },
  { prefix: '/api/admin/send-access-code', permissions: ['manage_admins'] },
  { prefix: '/api/email/send-admin-invite', permissions: ['manage_admins'] },

  // Settings
  { prefix: '/api/admin/location-config', permissions: ['manage_settings'] },
  { prefix: '/api/settings', permissions: ['manage_settings'] },
  { prefix: '/api/admin/migrate-global-settings', permissions: ['manage_settings'] },
  { prefix: '/api/platform-config', permissions: ['manage_settings'] },

  // Reports
  { prefix: '/api/admin/integration-analytics', permissions: ['view_reports'] },
  { prefix: '/api/admin/referrals', permissions: ['view_reports'] },

  // Content
  { prefix: '/api/faqs', permissions: ['manage_content'] },
  { prefix: '/api/forms', permissions: ['manage_content'] },
  { prefix: '/api/admin/form-submissions', permissions: ['manage_content'] },
  { prefix: '/api/admin/chatbot-knowledge', permissions: ['manage_content'] },
  { prefix: '/api/admin/eu-policy', permissions: ['manage_content'] },
  { prefix: '/api/admin/newsletters', permissions: ['manage_content'] },
  { prefix: '/api/newsletters', permissions: ['manage_content'] },
  { prefix: '/api/contact', permissions: ['manage_content'] },
  { prefix: '/api/conversations', permissions: ['manage_content'] },
  { prefix: '/api/advertising', permissions: ['manage_content'] },
  { prefix: '/api/pages', permissions: ['manage_content'] },
  { prefix: '/api/eu-policy', permissions: ['manage_content'] },

  // Integrations
  { prefix: '/api/admin/integrations', permissions: ['manage_integrations'] },

  // Beneficiary / charity
  { prefix: '/api/admin/beneficiary-requests', permissions: ['manage_beneficiary'] },
  { prefix: '/api/beneficiary-requests', permissions: ['manage_beneficiary'] },
  { prefix: '/api/admin/donations', permissions: ['manage_beneficiary'] },
  { prefix: '/api/admin/donation-verification', permissions: ['manage_beneficiary'] },
]

/** Invite permissions required for this API path, or null if unmapped. */
export function permissionsRequiredForApiPath(apiPathname: string): InvitePermissionId[] | null {
  const path = normalizePath(apiPathname)
  let best: { prefix: string; permissions: InvitePermissionId[] } | null = null
  for (const entry of API_PERMISSION_PREFIXES) {
    if (path === entry.prefix || path.startsWith(`${entry.prefix}/`)) {
      if (!best || entry.prefix.length > best.prefix.length) {
        best = entry
      }
    }
  }
  return best ? best.permissions : null
}

/**
 * Whether a scoped admin may call this API. Super admin / full_access always allowed.
 * Unmapped `/api/admin/*` (except public setup endpoints) → denied for scoped users.
 */
export function canAccessAdminApi(user: PermissionUser, apiPathname: string): boolean {
  if (!user) return false
  if (user.role === 'super_admin') return true

  const path = normalizePath(apiPathname)
  const publicAdminApis = [
    '/api/admin/access-codes/verify',
    '/api/admin/access-codes/redeem',
    '/api/admin/access-codes/claim-password',
    '/api/admin/access-codes/bootstrap',
  ]
  if (publicAdminApis.some((p) => path === p || path.startsWith(`${p}/`))) {
    return true
  }

  const effective = getEffectiveInvitePermissions(user.permissions, user.role)
  if (effective.includes('full_access')) return true

  const required = permissionsRequiredForApiPath(path)
  if (required && required.length > 0) {
    return required.some((perm) => effective.includes(perm))
  }

  // Deny-by-default for admin APIs; other /api/* left to their own auth
  if (path.startsWith('/api/admin')) {
    return false
  }

  // Non-admin API used with requireAdminFromRequest but unmapped → require full_access
  return false
}
