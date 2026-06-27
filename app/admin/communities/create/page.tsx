'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { auth } from '@/lib/firebase'

export default function CreateCommunityPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser)
    })
    return () => unsubscribe()
  }, [])
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'general',
    visibility: 'public',
    rules: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      alert('You must be logged in')
      return
    }

    setLoading(true)
    try {
      console.log('[v0] Creating community:', { ...formData, createdBy: user.uid })

      const response = await fetch('/api/communities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          createdBy: user.uid,
          rules: formData.rules.split('\n').filter(r => r.trim()),
        }),
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.error)

      console.log('[v0] Community created successfully:', data.data.id)
      alert('Community created successfully!')
      router.push('/admin/communities')
    } catch (error: any) {
      console.error('[v0] Error creating community:', error)
      alert(`Failed to create community: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminPageLayout title="Create Community" subtitle="Add a new community to the platform">
      <div className="w-full max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg border border-gray-200">
          <div>
            <label className="block text-sm font-medium text-black mb-2">Community Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="e.g., Technology Enthusiasts"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-black placeholder-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Describe the community purpose and focus..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-black placeholder-gray-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-black mb-2">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-black"
              >
                <option value="general">General</option>
                <option value="interest">Interest Group</option>
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
                onChange={(e) => setFormData({...formData, visibility: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-black"
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="restricted">Restricted</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">Community Rules (one per line)</label>
            <textarea
              value={formData.rules}
              onChange={(e) => setFormData({...formData, rules: e.target.value})}
              placeholder="1. Be respectful&#10;2. No spam&#10;3. Follow guidelines"
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-black placeholder-gray-500"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-600 transition font-medium"
            >
              {loading ? 'Creating...' : 'Create Community'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 bg-gray-200 text-black rounded-lg hover:bg-gray-300 transition font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </AdminPageLayout>
  )
}
