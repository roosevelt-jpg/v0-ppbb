'use client'

import React from 'react'
import Link from 'next/link'
import { Logo } from './logo'

export function Navbar() {
  const navLinks = [
    { href: '#about', label: 'About us' },
    { href: '#join', label: 'Join' },
    { href: '#events', label: 'Events' },
    { href: '#marketplace', label: 'Marketplace' },
    { href: '#contact', label: 'Contact' },
  ]

  return (
    <nav
      className="h-12 flex items-center justify-between px-6 border-b"
      style={{
        backgroundColor: '#111111',
        borderColor: '#e4e1da',
      }}
    >
      {/* Logo */}
      <div className="w-24">
        <Link href="/">
          <Logo size="sm" />
        </Link>
      </div>

      {/* Center nav links - 12px font */}
      <div className="flex items-center gap-6">
        {navLinks.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="text-xs transition hover:text-warm-white"
            style={{
              fontSize: '12px',
              color: '#888888',
            }}
          >
            {link.label}
          </a>
        ))}
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-4">
        <Link href="/login" className="text-xs font-medium transition hover:text-warm-white" style={{ color: '#888888' }}>
          Sign in
        </Link>
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
    </nav>
  )
}
