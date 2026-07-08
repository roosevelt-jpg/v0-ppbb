'use client'

import React, { useEffect, useState } from 'react'
import { updateEmail, updateProfile } from 'firebase/auth'
import { doc, updateDoc } from 'firebase/firestore'
import { Upload, Loader2 } from 'lucide-react'
import { Dialog } from '@/components/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UserAvatar } from '@/components/user-avatar'
import { useAuth } from '@/lib/auth-context'
import { auth, db } from '@/lib/firebase'
import { sanitizeForFirestore } from '@/lib/firestore-utils'
import {
  getUserDisplayName,
  getUserProfilePictureURL,
  splitFullName,
} from '@/lib/user-profile'
import { uploadImageToFirebase } from '@/lib/upload-utils'
import { useAdminAudit } from '@/lib/use-admin-audit'

interface ProfileQuickEditProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProfileQuickEdit({ open, onOpenChange }: ProfileQuickEditProps) {
  const { user, firebaseUser } = useAuth()
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
      setMessage({ type: 'success', text: 'Photo uploaded. Save to apply.' })
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
      const { firstName, lastName } = splitFullName(fullName)
      if (!firstName.trim()) {
        throw new Error('Name is required')
      }
      if (!email.trim()) {
        throw new Error('Email is required')
      }

      const uid = firebaseUser.uid
      const firestoreUpdates = sanitizeForFirestore({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        profilePictureURL: pictureURL.trim(),
        avatarUrl: pictureURL.trim(),
        updatedAt: new Date(),
      })

      await updateDoc(doc(db, 'users', uid), firestoreUpdates)

      audit({
        actionType: 'update',
        action: 'Updated admin profile',
        entityType: 'admin',
        entityId: uid,
        entityName: fullName.trim(),
        status: 'success',
      })

      const authUpdates: { displayName?: string; photoURL?: string } = {}
      if (fullName.trim()) authUpdates.displayName = fullName.trim()
      if (pictureURL.trim()) authUpdates.photoURL = pictureURL.trim()
      if (Object.keys(authUpdates).length > 0 && auth.currentUser) {
        await updateProfile(auth.currentUser, authUpdates)
      }

      const currentEmail = firebaseUser.email || user.email
      if (email.trim() !== currentEmail && auth.currentUser) {
        try {
          await updateEmail(auth.currentUser, email.trim())
        } catch {
          setMessage({
            type: 'error',
            text: 'Profile saved, but email change requires recent sign-in. Sign out and sign in again, then retry.',
          })
          setSaving(false)
          return
        }
      }

      setMessage({ type: 'success', text: 'Profile updated.' })
      setTimeout(() => onOpenChange(false), 600)
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

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <UserAvatar user={user} size="lg" imageUrl={pictureURL || null} name={fullName} />
          <div className="w-full sm:flex-1">
            <label className="eyebrow block text-neutral-600 mb-2">Profile photo</label>
            <label className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg border border-gray-300 bg-white text-black text-sm font-medium cursor-pointer hover:bg-gray-50 w-full sm:w-auto justify-center">
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {uploading ? 'Uploading…' : 'Upload photo'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) void handlePhotoUpload(f)
                  e.target.value = ''
                }}
              />
            </label>
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
          />
        </div>
      </div>
    </Dialog>
  )
}

interface ProfileMenuButtonProps {
  className?: string
}

/** Avatar button that opens profile quick-edit — for all logged-in users */
export function ProfileMenuButton({ className = '' }: ProfileMenuButtonProps) {
  const { user, loading } = useAuth()
  const [open, setOpen] = useState(false)

  if (loading || !user) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`rounded-full p-0.5 hover:ring-2 hover:ring-neutral-300 transition min-h-[44px] min-w-[44px] inline-flex items-center justify-center ${className}`}
        aria-label="Edit profile"
        title="Edit profile"
      >
        <UserAvatar user={user} size="md" />
      </button>
      <ProfileQuickEdit open={open} onOpenChange={setOpen} />
    </>
  )
}
