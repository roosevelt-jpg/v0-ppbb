'use client'

import React from 'react'
import Link from 'next/link'
import { UserAvatar } from '@/components/user-avatar'
import { AdminDetailModal } from '@/components/admin-detail-modal'
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
      data-dashboard-control
      onClick={onClick}
      className={`inline-flex items-center justify-center font-medium transition-colors whitespace-nowrap ${
        compact
          ? 'min-h-[32px] px-2 py-1 text-xs bg-white text-black border border-neutral-300 rounded hover:bg-neutral-50'
          : 'min-h-[36px] px-2.5 py-1 text-xs sm:text-sm bg-white text-black border border-neutral-300 rounded hover:bg-neutral-50'
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
    <AdminDetailModal
      open={open}
      onClose={onClose}
      title={profile.name}
      titleId="admin-profile-title"
      footer={
        <>
          <button
            type="button"
            data-dashboard-control
            onClick={onClose}
            className={`${BUTTON_SECONDARY} w-full sm:w-auto min-h-[32px] px-3 py-1 text-xs sm:text-sm`}
          >
            Close
          </button>
          {showRouteEdit && (
            <Link
              href={profile.editHref!}
              onClick={onClose}
              data-dashboard-control
              className={`${BUTTON_PRIMARY} w-full sm:w-auto min-h-[32px] px-3 py-1 text-xs sm:text-sm text-center`}
            >
              {editLabel}
            </Link>
          )}
          {showCallbackEdit && !showRouteEdit && (
            <button
              type="button"
              data-dashboard-control
              onClick={() => {
                onClose()
                onEdit?.()
              }}
              className={`${BUTTON_PRIMARY} w-full sm:w-auto min-h-[32px] px-3 py-1 text-xs sm:text-sm`}
            >
              {editLabel}
            </button>
          )}
        </>
      }
    >
      <div className="flex flex-col items-center text-center mb-3">
        <UserAvatar
          user={{
            firstName: profile.name,
            profilePictureURL: profile.profilePictureURL || undefined,
          }}
          name={profile.name}
          imageUrl={profile.profilePictureURL}
          size="sm"
          className="mb-2"
        />
        <div className="flex flex-wrap items-center justify-center gap-1">
          <span className="inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-900 text-white capitalize">
            {profile.roleLabel}
          </span>
          <span
            className={`inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-semibold capitalize ${statusBadgeClass(profile.status)}`}
          >
            {profile.status || 'active'}
          </span>
        </div>
      </div>

      <dl className="grid grid-cols-1 gap-y-2.5 text-xs sm:text-sm mb-3">
        <div className="min-w-0">
          <dt className="text-[10px] uppercase tracking-wider text-neutral-500 mb-0.5">Email</dt>
          <dd className="text-neutral-900 break-all">{profile.email || '—'}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-[10px] uppercase tracking-wider text-neutral-500 mb-0.5">Phone</dt>
          <dd className="text-neutral-900">{profile.phone || '—'}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-[10px] uppercase tracking-wider text-neutral-500 mb-0.5">Location</dt>
          <dd className="text-neutral-900">{profile.location || '—'}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-[10px] uppercase tracking-wider text-neutral-500 mb-0.5">Joined</dt>
          <dd className="text-neutral-900">{formatJoined(profile.joinedAt)}</dd>
        </div>
      </dl>

      {profile.stats && profile.stats.length > 0 && (
        <div className="rounded-md border border-neutral-200 bg-neutral-50 p-2.5">
          <h3 className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1.5 font-semibold">
            Role-specific details
          </h3>
          <dl className="space-y-1">
            {profile.stats.map((stat) => (
              <div key={stat.label} className="flex justify-between gap-2 text-xs">
                <dt className="text-neutral-600">{stat.label}</dt>
                <dd className="font-medium text-neutral-900 text-right break-words">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </AdminDetailModal>
  )
}
