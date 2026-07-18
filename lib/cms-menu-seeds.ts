import type { Page } from '@/lib/types'

export type MenuPageSeed = Omit<Page, 'id' | 'createdAt' | 'updatedAt' | 'keywords' | 'seoTitle' | 'seoDescription' | 'order' | 'description'> & {
  description?: string
  seoTitle?: string
  seoDescription?: string
  keywords?: string[]
  order?: number
}

/**
 * Canonical public footer links (FEEDBACK_P1.2).
 * Workshops are under Events — not a separate footer item.
 * Educational Resources combines recordings + learning articles on one page.
 */
export const FOOTER_PRIMARY_LINKS: ReadonlyArray<{ label: string; href: string }> = [
  { label: 'About us', href: '/about' },
  { label: 'Impact & Transparency', href: '/transparency' },
  { label: 'Events', href: '/events' },
  { label: 'Marketplace', href: '/marketplace' },
  { label: "PB's Merchandize", href: '/shop' },
  { label: 'Partners', href: '/partners' },
  { label: 'Community', href: '/communities' },
  { label: 'Donate', href: '/donate' },
  { label: 'Volunteer', href: '/forms/volunteer-unpaid-service' },
  { label: 'Charity Support Request', href: '/dashboard/charity-requests?apply=1' },
  { label: 'Educational Resources', href: '/educational-resources' },
  { label: 'FAQ', href: '/faq' },
]

/**
 * Footer links per FEEDBACK_P1.2 — single compact list (no separate Workshops tab;
 * Educational Resources combines recordings + learning articles).
 */
export const CMS_MENU_SEEDS: MenuPageSeed[] = [
  { slug: 'nav-about', title: 'About us', menuLabel: 'About us', menuLocation: 'footer-quicklinks', menuOrder: 0, showInMenu: true, status: 'published', externalHref: '/about', content: '' },
  { slug: 'nav-transparency', title: 'Impact & Transparency', menuLabel: 'Impact & Transparency', menuLocation: 'footer-quicklinks', menuOrder: 1, showInMenu: true, status: 'published', externalHref: '/transparency', content: '' },
  { slug: 'nav-events', title: 'Events', menuLabel: 'Events', menuLocation: 'footer-quicklinks', menuOrder: 2, showInMenu: true, status: 'published', externalHref: '/events', content: '' },
  { slug: 'nav-marketplace', title: 'Marketplace', menuLabel: 'Marketplace', menuLocation: 'footer-quicklinks', menuOrder: 3, showInMenu: true, status: 'published', externalHref: '/marketplace', content: '' },
  { slug: 'nav-shop', title: "PB's Merchandize", menuLabel: "PB's Merchandize", menuLocation: 'footer-quicklinks', menuOrder: 4, showInMenu: true, status: 'published', externalHref: '/shop', content: '' },
  { slug: 'nav-partners', title: 'Partners', menuLabel: 'Partners', menuLocation: 'footer-quicklinks', menuOrder: 5, showInMenu: true, status: 'published', externalHref: '/partners', content: '' },
  { slug: 'nav-community', title: 'Community', menuLabel: 'Community', menuLocation: 'footer-quicklinks', menuOrder: 6, showInMenu: true, status: 'published', externalHref: '/communities', content: '' },
  { slug: 'nav-donate', title: 'Donate', menuLabel: 'Donate', menuLocation: 'footer-quicklinks', menuOrder: 7, showInMenu: true, status: 'published', externalHref: '/donate', content: '' },
  { slug: 'nav-volunteer', title: 'Volunteer', menuLabel: 'Volunteer', menuLocation: 'footer-quicklinks', menuOrder: 8, showInMenu: true, status: 'published', externalHref: '/forms/volunteer-unpaid-service', content: '' },
  { slug: 'nav-charity-request', title: 'Charity Support Request', menuLabel: 'Charity Support Request', menuLocation: 'footer-quicklinks', menuOrder: 9, showInMenu: true, status: 'published', externalHref: '/dashboard/charity-requests?apply=1', content: '' },
  { slug: 'nav-educational', title: 'Educational Resources', menuLabel: 'Educational Resources', menuLocation: 'footer-quicklinks', menuOrder: 10, showInMenu: true, status: 'published', externalHref: '/educational-resources', content: '' },
  { slug: 'nav-faq', title: 'FAQ', menuLabel: 'FAQ', menuLocation: 'footer-quicklinks', menuOrder: 11, showInMenu: true, status: 'published', externalHref: '/faq', content: '' },
  // Legal (not shown in primary footer list; managed via Pages CMS if needed elsewhere)
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
]
