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
    <nav className="w-full bg-white border-b" style={{ borderColor: '#e4e1da' }}>
      {/* Desktop Navigation */}
      <div className="hidden md:block px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 lg:gap-8">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/">
              <Logo size="sm" />
            </Link>
          </div>

          {/* Center Menu Items */}
          <div className="flex-1 flex items-center justify-center gap-0 lg:gap-2">
            {navItems.map((item) => (
              <div
                key={item.label}
                className="relative group"
                onMouseEnter={() => setOpenDropdown(item.label)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <button
                  className="px-2 sm:px-3 lg:px-4 py-2 text-xs sm:text-sm font-medium rounded transition flex items-center gap-1 whitespace-nowrap"
                  style={{
                    color: '#888888',
                    backgroundColor: openDropdown === item.label ? '#f7f6f2' : 'transparent',
                  }}
                  onMouseEnter={() => setOpenDropdown(item.label)}
                >
                  {item.label}
                  <ChevronDown size={14} className={`transition-transform ${openDropdown === item.label ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {openDropdown === item.label && (
                  <div
                    className="absolute left-0 mt-0 pt-1 min-w-max rounded-lg shadow-lg z-50"
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
                        className="block px-4 py-2.5 text-xs sm:text-sm transition hover:bg-white first:rounded-t-lg last:rounded-b-lg"
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
          <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
            {/* LOGIN / DASHBOARD Dropdown */}
            <div
              className="relative group"
              onMouseEnter={() => setOpenDropdown('LOGIN')}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <button
                className="px-2 sm:px-3 lg:px-4 py-2 text-xs sm:text-sm font-medium rounded transition flex items-center gap-1 whitespace-nowrap"
                style={{
                  color: '#888888',
                  backgroundColor: openDropdown === 'LOGIN' ? '#f7f6f2' : 'transparent',
                }}
                onMouseEnter={() => setOpenDropdown('LOGIN')}
              >
                Account
                <ChevronDown size={14} className={`transition-transform ${openDropdown === 'LOGIN' ? 'rotate-180' : ''}`} />
              </button>

              {/* Login Dropdown Menu */}
              {openDropdown === 'LOGIN' && (
                <div
                  className="absolute right-0 mt-0 pt-1 min-w-max rounded-lg shadow-lg z-50"
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
                    className="block px-4 py-2.5 text-xs sm:text-sm transition hover:bg-white rounded-t-lg"
                    style={{
                      color: '#333333',
                    }}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/dashboard"
                    className="block px-4 py-2.5 text-xs sm:text-sm transition hover:bg-white"
                    style={{
                      color: '#333333',
                    }}
                  >
                    Member Portal
                  </Link>
                  <Link
                    href="/dashboard/sponsor-dashboard"
                    className="block px-4 py-2.5 text-xs sm:text-sm transition hover:bg-white"
                    style={{
                      color: '#333333',
                    }}
                  >
                    Sponsor Portal
                  </Link>
                  <Link
                    href="/admin"
                    className="block px-4 py-2.5 text-xs sm:text-sm transition hover:bg-white rounded-b-lg"
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
              className="px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-lg transition hover:shadow-md whitespace-nowrap"
              style={{
                backgroundColor: '#111111',
                color: '#ffffff',
              }}
            >
              Join Now
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden px-4 py-3 flex items-center justify-between">
        <Link href="/">
          <Logo size="sm" />
        </Link>
        <button
          className="p-2 -mr-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{ color: '#111111' }}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div
          className="md:hidden max-h-[calc(100vh-64px)] overflow-y-auto border-t"
          style={{
            backgroundColor: '#ffffff',
            borderColor: '#e4e1da',
          }}
        >
          {navItems.map((item) => (
            <div key={item.label}>
              <button
                className="w-full text-left px-4 py-3 text-sm font-medium flex items-center justify-between border-b transition hover:bg-gray-50"
                style={{
                  color: '#111111',
                  borderColor: '#e4e1da',
                }}
                onClick={() => setOpenDropdown(openDropdown === item.label ? null : item.label)}
              >
                {item.label}
                <ChevronDown
                  size={18}
                  className={`transition-transform flex-shrink-0 ${openDropdown === item.label ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Mobile Dropdown */}
              {openDropdown === item.label && (
                <div style={{ backgroundColor: '#f7f6f2' }}>
                  {item.items.map((subItem) => (
                    <Link
                      key={subItem.href}
                      href={subItem.href}
                      className="block px-8 py-2.5 text-sm transition hover:bg-white border-b"
                      style={{
                        color: '#333333',
                        borderColor: '#e4e1da',
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
          <div style={{ borderTop: '1px solid #e4e1da' }}>
            <Link
              href="/login"
              className="block w-full px-4 py-3 text-sm font-medium border-b text-center transition hover:bg-gray-50"
              style={{
                color: '#111111',
                borderColor: '#e4e1da',
              }}
              onClick={() => setMobileMenuOpen(false)}
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="block w-full px-4 py-3 text-sm font-semibold text-center transition hover:shadow-md"
              style={{
                backgroundColor: '#111111',
                color: '#ffffff',
              }}
              onClick={() => setMobileMenuOpen(false)}
            >
              Join Now
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
