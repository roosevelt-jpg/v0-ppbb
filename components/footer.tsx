'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { getPagesByMenuLocation } from '@/lib/admin'
import { Page } from '@/lib/types'
import { SocialMediaLinks } from '@/components/social-media-links'
import { SiteLogo } from '@/components/site-logo'
import { BusinessFeatureLink } from '@/components/business-feature-gate'
import {
  subscribeToGlobalSettings,
  DEFAULT_GLOBAL_SETTINGS,
  type GlobalSocialLinks,
} from '@/lib/platform-config'

interface Stats {
  members: number
  volunteerHours: number
  businessPartners: number
  donationsTracked: string
}

const BUSINESS_GATE_LABELS = new Set(['Start Business', 'Host Event', 'List Your Business', 'Post a Job'])

export function Footer() {
  const currentYear = new Date().getFullYear()
  const [stats] = useState<Stats>({
    members: 3412,
    volunteerHours: 8940,
    businessPartners: 87,
    donationsTracked: 'AED 92K',
  })
  const [socialLinks, setSocialLinks] = useState<GlobalSocialLinks>(
    DEFAULT_GLOBAL_SETTINGS.socialLinks
  )
  const [footerBlurb, setFooterBlurb] = useState(DEFAULT_GLOBAL_SETTINGS.siteDescription)

  const [quickLinks, setQuickLinks] = useState<Page[]>([])
  const [getInvolvedLinks, setGetInvolvedLinks] = useState<Page[]>([])
  const [legalLinks, setLegalLinks] = useState<Page[]>([])

  useEffect(() => {
    return subscribeToGlobalSettings((s) => {
      setSocialLinks(s.socialLinks || {})
      setFooterBlurb(s.siteDescription || DEFAULT_GLOBAL_SETTINGS.siteDescription)
    })
  }, [])

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const [quickLinksPages, getInvolvedPages, legalPages] = await Promise.all([
          getPagesByMenuLocation('footer-quicklinks'),
          getPagesByMenuLocation('footer-getinvolved'),
          getPagesByMenuLocation('footer-legal'),
        ])
        setQuickLinks(quickLinksPages)
        setGetInvolvedLinks(getInvolvedPages)
        setLegalLinks(legalPages)
      } catch {
        // Permission errors expected for some users — defaults remain
      }
    }
    void fetchMenus()
  }, [])

  // Default links if no pages configured
  const defaultQuickLinks = [
    { label: 'About Us', href: '/about' },
    { label: 'Impact & Transparency', href: '/transparency' },
    { label: 'Events', href: '/events' },
    { label: 'Marketplace', href: '/marketplace' },
    { label: 'Shop', href: '/shop' },
    { label: 'Partners', href: '/partners' },
    { label: 'Contact', href: '/contact' },
    { label: 'Charity Support Request', href: '/dashboard/charity-requests?apply=1' },
    { label: 'FAQ', href: '/faq' },
  ]

  const defaultGetInvolved = [
    { label: 'Join Community', href: '/signup' },
    { label: 'Volunteer', href: '/signup' },
    { label: 'Workshops', href: '/workshops' },
    { label: 'Recordings', href: '/recordings' },
    { label: 'Donate', href: '/donate' },
    { label: 'Start Business', href: '/join?type=business' },
    { label: 'Host Event', href: '/business/events/new' },
  ]

  const defaultLegal = [
    { label: 'Privacy Policy', href: '/policies/privacy-policy' },
    { label: 'Terms & Conditions', href: '/policies/terms-of-service' },
    { label: 'Code of Conduct', href: '/policies/code-of-conduct' },
    { label: 'UAE Data Protection Policy', href: '/legal/data-protection' },
    { label: 'Accessibility', href: '#' },
  ]

  // Use Firestore pages if available, otherwise use defaults
  const quickLinksToDisplay = quickLinks.length > 0 
    ? quickLinks.map(p => ({ label: p.menuLabel || p.title, href: `/${p.slug}` }))
    : defaultQuickLinks

  const getInvolvedToDisplay = getInvolvedLinks.length > 0
    ? getInvolvedLinks.map(p => ({ label: p.menuLabel || p.title, href: `/${p.slug}` }))
    : defaultGetInvolved

  const legalToDisplay = legalLinks.length > 0
    ? legalLinks.map(p => ({ label: p.menuLabel || p.title, href: `/${p.slug}` }))
    : defaultLegal

  return (
    <footer
      className="border-t py-12 px-4 sm:px-6 lg:px-8"
      style={{
        backgroundColor: '#111111',
        borderColor: '#333333',
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Community Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 pb-8" style={{ borderBottom: '1px solid #333333' }}>
          <div>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem', color: '#ffffff' }}>{stats.members.toLocaleString()}</p>
            <p style={{ fontSize: '0.875rem', color: '#888888' }}>Community Members</p>
          </div>
          <div>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem', color: '#ffffff' }}>{stats.volunteerHours.toLocaleString()}</p>
            <p style={{ fontSize: '0.875rem', color: '#888888' }}>Volunteer Hours</p>
          </div>
          <div>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem', color: '#ffffff' }}>{stats.businessPartners}</p>
            <p style={{ fontSize: '0.875rem', color: '#888888' }}>Business Partners</p>
          </div>
          <div>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem', color: '#ffffff' }}>{stats.donationsTracked}</p>
            <p style={{ fontSize: '0.875rem', color: '#888888' }}>Donations Tracked</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Logo and Description */}
          <div className="md:col-span-1">
            <SiteLogo background="dark" href="/" heightClass="h-auto" maxWidth={140} />
            <p className="mt-4 text-sm" style={{ color: '#888888' }}>
              {footerBlurb}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold mb-4" style={{ color: '#ffffff' }}>
              Quick Links
            </h3>
            <ul className="space-y-2">
              {quickLinksToDisplay.map((link, idx) => (
                <li key={`${link.href}-${idx}`}>
                  <Link href={link.href} className="text-sm hover:text-white transition-colors" style={{ color: '#888888' }}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Get Involved */}
          <div>
            <h3 className="text-sm font-semibold mb-4" style={{ color: '#ffffff' }}>
              Get Involved
            </h3>
            <ul className="space-y-2">
              {getInvolvedToDisplay.map((link, idx) => {
                const gate =
                  BUSINESS_GATE_LABELS.has(link.label) ||
                  link.href.includes('/join?type=business') ||
                  link.href.startsWith('/business/')
                return (
                  <li key={`${link.href}-${idx}`}>
                    {gate ? (
                      <BusinessFeatureLink
                        featureLabel={link.label}
                        href={link.href}
                        className="text-sm hover:text-white transition-colors text-left"
                        style={{ color: '#888888' }}
                      >
                        {link.label}
                      </BusinessFeatureLink>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm hover:text-white transition-colors"
                        style={{ color: '#888888' }}
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold mb-4" style={{ color: '#ffffff' }}>
              Legal
            </h3>
            <ul className="space-y-2">
              {legalToDisplay.map((link, idx) => (
                <li key={`${link.href}-${idx}`}>
                  <Link href={link.href} className="text-sm hover:text-white transition-colors" style={{ color: '#888888' }}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

          {/* Bottom Section */}
          <div
            className="border-t pt-8"
            style={{
              borderColor: '#333333',
            }}
          >
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
              <div className="text-xs flex flex-col sm:flex-row items-center gap-2" style={{ color: '#888888' }}>
                <p>Copyright © {currentYear} Passive Blessings. All rights reserved. ESTD 2025</p>
                <span className="hidden sm:inline">·</span>
                <p>
                  Made with ❤️ by{' '}
                  <Link 
                    href="https://myflynai.com" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors font-light text-[10px] sm:text-xs opacity-60"
                    style={{ color: '#999999' }}
                  >
                    FLYN.AI
                  </Link>
                </p>
              </div>
              <div className="flex gap-3">
                {Object.keys(socialLinks).length > 0 ? (
                  <SocialMediaLinks links={socialLinks} size="md" />
                ) : (
                  <p className="text-xs" style={{ color: '#666666' }}>Social links not configured</p>
                )}
              </div>
            </div>
          </div>
      </div>
    </footer>
  )
}
