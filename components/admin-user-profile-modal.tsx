'use client'

import React from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'
import { UserAvatar } from '@/components/user-avatar'
import { BUTTON_PRIMARY, BUTTON_SECONDARY } from '@/lib/admin-design-system'
import type { AdminProfileViewData } from '@/lib/admin-profile-view'

interface AdminUserProfileModalProps {
  open: boolean
  onClose: () => void
  profile: AdminProfileViewData | null
  /** When edit is in-page (e.g. sponsors modal) instead of a route */
  onEdit?: () => void
  editLabel?: string
}

function formatJoined(value: AdminProfileViewData['joinedAt']): string {
  if (!value) return '—'
  if (value instanceof Date) return value.toLocaleDateString()
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate().toLocaleDateString()
  }
  const parsed = new Date(String(value))
  return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleDateString()
}

function statusBadgeClass(status?: string): string {
  const s = (status || 'active').toLowerCase()
  if (s === 'active' || s === 'approved') return 'bg-green-100 text-green-800'
  if (s === 'pending' || s === 'pending_approval') return 'bg-amber-100 text-amber-800'
  if (s === 'suspended' || s === 'inactive') return 'bg-red-100 text-red-800'
  return 'bg-neutral-100 text-neutral-800'
}

export function AdminViewProfileButton({
  onClick,
  compact = false,
}: {
  onClick: () => void
  compact?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center font-medium transition-colors whitespace-nowrap ${
        compact
          ? 'min-h-[36px] px-2.5 py-1 text-xs bg-white text-black border border-neutral-300 rounded hover:bg-neutral-50'
          : 'min-h-[44px] px-3 py-2 text-sm bg-white text-black border border-neutral-300 rounded hover:bg-neutral-50'
      }`}
    >
      View Profile
    </button>
  )
}

export function AdminUserProfileModal({
  open,
  onClose,
  profile,
  onEdit,
  editLabel = 'Edit user',
}: AdminUserProfileModalProps) {
  if (!open || !profile) return null

  const showRouteEdit = Boolean(profile.editHref)
  const showCallbackEdit = Boolean(onEdit)

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close profile"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-profile-title"
        className="relative bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full max-w-lg max-h-[92vh] overflow-y-auto"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg hover:bg-neutral-100 z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-neutral-700" />
        </button>

        <div className="p-5 sm:p-6 pt-8 sm:pt-6">
          <div className="flex flex-col items-center text-center mb-6">
            <UserAvatar
              user={{
                firstName: profile.name,
                profilePictureURL: profile.profilePictureURL || undefined,
              }}
              name={profile.name}
              imageUrl={profile.profilePictureURL}
              size="xl"
              className="mb-4"
            />
            <h2
              id="admin-profile-title"
              className="font-headline text-2xl sm:text-3xl font-bold text-neutral-900 break-words max-w-full"
            >
              {profile.name}
            </h2>
            <span className="mt-2 inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-neutral-900 text-white capitalize">
              {profile.roleLabel}
            </span>
            <span
              className={`mt-2 inline-flex px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusBadgeClass(profile.status)}`}
            >
              {profile.status || 'active'}
            </span>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm mb-6">
            <div className="min-w-0">
              <dt className="text-xs uppercase tracking-wider text-neutral-500 mb-1">Email</dt>
              <dd className="text-neutral-900 break-all">{profile.email || '—'}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs uppercase tracking-wider text-neutral-500 mb-1">Phone</dt>
              <dd className="text-neutral-900">{profile.phone || '—'}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs uppercase tracking-wider text-neutral-500 mb-1">Location</dt>
              <dd className="text-neutral-900">{profile.location || '—'}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs uppercase tracking-wider text-neutral-500 mb-1">Joined</dt>
              <dd className="text-neutral-900">{formatJoined(profile.joinedAt)}</dd>
            </div>
          </dl>

          {profile.stats && profile.stats.length > 0 && (
            <div className="mb-6 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
              <h3 className="text-xs uppercase tracking-wider text-neutral-500 mb-3 font-semibold">
                Role-specific details
              </h3>
              <dl className="space-y-2">
                {profile.stats.map((stat) => (
                  <div key={stat.label} className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
                    <dt className="text-neutral-600">{stat.label}</dt>
                    <dd className="font-medium text-neutral-900 sm:text-right break-words">{stat.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2 border-t border-neutral-200">
            <button type="button" onClick={onClose} className={`${BUTTON_SECONDARY} w-full sm:w-auto min-h-[44px]`}>
              Close
            </button>
            {showRouteEdit && (
              <Link
                href={profile.editHref!}
                onClick={onClose}
                className={`${BUTTON_PRIMARY} w-full sm:w-auto min-h-[44px] text-center`}
              >
                {editLabel}
              </Link>
            )}
            {showCallbackEdit && !showRouteEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onEdit?.()
                }}
                className={`${BUTTON_PRIMARY} w-full sm:w-auto min-h-[44px]`}
              >
                {editLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
