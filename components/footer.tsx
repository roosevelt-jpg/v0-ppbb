'use client'

import React from 'react'
import { Logo } from '@/components/logo'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer
      className="border-t py-12 px-4 sm:px-6 lg:px-8"
      style={{
        backgroundColor: '#ffffff',
        borderColor: '#e4e1da',
      }}
    >
      <div className="max-w-7xl mx-auto">
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
                { label: 'About Us', href: '#' },
                { label: 'Events', href: '/dashboard/events' },
                { label: 'Volunteer', href: '/dashboard/volunteering' },
                { label: 'Donate', href: '/dashboard/donations' },
                { label: 'Partnership Inquiry', href: '/dashboard/sponsor-profile' },
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
              Community
            </h3>
            <ul className="space-y-2">
              {[
                { label: 'Join Community', href: '/signup' },
                { label: 'Member Portal', href: '/dashboard' },
                { label: 'Sponsor Portal', href: '/dashboard/sponsor-dashboard' },
                { label: 'Admin Portal', href: '/admin' },
                { label: 'Marketplace', href: '/dashboard/marketplace' },
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
                { label: 'Privacy Policy', href: '#' },
                { label: 'Terms of Service', href: '#' },
                { label: 'Cookie Policy', href: '#' },
                { label: 'Accessibility', href: '#' },
              ].map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm hover:underline" style={{ color: '#333333' }}>
                    {link.label}
                  </a>
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
                  className="text-xs hover:underline"
                  style={{ color: '#888888' }}
                >
                  {social.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
