/** Routes where marketing overlays (EU popup, WhatsApp) should not block dashboard UX. */
export const DASHBOARD_ROUTE_PREFIXES = ['/dashboard', '/admin', '/business', '/sponsor'] as const

export function isDashboardRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  const path = pathname.split('?')[0]
  return DASHBOARD_ROUTE_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  )
}
