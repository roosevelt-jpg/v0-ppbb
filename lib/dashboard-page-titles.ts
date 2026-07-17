/** Resolve human-readable page titles for dashboard top bars from the current path. */

type TitleEntry = { href: string; title: string }

const businessRoutes: TitleEntry[] = [
  { href: '/business/dashboard', title: 'Business Dashboard' },
  { href: '/business/profile', title: 'Business Profile' },
  { href: '/business/events/new', title: 'Create Event' },
  { href: '/business/events', title: 'Events' },
  { href: '/business/assets', title: 'Event Assets' },
  { href: '/business/communities/create', title: 'Create Community' },
  { href: '/business/communities/new', title: 'Create Community' },
  { href: '/business/communities', title: 'Communities' },
  { href: '/business/advertise', title: 'Advertise' },
  { href: '/business/opportunities/new', title: 'Post Opportunity' },
  { href: '/business/opportunities/applicants', title: 'Candidates' },
  { href: '/business/opportunities', title: 'Job List' },
  { href: '/business/offers/new', title: 'Post Offer' },
  { href: '/business/offers', title: 'Posted Offers' },
  { href: '/business/leads', title: 'Leads & Conversions' },
  { href: '/business/referrals', title: 'Referrals' },
  { href: '/business/partnerships/new', title: 'Submit Partnership' },
  { href: '/business/partnerships', title: 'Partnerships' },
  { href: '/business/marketplace', title: 'Network / Connections' },
  { href: '/business/membership', title: 'Membership' },
  { href: '/business/certificates', title: 'Certificates' },
  { href: '/business/payments', title: 'Payments & Subscriptions' },
  { href: '/business/analytics', title: 'Business Analytics' },
  { href: '/business/signup', title: 'Business Sign Up' },
]

const memberRoutes: TitleEntry[] = [
  { href: '/directory', title: 'Business Directory' },
  { href: '/dashboard', title: 'Member Dashboard' },
  { href: '/dashboard/events', title: 'My Events' },
  { href: '/dashboard/donations', title: 'My Donations' },
  { href: '/dashboard/volunteering', title: 'Volunteering' },
  { href: '/dashboard/charity-requests', title: 'Charity Requests' },
  { href: '/dashboard/charity', title: 'Active Causes' },
  { href: '/dashboard/opportunities', title: 'Opportunities' },
  { href: '/dashboard/marketplace', title: 'Marketplace' },
  { href: '/dashboard/orders', title: 'Orders' },
  { href: '/dashboard/messages', title: 'Messages' },
  { href: '/dashboard/learning', title: 'Learning' },
  { href: '/dashboard/certificates', title: 'Certificates' },
  { href: '/dashboard/assets', title: 'Event Assets' },
  { href: '/dashboard/membership', title: 'Membership' },
  { href: '/dashboard/communities', title: 'My Communities' },
  { href: '/dashboard/settings', title: 'Settings' },
]

function matchTitle(pathname: string, routes: TitleEntry[], fallback: string): string {
  const path = pathname.split('?')[0]
  const exact = routes.find((r) => r.href === path)
  if (exact) return exact.title
  const sorted = [...routes].sort((a, b) => b.href.length - a.href.length)
  const prefix = sorted.find((r) => path.startsWith(r.href + '/'))
  if (prefix) {
    if (path.includes('/new')) return prefix.title.replace(/^Posted /, 'New ')
    if (path.includes('/edit')) return `Edit ${prefix.title}`
    return prefix.title
  }
  return fallback
}

export function getBusinessPageTitle(pathname: string): string {
  return matchTitle(pathname, businessRoutes, 'Business Portal')
}

export function getMemberPageTitle(pathname: string): string {
  return matchTitle(pathname, memberRoutes, 'Member Dashboard')
}

export function getAdminPageTitle(pathname: string, adminMenu: TitleEntry[]): string {
  if (pathname === '/admin') return 'Admin Overview'
  return matchTitle(pathname, adminMenu, 'Admin')
}

export function getWelcomeFirstName(displayName: string): string {
  const trimmed = displayName.trim()
  if (!trimmed) return 'there'
  return trimmed.split(/\s+/)[0]
}
