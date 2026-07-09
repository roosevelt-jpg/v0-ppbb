'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { ChevronLeft, Upload } from 'lucide-react'
import Link from 'next/link'
import { uploadGroupIcon } from '@/lib/firebase-storage'
import { useAuth } from '@/lib/auth-context'
import { GENDER_RESTRICTION_OPTIONS } from '@/lib/community-governance'

export default function CreateGroupPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const communityId = params.id as string

  const [formData, setFormData] = React.useState({
    name: '',
    description: '',
    genderRestriction: 'mixed',
  })
  const [icon, setIcon] = React.useState<File | null>(null)
  const [iconPreview, setIconPreview] = React.useState<string>('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setIcon(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        setIconPreview(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setError('Group name is required')
      return
    }

    setLoading(true)
    setError('')

    try {
      let iconURL = ''
      if (icon) {
        iconURL = await uploadGroupIcon(communityId, `new_${Date.now()}`, icon)
      }

      const token = user ? await (await import('@/lib/firebase')).auth.currentUser?.getIdToken() : null
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          communityId,
          name: formData.name,
          description: formData.description,
          genderRestriction: formData.genderRestriction,
          iconURL,
          createdBy: user?.id,
        }),
      })

      const data = await res.json()
      if (data.success) {
        router.push(`/admin/communities/${communityId}/groups`)
      } else {
        setError(data.error || 'Failed to create group')
      }
    } catch (err) {
      console.error('[v0] Error creating group:', err)
      setError('An error occurred while creating the group')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminPageLayout title="Create Group">
      <div className="max-w-2xl space-y-6">
        <Link
          href={`/admin/communities/${communityId}/groups`}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ChevronLeft size={20} />
          Back to Groups
        </Link>

        <h2 className="text-2xl font-bold text-black">Create New Group</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
          {/* Group Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Group Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Prayer Circle, Book Club"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What is this group about?"
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              disabled={loading}
            />
          </div>

          {/* Gender Restriction */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Gender Restriction
            </label>
            <div className="space-y-2">
              {GENDER_RESTRICTION_OPTIONS.map((option) => (
                <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="genderRestriction"
                    value={option.value}
                    checked={formData.genderRestriction === option.value}
                    onChange={(e) => setFormData({ ...formData, genderRestriction: e.target.value })}
                    disabled={loading}
                    className="w-4 h-4"
                  />
                  <span className="text-gray-700">{option.label}</span>
                  <span className="text-xs text-gray-400">({option.description})</span>
                </label>
              ))}
            </div>
          </div>

          {/* Group Icon */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Group Icon (optional)
            </label>
            <div className="flex gap-4">
              {iconPreview && (
                <img src={iconPreview} alt="Preview" className="w-20 h-20 rounded-lg object-cover" />
              )}
              <label className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <Upload size={18} className="mr-2" />
                Choose File
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleIconChange}
                  disabled={loading}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 font-medium disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Group'}
            </button>
            <Link
              href={`/admin/communities/${communityId}/groups`}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </AdminPageLayout>
  )
}
