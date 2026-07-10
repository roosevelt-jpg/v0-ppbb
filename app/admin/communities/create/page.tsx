'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { auth } from '@/lib/firebase'
import { uploadCommunityBanner, uploadCommunityIcon } from '@/lib/firebase-storage'

function CreateCommunityForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('id')

  const [user, setUser] = useState<{ uid: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingExisting, setLoadingExisting] = useState(Boolean(editId))
  const [iconFile, setIconFile] = useState<File | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [iconPreview, setIconPreview] = useState('')
  const [bannerPreview, setBannerPreview] = useState('')
  const [existingIconURL, setExistingIconURL] = useState('')
  const [existingBannerURL, setExistingBannerURL] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'general',
    visibility: 'public',
    rules: '',
    genderRestriction: 'mixed',
  })

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!editId) return

    async function loadCommunity() {
      setLoadingExisting(true)
      try {
        const res = await fetch(`/api/communities?id=${encodeURIComponent(editId)}`)
        const data = await res.json()
        if (!data.success) throw new Error(data.error || 'Failed to load community')

        const c = data.data
        setFormData({
          name: c.name || '',
          description: c.description || '',
          category: c.category || 'general',
          visibility: c.visibility || 'public',
          rules: Array.isArray(c.rules) ? c.rules.join('\n') : '',
          genderRestriction: c.genderRestriction || 'mixed',
        })
        setExistingIconURL(c.iconURL || c.logoURL || '')
        setExistingBannerURL(c.bannerURL || '')
        if (c.iconURL || c.logoURL) setIconPreview(c.iconURL || c.logoURL)
        if (c.bannerURL) setBannerPreview(c.bannerURL)
      } catch (error) {
        console.error('[v0] Error loading community:', error)
        alert('Failed to load community for editing')
      } finally {
        setLoadingExisting(false)
      }
    }

    void loadCommunity()
  }, [editId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      alert('You must be logged in')
      return
    }

    setLoading(true)
    try {
      const token = await auth.currentUser?.getIdToken()
      let iconURL = existingIconURL
      let bannerURL = existingBannerURL

      const uploadId = editId || `draft_${Date.now()}`
      if (iconFile) iconURL = await uploadCommunityIcon(uploadId, iconFile)
      if (bannerFile) bannerURL = await uploadCommunityBanner(uploadId, bannerFile)

      const payload = {
        ...formData,
        iconURL,
        bannerURL,
        logoURL: iconURL,
        rules: formData.rules.split('\n').filter((r) => r.trim()),
        genderRestriction: formData.genderRestriction,
      }

      if (editId) {
        const response = await fetch('/api/communities', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ id: editId, ...payload }),
        })
        const data = await response.json()
        if (!data.success) throw new Error(data.error)
        router.push(`/admin/communities/${editId}`)
      } else {
        const response = await fetch('/api/communities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            ...payload,
            createdBy: user.uid,
          }),
        })
        const data = await response.json()
        if (!data.success) throw new Error(data.error)
        router.push(`/admin/communities/${data.data.id}`)
      }
    } catch (error: unknown) {
      console.error('[v0] Error saving community:', error)
      alert(`Failed to save community: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  if (loadingExisting) {
    return (
      <AdminPageLayout title="Edit Community" subtitle="Loading…">
        <p className="text-gray-500">Loading community…</p>
      </AdminPageLayout>
    )
  }

  return (
    <AdminPageLayout
      title={editId ? 'Edit Community' : 'Create Community'}
      subtitle={editId ? 'Update community details' : 'Add a new community to the platform'}
    >
      <div className="w-full max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-lg border border-gray-200">
          <div>
            <label className="block text-sm font-medium text-black mb-2">Community Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Technology Enthusiasts"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">Description *</label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the community purpose and focus..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-black"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-black mb-2">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-black"
              >
                <option value="general">General</option>
                <option value="interest">Interest</option>
                <option value="support">Support</option>
                <option value="events">Events</option>
                <option value="volunteer">Volunteer</option>
                <option value="business">Business</option>
                <option value="charity">Charity</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">Visibility *</label>
              <select
                value={formData.visibility}
                onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-black"
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="restricted">Restricted</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">Gender restriction</label>
            <select
              value={formData.genderRestriction}
              onChange={(e) => setFormData({ ...formData, genderRestriction: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-black"
            >
              <option value="mixed">Mixed (all genders)</option>
              <option value="male">Men only</option>
              <option value="female">Ladies only</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">Community Rules (one per line)</label>
            <textarea
              value={formData.rules}
              onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
              placeholder="Be respectful&#10;No spam"
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-black"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-black mb-2">Community Icon</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setIconFile(file)
                    setIconPreview(URL.createObjectURL(file))
                  }
                }}
                className="w-full text-sm"
              />
              {iconPreview && (
                <img src={iconPreview} alt="" className="mt-2 w-16 h-16 rounded-lg object-cover" />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">Community Banner</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setBannerFile(file)
                    setBannerPreview(URL.createObjectURL(file))
                  }
                }}
                className="w-full text-sm"
              />
              {bannerPreview && (
                <img src={bannerPreview} alt="" className="mt-2 w-full h-20 rounded-lg object-cover" />
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 font-medium"
            >
              {loading ? 'Saving…' : editId ? 'Save Changes' : 'Create Community'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 bg-gray-200 text-black rounded-lg hover:bg-gray-300 font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </AdminPageLayout>
  )
}

export default function CreateCommunityPage() {
  return (
    <Suspense fallback={<AdminPageLayout title="Community"><p className="text-gray-500">Loading…</p></AdminPageLayout>}>
      <CreateCommunityForm />
    </Suspense>
  )
}
