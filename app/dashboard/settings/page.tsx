'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { updateProfile } from 'firebase/auth'
import { Card } from '@/components/ui/card'
import { User } from '@/lib/types'
import { Bell, Shield, UserX, Upload, Loader2 } from 'lucide-react'
import { UserAvatar } from '@/components/user-avatar'
import { getUserProfilePictureURL } from '@/lib/user-profile'
import { uploadImageToFirebase } from '@/lib/upload-utils'
import { sanitizeForFirestore } from '@/lib/firestore-utils'
import { sendPasswordReset } from '@/lib/auth'
import { requestAndRegisterFCM } from '@/lib/fcm-client'
import {
  buildLocationLabelUpdate,
  DEFAULT_NOTIFICATION_PREFERENCES,
  DEFAULT_PRIVACY_SETTINGS,
  formatUserLocationDisplay,
  fcmSettingsToNotificationPrefs,
  mergeNotificationPreferences,
  mergePrivacySettings,
  notificationPrefsToFcmSettings,
  type NotificationPreferences,
  type PrivacySettings,
} from '@/lib/user-settings'
import {
  DashboardPageShell,
  DashboardSkeleton,
  DashboardErrorState,
} from '@/components/dashboard-states'

const SKILL_OPTIONS = [
  'Tech/IT',
  'Marketing',
  'Design',
  'Finance',
  'Teaching/Training',
  'Medical/Health',
  'Legal',
  'Events Management',
  'Media/PR',
  'Logistics',
  'Admin/Operations',
  'Social work',
  'Other',
]

type ProfileForm = {
  firstName: string
  lastName: string
  phone: string
  location: string
  bio: string
  skills: string[]
}

function SettingsContent() {
  const { user: authUser, firebaseUser, loading: authLoading, logout, refreshUser } = useAuth()
  const router = useRouter()
  const [user, setUser] = React.useState<User | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [editing, setEditing] = React.useState(false)
  const [editingNotifications, setEditingNotifications] = React.useState(false)
  const [editingPrivacy, setEditingPrivacy] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [savingNotifications, setSavingNotifications] = React.useState(false)
  const [savingPrivacy, setSavingPrivacy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)
  const [formData, setFormData] = React.useState<ProfileForm>({
    firstName: '',
    lastName: '',
    phone: '',
    location: '',
    bio: '',
    skills: [],
  })
  const [savedProfile, setSavedProfile] = React.useState<ProfileForm>(formData)
  const [notificationPreferences, setNotificationPreferences] =
    React.useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES)
  const [savedNotifications, setSavedNotifications] =
    React.useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES)
  const [privacySettings, setPrivacySettings] =
    React.useState<PrivacySettings>(DEFAULT_PRIVACY_SETTINGS)
  const [savedPrivacy, setSavedPrivacy] = React.useState<PrivacySettings>(DEFAULT_PRIVACY_SETTINGS)
  const [passwordMessage, setPasswordMessage] = React.useState<string | null>(null)
  const [passwordLoading, setPasswordLoading] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)
  const [pictureURL, setPictureURL] = React.useState('')
  const [uploadingPhoto, setUploadingPhoto] = React.useState(false)

  const applyUserDoc = React.useCallback((userData: User) => {
    const profile: ProfileForm = {
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      phone: userData.phone || '',
      location: formatUserLocationDisplay(userData.location, userData.locationLabel),
      bio: userData.bio || '',
      skills: userData.skills || [],
    }
    const notifications = mergeNotificationPreferences({
      ...userData.notificationPreferences,
      ...fcmSettingsToNotificationPrefs(userData.fcmSettings, userData.notificationPreferences),
    })
    const privacy = mergePrivacySettings(userData.privacySettings)

    setUser(userData)
    setPictureURL(getUserProfilePictureURL(userData) || '')
    setFormData(profile)
    setSavedProfile(profile)
    setNotificationPreferences(notifications)
    setSavedNotifications(notifications)
    setPrivacySettings(privacy)
    setSavedPrivacy(privacy)
  }, [])

  React.useEffect(() => {
    const fetchUser = async () => {
      if (authLoading) return
      try {
        const current = auth.currentUser
        if (!current) {
          setLoading(false)
          return
        }

        await current.getIdToken(true)
        const userDoc = await getDoc(doc(db, 'users', current.uid))
        if (userDoc.exists()) {
          applyUserDoc({ id: userDoc.id, ...userDoc.data() } as User)
        } else if (authUser) {
          applyUserDoc(authUser as User)
        }
      } catch (err) {
        console.error('[v0] Error fetching user:', err)
        setError('Failed to load settings.')
      } finally {
        setLoading(false)
      }
    }

    void fetchUser()
  }, [authLoading, authUser, applyUserDoc])

  const handlePhotoUpload = async (file: File) => {
    const current = auth.currentUser
    if (!current || !user) return

    setUploadingPhoto(true)
    setError(null)
    setSuccess(null)
    try {
      const url = await uploadImageToFirebase(file, `users/${current.uid}/profile`, {
        preset: 'content',
        maxDimension: 512,
      })

      await updateDoc(
        doc(db, 'users', current.uid),
        sanitizeForFirestore({
          profilePictureURL: url,
          avatarUrl: url,
          updatedAt: new Date(),
        })
      )

      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: url })
      }

      setPictureURL(url)
      setUser({ ...user, profilePictureURL: url, avatarUrl: url })
      setSuccess('Profile photo updated.')
      await refreshUser()
    } catch (err) {
      console.error('[v0] Profile photo upload error:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload profile photo.')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleSaveProfile = async () => {
    const current = auth.currentUser
    if (!current || !user) return

    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const locationUpdate = buildLocationLabelUpdate(formData.location, user.location)
      await updateDoc(
        doc(db, 'users', current.uid),
        sanitizeForFirestore({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          phone: formData.phone.trim(),
          bio: formData.bio.trim(),
          skills: formData.skills,
          ...locationUpdate,
          updatedAt: new Date(),
        })
      )
      const updated = {
        ...user,
        ...formData,
        locationLabel: locationUpdate.locationLabel,
        location: locationUpdate.location ?? user.location,
      } as User
      setUser(updated)
      setSavedProfile(formData)
      setEditing(false)
      setSuccess('Profile updated successfully.')
      await refreshUser()
    } catch (err) {
      console.error('[v0] Error updating profile:', err)
      setError('Failed to save profile.')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveNotifications = async () => {
    const current = auth.currentUser
    if (!current) return

    setSavingNotifications(true)
    setError(null)
    setSuccess(null)
    try {
      const merged = mergeNotificationPreferences(notificationPreferences)
      const fcmSettings = notificationPrefsToFcmSettings(merged)

      if (merged.pushNotifications) {
        await requestAndRegisterFCM(current.uid)
      }

      await updateDoc(
        doc(db, 'users', current.uid),
        sanitizeForFirestore({
          notificationPreferences: merged,
          fcmSettings,
          newsletterOptOut: !merged.newsletter,
          updatedAt: new Date(),
        })
      )
      setNotificationPreferences(merged)
      setSavedNotifications(merged)
      setEditingNotifications(false)
      setSuccess('Notification preferences saved.')
      await refreshUser()
    } catch (err) {
      console.error('[v0] Error saving notification preferences:', err)
      setError('Failed to save notification preferences.')
    } finally {
      setSavingNotifications(false)
    }
  }

  const handleSavePrivacy = async () => {
    const uid = authUser?.id ?? firebaseUser?.uid
    if (!uid) return
    setSavingPrivacy(true)
    setError(null)
    setSuccess(null)
    try {
      const merged = mergePrivacySettings(privacySettings)
      await updateDoc(
        doc(db, 'users', uid),
        sanitizeForFirestore({ privacySettings: merged, updatedAt: new Date() })
      )
      setPrivacySettings(merged)
      setSavedPrivacy(merged)
      setEditingPrivacy(false)
      setSuccess('Privacy settings saved.')
      await refreshUser()
    } catch (err) {
      console.error('[v0] Error saving privacy:', err)
      setError('Failed to save privacy settings.')
    } finally {
      setSavingPrivacy(false)
    }
  }

  const handleChangePassword = async () => {
    const email = user?.email ?? firebaseUser?.email
    if (!email) {
      setPasswordMessage('No email on file for this account.')
      return
    }

    const hasPasswordProvider = firebaseUser?.providerData?.some(
      (p) => p.providerId === 'password'
    )
    if (firebaseUser && !hasPasswordProvider) {
      setPasswordMessage(
        'This account uses social sign-in. Manage your password through Google, or add a password via Forgot Password on the login page.'
      )
      return
    }

    setPasswordLoading(true)
    setPasswordMessage(null)
    const result = await sendPasswordReset(email)
    setPasswordMessage(
      result.success
        ? 'Password reset email sent. Check your inbox.'
        : result.error || 'Failed to send reset email.'
    )
    setPasswordLoading(false)
  }

  const handleDeleteAccount = async () => {
    if (
      !confirm(
        'Delete your account? You will be signed out and your profile will be deactivated. Contact support to restore access.'
      )
    ) {
      return
    }

    const uid = authUser?.id ?? firebaseUser?.uid
    const token = await firebaseUser?.getIdToken()
    if (!uid || !token) return

    setDeleting(true)
    setError(null)
    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || 'Delete failed')
      }
      await logout()
      router.push('/login')
    } catch (err) {
      console.error('[v0] Delete account error:', err)
      setError('Failed to delete account. Please contact support.')
    } finally {
      setDeleting(false)
    }
  }

  const toggleSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }))
  }

  if (authLoading || loading) return <DashboardSkeleton rows={2} />
  if (error && !user) return <DashboardErrorState message={error} />

  const usesSocialLogin = Boolean(
    firebaseUser?.providerData?.length &&
      !firebaseUser.providerData.some((p) => p.providerId === 'password')
  )

  return (
    <DashboardPageShell title="Settings" subtitle="Manage your profile and preferences">
      <div className="w-full max-w-2xl mx-auto flex flex-col gap-6">
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {success ? <p className="text-sm text-green-700">{success}</p> : null}

        <Card className="p-6 border border-neutral-200 w-full">
          <h2 className="text-xl font-bold mb-6 text-neutral-900">Personal Information</h2>

          <div className="flex flex-col sm:flex-row items-center gap-4 mb-8 pb-6 border-b border-neutral-200">
            <UserAvatar user={user} size="lg" imageUrl={pictureURL || null} />
            <div className="flex flex-col items-center sm:items-start gap-2 text-center sm:text-left">
              <p className="text-sm font-medium text-neutral-900">Profile photo</p>
              <p className="text-xs text-neutral-500 max-w-xs">
                JPG, PNG, or WebP. Automatically resized to 512px before upload.
              </p>
              <label className="inline-flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-lg border border-neutral-300 bg-white text-black text-sm font-medium cursor-pointer hover:bg-neutral-50">
                {uploadingPhoto ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Upload className="h-4 w-4" aria-hidden />
                )}
                {uploadingPhoto ? 'Uploading…' : pictureURL ? 'Change photo' : 'Upload photo'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  disabled={uploadingPhoto}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) void handlePhotoUpload(file)
                    e.target.value = ''
                  }}
                />
              </label>
            </div>
          </div>

          {editing ? (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1 min-w-0">
                  <label className="text-sm font-medium text-neutral-500">First Name</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <label className="text-sm font-medium text-neutral-500">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-neutral-500">Email</label>
                <input
                  type="text"
                  value={user?.email ?? ''}
                  disabled
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-neutral-50 text-neutral-600"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-neutral-500">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-neutral-500">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="City, emirate, or country"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-neutral-500">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-neutral-500 block mb-2">Skills</label>
                <div className="flex flex-wrap gap-2">
                  {SKILL_OPTIONS.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${
                        formData.skills.includes(skill)
                          ? '!bg-black !text-white border-black'
                          : '!bg-white !text-black border-neutral-300'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="!bg-black !text-white px-6 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(savedProfile)
                    setEditing(false)
                  }}
                  className="!bg-white !text-black border border-gray-300 px-6 py-2 rounded-lg text-sm font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-neutral-500">First Name</p>
                  <p className="text-base font-medium text-neutral-900">{user?.firstName || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Last Name</p>
                  <p className="text-base font-medium text-neutral-900">{user?.lastName || '—'}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-neutral-500">Email</p>
                <p className="text-base font-medium text-neutral-900">{user?.email || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-500">Phone</p>
                <p className="text-base font-medium text-neutral-900">{user?.phone || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-500">Location</p>
                <p className="text-base font-medium text-neutral-900">
                  {formatUserLocationDisplay(user?.location, user?.locationLabel) || '—'}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-500">Bio</p>
                <p className="text-base text-neutral-900 whitespace-pre-wrap">{user?.bio || '—'}</p>
              </div>
              {user?.skills?.length ? (
                <div>
                  <p className="text-sm text-neutral-500 mb-2">Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {user.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-1 bg-neutral-100 rounded text-xs font-medium text-neutral-800"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="self-start !bg-black !text-white px-6 py-2 rounded-lg text-sm font-semibold"
              >
                Edit Profile
              </button>
            </div>
          )}
        </Card>

        <Card className="p-6 border border-neutral-200 w-full">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5" />
            <h2 className="text-xl font-bold text-neutral-900">Notification Preferences</h2>
          </div>
          <p className="text-xs text-neutral-500 mb-4">
            These preferences control newsletters, push alerts, and in-app notifications across the
            platform.
          </p>

          {editingNotifications ? (
            <div className="flex flex-col gap-4">
              {(
                [
                  ['emailNotifications', 'Email Notifications', 'Master switch for email updates'],
                  ['pushNotifications', 'Push Notifications', 'Browser and mobile push alerts'],
                  ['eventReminders', 'Event Reminders', 'Upcoming events and activities'],
                  ['newsletter', 'Newsletter', 'Periodic community newsletters'],
                  ['memberMessages', 'Community Messages', 'New messages in communities'],
                  ['communityUpdates', 'Community Updates', 'New communities and groups'],
                  ['systemAlerts', 'System Alerts', 'Important security notifications'],
                ] as const
              ).map(([key, title, desc]) => (
                <label key={key} className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationPreferences[key]}
                    onChange={(e) =>
                      setNotificationPreferences({
                        ...notificationPreferences,
                        [key]: e.target.checked,
                      })
                    }
                    className="mt-1 w-4 h-4 accent-black"
                  />
                  <div>
                    <p className="font-medium text-sm text-neutral-900">{title}</p>
                    <p className="text-xs text-neutral-500">{desc}</p>
                  </div>
                </label>
              ))}
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSaveNotifications}
                  disabled={savingNotifications}
                  className="!bg-black !text-white px-6 py-2 rounded-lg text-sm font-semibold"
                >
                  {savingNotifications ? 'Saving...' : 'Save Preferences'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNotificationPreferences(savedNotifications)
                    setEditingNotifications(false)
                  }}
                  className="!bg-white !text-black border border-gray-300 px-6 py-2 rounded-lg text-sm font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {Object.entries(notificationPreferences).map(([key, enabled]) => (
                <div key={key} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                  <span className="text-sm font-medium capitalize text-neutral-800">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <span className="text-xs px-2 py-1 bg-neutral-200 rounded">
                    {enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setEditingNotifications(true)}
                className="!bg-black !text-white px-6 py-2 rounded-lg text-sm font-semibold w-full sm:w-auto"
              >
                Edit Notification Preferences
              </button>
            </div>
          )}
        </Card>

        <Card className="p-6 border border-neutral-200 w-full">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5" />
            <h2 className="text-xl font-bold text-neutral-900">Privacy Settings</h2>
          </div>
          <p className="text-xs text-neutral-500 mb-4">
            Control how your profile appears in the member directory and community areas.
          </p>

          {editingPrivacy ? (
            <div className="flex flex-col gap-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacySettings.showProfileToCommunity}
                  onChange={(e) =>
                    setPrivacySettings({
                      ...privacySettings,
                      showProfileToCommunity: e.target.checked,
                    })
                  }
                  className="mt-1 w-4 h-4 accent-black"
                />
                <div>
                  <p className="font-medium text-sm">Allow others to open my full profile</p>
                  <p className="text-xs text-neutral-500">
                    Members can view your profile card from groups, chat, and the forum
                  </p>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacySettings.showInMemberDirectory}
                  onChange={(e) =>
                    setPrivacySettings({
                      ...privacySettings,
                      showInMemberDirectory: e.target.checked,
                    })
                  }
                  className="mt-1 w-4 h-4 accent-black"
                />
                <div>
                  <p className="font-medium text-sm">Show in member directory</p>
                  <p className="text-xs text-neutral-500">Appear in the public member directory</p>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacySettings.showRealNameInGroups}
                  onChange={(e) =>
                    setPrivacySettings({
                      ...privacySettings,
                      showRealNameInGroups: e.target.checked,
                    })
                  }
                  className="mt-1 w-4 h-4 accent-black"
                />
                <div>
                  <p className="font-medium text-sm">Show my real name in groups</p>
                  <p className="text-xs text-neutral-500">
                    If off, others see “Member” instead of your name in chat and forum
                  </p>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacySettings.showAvatarInGroups}
                  onChange={(e) =>
                    setPrivacySettings({
                      ...privacySettings,
                      showAvatarInGroups: e.target.checked,
                    })
                  }
                  className="mt-1 w-4 h-4 accent-black"
                />
                <div>
                  <p className="font-medium text-sm">Show my photo in groups</p>
                  <p className="text-xs text-neutral-500">
                    Control avatar visibility in chat, forum, and member lists
                  </p>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacySettings.showBioOnProfile}
                  onChange={(e) =>
                    setPrivacySettings({
                      ...privacySettings,
                      showBioOnProfile: e.target.checked,
                    })
                  }
                  className="mt-1 w-4 h-4 accent-black"
                />
                <div>
                  <p className="font-medium text-sm">Show bio on my profile</p>
                  <p className="text-xs text-neutral-500">
                    Include your about text when someone opens your profile
                  </p>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacySettings.showLocationOnProfile}
                  onChange={(e) =>
                    setPrivacySettings({
                      ...privacySettings,
                      showLocationOnProfile: e.target.checked,
                    })
                  }
                  className="mt-1 w-4 h-4 accent-black"
                />
                <div>
                  <p className="font-medium text-sm">Show location on my profile</p>
                  <p className="text-xs text-neutral-500">
                    Include your location when someone opens your profile
                  </p>
                </div>
              </label>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleSavePrivacy}
                  disabled={savingPrivacy}
                  className="!bg-black !text-white px-6 py-2 rounded-lg text-sm font-semibold"
                >
                  {savingPrivacy ? 'Saving...' : 'Save Privacy Settings'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPrivacySettings(savedPrivacy)
                    setEditingPrivacy(false)
                  }}
                  className="!bg-white !text-black border border-gray-300 px-6 py-2 rounded-lg text-sm font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex justify-between p-3 bg-neutral-50 rounded-lg text-sm">
                <span>Full profile visible</span>
                <span>{privacySettings.showProfileToCommunity ? 'On' : 'Off'}</span>
              </div>
              <div className="flex justify-between p-3 bg-neutral-50 rounded-lg text-sm">
                <span>Show in member directory</span>
                <span>{privacySettings.showInMemberDirectory ? 'On' : 'Off'}</span>
              </div>
              <div className="flex justify-between p-3 bg-neutral-50 rounded-lg text-sm">
                <span>Real name in groups</span>
                <span>{privacySettings.showRealNameInGroups ? 'On' : 'Off'}</span>
              </div>
              <div className="flex justify-between p-3 bg-neutral-50 rounded-lg text-sm">
                <span>Photo in groups</span>
                <span>{privacySettings.showAvatarInGroups ? 'On' : 'Off'}</span>
              </div>
              <div className="flex justify-between p-3 bg-neutral-50 rounded-lg text-sm">
                <span>Bio on profile</span>
                <span>{privacySettings.showBioOnProfile ? 'On' : 'Off'}</span>
              </div>
              <div className="flex justify-between p-3 bg-neutral-50 rounded-lg text-sm">
                <span>Location on profile</span>
                <span>{privacySettings.showLocationOnProfile ? 'On' : 'Off'}</span>
              </div>
              <button
                type="button"
                onClick={() => setEditingPrivacy(true)}
                className="!bg-black !text-white px-6 py-2 rounded-lg text-sm font-semibold w-full sm:w-auto"
              >
                Edit Privacy Settings
              </button>
            </div>
          )}
        </Card>

        <Card className="p-6 border border-neutral-200 w-full">
          <div className="flex items-center gap-2 mb-4">
            <UserX className="w-5 h-5" />
            <h2 className="text-xl font-bold text-neutral-900">Account</h2>
          </div>
          <div className="flex flex-col gap-4">
            <div>
              {!usesSocialLogin ? (
                <button
                  type="button"
                  onClick={handleChangePassword}
                  disabled={passwordLoading}
                  className="!bg-black !text-white px-6 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                >
                  {passwordLoading ? 'Sending...' : 'Change Password'}
                </button>
              ) : (
                <p className="text-sm text-neutral-600">
                  You signed in with a social provider. Use{' '}
                  <Link href="/forgot-password" className="underline font-medium">
                    Forgot Password
                  </Link>{' '}
                  to add email login, or manage your password with your provider.
                </p>
              )}
              {passwordMessage ? (
                <p className="text-sm text-neutral-600 mt-2">{passwordMessage}</p>
              ) : null}
            </div>
            <div>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="text-red-600 text-sm font-semibold hover:underline disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Account'}
              </button>
              <p className="text-xs text-neutral-500 mt-1">
                Deactivates your profile, opts you out of communications, and disables sign-in.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardPageShell>
  )
}

export default function SettingsPage() {
  return <SettingsContent />
}
