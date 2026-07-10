'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { getCmsPageHref, getCmsPageLabel } from '@/lib/cms-page-routes'
import { Page } from '@/lib/types'
import { SocialMediaLinks } from '@/components/social-media-links'
import { SiteLogo } from '@/components/site-logo'
import { BusinessFeatureLink } from '@/components/business-feature-gate'
import {
  subscribeToGlobalSettings,
  DEFAULT_GLOBAL_SETTINGS,
  type GlobalSocialLinks,
} from '@/lib/platform-config'
import { ensureMenuPagesSeeded, subscribeToMenuPages } from '@/lib/cms-menu-live'
import { useCommunityStats } from '@/hooks/use-community-stats'

interface Stats {
  members: number
  volunteerHours: number
  businessPartners: number
  donationsTracked: string
}

const BUSINESS_GATE_LABELS = new Set(['Start Business', 'Host Event', 'List Your Business', 'Post a Job'])

type MenuLink = { id: string; label: string; href: string }

function pagesToLinks(pages: Page[]): MenuLink[] {
  return pages.map((p) => ({
    id: p.id,
    label: getCmsPageLabel(p),
    href: getCmsPageHref(p),
  }))
}

export function Footer() {
  const currentYear = new Date().getFullYear()
  const liveStats = useCommunityStats()
  const stats: Stats = {
    members: liveStats.totalMembers,
    volunteerHours: liveStats.volunteerHours,
    businessPartners: liveStats.businessPartners,
    donationsTracked: liveStats.donationsTracked,
  }
  const [socialLinks, setSocialLinks] = useState<GlobalSocialLinks>(
    DEFAULT_GLOBAL_SETTINGS.socialLinks
  )
  const [footerBlurb, setFooterBlurb] = useState(DEFAULT_GLOBAL_SETTINGS.siteDescription)

  const [quickLinks, setQuickLinks] = useState<MenuLink[]>([])
  const [getInvolvedLinks, setGetInvolvedLinks] = useState<MenuLink[]>([])
  const [legalLinks, setLegalLinks] = useState<MenuLink[]>([])

  useEffect(() => {
    return subscribeToGlobalSettings((s) => {
      setSocialLinks(s.socialLinks || {})
      setFooterBlurb(s.siteDescription || DEFAULT_GLOBAL_SETTINGS.siteDescription)
    })
  }, [])

  useEffect(() => {
    void ensureMenuPagesSeeded()
    const unsubs = [
      subscribeToMenuPages('footer-quicklinks', (pages) => setQuickLinks(pagesToLinks(pages))),
      subscribeToMenuPages('footer-getinvolved', (pages) => setGetInvolvedLinks(pagesToLinks(pages))),
      subscribeToMenuPages('footer-legal', (pages) => setLegalLinks(pagesToLinks(pages))),
    ]
    return () => unsubs.forEach((u) => u())
  }, [])

  return (
    <footer
      className="border-t py-12 px-4 sm:px-6 lg:px-8"
      style={{
        backgroundColor: '#111111',
        borderColor: '#333333',
      }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 pb-8" style={{ borderBottom: '1px solid #333333' }}>
          <div>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem', color: '#ffffff' }}>
              {liveStats.loading ? '—' : stats.members.toLocaleString()}
            </p>
            <p style={{ fontSize: '0.875rem', color: '#888888' }}>Community Members</p>
          </div>
          <div>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem', color: '#ffffff' }}>
              {liveStats.loading ? '—' : stats.volunteerHours.toLocaleString()}
            </p>
            <p style={{ fontSize: '0.875rem', color: '#888888' }}>Volunteer Hours</p>
          </div>
          <div>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem', color: '#ffffff' }}>
              {liveStats.loading ? '—' : stats.businessPartners}
            </p>
            <p style={{ fontSize: '0.875rem', color: '#888888' }}>Business Partners</p>
          </div>
          <div>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem', color: '#ffffff' }}>
              {liveStats.loading ? '—' : stats.donationsTracked}
            </p>
            <p style={{ fontSize: '0.875rem', color: '#888888' }}>Donations Tracked</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-1">
            <SiteLogo background="dark" variant="footer" href="/" />
            <p className="mt-4 text-sm" style={{ color: '#888888' }}>
              {footerBlurb}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-4" style={{ color: '#ffffff' }}>
              Quick Links
            </h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.id}>
                  <Link href={link.href} className="text-sm hover:text-white transition-colors" style={{ color: '#888888' }}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-4" style={{ color: '#ffffff' }}>
              Get Involved
            </h3>
            <ul className="space-y-2">
              {getInvolvedLinks.map((link) => {
                const gate =
                  BUSINESS_GATE_LABELS.has(link.label) ||
                  link.href.includes('/join?type=business') ||
                  link.href.startsWith('/business/')
                return (
                  <li key={link.id}>
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
                      <Link href={link.href} className="text-sm hover:text-white transition-colors" style={{ color: '#888888' }}>
                        {link.label}
                      </Link>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-4" style={{ color: '#ffffff' }}>
              Legal
            </h3>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
                <li key={link.id}>
                  <Link href={link.href} className="text-sm hover:text-white transition-colors" style={{ color: '#888888' }}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t pt-8" style={{ borderColor: '#333333' }}>
          <div className="flex justify-center mb-6">
            {Object.keys(socialLinks).length > 0 ? (
              <SocialMediaLinks links={socialLinks} size="md" variant="footer" />
            ) : (
              <p className="text-xs" style={{ color: '#666666' }}>Social links not configured</p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-2 text-xs" style={{ color: '#888888' }}>
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
        </div>
      </div>
    </footer>
  )
}
