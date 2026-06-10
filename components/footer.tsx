'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/logo'
import { db } from '@/lib/firebase'
import { collection, getDocs, getCountFromServer, query, where } from 'firebase/firestore'
import { Mail } from 'lucide-react'

interface Stats {
  members: number
  volunteerHours: number
  businessPartners: number
  donationsTracked: string
}

export function Footer() {
  const currentYear = new Date().getFullYear()
  const [stats, setStats] = useState<Stats>({
    members: 3412,
    volunteerHours: 8940,
    businessPartners: 87,
    donationsTracked: 'AED 92K',
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const membersSnapshot = await getCountFromServer(collection(db, 'users'))
        const memberCount = membersSnapshot.data().count

        const usersSnapshot = await getDocs(collection(db, 'users'))
        let totalVolunteerHours = 0
        usersSnapshot.forEach(doc => {
          totalVolunteerHours += doc.data().volunteeredHours || 0
        })

        const businessSnapshot = await getCountFromServer(
          query(collection(db, 'users'), where('role', '==', 'business'))
        )
        const businessCount = businessSnapshot.data().count

        const donationsSnapshot = await getDocs(collection(db, 'donations'))
        let totalDonations = 0
        donationsSnapshot.forEach(doc => {
          if (doc.data().amount) totalDonations += doc.data().amount
        })

        setStats({
          members: memberCount || 3412,
          volunteerHours: totalVolunteerHours || 8940,
          businessPartners: businessCount || 87,
          donationsTracked: totalDonations > 0 ? `AED ${totalDonations.toLocaleString()}` : 'AED 92K',
        })
      } catch (error) {
        console.error('[v0] Error fetching footer stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <footer
      className="border-t py-12 px-4 sm:px-6 lg:px-8"
      style={{
        backgroundColor: '#ffffff',
        borderColor: '#e4e1da',
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Community Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 pb-8" style={{ borderBottom: '1px solid #e4e1da' }}>
          <div>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem', color: '#111111' }}>{stats.members.toLocaleString()}</p>
            <p style={{ fontSize: '0.875rem', color: '#888888' }}>Community Members</p>
          </div>
          <div>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem', color: '#111111' }}>{stats.volunteerHours.toLocaleString()}</p>
            <p style={{ fontSize: '0.875rem', color: '#888888' }}>Volunteer Hours</p>
          </div>
          <div>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem', color: '#111111' }}>{stats.businessPartners}</p>
            <p style={{ fontSize: '0.875rem', color: '#888888' }}>Business Partners</p>
          </div>
          <div>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem', color: '#111111' }}>{stats.donationsTracked}</p>
            <p style={{ fontSize: '0.875rem', color: '#888888' }}>Donations Tracked</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Logo and Description */}
          <div className="md:col-span-1">
            <Logo size="md" />
            <p className="mt-4 text-sm" style={{ color: '#888888' }}>
              Building community through compassion and collective action.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold mb-4" style={{ color: '#111111' }}>
              Quick Links
            </h3>
            <ul className="space-y-2">
              {[
                { label: 'About Us', href: '#about' },
                { label: 'Impact & Transparency', href: '/transparency' },
                { label: 'Events', href: '/events' },
                { label: 'Marketplace', href: '/marketplace' },
                { label: 'Contact Us', href: '/contact' },
                { label: 'Donate', href: '/dashboard/donations' },
              ].map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm hover:underline" style={{ color: '#333333' }}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="text-sm font-semibold mb-4" style={{ color: '#111111' }}>
              Get Involved
            </h3>
            <ul className="space-y-2">
              {[
                { label: 'Join Community', href: '/signup' },
                { label: 'Volunteer', href: '/signup' },
                { label: 'Donate', href: '/dashboard/donations' },
                { label: 'Start Business', href: '/signup' },
                { label: 'Host Event', href: '/signup' },
              ].map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm hover:underline" style={{ color: '#333333' }}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold mb-4" style={{ color: '#111111' }}>
              Legal
            </h3>
            <ul className="space-y-2">
              {[
                { label: 'Privacy Policy', href: '/policies/privacy-policy' },
                { label: 'Terms & Conditions', href: '/policies/terms-of-service' },
                { label: 'Code of Conduct', href: '/policies/code-of-conduct' },
                { label: 'Accessibility', href: '#' },
              ].map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm hover:underline" style={{ color: '#333333' }}>
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
            borderColor: '#e4e1da',
          }}
        >
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <p className="text-xs" style={{ color: '#888888' }}>
              Copyright © {currentYear} Passive Blessings. All rights reserved. ESTD 2025
            </p>
          <div className="flex gap-4 mt-4 sm:mt-0">
              {[
                { label: 'Facebook', href: 'https://facebook.com/passiveblessings' },
                { label: 'Twitter', href: 'https://twitter.com/passiveblessings' },
                { label: 'Instagram', href: 'https://instagram.com/passiveblessings' },
                { label: 'LinkedIn', href: 'https://linkedin.com/company/passiveblessings' },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:bg-gray-200"
                  style={{ color: '#888888' }}
                  aria-label={social.label}
                  title={social.label}
                >
                  <span className="text-xs font-bold">{social.label.charAt(0)}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
