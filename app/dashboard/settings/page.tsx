'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { Card } from '@/components/ui/card'
import { User } from '@/lib/types'
import { Bell, Shield, UserX } from 'lucide-react'
import { sanitizeForFirestore } from '@/lib/firestore-utils'
import { sendPasswordReset } from '@/lib/auth'
import {
  DashboardPageShell,
  DashboardSkeleton,
  DashboardErrorState,
} from '@/components/dashboard-states'

function SettingsContent() {
  const { user: authUser, firebaseUser, loading: authLoading, logout } = useAuth()
  const router = useRouter()
  const [user, setUser] = React.useState<User | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [editing, setEditing] = React.useState(false)
  const [editingNotifications, setEditingNotifications] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [savingNotifications, setSavingNotifications] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [formData, setFormData] = React.useState({
    firstName: '',
    lastName: '',
    phone: '',
    location: '',
    bio: '',
    skills: [] as string[],
    departments: [] as string[],
  })
  const [notificationPreferences, setNotificationPreferences] = React.useState({
    emailNotifications: true,
    pushNotifications: true,
    eventReminders: true,
    memberMessages: true,
    systemAlerts: true,
    newsletter: true,
    communityUpdates: true,
  })
  const [privacySettings, setPrivacySettings] = React.useState({
    showProfileToCommunity: true,
    showInMemberDirectory: true,
  })
  const [editingPrivacy, setEditingPrivacy] = React.useState(false)
  const [savingPrivacy, setSavingPrivacy] = React.useState(false)
  const [passwordMessage, setPasswordMessage] = React.useState<string | null>(null)
  const [deleting, setDeleting] = React.useState(false)

  React.useEffect(() => {
    const fetchUser = async () => {
      if (authLoading) return
      try {
        const firebaseUser = auth.currentUser
        if (!firebaseUser) {
          setLoading(false)
          return
        }

        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
        if (userDoc.exists()) {
          const userData = userDoc.data() as User
          setUser(userData)
          setFormData({
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            phone: userData.phone || '',
            location: userData.location || '',
            bio: userData.bio || '',
            skills: userData.skills || [],
            departments: userData.departments || [],
          })
          if (userData.notificationPreferences) {
            setNotificationPreferences((prev) => ({ ...prev, ...userData.notificationPreferences }))
          }
          if (userData.privacySettings) {
            setPrivacySettings(userData.privacySettings as typeof privacySettings)
          }
        } else if (authUser) {
          setUser(authUser as User)
        }
      } catch (err) {
        console.error('[v0] Error fetching user:', err)
        setError('Failed to load settings.')
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [authLoading, authUser])

  const handleSaveProfile = async () => {
    const firebaseUser = auth.currentUser
    if (!firebaseUser) return

    setSaving(true)
    try {
      await updateDoc(
        doc(db, 'users', firebaseUser.uid),
        sanitizeForFirestore({
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          location: formData.location,
          bio: formData.bio,
          skills: formData.skills,
          departments: formData.departments,
          updatedAt: new Date(),
        })
      )
      setUser({ ...(user ?? {}), ...formData } as User)
      setEditing(false)
    } catch (err) {
      console.error('[v0] Error updating profile:', err)
      setError('Failed to save profile.')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveNotifications = async () => {
    const firebaseUser = auth.currentUser
    if (!firebaseUser) return

    setSavingNotifications(true)
    try {
      await updateDoc(
        doc(db, 'users', firebaseUser.uid),
        sanitizeForFirestore({
          notificationPreferences,
          updatedAt: new Date(),
        })
      )
      setEditingNotifications(false)
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
    try {
      await updateDoc(
        doc(db, 'users', uid),
        sanitizeForFirestore({ privacySettings, updatedAt: new Date() })
      )
      setEditingPrivacy(false)
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
    const result = await sendPasswordReset(email)
    setPasswordMessage(
      result.success
        ? 'Password reset email sent. Check your inbox.'
        : result.error || 'Failed to send reset email.'
    )
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Delete your account? This cannot be undone. Your profile will be deactivated.')) return
    const uid = authUser?.id ?? firebaseUser?.uid
    if (!uid) return
    setDeleting(true)
    try {
      await updateDoc(
        doc(db, 'users', uid),
        sanitizeForFirestore({
          status: 'deleted',
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
      )
      await logout()
      router.push('/login')
    } catch (err) {
      console.error('[v0] Delete account error:', err)
      setError('Failed to delete account. Please contact support.')
    } finally {
      setDeleting(false)
    }
  }

  if (authLoading || loading) return <DashboardSkeleton rows={2} />
  if (error && !user) return <DashboardErrorState message={error} />

  return (
    <DashboardPageShell title="Settings" subtitle="Manage your profile and preferences">
      <div className="w-full max-w-2xl mx-auto flex flex-col gap-6">
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <Card className="p-6 border border-neutral-200 w-full">
          <h2 className="text-xl font-bold mb-6 text-neutral-900">Personal Information</h2>

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

              {[
                { key: 'email', label: 'Email', value: user?.email ?? '', disabled: true },
                { key: 'phone', label: 'Phone', value: formData.phone, field: 'phone' as const },
                { key: 'location', label: 'Location', value: formData.location, field: 'location' as const },
              ].map((field) => (
                <div key={field.key} className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-neutral-500">{field.label}</label>
                  <input
                    type="text"
                    value={field.field ? formData[field.field] : field.value}
                    disabled={field.disabled}
                    onChange={
                      field.field
                        ? (e) => setFormData({ ...formData, [field.field!]: e.target.value })
                        : undefined
                    }
                    className={`w-full px-3 py-2 border border-neutral-300 rounded-lg ${
                      field.disabled ? 'bg-neutral-50 text-neutral-600' : 'focus:outline-none focus:ring-2 focus:ring-black'
                    }`}
                  />
                </div>
              ))}

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-neutral-500">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-black"
                />
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
                  onClick={() => setEditing(false)}
                  className="!bg-white !text-black border border-gray-300 px-6 py-2 rounded-lg text-sm font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1 min-w-0">
                  <p className="text-sm text-neutral-500">First Name</p>
                  <p className="text-base font-medium text-neutral-900 break-words">{user?.firstName || '—'}</p>
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <p className="text-sm text-neutral-500">Last Name</p>
                  <p className="text-base font-medium text-neutral-900 break-words">{user?.lastName || '—'}</p>
                </div>
              </div>

              {[
                { label: 'Email', value: user?.email },
                { label: 'Phone', value: user?.phone || '—' },
                { label: 'Location', value: user?.location || '—' },
              ].map((field) => (
                <div key={field.label} className="flex flex-col gap-1">
                  <p className="text-sm text-neutral-500">{field.label}</p>
                  <p className="text-base font-medium text-neutral-900 break-words">{field.value}</p>
                </div>
              ))}

              <div className="flex flex-col gap-1">
                <p className="text-sm text-neutral-500">Bio</p>
                <p className="text-base text-neutral-900 whitespace-pre-wrap break-words">{user?.bio || '—'}</p>
              </div>

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

          {editingNotifications ? (
            <div className="flex flex-col gap-4">
              {(
                [
                  ['emailNotifications', 'Email Notifications', 'Receive updates via email'],
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
                      setNotificationPreferences({ ...notificationPreferences, [key]: e.target.checked })
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
                  onClick={() => setEditingNotifications(false)}
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
                  <span className="text-xs px-2 py-1 bg-neutral-200 rounded">{enabled ? 'Enabled' : 'Disabled'}</span>
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
          {editingPrivacy ? (
            <div className="flex flex-col gap-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacySettings.showProfileToCommunity}
                  onChange={(e) =>
                    setPrivacySettings({ ...privacySettings, showProfileToCommunity: e.target.checked })
                  }
                  className="mt-1 w-4 h-4 accent-black"
                />
                <div>
                  <p className="font-medium text-sm">Show profile to community members</p>
                  <p className="text-xs text-neutral-500">Let members see your profile in groups</p>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacySettings.showInMemberDirectory}
                  onChange={(e) =>
                    setPrivacySettings({ ...privacySettings, showInMemberDirectory: e.target.checked })
                  }
                  className="mt-1 w-4 h-4 accent-black"
                />
                <div>
                  <p className="font-medium text-sm">Show in member directory</p>
                  <p className="text-xs text-neutral-500">Appear in the public member directory</p>
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
                  onClick={() => setEditingPrivacy(false)}
                  className="!bg-white !text-black border border-gray-300 px-6 py-2 rounded-lg text-sm font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex justify-between p-3 bg-neutral-50 rounded-lg text-sm">
                <span>Show profile to community</span>
                <span>{privacySettings.showProfileToCommunity ? 'On' : 'Off'}</span>
              </div>
              <div className="flex justify-between p-3 bg-neutral-50 rounded-lg text-sm">
                <span>Show in member directory</span>
                <span>{privacySettings.showInMemberDirectory ? 'On' : 'Off'}</span>
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
              <button
                type="button"
                onClick={handleChangePassword}
                className="!bg-black !text-white px-6 py-2 rounded-lg text-sm font-semibold"
              >
                Change Password
              </button>
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
              <p className="text-xs text-neutral-500 mt-1">Permanently deactivate your member account.</p>
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
