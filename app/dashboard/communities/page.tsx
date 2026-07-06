'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
import Link from 'next/link'
import { subscribeToUserCommunities } from '@/lib/community-queries'
import type { Community } from '@/lib/community-types'
import { useAuth } from '@/lib/auth-context'
import { Users, Tag, ChevronRight } from 'lucide-react'

export default function MyCommunities() {
  const { user } = useAuth()
  const [communities, setCommunities] = React.useState<Community[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const unsubscribe = subscribeToUserCommunities(user.id, (data) => {
      setCommunities(data)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  if (!user) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold text-black">My Communities</h1>
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500 mb-4">Please log in to view your communities</p>
          <Link href="/login" className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900">
            Log In
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold text-black">My Communities</h1>
        <p className="text-gray-500">Loading communities...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-bold text-black">My Communities</h1>
        <Link
          href="/communities"
          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 font-medium"
        >
          Explore Communities
        </Link>
      </div>

      {communities.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200 space-y-4">
          <p className="text-gray-500">You haven&apos;t joined any communities yet</p>
          <Link
            href="/communities"
            className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900"
          >
            Browse Communities
            <ChevronRight size={18} />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {communities.map((community) => (
            <Link
              key={community.id}
              href={`/communities/${community.id}`}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Banner */}
              {community.bannerURL && (
                <div
                  className="w-full h-40 bg-gray-200 bg-cover bg-center"
                  style={{ backgroundImage: `url(${community.bannerURL})` }}
                />
              )}

              {/* Content */}
              <div className="p-4 space-y-3">
                <h3 className="font-bold text-black text-lg line-clamp-2 hover:text-blue-600">
                  {community.name}
                </h3>

                <p className="text-sm text-gray-600 line-clamp-2">
                  {community.description}
                </p>

                {/* Tags */}
                {community.tags && community.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {community.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs text-gray-700"
                      >
                        <Tag size={12} />
                        {tag}
                      </span>
                    ))}
                    {community.tags.length > 2 && (
                      <span className="text-xs text-gray-500 px-2 py-1">
                        +{community.tags.length - 2}
                      </span>
                    )}
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Users size={14} />
                    {community.memberCount}
                  </div>
                  <span className="text-xs text-gray-500">{community.groupCount} groups</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
