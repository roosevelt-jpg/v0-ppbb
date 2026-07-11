'use client'

import React from 'react'
import { X, MapPin, User } from 'lucide-react'
import type { PublicMemberProfile } from '@/lib/user-settings'

type MemberProfileModalProps = {
  open: boolean
  loading?: boolean
  profile: PublicMemberProfile | null
  onClose: () => void
}

export function MemberProfileModal({ open, loading, profile, onClose }: MemberProfileModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close profile"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-white rounded-xl border border-neutral-200 shadow-xl p-5 sm:p-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 p-2 rounded-lg hover:bg-neutral-100 min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {loading ? (
          <p className="text-sm text-neutral-500 py-8 text-center">Loading profile…</p>
        ) : !profile || profile.hidden ? (
          <div className="py-6 text-center space-y-2">
            <div className="mx-auto w-16 h-16 rounded-full bg-neutral-200 flex items-center justify-center">
              <User className="w-7 h-7 text-neutral-500" />
            </div>
            <h3 className="font-headline text-xl font-bold">Private member</h3>
            <p className="text-sm text-neutral-600">
              This member has restricted who can view their profile details.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {profile.profilePictureURL ? (
                <img
                  src={profile.profilePictureURL}
                  alt=""
                  className="w-16 h-16 rounded-full object-cover border border-neutral-200"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-neutral-900 text-white flex items-center justify-center text-lg font-bold">
                  {profile.displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <h3 className="font-headline text-xl font-bold break-words">{profile.displayName}</h3>
                <p className="text-xs text-neutral-500">Community member</p>
              </div>
            </div>

            {profile.location ? (
              <p className="text-sm text-neutral-700 flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                <span className="break-words">{profile.location}</span>
              </p>
            ) : null}

            {profile.bio ? (
              <div>
                <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">About</p>
                <p className="text-sm text-neutral-800 whitespace-pre-wrap break-words">{profile.bio}</p>
              </div>
            ) : (
              <p className="text-sm text-neutral-500">No bio shared.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
