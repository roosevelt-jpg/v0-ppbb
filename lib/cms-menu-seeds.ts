import type { Page } from '@/lib/types'

export type MenuPageSeed = Omit<Page, 'id' | 'createdAt' | 'updatedAt' | 'keywords' | 'seoTitle' | 'seoDescription' | 'order' | 'description'> & {
  description?: string
  seoTitle?: string
  seoDescription?: string
  keywords?: string[]
  order?: number
}

/** Default footer / menu entries migrated from former hardcoded navbar & footer links */
export const CMS_MENU_SEEDS: MenuPageSeed[] = [
  // Footer — Quick Links
  { slug: 'nav-about', title: 'About Us', menuLabel: 'About Us', menuLocation: 'footer-quicklinks', menuOrder: 0, showInMenu: true, status: 'published', externalHref: '/about', content: '' },
  { slug: 'nav-transparency', title: 'Impact & Transparency', menuLabel: 'Impact & Transparency', menuLocation: 'footer-quicklinks', menuOrder: 1, showInMenu: true, status: 'published', externalHref: '/transparency', content: '' },
  { slug: 'nav-events', title: 'Events', menuLabel: 'Events', menuLocation: 'footer-quicklinks', menuOrder: 2, showInMenu: true, status: 'published', externalHref: '/events', content: '' },
  { slug: 'nav-marketplace', title: 'Marketplace', menuLabel: 'Marketplace', menuLocation: 'footer-quicklinks', menuOrder: 3, showInMenu: true, status: 'published', externalHref: '/marketplace', content: '' },
  { slug: 'nav-shop', title: 'Shop', menuLabel: 'Shop', menuLocation: 'footer-quicklinks', menuOrder: 4, showInMenu: true, status: 'published', externalHref: '/shop', content: '' },
  { slug: 'nav-partners', title: 'Partners', menuLabel: 'Partners', menuLocation: 'footer-quicklinks', menuOrder: 5, showInMenu: true, status: 'published', externalHref: '/partners', content: '' },
  { slug: 'nav-contact', title: 'Contact', menuLabel: 'Contact', menuLocation: 'footer-quicklinks', menuOrder: 6, showInMenu: true, status: 'published', externalHref: '/contact', content: '' },
  { slug: 'nav-charity-request', title: 'Charity Support Request', menuLabel: 'Charity Support Request', menuLocation: 'footer-quicklinks', menuOrder: 7, showInMenu: true, status: 'published', externalHref: '/dashboard/charity-requests?apply=1', content: '' },
  { slug: 'nav-faq', title: 'FAQ', menuLabel: 'FAQ', menuLocation: 'footer-quicklinks', menuOrder: 8, showInMenu: true, status: 'published', externalHref: '/faq', content: '' },
  // Footer — Get Involved
  { slug: 'nav-join', title: 'Join Community', menuLabel: 'Join Community', menuLocation: 'footer-getinvolved', menuOrder: 0, showInMenu: true, status: 'published', externalHref: '/join', content: '' },
  { slug: 'nav-volunteer', title: 'Volunteer', menuLabel: 'Volunteer', menuLocation: 'footer-getinvolved', menuOrder: 1, showInMenu: true, status: 'published', externalHref: '/join', content: '' },
  { slug: 'nav-workshops', title: 'Workshops', menuLabel: 'Workshops', menuLocation: 'footer-getinvolved', menuOrder: 2, showInMenu: true, status: 'published', externalHref: '/workshops', content: '' },
  { slug: 'nav-recordings', title: 'Recordings', menuLabel: 'Recordings', menuLocation: 'footer-getinvolved', menuOrder: 3, showInMenu: true, status: 'published', externalHref: '/recordings', content: '' },
  { slug: 'nav-donate', title: 'Donate', menuLabel: 'Donate', menuLocation: 'footer-getinvolved', menuOrder: 4, showInMenu: true, status: 'published', externalHref: '/donate', content: '' },
  { slug: 'nav-start-business', title: 'Start Business', menuLabel: 'Start Business', menuLocation: 'footer-getinvolved', menuOrder: 5, showInMenu: true, status: 'published', externalHref: '/join?type=business', content: '' },
  { slug: 'nav-host-event', title: 'Host Event', menuLabel: 'Host Event', menuLocation: 'footer-getinvolved', menuOrder: 6, showInMenu: true, status: 'published', externalHref: '/business/events/new', content: '' },
  // Footer — Legal (CMS pages — edit content in Admin → Pages)
  {
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    menuLabel: 'Privacy Policy',
    menuLocation: 'footer-legal',
    menuOrder: 0,
    showInMenu: true,
    status: 'published',
    content: '<p>Add your privacy policy content in Admin → Pages (CMS).</p>',
  },
  {
    slug: 'terms-of-service',
    title: 'Terms & Conditions',
    menuLabel: 'Terms & Conditions',
    menuLocation: 'footer-legal',
    menuOrder: 1,
    showInMenu: true,
    status: 'published',
    content: '<p>Add your terms and conditions in Admin → Pages (CMS).</p>',
  },
  {
    slug: 'code-of-conduct',
    title: 'Code of Conduct',
    menuLabel: 'Code of Conduct',
    menuLocation: 'footer-legal',
    menuOrder: 2,
    showInMenu: true,
    status: 'published',
    content: '<p>Add your community code of conduct in Admin → Pages (CMS).</p>',
  },
  {
    slug: 'data-protection',
    title: 'UAE Data Protection Policy',
    menuLabel: 'UAE Data Protection Policy',
    menuLocation: 'footer-legal',
    menuOrder: 3,
    showInMenu: true,
    status: 'published',
    content: '<p>Manage this content in Admin → Pages (CMS).</p>',
  },
  {
    slug: 'community-guidelines',
    title: 'Community Guidelines',
    menuLabel: 'Community Guidelines',
    menuLocation: 'navbar',
    menuOrder: 0,
    showInMenu: true,
    status: 'published',
    headerSection: '/about',
    content: '<p>Our community standards help everyone participate respectfully.</p>',
  },
]
