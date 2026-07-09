'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import Link from 'next/link'
import { subscribeToAllCommunities, joinCommunity, subscribeToUserCommunities } from '@/lib/community-queries'
import type { Community } from '@/lib/community-types'
import { genderRestrictionBadgeClass, genderRestrictionLabel } from '@/lib/community-governance'
import { useAuth } from '@/lib/auth-context'
import { Search, Users, Tag } from 'lucide-react'
import { CommunityListSkeleton } from '@/components/community-list-skeleton'

function CommunityCard({
  community,
  isJoined,
  joining,
  onJoin,
}: {
  community: Community
  isJoined: boolean
  joining: boolean
  onJoin: () => void
}) {
  const iconUrl = community.iconURL || community.logoURL

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      {community.bannerURL ? (
        <div
          className="w-full h-32 md:h-40 bg-gray-200 bg-cover bg-center relative"
          style={{ backgroundImage: `url(${community.bannerURL})` }}
        >
          {iconUrl && (
            <img
              src={iconUrl}
              alt=""
              className="absolute bottom-3 left-3 w-14 h-14 rounded-xl border-2 border-white object-cover shadow-md bg-white"
            />
          )}
        </div>
      ) : iconUrl ? (
        <div className="p-4 pb-0">
          <img src={iconUrl} alt="" className="w-16 h-16 rounded-xl object-cover border border-gray-200" />
        </div>
      ) : null}

      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-black text-lg line-clamp-2">{community.name}</h3>
          <span
            className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${genderRestrictionBadgeClass(community.genderRestriction)}`}
          >
            {genderRestrictionLabel(community.genderRestriction)}
          </span>
        </div>

        <p className="text-sm text-gray-600 line-clamp-2">{community.description}</p>

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
              <span className="text-xs text-gray-500 px-2 py-1">+{community.tags.length - 2}</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Users size={14} />
            {community.memberCount}
          </div>
          <span className="text-xs">{community.groupCount} groups</span>
        </div>

        {isJoined ? (
          <Link
            href={`/communities/${community.id}`}
            className="w-full inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-300 text-black rounded-lg hover:bg-gray-50 font-medium text-sm md:text-base min-h-[44px]"
          >
            Joined · View Groups
          </Link>
        ) : (
          <button
            type="button"
            onClick={onJoin}
            disabled={joining}
            className="w-full px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 font-medium disabled:opacity-50 text-sm md:text-base min-h-[44px]"
          >
            {joining ? 'Joining...' : 'Join Community'}
          </button>
        )}
      </div>
    </div>
  )
}

export default function CommunitiesPage() {
  const { user } = useAuth()
  const [communities, setCommunities] = React.useState<Community[]>([])
  const [filtered, setFiltered] = React.useState<Community[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [selectedCategory, setSelectedCategory] = React.useState<string>('')
  const [selectedGender, setSelectedGender] = React.useState<string>('all')
  const [joining, setJoining] = React.useState<string | null>(null)
  const [joinedIds, setJoinedIds] = React.useState<Set<string>>(new Set())

  React.useEffect(() => {
    const unsubscribe = subscribeToAllCommunities((data) => {
      setCommunities(data.filter((c) => c.status === 'active' && c.visibility === 'public'))
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  React.useEffect(() => {
    if (!user?.id) {
      setJoinedIds(new Set())
      return
    }
    const unsub = subscribeToUserCommunities(user.id, (joined) => {
      setJoinedIds(new Set(joined.map((c) => c.id!).filter(Boolean)))
    })
    return () => unsub()
  }, [user?.id])

  React.useEffect(() => {
    let result = communities

    if (searchTerm) {
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedCategory) {
      result = result.filter((c) => c.category === selectedCategory)
    }

    if (selectedGender !== 'all') {
      result = result.filter((c) => c.genderRestriction === selectedGender || c.genderRestriction === 'mixed')
    }

    setFiltered(result)
  }, [communities, searchTerm, selectedCategory, selectedGender])

  const handleJoinCommunity = async (community: Community) => {
    if (!user) {
      alert('Please log in to join communities')
      return
    }

    setJoining(community.id!)
    try {
      await joinCommunity(community.id!, user.id, user.displayName || '', user.email || '', user.gender, user.photoURL)
      setJoinedIds((prev) => new Set(prev).add(community.id!))
    } catch (error) {
      console.error('[v0] Error joining community:', error)
      alert(error instanceof Error ? error.message : 'Failed to join community')
    } finally {
      setJoining(null)
    }
  }

  const isJoined = (communityId?: string) => Boolean(communityId && joinedIds.has(communityId))

  const categories = Array.from(new Set(communities.map((c) => c.category)))
  const featuredCommunities = filtered.filter((c) => c.isFeatured).slice(0, 3)
  const otherCommunities = filtered.filter((c) => !c.isFeatured)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 md:py-12 space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-black mb-4">Join a Community</h1>
          <p className="text-base md:text-lg text-gray-600">Connect with like-minded people and make an impact together</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search communities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 md:mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black text-sm"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 md:mb-2">Gender</label>
              <select
                value={selectedGender}
                onChange={(e) => setSelectedGender(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black text-sm"
              >
                <option value="all">All</option>
                <option value="mixed">All genders</option>
                <option value="male">Men only</option>
                <option value="female">Women only</option>
              </select>
            </div>

            <div className="flex items-end">
              <p className="text-sm text-gray-600">{filtered.length} communities found</p>
            </div>
          </div>
        </div>

        {loading ? (
          <CommunityListSkeleton count={6} />
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500 text-lg">No communities found. Try adjusting your filters.</p>
          </div>
        ) : (
          <>
            {featuredCommunities.length > 0 && (
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-black mb-4">Featured Communities</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                  {featuredCommunities.map((community) => (
                    <CommunityCard
                      key={community.id}
                      community={community}
                      isJoined={isJoined(community.id)}
                      joining={joining === community.id}
                      onJoin={() => handleJoinCommunity(community)}
                    />
                  ))}
                </div>
              </div>
            )}

            {otherCommunities.length > 0 && (
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-black mb-4">
                  {featuredCommunities.length > 0 ? 'All Communities' : 'Communities'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {otherCommunities.map((community) => (
                    <CommunityCard
                      key={community.id}
                      community={community}
                      isJoined={isJoined(community.id)}
                      joining={joining === community.id}
                      onJoin={() => handleJoinCommunity(community)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}
