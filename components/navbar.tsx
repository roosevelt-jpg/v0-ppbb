'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Logo } from './logo'
import { ChevronDown, Menu, X } from 'lucide-react'

export function Navbar() {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    {
      label: 'HOME',
      items: [
        { label: 'Overview', href: '/' },
        { label: 'Impact', href: '/#impact' },
        { label: 'Events', href: '/dashboard/events' },
      ],
    },
    {
      label: 'ABOUT US',
      items: [
        { label: 'Story', href: '/about' },
        { label: 'Leadership', href: '/leadership' },
        { label: 'Partnerships', href: '/partnerships' },
        { label: 'Transparency', href: '/transparency' },
      ],
    },
    {
      label: 'COMMUNITY',
      items: [
        { label: 'Events', href: '/dashboard/events' },
        { label: 'Volunteer', href: '/dashboard/volunteering' },
        { label: 'Membership', href: '/dashboard/membership' },
      ],
    },
    {
      label: 'CHARITY & WELFARE',
      items: [
        { label: 'Donate', href: '/dashboard/donations' },
        { label: 'Active Causes', href: '/#causes' },
        { label: 'Request Support', href: '/dashboard/charity-requests' },
      ],
    },
    {
      label: 'MARKETPLACE',
      items: [
        { label: 'Business Directory', href: '/dashboard/community' },
        { label: 'Jobs', href: '/dashboard/community' },
        { label: 'Opportunities', href: '/dashboard/community' },
        { label: 'Discounts', href: '/dashboard/sponsor-profile' },
      ],
    },
    {
      label: 'RESOURCES',
      items: [
        { label: 'Programs', href: '/dashboard/learning' },
        { label: 'Workshops', href: '/dashboard/learning' },
        { label: 'Recordings', href: '/dashboard/learning' },
      ],
    },
    {
      label: 'PARTNERS & SPONSORS',
      items: [
        { label: 'Sponsorship Packages', href: '/dashboard/sponsor-profile' },
        { label: 'Partnership Requests', href: '/dashboard/sponsor-profile' },
        { label: 'Media Kit', href: '/media-kit' },
      ],
    },
    {
      label: 'SHOP',
      items: [
        { label: 'Merchandise', href: '/dashboard/marketplace' },
        { label: 'Donations Through Purchases', href: '/dashboard/marketplace' },
      ],
    },
  ]

  return (
    <nav
      className="relative h-12 flex items-center justify-between px-6 border-b"
      style={{
        backgroundColor: '#111111',
        borderColor: '#e4e1da',
      }}
    >
      {/* Logo */}
      <div className="w-24 flex-shrink-0">
        <Link href="/">
          <Logo size="sm" />
        </Link>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
        {navItems.map((item) => (
          <div
            key={item.label}
            className="relative group"
            onMouseEnter={() => setOpenDropdown(item.label)}
            onMouseLeave={() => setOpenDropdown(null)}
          >
            <button
              className="px-3 py-2 text-xs font-medium rounded transition flex items-center gap-1"
              style={{
                color: '#888888',
              }}
              onMouseEnter={() => setOpenDropdown(item.label)}
            >
              {item.label}
              <ChevronDown size={12} className="mt-0.5" />
            </button>

            {/* Dropdown Menu */}
            {openDropdown === item.label && (
              <div
                className="absolute left-0 mt-0 pt-1 w-48 rounded-lg shadow-lg z-50"
                style={{
                  backgroundColor: '#f7f6f2',
                  borderColor: '#e4e1da',
                  border: '1px solid',
                }}
                onMouseEnter={() => setOpenDropdown(item.label)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                {item.items.map((subItem) => (
                  <Link
                    key={subItem.href}
                    href={subItem.href}
                    className="block px-4 py-2 text-xs transition hover:bg-gray-200 first:rounded-t-lg last:rounded-b-lg"
                    style={{
                      color: '#333333',
                    }}
                  >
                    {subItem.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Right side actions */}
      <div className="hidden md:flex items-center gap-4 flex-shrink-0">
        {/* LOGIN / DASHBOARD Dropdown */}
        <div
          className="relative group"
          onMouseEnter={() => setOpenDropdown('LOGIN')}
          onMouseLeave={() => setOpenDropdown(null)}
        >
          <button
            className="px-3 py-2 text-xs font-medium rounded transition flex items-center gap-1"
            style={{
              color: '#888888',
            }}
            onMouseEnter={() => setOpenDropdown('LOGIN')}
          >
            LOGIN / DASHBOARD
            <ChevronDown size={12} className="mt-0.5" />
          </button>

          {/* Login Dropdown Menu */}
          {openDropdown === 'LOGIN' && (
            <div
              className="absolute right-0 mt-0 pt-1 w-48 rounded-lg shadow-lg z-50"
              style={{
                backgroundColor: '#f7f6f2',
                borderColor: '#e4e1da',
                border: '1px solid',
              }}
              onMouseEnter={() => setOpenDropdown('LOGIN')}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <Link
                href="/login"
                className="block px-4 py-2 text-xs transition hover:bg-gray-200 rounded-t-lg"
                style={{
                  color: '#333333',
                }}
              >
                Sign In
              </Link>
              <Link
                href="/dashboard"
                className="block px-4 py-2 text-xs transition hover:bg-gray-200"
                style={{
                  color: '#333333',
                }}
              >
                Member Portal
              </Link>
              <Link
                href="/dashboard/sponsor-dashboard"
                className="block px-4 py-2 text-xs transition hover:bg-gray-200"
                style={{
                  color: '#333333',
                }}
              >
                Sponsor Portal
              </Link>
              <Link
                href="/admin"
                className="block px-4 py-2 text-xs transition hover:bg-gray-200 rounded-b-lg"
                style={{
                  color: '#333333',
                }}
              >
                Admin Portal
              </Link>
            </div>
          )}
        </div>

        <Link
          href="/signup"
          className="px-3 py-1 text-xs font-medium rounded-lg transition"
          style={{
            backgroundColor: '#f7f6f2',
            color: '#111111',
          }}
        >
          Join now
        </Link>
      </div>

      {/* Mobile Menu Button */}
      <button
        className="md:hidden flex-shrink-0"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        style={{ color: '#888888' }}
      >
        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div
          className="absolute top-12 left-0 right-0 z-50 max-h-[calc(100vh-48px)] overflow-y-auto rounded-b-lg shadow-lg"
          style={{
            backgroundColor: '#111111',
            borderColor: '#e4e1da',
            borderTop: '1px solid #e4e1da',
          }}
        >
          {navItems.map((item) => (
            <div key={item.label}>
              <button
                className="w-full text-left px-6 py-3 text-xs font-medium flex items-center justify-between border-b"
                style={{
                  color: '#888888',
                  borderColor: '#e4e1da',
                }}
                onClick={() => setOpenDropdown(openDropdown === item.label ? null : item.label)}
              >
                {item.label}
                <ChevronDown
                  size={14}
                  className={`transition transform ${openDropdown === item.label ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Mobile Dropdown */}
              {openDropdown === item.label && (
                <div
                  style={{
                    backgroundColor: '#222222',
                  }}
                >
                  {item.items.map((subItem) => (
                    <Link
                      key={subItem.href}
                      href={subItem.href}
                      className="block px-8 py-2 text-xs border-b"
                      style={{
                        color: '#888888',
                        borderColor: '#333333',
                      }}
                      onClick={() => {
                        setMobileMenuOpen(false)
                        setOpenDropdown(null)
                      }}
                    >
                      {subItem.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Mobile Login Section */}
          <div
            className="border-t"
            style={{
              borderColor: '#e4e1da',
            }}
          >
            <Link
              href="/login"
              className="block w-full px-6 py-3 text-xs font-medium border-b"
              style={{
                color: '#888888',
                borderColor: '#e4e1da',
              }}
              onClick={() => setMobileMenuOpen(false)}
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="block w-full px-6 py-3 text-xs font-medium"
              style={{
                backgroundColor: '#f7f6f2',
                color: '#111111',
              }}
              onClick={() => setMobileMenuOpen(false)}
            >
              Join now
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
