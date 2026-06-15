'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { FileText, Zap, X } from 'lucide-react'

export function AdminQuickMenu() {
  const [isOpen, setIsOpen] = useState(false)

  const quickLinks = [
    {
      icon: FileText,
      label: 'Pages (CMS)',
      href: '/admin/pages',
      color: '#4A90E2',
    },
    {
      icon: Zap,
      label: 'Custom Forms',
      href: '/admin/forms',
      color: '#F5A623',
    },
  ]

  return (
    <>
      {/* Floating Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 lg:bottom-8 lg:right-8 z-40 p-4 rounded-full shadow-lg transition-all hover:shadow-xl flex items-center justify-center"
        style={{
          backgroundColor: '#111111',
          color: '#f7f6f2',
          width: '56px',
          height: '56px',
        }}
        aria-label="Toggle quick menu"
        title="Quick Access Menu"
      >
        {isOpen ? (
          <X size={24} />
        ) : (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        )}
      </button>

      {/* Quick Menu Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu Panel */}
          <div
            className="fixed bottom-24 right-6 lg:bottom-28 lg:right-8 z-40 rounded-lg shadow-2xl overflow-hidden w-56"
            style={{ backgroundColor: '#ffffff', border: '1px solid #e4e1da' }}
          >
            {/* Menu Header */}
            <div
              className="px-4 py-3 border-b"
              style={{ backgroundColor: '#f7f6f2', borderColor: '#e4e1da' }}
            >
              <h3 className="text-sm font-semibold" style={{ color: '#111111' }}>
                Quick Access
              </h3>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              {quickLinks.map((link) => {
                const Icon = link.icon
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b last:border-b-0"
                    style={{ borderColor: '#e4e1da' }}
                  >
                    <div
                      className="p-2 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${link.color}20` }}
                    >
                      <Icon size={18} style={{ color: link.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium"
                        style={{ color: '#111111' }}
                      >
                        {link.label}
                      </p>
                    </div>
                    <svg
                      className="w-4 h-4 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      style={{ color: '#888888' }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                )
              })}
            </div>

            {/* Menu Footer */}
            <div
              className="px-4 py-2 text-xs text-center"
              style={{ color: '#888888', backgroundColor: '#f7f6f2' }}
            >
              Click to navigate
            </div>
          </div>
        </>
      )}
    </>
  )
}
