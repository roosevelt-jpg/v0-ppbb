/** Shared audit log types and request parsing (client + server safe). */

export type AuditActionType =
  | 'login'
  | 'login_failed'
  | 'logout'
  | 'page_view'
  | 'create'
  | 'update'
  | 'delete'
  | 'approve'
  | 'reject'
  | 'export'
  | 'other'

export type AuditEntityType =
  | 'auth'
  | 'page'
  | 'admin'
  | 'integration'
  | 'settings'
  | 'webhook'
  | 'alert'
  | 'member'
  | 'business'
  | 'event'
  | 'donation'
  | 'beneficiary'
  | 'pricing'
  | 'content'
  | 'other'

export interface AdminAuditLogEntry {
  id?: string
  timestamp: number
  adminId: string
  adminEmail: string
  adminName: string
  adminRole: string
  action: string
  actionType: AuditActionType
  entityType: AuditEntityType | string
  entityId?: string
  entityName?: string
  route?: string
  status: 'success' | 'failed'
  ipAddress: string
  userAgent: string
  deviceBrowser: string
  deviceOs: string
  deviceType: 'mobile' | 'tablet' | 'desktop'
  details?: string
  failureReason?: string
  changes?: Record<string, { before: unknown; after: unknown }>
}

export type AuditLogInput = Omit<
  AdminAuditLogEntry,
  'timestamp' | 'ipAddress' | 'userAgent' | 'deviceBrowser' | 'deviceOs' | 'deviceType'
> & {
  timestamp?: number
  ipAddress?: string
  userAgent?: string
  deviceBrowser?: string
  deviceOs?: string
  deviceType?: 'mobile' | 'tablet' | 'desktop'
}

export function parseUserAgent(userAgent: string) {
  const ua = userAgent || ''
  const browserMatch = ua.match(/(Edg|Chrome|Safari|Firefox|Opera|OPR)\/[\d.]+/)
  let browser = browserMatch ? browserMatch[1] : 'Unknown'
  if (browser === 'OPR') browser = 'Opera'
  if (browser === 'Edg') browser = 'Edge'

  const osMatch = ua.match(/(Windows|Mac OS X|Linux|iPhone|iPad|Android)/)
  let os = osMatch ? osMatch[1] : 'Unknown'
  if (os === 'Mac OS X') os = 'Mac'

  const deviceType: 'mobile' | 'tablet' | 'desktop' = /iPad|Tablet/i.test(ua)
    ? 'tablet'
    : /Mobile|Android|iPhone/i.test(ua)
      ? 'mobile'
      : 'desktop'

  return { deviceBrowser: browser, deviceOs: os, deviceType }
}

export function getClientIpFromRequest(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return (
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    'unknown'
  )
}

export function getRequestAuditContext(request: Request) {
  const userAgent = request.headers.get('user-agent') || ''
  const parsed = parseUserAgent(userAgent)
  return {
    ipAddress: getClientIpFromRequest(request),
    userAgent,
    ...parsed,
  }
}

/** For Next.js server actions — IP/UA from incoming request headers. */
export function getAuditContextFromHeaders(headersList: Headers) {
  const userAgent = headersList.get('user-agent') || ''
  const parsed = parseUserAgent(userAgent)
  const forwarded = headersList.get('x-forwarded-for')
  const ipAddress = forwarded
    ? forwarded.split(',')[0].trim()
    : headersList.get('x-real-ip') || headersList.get('cf-connecting-ip') || 'unknown'
  return {
    ipAddress,
    userAgent,
    ...parsed,
  }
}

export function formatAdminRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    founder_admin: 'Founder Admin',
    manager: 'Manager',
    welfare: 'Welfare',
    founder: 'Founder',
    coordinator: 'Coordinator',
    moderator: 'Moderator',
  }
  return labels[role] || role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export const AUDIT_ACTION_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'login', label: 'Login' },
  { value: 'login_failed', label: 'Failed Login' },
  { value: 'logout', label: 'Logout' },
  { value: 'page_view', label: 'Page View' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'approve', label: 'Approve' },
  { value: 'reject', label: 'Reject' },
  { value: 'export', label: 'Export' },
  { value: 'other', label: 'Other' },
]
