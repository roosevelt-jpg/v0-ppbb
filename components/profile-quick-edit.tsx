'use client'

import React, { useEffect, useState } from 'react'
import { Upload, Loader2, ChevronDown } from 'lucide-react'
import { Dialog } from '@/components/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UserAvatar } from '@/components/user-avatar'
import { useAuth } from '@/lib/auth-context'
import { auth } from '@/lib/firebase'
import { adminApiFetch } from '@/lib/admin-api-client'
import {
  getUserDisplayName,
  getUserProfilePictureURL,
} from '@/lib/user-profile'
import { uploadImageToFirebase } from '@/lib/upload-utils'
import { useAdminAudit } from '@/lib/use-admin-audit'

interface ProfileQuickEditProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProfileQuickEdit({ open, onOpenChange }: ProfileQuickEditProps) {
  const { user, firebaseUser, refreshUser } = useAuth()
  const audit = useAdminAudit()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [pictureURL, setPictureURL] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (!open || !user) return
    setFullName(getUserDisplayName(user))
    setEmail(user.email || firebaseUser?.email || '')
    setPhone(user.phone || '')
    setPictureURL(getUserProfilePictureURL(user) || '')
    setMessage(null)
  }, [open, user, firebaseUser])

  const persistProfile = async (overrides?: {
    fullName?: string
    email?: string
    phone?: string
    profilePictureURL?: string
  }) => {
    const payload = {
      fullName: (overrides?.fullName ?? fullName).trim(),
      email: (overrides?.email ?? email).trim(),
      phone: (overrides?.phone ?? phone).trim(),
      profilePictureURL: (overrides?.profilePictureURL ?? pictureURL).trim(),
    }

    const result = await adminApiFetch<{
      firstName: string
      lastName: string
      name: string
      displayName: string
      email: string
      phone: string
      profilePictureURL: string | null
      avatarUrl: string | null
    }>('/api/account/profile', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })

    if (!result.success) {
      throw new Error(result.error || 'Failed to save profile')
    }

    // Refresh auth token so Auth claims/email stay in sync client-side
    if (auth.currentUser) {
      await auth.currentUser.reload()
      await auth.currentUser.getIdToken(true)
    }
    await refreshUser()
    return result
  }

  const handlePhotoUpload = async (file: File) => {
    if (!firebaseUser) return
    setUploading(true)
    setMessage(null)
    try {
      const url = await uploadImageToFirebase(file, `users/${firebaseUser.uid}/profile`, {
        preset: 'content',
        maxDimension: 512,
      })
      setPictureURL(url)
      await persistProfile({ profilePictureURL: url })
      setMessage({ type: 'success', text: 'Photo updated.' })
      audit({
        actionType: 'update',
        action: 'Updated admin profile photo',
        entityType: 'admin',
        entityId: firebaseUser.uid,
        entityName: fullName.trim() || getUserDisplayName(user),
        status: 'success',
      })
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Photo upload failed',
      })
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    if (!firebaseUser || !user) return
    setSaving(true)
    setMessage(null)

    try {
      if (!fullName.trim()) throw new Error('Name is required')
      if (!email.trim()) throw new Error('Email is required')

      await persistProfile()

      audit({
        actionType: 'update',
        action: 'Updated admin profile',
        entityType: 'admin',
        entityId: firebaseUser.uid,
        entityName: fullName.trim(),
        status: 'success',
      })

      setMessage({ type: 'success', text: 'Profile updated.' })
      setTimeout(() => onOpenChange(false), 500)
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save profile',
      })
    } finally {
      setSaving(false)
    }
  }

  if (!user) return null

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit profile"
      description="Update your account details. Changes sync across the platform instantly."
      maxWidth="400px"
      footer={
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto bg-white text-black border border-gray-300 hover:bg-gray-50 min-h-[44px] font-body"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || uploading}
            className="w-full sm:w-auto bg-black text-white hover:bg-gray-800 min-h-[44px] font-body"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      }
    >
      <div className="space-y-5 font-body">
        {message && (
          <p
            className={`text-sm rounded-lg px-3 py-2 ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </p>
        )}

        <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
          <p className="font-medium text-neutral-900">{fullName.trim() || getUserDisplayName(user)}</p>
          <p className="text-sm text-neutral-600 mt-0.5 break-all">{email.trim() || user.email || '—'}</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <UserAvatar user={user} size="lg" imageUrl={pictureURL || null} name={fullName} />
          <div className="w-full sm:flex-1">
            <label className="eyebrow block text-neutral-600 mb-2">Profile photo</label>
            <label className="pb-compact-btn inline-flex items-center gap-2 h-8 px-3 rounded-md border border-gray-300 bg-white text-black text-xs font-semibold cursor-pointer hover:bg-gray-50 w-full sm:w-auto justify-center">
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              {uploading ? 'Uploading…' : 'Upload photo'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                disabled={uploading || saving}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) void handlePhotoUpload(f)
                  e.target.value = ''
                }}
              />
            </label>
            <p className="text-xs text-neutral-500 mt-1.5">Photo applies immediately after upload.</p>
          </div>
        </div>

        <div>
          <label htmlFor="profile-name" className="eyebrow block text-neutral-600 mb-2">
            Name
          </label>
          <Input
            id="profile-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="min-h-[44px] font-body"
            placeholder="Your full name"
            autoComplete="name"
          />
        </div>

        <div>
          <label htmlFor="profile-email" className="eyebrow block text-neutral-600 mb-2">
            Email
          </label>
          <Input
            id="profile-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="min-h-[44px] font-body"
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>

        <div>
          <label htmlFor="profile-phone" className="eyebrow block text-neutral-600 mb-2">
            Phone
          </label>
          <Input
            id="profile-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="min-h-[44px] font-body"
            placeholder="+971 50 000 0000"
            autoComplete="tel"
          />
        </div>
      </div>
    </Dialog>
  )
}

interface ProfileMenuButtonProps {
  className?: string
  compact?: boolean
}

/** Avatar button that opens profile quick-edit — for all logged-in users */
export function ProfileMenuButton({ className = '', compact = false }: ProfileMenuButtonProps) {
  const { user, loading } = useAuth()
  const [open, setOpen] = useState(false)

  if (loading || !user) return null

  return (
    <>
      <button
        type="button"
        data-dashboard-control
        onClick={() => setOpen(true)}
        className={`inline-flex items-center rounded-full bg-transparent hover:ring-2 hover:ring-neutral-300 dark:hover:ring-neutral-600 transition ${
          compact ? 'p-0 min-h-[28px] gap-0' : 'p-1 min-h-[44px] min-w-[44px] justify-center gap-0.5'
        } ${className}`}
        aria-label="Edit profile"
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Edit profile — view email and account details"
      >
        <UserAvatar user={user} size={compact ? 'xs' : 'sm'} />
        {!compact ? (
          <ChevronDown className="h-3.5 w-3.5 text-neutral-500 shrink-0" aria-hidden />
        ) : null}
      </button>
      <ProfileQuickEdit open={open} onOpenChange={setOpen} />
    </>
  )
}
