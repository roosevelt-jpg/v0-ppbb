'use client'

export const dynamic = 'force-dynamic'
import React, { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { createCommunity, updateCommunity, subscribeToCommunity } from '@/lib/community-queries'
import type { Community } from '@/lib/community-types'
import { ChevronLeft } from 'lucide-react'

const COMMUNITY_CATEGORIES = ['Professional', 'Hobby', 'Support', 'Charity', 'Social', 'Learning']
const COMMON_TAGS = ['mentorship', 'networking', 'wellness', 'spirituality', 'volunteering', 'fundraising']

function CreateCommunityContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const communityId = searchParams.get('id')

  const [loading, setLoading] = React.useState(!!communityId)
  const [saving, setSaving] = React.useState(false)
  const [community, setCommunity] = React.useState<Partial<Community>>({
    name: '',
    description: '',
    category: 'Professional',
    genderRestriction: 'mixed',
    isFeatured: false,
    tags: [],
    bannerURL: '',
    memberCount: 0,
    groupCount: 0,
  })

  React.useEffect(() => {
    if (communityId) {
      const unsubscribe = subscribeToCommunity(communityId, (data) => {
        if (data) {
          setCommunity(data)
        }
        setLoading(false)
      })
      return () => unsubscribe()
    }
  }, [communityId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (communityId) {
        await updateCommunity(communityId, community)
        alert('Community updated successfully')
      } else {
        const newId = await createCommunity(community)
        alert('Community created successfully')
      }
      router.push('/admin/community')
    } catch (error) {
      console.error('[v0] Error saving community:', error)
      alert('Failed to save community')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AdminPageLayout title={communityId ? 'Edit Community' : 'Create Community'}>
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500">Loading...</p>
        </div>
      </AdminPageLayout>
    )
  }

  return (
    <AdminPageLayout title={communityId ? 'Edit Community' : 'Create Community'}>
      <div className="max-w-2xl mx-auto space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ChevronLeft size={20} />
          Back
        </button>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Community Name</label>
            <input
              type="text"
              required
              value={community.name || ''}
              onChange={(e) => setCommunity({ ...community, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="e.g., Tech Enthusiasts Dubai"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              required
              rows={4}
              value={community.description || ''}
              onChange={(e) => setCommunity({ ...community, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="Describe this community"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={community.category || 'Professional'}
              onChange={(e) => setCommunity({ ...community, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            >
              {COMMUNITY_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Gender Restriction */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Gender Restriction</label>
            <select
              value={community.genderRestriction || 'mixed'}
              onChange={(e) => setCommunity({ ...community, genderRestriction: e.target.value as any })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="mixed">Open to all</option>
              <option value="men-only">Men only</option>
              <option value="ladies-only">Ladies only</option>
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {COMMON_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    const tags = community.tags || []
                    setCommunity({
                      ...community,
                      tags: tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag],
                    })
                  }}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    community.tags?.includes(tag)
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Banner URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Banner Image URL</label>
            <input
              type="url"
              value={community.bannerURL || ''}
              onChange={(e) => setCommunity({ ...community, bannerURL: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="https://..."
            />
            {community.bannerURL && (
              <img
                src={community.bannerURL}
                alt="Banner preview"
                className="mt-2 w-full h-32 object-cover rounded-lg"
              />
            )}
          </div>

          {/* Featured */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="featured"
              checked={community.isFeatured || false}
              onChange={(e) => setCommunity({ ...community, isFeatured: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300"
            />
            <label htmlFor="featured" className="text-sm font-medium text-gray-700">
              Featured Community
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 font-medium disabled:opacity-50"
            >
              {saving ? 'Saving...' : communityId ? 'Update Community' : 'Create Community'}
            </button>
          </div>
        </form>
      </div>
    </AdminPageLayout>
  )
}

export default function CreateCommunityPage() {
  return (
    <Suspense fallback={<AdminPageLayout title="Create Community"><div className="flex items-center justify-center py-12"><p className="text-gray-500">Loading...</p></div></AdminPageLayout>}>
      <CreateCommunityContent />
    </Suspense>
  )
}
