'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { db } from '@/lib/firebase'
import { collection, getDocs } from 'firebase/firestore'
import { getPagesByMenuLocation } from '@/lib/admin'
import { Mail, Heart, Share2, Link as LinkIcon, MessageSquare } from 'lucide-react'
import { Page } from '@/lib/types'

interface Stats {
  members: number
  volunteerHours: number
  businessPartners: number
  donationsTracked: string
}

interface SocialLinks {
  facebook?: string
  twitter?: string
  instagram?: string
  linkedin?: string
}

export function Footer() {
  const currentYear = new Date().getFullYear()
  const [stats, setStats] = useState<Stats>({
    members: 3412,
    volunteerHours: 8940,
    businessPartners: 87,
    donationsTracked: 'AED 92K',
  })
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({})
  
  const [quickLinks, setQuickLinks] = useState<Page[]>([])
  const [getInvolvedLinks, setGetInvolvedLinks] = useState<Page[]>([])
  const [legalLinks, setLegalLinks] = useState<Page[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch social links from settings
        const settingsSnapshot = await getDocs(collection(db, 'settings'))
        settingsSnapshot.forEach(doc => {
          if (doc.data().socialLinks) {
            setSocialLinks(doc.data().socialLinks)
          }
        })

        // Fetch menu pages by location
        const [quickLinksPages, getInvolvedPages, legalPages] = await Promise.all([
          getPagesByMenuLocation('footer-quicklinks'),
          getPagesByMenuLocation('footer-getinvolved'),
          getPagesByMenuLocation('footer-legal'),
        ])

        setQuickLinks(quickLinksPages)
        setGetInvolvedLinks(getInvolvedPages)
        setLegalLinks(legalPages)
      } catch (error) {
        // Silently fail - use default links
        // Permission errors are expected for unauthenticated users
      }
    }

    fetchData()
  }, [])

  // Default links if no pages configured
  const defaultQuickLinks = [
    { label: 'About Us', href: '/about' },
    { label: 'Impact & Transparency', href: '/transparency' },
    { label: 'Events', href: '/events' },
    { label: 'Marketplace', href: '/marketplace' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'Charity Support Request', href: '/dashboard/charity-requests' },
    { label: 'FAQ', href: '/faq' },
  ]

  const defaultGetInvolved = [
    { label: 'Join Community', href: '/signup' },
    { label: 'Volunteer', href: '/signup' },
    { label: 'Workshops', href: '/workshops' },
    { label: 'Recordings', href: '/recordings' },
    { label: 'Donate', href: '/donate' },
    { label: 'Start Business', href: '/signup' },
    { label: 'Host Event', href: '/signup' },
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
            <img 
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/PB%20ORIGINAL%20LOGO%20%5Bwhite%5D-1IbVvpWYxxNsdvH8MfdFG37gnBEPOv.png" 
              alt="Passive Blessings" 
              style={{ width: '140px', height: 'auto' }}
            />
            <p className="mt-4 text-sm" style={{ color: '#888888' }}>
              Building community through compassion and collective action.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold mb-4" style={{ color: '#ffffff' }}>
              Quick Links
            </h3>
            <ul className="space-y-2">
              {quickLinksToDisplay.map((link) => (
                <li key={link.href}>
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
              {getInvolvedToDisplay.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm hover:text-white transition-colors" style={{ color: '#888888' }}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold mb-4" style={{ color: '#ffffff' }}>
              Legal
            </h3>
            <ul className="space-y-2">
              {legalToDisplay.map((link) => (
                <li key={link.href}>
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
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="text-xs flex flex-col sm:flex-row items-center gap-2" style={{ color: '#888888' }}>
              <p>Copyright © {currentYear} Passive Blessings. All rights reserved. ESTD 2025</p>
              <span className="hidden sm:inline">·</span>
              <p>
                Made with Love by{' '}
                <Link 
                  href="https://myflynai.com" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors font-semibold"
                  style={{ color: '#ffffff' }}
                >
                  MYFLYN
                </Link>
              </p>
            </div>
            <div className="flex gap-4 mt-4 sm:mt-0">
              {[
                { label: 'Facebook', key: 'facebook', icon: Heart },
                { label: 'Twitter', key: 'twitter', icon: MessageSquare },
                { label: 'Instagram', key: 'instagram', icon: Share2 },
                { label: 'LinkedIn', key: 'linkedin', icon: LinkIcon },
              ].map((social) => {
                const href = socialLinks[social.key as keyof SocialLinks]
                const Icon = social.icon
                return (
                  <a
                    key={social.label}
                    href={href || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:bg-gray-700"
                    style={{ color: '#ffffff' }}
                    aria-label={social.label}
                    title={social.label}
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
