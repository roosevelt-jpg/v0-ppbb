import React from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import {
  LogOut,
  Settings,
  BarChart3,
  Users,
  Calendar,
  Store,
  Zap,
  Heart,
  DollarSign,
  CheckCircle,
  ShieldAlert,
  CreditCard,
  Mail,
  HandHeart,
  Plug,
  Play,
  Shield,
  Lock,
  HelpCircle,
  Menu,
  Briefcase,
  Share2,
  Inbox,
  ShieldCheck,
  LayoutTemplate,
  ClipboardList,
  ScrollText,
  Home,
  Info,
  Handshake,
  MessageSquareQuote,
  Building2,
  HeartHandshake,
  ShoppingBag,
  Compass,
  Activity,
  TrendingUp,
  FileChartColumn,
  History,
  UserCog,
  UserCircle,
  Award,
  Building,
  UsersRound,
  Presentation,
  ClipboardCheck,
  Receipt,
  Wallet,
  Tags,
  BadgeCheck,
  MessageSquare,
  CalendarCog,
  Landmark,
  Video,
  MapPin,
  PieChart,
  BookOpen,
  FolderOpen,
  Megaphone,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageSwitcherWithFlags } from '@/components/language-switcher-flags'
import { SiteLogo } from '@/components/site-logo'
import { ProfileMenuButton } from '@/components/profile-quick-edit'
import { logoutUser } from '@/lib/auth'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { useAuth } from '@/lib/auth-context'
import { filterAdminMenuByPermissions } from '@/lib/admin-invite-permissions'

export const adminMenuItems = [
  // Dashboard & System
  { label: 'Overview', href: '/admin', icon: BarChart3, group: 'Dashboard' },
  { label: 'System Health', href: '/admin/health', icon: Activity, group: 'Dashboard' },
  { label: 'Analytics', href: '/admin/analytics', icon: TrendingUp, group: 'Dashboard' },
  { label: 'Reporting', href: '/admin/reporting', icon: FileChartColumn, group: 'Dashboard' },

  // Security & Access
  { label: 'Security Center', href: '/admin/security-center', icon: Lock, group: 'Security' },
  { label: 'Audit Logs', href: '/admin/audit-logs', icon: History, group: 'Security' },
  { label: 'Admin Management', href: '/admin/management', icon: UserCog, group: 'Security' },

  // User Management
  { label: 'Members', href: '/admin/members', icon: UserCircle, group: 'Users' },
  { label: 'Volunteers', href: '/admin/volunteers', icon: Heart, group: 'Users' },
  { label: 'Businesses', href: '/admin/businesses', icon: Building, group: 'Users' },
  { label: 'Vendor Applications', href: '/admin/vendor-applications', icon: ClipboardCheck, group: 'Users' },

  // Community & Events
  { label: 'Community', href: '/admin/communities', icon: UsersRound, group: 'Community' },
  { label: 'Events', href: '/admin/events', icon: Calendar, group: 'Community' },
  { label: 'Opportunities', href: '/admin/opportunities', icon: Briefcase, group: 'Community' },
  { label: 'Marketplace', href: '/admin/marketplace', icon: Store, group: 'Community' },
  { label: 'Partnerships', href: '/admin/partnerships', icon: Handshake, group: 'Community' },
  { label: 'Recordings', href: '/admin/recordings', icon: Play, group: 'Community' },

  // Charity & Support
  { label: 'Charity Cases', href: '/admin/charity', icon: ShieldAlert, group: 'Charity' },
  { label: 'Donations', href: '/admin/donations', icon: DollarSign, group: 'Charity' },
  { label: 'Charity Partners', href: '/admin/charity-partners', icon: Landmark, group: 'Charity' },
  { label: 'Donation Verification', href: '/admin/donation-verification', icon: CheckCircle, group: 'Charity' },
  { label: 'Beneficiary Requests', href: '/admin/beneficiary-requests', icon: ClipboardCheck, group: 'Charity' },

  // Finance
  { label: 'Donation Tracking', href: '/admin/finance/donations', icon: Receipt, group: 'Finance' },
  { label: 'Event Finance', href: '/admin/finance/events', icon: Wallet, group: 'Finance' },
  { label: 'Business Referrals', href: '/admin/finance/referrals', icon: Share2, group: 'Finance' },
  { label: 'Referrals Overview', href: '/admin/referrals', icon: Share2, group: 'Finance' },

  // Memberships & Commerce
  { label: 'Membership', href: '/admin/membership', icon: CreditCard, group: 'Memberships' },
  { label: 'Pricing Plans', href: '/admin/pricing', icon: Tags, group: 'Memberships' },
  { label: 'Approvals', href: '/admin/approvals', icon: BadgeCheck, group: 'Memberships' },

  // Communication & Support
  { label: 'Contact Submissions', href: '/admin/contact-submissions', icon: Inbox, group: 'Communication' },
  { label: 'Newsletters', href: '/admin/newsletters', icon: Mail, group: 'Communication' },
  { label: 'Moderation', href: '/admin/moderation', icon: ShieldCheck, group: 'Communication' },
  { label: 'Chatbot', href: '/admin/chatbot', icon: Zap, group: 'Communication' },

  // Content Management
  { label: 'Pages (CMS)', href: '/admin/pages', icon: LayoutTemplate, group: 'Content' },
  // Part 11 — CMS section order (do not scramble; Partners & Logos is logos collection)
  { label: 'Homepage', href: '/admin/cms/homepage', icon: Home, group: 'CMS' },
  { label: 'Advertising', href: '/admin/cms/advertising', icon: Megaphone, group: 'CMS' },
  { label: 'About Page', href: '/admin/cms/about', icon: Info, group: 'CMS' },
  { label: 'Events Config', href: '/admin/cms/events', icon: CalendarCog, group: 'CMS' },
  { label: 'Marketplace Config', href: '/admin/cms/marketplace', icon: Store, group: 'CMS' },
  { label: 'Partners Page', href: '/admin/cms/partners', icon: Handshake, group: 'CMS' },
  { label: 'Donations Config', href: '/admin/cms/donations', icon: HeartHandshake, group: 'CMS' },
  { label: 'Transparency Page', href: '/admin/cms/transparency', icon: BarChart3, group: 'CMS' },
  { label: 'Shop Config', href: '/admin/cms/shop', icon: ShoppingBag, group: 'CMS' },
  { label: 'Volunteer Config', href: '/admin/cms/volunteer', icon: HandHeart, group: 'CMS' },
  { label: 'Learning Resources', href: '/admin/cms/learning', icon: BookOpen, group: 'CMS' },
  { label: 'Volunteer Certificates', href: '/admin/cms/certificates', icon: Award, group: 'CMS' },
  { label: 'Navigation', href: '/admin/cms/navigation', icon: Compass, group: 'CMS' },
  { label: 'Global Settings', href: '/admin/cms/global-settings', icon: Settings, group: 'CMS' },
  { label: 'Team Members', href: '/admin/team', icon: Users, group: 'CMS' },
  { label: 'Testimonials', href: '/admin/cms/testimonials', icon: MessageSquareQuote, group: 'CMS' },
  { label: 'Partners & Logos', href: '/admin/partners', icon: Building2, group: 'CMS' },
  { label: 'Custom Forms', href: '/admin/forms', icon: ClipboardList, group: 'Content' },
  { label: 'FAQ Management', href: '/admin/faq', icon: HelpCircle, group: 'Content' },
  { label: 'Policies', href: '/admin/policies', icon: ScrollText, group: 'Content' },
  { label: 'EU Data Protection', href: '/admin/eu-data-protection', icon: Shield, group: 'Content' },

  // Assets & Media
  { label: 'Event Assets', href: '/admin/assets', icon: FolderOpen, group: 'Assets' },
  { label: 'YouTube Videos', href: '/admin/youtube-config', icon: Video, group: 'Assets' },

  // Configuration
  { label: 'Location Config', href: '/admin/location-config', icon: MapPin, group: 'Configuration' },
  { label: 'Integrations', href: '/admin/integrations', icon: Plug, group: 'Configuration' },
  { label: 'Integration Analytics', href: '/admin/integration-analytics', icon: PieChart, group: 'Configuration' },
]

export function AdminSidebar({
  mobileOpen,
  onMobileOpenChange,
}: {
  mobileOpen?: boolean
  onMobileOpenChange?: (open: boolean) => void
} = {}) {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const [internalMobileOpen, setInternalMobileOpen] = React.useState(false)
  const mobileMenuOpen = mobileOpen ?? internalMobileOpen
  const setMobileMenuOpen = onMobileOpenChange ?? setInternalMobileOpen
  const showFab = mobileOpen === undefined && onMobileOpenChange === undefined

  const visibleMenuItems = React.useMemo(
    () => filterAdminMenuByPermissions(adminMenuItems, user),
    [user]
  )

  const handleLogout = async () => {
    await logoutUser()
    router.push('/login')
  }

  // Group items by category
  const groupedItems = visibleMenuItems.reduce((acc, item) => {
    const group = item.group || 'Other'
    if (!acc[group]) {
      acc[group] = []
    }
    acc[group].push(item)
    return acc
  }, {} as Record<string, typeof adminMenuItems>)

  // Sort groups in order of appearance
  const groupOrder = [
    'Dashboard',
    'Security',
    'Users',
    'Community',
    'Charity',
    'Finance',
    'Memberships',
    'Communication',
    'Content',
    'CMS',
    'Assets',
    'Configuration',
  ]
  const sortedGroups = groupOrder.filter(g => groupedItems[g])

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-52 min-h-screen flex-col border-r" style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da' }}>
        {/* Logo */}
        <div className="px-4 py-4 border-b flex flex-col items-center justify-center" style={{ borderColor: '#e4e1da' }}>
          <SiteLogo background="light" variant="sidebar" href="/admin" />
        </div>

        {/* Navigation with Groups */}
        <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
          {sortedGroups.map((group) => (
            <div key={group}>
              {/* Group Header */}
              <div className="px-3 py-2 mb-2">
                <h3 
                  className="text-xs font-semibold tracking-wider"
                  style={{ color: '#888888', textTransform: 'uppercase' }}
                >
                  {group}
                </h3>
              </div>

              {/* Group Items */}
              <div className="space-y-1">
                {groupedItems[group].map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2 px-3 py-2.5 min-h-[44px] rounded-lg text-xs font-medium truncate transition-all duration-200 ${
                        isActive
                          ? 'bg-[#111111] text-[#f7f6f2] hover:shadow-[0_2px_10px_rgba(0,0,0,0.25)]'
                          : 'text-[#333333] hover:bg-[#f0efeb] hover:shadow-[0_2px_10px_rgba(0,0,0,0.12)]'
                      }`}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span className="font-medium truncate">{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* Mobile Menu Button — only when parent does not provide a top-bar toggle */}
      {showFab ? (
        <button
          type="button"
          data-dashboard-control
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden fixed bottom-6 left-4 z-40 flex items-center justify-center min-h-[48px] min-w-[48px] p-3 rounded-lg transition-colors"
          style={{ backgroundColor: '#111111', color: '#f7f6f2' }}
          aria-label="Toggle menu"
        >
          <Menu size={24} />
        </button>
      ) : null}

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Drawer */}
          <aside className="lg:hidden fixed left-0 top-0 bottom-0 w-64 flex flex-col border-r overflow-y-auto z-30" style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da' }}>
            {/* Logo */}
            <div className="px-4 py-4 border-b flex flex-col items-center justify-center" style={{ borderColor: '#e4e1da' }}>
              <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                <SiteLogo background="light" variant="sidebar" linked={false} />
              </Link>
            </div>

            {/* Navigation with Groups */}
            <nav className="flex-1 p-3 space-y-4">
              {sortedGroups.map((group) => (
                <div key={group}>
                  {/* Group Header */}
                  <div className="px-3 py-2 mb-2">
                    <h3 
                      className="text-xs font-semibold tracking-wider"
                      style={{ color: '#888888', textTransform: 'uppercase' }}
                    >
                      {group}
                    </h3>
                  </div>

                  {/* Group Items */}
                  <div className="space-y-1">
                    {groupedItems[group].map((item) => {
                      const Icon = item.icon
                      const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-2 px-3 py-2.5 min-h-[44px] rounded-lg text-xs font-medium transition-all duration-200 ${
                            isActive
                              ? 'bg-[#111111] text-[#f7f6f2] hover:shadow-[0_2px_10px_rgba(0,0,0,0.25)]'
                              : 'text-[#333333] hover:bg-[#f0efeb] hover:shadow-[0_2px_10px_rgba(0,0,0,0.12)]'
                          }`}
                        >
                          <Icon className="h-4 w-4 flex-shrink-0" />
                          <span className="font-medium">{item.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </aside>
        </>
      )}
    </>
  )
}

export function AdminHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const router = useRouter()
  const [dateTime, setDateTime] = React.useState<string>('')
  const [unreadMessages, setUnreadMessages] = React.useState<number>(0)

  React.useEffect(() => {
    const updateDateTime = () => {
      const now = new Date()
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }
      setDateTime(now.toLocaleDateString('en-US', options))
    }

    updateDateTime()
    const interval = setInterval(updateDateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  React.useEffect(() => {
    const q = query(collection(db, 'contactSubmissions'), where('status', '==', 'unread'))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setUnreadMessages(snapshot.size)
      },
      (error) => {
        console.error('[v0] Error fetching unread messages:', error)
      }
    )

    return () => unsubscribe()
  }, [])

  const handleLogout = async () => {
    await logoutUser()
    router.push('/login')
  }

  return (
    <div className="border-b px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da' }}>
      <div className="flex-1 min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold truncate font-headline" style={{ color: '#111111', fontWeight: 700 }}>
          {title}
        </h1>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
          {subtitle && <p className="text-xs" style={{ color: '#888888' }}>{subtitle}</p>}
          <div className="flex items-center gap-1 text-xs" style={{ color: '#888888' }}>
            <svg className="h-3 w-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="truncate">{dateTime}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-4 flex-wrap sm:flex-nowrap justify-end">
        <LanguageSwitcherWithFlags />
        <ThemeToggle />
        <ProfileMenuButton />
        
        {/* Message Notification Badge */}
        {unreadMessages > 0 && (
          <Link href="/admin/contact-submissions">
            <button className="relative flex items-center justify-center w-10 h-10 rounded-lg transition-colors flex-shrink-0" style={{ backgroundColor: '#fff3e0', border: '2px solid #ff6b6b' }}>
              <Mail className="h-5 w-5" style={{ color: '#ff6b6b' }} />
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center" style={{ backgroundColor: '#ff6b6b' }}>
                {unreadMessages}
              </span>
            </button>
          </Link>
        )}
        
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-100 transition-colors whitespace-nowrap flex-shrink-0"
          style={{
            backgroundColor: '#f7f6f2',
            color: '#111111',
            border: '1px solid #e4e1da',
          }}
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </div>
  )
}
