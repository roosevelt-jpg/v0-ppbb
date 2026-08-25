'use client'

import React from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { canAccessAdminPath } from '@/lib/admin-invite-permissions'

const DASHBOARD_CARDS = [
  { title: 'FAQ Management', label: 'Manage FAQs', href: '/admin/faq' },
  { title: 'Forms Management', label: 'Manage Forms', href: '/admin/forms' },
  { title: 'Pages Management', label: 'Manage Pages', href: '/admin/pages' },
  { title: 'Events Management', label: 'Manage Events', href: '/admin/events' },
  { title: 'Donations', label: 'Manage Donations', href: '/admin/donations' },
  { title: 'Settings', label: 'Admin Settings', href: '/admin/cms/global-settings' },
  { title: 'Members', label: 'Manage Members', href: '/admin/members' },
  { title: 'Volunteers', label: 'Manage Volunteers', href: '/admin/volunteers' },
] as const

export default function AdminDashboard() {
  const { user } = useAuth()
  const cards = DASHBOARD_CARDS.filter((card) => canAccessAdminPath(user, card.href))

  return (
    <div className="w-full min-w-0">
      <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-neutral-900 dark:text-foreground">Admin Dashboard</h1>
      <p className="text-sm text-neutral-600 dark:text-muted-foreground mb-6 sm:mb-10">
        Welcome to the Passive Blessings admin panel
      </p>

      {cards.length === 0 ? (
        <p className="text-sm text-neutral-500 dark:text-muted-foreground">
          No dashboard shortcuts for your current permissions. Use the sidebar to open areas you can
          access.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {cards.map((card) => (
            <div
              key={card.href}
              className="bg-white dark:bg-card p-4 sm:p-6 rounded-lg border border-neutral-200 dark:border-border min-w-0"
            >
              <h3 className="text-sm font-medium text-neutral-600 dark:text-muted-foreground mb-2">{card.title}</h3>
              <p className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-foreground break-words">{card.label}</p>
              <Link
                href={card.href}
                className="inline-flex items-center mt-4 text-sm font-medium text-blue-600 hover:underline"
              >
                Go to {card.title.replace(' Management', '').replace('Admin ', '')} →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
