'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { ArrowLeft, Upload } from 'lucide-react'
import Link from 'next/link'

export default function CreateTeamMemberPage() {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)
  const [imageFile, setImageFile] = React.useState<File | null>(null)
  const [imagePreview, setImagePreview] = React.useState<string>('')
  const [error, setError] = React.useState('')

  const [formData, setFormData] = React.useState({
    name: '',
    role: '',
    bio: '',
    email: '',
    linkedin: '',
    twitter: '',
    order: 0,
    status: 'draft',
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'order' ? parseInt(value) : value,
    }))
  }

  const uploadImageToStorage = async (file: File): Promise<string> => {
    const formDataForUpload = new FormData()
    formDataForUpload.append('file', file)
    formDataForUpload.append('folder', 'team-members')

    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      body: formDataForUpload,
    })

    const json = await res.json()
    if (!json.success) {
      throw new Error(json.error || 'Failed to upload image')
    }

    return json.data.url // Return the Storage URL
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!formData.name || !formData.role) {
        setError('Name and role are required')
        setLoading(false)
        return
      }

      let imageUrl = ''

      // Upload image to Firebase Storage if provided
      if (imageFile) {
        imageUrl = await uploadImageToStorage(imageFile)
      }

      // Save team member data to Firestore with Storage URL
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          role: formData.role,
          bio: formData.bio,
          imageUrl, // Only URL stored in Firestore, file in Storage
          socialLinks: {
            email: formData.email,
            linkedin: formData.linkedin,
            twitter: formData.twitter,
          },
          order: formData.order,
          status: formData.status,
        }),
      })

      const json = await res.json()
      if (json.success) {
        router.push('/admin/team')
        router.refresh()
      } else {
        setError(json.error || 'Failed to create team member')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminPageLayout title="Add Team Member">
      <div className="w-full max-w-4xl">
        <Link
          href="/admin/team"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={18} />
          Back to Team Members
        </Link>

        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-black mb-6">Create New Team Member</h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">Profile Image</label>
              <div className="flex gap-6">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-32 h-32 rounded-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null)
                        setImagePreview('')
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                    <span className="text-gray-500 text-xs">No image</span>
                  </div>
                )}

                <div className="flex-1">
                  <label className="flex flex-col gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 cursor-pointer font-medium">
                      <Upload size={18} />
                      Choose Image
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 mt-2">Image will be stored in Firebase Storage</p>
                </div>
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., John Doe"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Role *</label>
                <input
                  type="text"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  placeholder="e.g., Program Manager"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  required
                />
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Tell us about this team member..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black resize-none"
              />
            </div>

            {/* Social Links */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">Social Links</label>
              <div className="space-y-3">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Email address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
                <input
                  type="url"
                  name="linkedin"
                  value={formData.linkedin}
                  onChange={handleInputChange}
                  placeholder="LinkedIn profile URL"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
                <input
                  type="url"
                  name="twitter"
                  value={formData.twitter}
                  onChange={handleInputChange}
                  placeholder="Twitter profile URL"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </div>

            {/* Order & Status */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Display Order</label>
                <input
                  type="number"
                  name="order"
                  value={formData.order}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-900 disabled:bg-gray-400 transition-colors"
              >
                {loading ? 'Creating...' : 'Create Team Member'}
              </button>
              <Link
                href="/admin/team"
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-900 font-semibold rounded-lg hover:bg-gray-300 transition-colors text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </AdminPageLayout>
  )
}
