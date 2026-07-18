'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import Link from 'next/link'
import { subscribeToAllCommunities, joinCommunity, subscribeToUserCommunities } from '@/lib/community-queries'
import type { Community } from '@/lib/community-types'
import { genderRestrictionLabel } from '@/lib/community-governance'
import { useAuth } from '@/lib/auth-context'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { CommunityListSkeleton } from '@/components/community-list-skeleton'

type ListTab = 'suggestions' | 'popular' | 'mine'

function formatMemberCount(count: number | undefined): string {
  const n = Number(count) || 0
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M members`
  if (n >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}k members`
  return `${n} member${n === 1 ? '' : 's'}`
}

function categoryLabel(category: string | undefined): string {
  if (!category) return 'General'
  return category.charAt(0).toUpperCase() + category.slice(1)
}

function communityCover(community: Community): string {
  return community.bannerURL || ''
}

function communityAvatar(community: Community): string {
  return community.logoURL || (community as { iconURL?: string }).iconURL || ''
}

function CommunityShortCard({
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
  const cover = communityCover(community)
  const avatar = communityAvatar(community)
  const href = `/communities/${community.id}`
  const meta = `${categoryLabel(community.category)} · ${formatMemberCount(community.memberCount)}`

  return (
    <article className="bg-white border border-[#e4e1da] rounded-xl overflow-hidden flex flex-col h-full">
      <div className="relative">
        {cover ? (
          <div
            className="w-full h-20 sm:h-24 bg-neutral-200 bg-cover bg-center"
            style={{ backgroundImage: `url(${cover})` }}
            role="img"
            aria-label=""
          />
        ) : (
          <div className="w-full h-20 sm:h-24 bg-gradient-to-br from-neutral-800 to-neutral-600" />
        )}
        <div className="absolute -bottom-3.5 left-3">
          {avatar ? (
            <img
              src={avatar}
              alt=""
              className="w-9 h-9 rounded-full border-2 border-white object-cover bg-white shadow-sm"
            />
          ) : (
            <div className="w-9 h-9 rounded-full border-2 border-white bg-neutral-900 text-white flex items-center justify-center text-xs font-bold shadow-sm">
              {(community.name || 'C').charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>

      <div className="pt-5 px-3 pb-3 flex flex-col flex-1 gap-2">
        <div className="min-w-0 space-y-0.5">
          <h3 className="font-headline text-sm sm:text-base font-bold text-black line-clamp-2 leading-snug">
            {community.name}
          </h3>
          <p className="text-xs text-neutral-500 truncate">{meta}</p>
          {community.genderRestriction && community.genderRestriction !== 'mixed' ? (
            <p className="text-[11px] text-neutral-400">
              {genderRestrictionLabel(community.genderRestriction)}
            </p>
          ) : null}
        </div>

        <div className="mt-auto grid grid-cols-2 gap-1.5 pt-0.5">
          {isJoined ? (
            <Link
              href={href}
              className="col-span-2 inline-flex items-center justify-center min-h-[36px] px-2.5 bg-black text-white rounded-lg text-xs font-semibold hover:bg-neutral-900"
            >
              Open community
            </Link>
          ) : (
            <>
              <button
                type="button"
                onClick={onJoin}
                disabled={joining}
                className="inline-flex items-center justify-center min-h-[36px] px-2.5 bg-black text-white rounded-lg text-xs font-semibold hover:bg-neutral-900 disabled:opacity-50"
              >
                {joining ? 'Joining…' : 'Join'}
              </button>
              <Link
                href={href}
                className="inline-flex items-center justify-center min-h-[36px] px-2.5 bg-white text-black border border-[#e4e1da] rounded-lg text-xs font-semibold hover:bg-neutral-50"
              >
                View
              </Link>
            </>
          )}
        </div>
      </div>
    </article>
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
  const [listTab, setListTab] = React.useState<ListTab>('suggestions')
  const categoriesRailRef = React.useRef<HTMLDivElement>(null)

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
      const q = searchTerm.toLowerCase()
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.description || '').toLowerCase().includes(q) ||
          (c.category || '').toLowerCase().includes(q)
      )
    }

    if (selectedCategory) {
      result = result.filter((c) => c.category === selectedCategory)
    }

    if (selectedGender !== 'all') {
      result = result.filter(
        (c) => c.genderRestriction === selectedGender || c.genderRestriction === 'mixed'
      )
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
      await joinCommunity(
        community.id!,
        user.id,
        user.displayName || '',
        user.email || '',
        user.gender,
        user.photoURL
      )
      setJoinedIds((prev) => new Set(prev).add(community.id!))
    } catch (error) {
      console.error('[v0] Error joining community:', error)
      alert(error instanceof Error ? error.message : 'Failed to join community')
    } finally {
      setJoining(null)
    }
  }

  const isJoined = (communityId?: string) => Boolean(communityId && joinedIds.has(communityId))

  const categories = Array.from(new Set(communities.map((c) => c.category).filter(Boolean)))

  const categoryTiles = categories.map((cat) => {
    const inCat = communities.filter((c) => c.category === cat)
    const cover =
      inCat.find((c) => c.bannerURL)?.bannerURL ||
      inCat.find((c) => c.logoURL)?.logoURL ||
      ''
    return {
      id: cat,
      label: categoryLabel(cat),
      count: inCat.length,
      cover,
    }
  })

  const listedCommunities = React.useMemo(() => {
    const base = [...filtered]
    if (listTab === 'mine') {
      return base.filter((c) => c.id && joinedIds.has(c.id))
    }
    if (listTab === 'popular') {
      return base.sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0))
    }
    // Suggestions: featured first, then by recency/name within the rest
    return base.sort((a, b) => {
      const af = a.isFeatured ? 1 : 0
      const bf = b.isFeatured ? 1 : 0
      if (bf !== af) return bf - af
      return (b.memberCount || 0) - (a.memberCount || 0)
    })
  }, [filtered, listTab, joinedIds])

  const scrollCategories = (dir: -1 | 1) => {
    const el = categoriesRailRef.current
    if (!el) return
    el.scrollBy({ left: dir * Math.min(320, el.clientWidth * 0.7), behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-[#f7f6f2] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8 md:space-y-10">
        <div className="text-center space-y-3">
          <h1 className="font-headline text-3xl md:text-4xl font-bold text-black">
            Join a Community
          </h1>
          <p className="text-base md:text-lg text-neutral-600 max-w-2xl mx-auto">
            Connect with like-minded people and make an impact together
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#e4e1da] p-4 md:p-5 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
            <input
              type="text"
              placeholder="Search communities…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full min-h-[48px] pl-10 pr-4 py-3 border border-[#e4e1da] rounded-xl focus:ring-2 focus:ring-black focus:border-transparent bg-white text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 border border-[#e4e1da] rounded-xl focus:ring-2 focus:ring-black text-sm bg-white"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {categoryLabel(cat)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Gender</label>
              <select
                value={selectedGender}
                onChange={(e) => setSelectedGender(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 border border-[#e4e1da] rounded-xl focus:ring-2 focus:ring-black text-sm bg-white"
              >
                <option value="all">All</option>
                <option value="mixed">All genders</option>
                <option value="male">Men only</option>
                <option value="female">Women only</option>
              </select>
            </div>

            <div className="flex items-end">
              <p className="text-sm text-neutral-500 pb-2">
                {listedCommunities.length} communities found
              </p>
            </div>
          </div>
        </div>

        {/* Tabs — Suggestions / Popular / My Groups */}
        <div className="border-b border-[#e4e1da]">
          <nav className="flex gap-6 sm:gap-8 overflow-x-auto" aria-label="Community lists">
            {(
              [
                { id: 'suggestions' as const, label: 'Suggestions' },
                { id: 'popular' as const, label: 'Popular' },
                { id: 'mine' as const, label: 'My Groups' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setListTab(tab.id)}
                className={`relative pb-3 text-sm sm:text-base font-semibold whitespace-nowrap transition-colors ${
                  listTab === tab.id
                    ? 'text-black'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                {tab.label}
                {listTab === tab.id ? (
                  <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-black rounded-full" />
                ) : null}
              </button>
            ))}
          </nav>
        </div>

        {loading ? (
          <CommunityListSkeleton count={6} />
        ) : listedCommunities.length === 0 ? (
          <div className="text-center py-14 bg-white rounded-2xl border border-[#e4e1da]">
            <p className="text-neutral-500 text-base">
              {listTab === 'mine'
                ? user
                  ? 'You have not joined any communities yet.'
                  : 'Sign in to see communities you have joined.'
                : 'No communities found. Try adjusting your filters.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {listedCommunities.map((community) => (
              <CommunityShortCard
                key={community.id}
                community={community}
                isJoined={isJoined(community.id)}
                joining={joining === community.id}
                onJoin={() => handleJoinCommunity(community)}
              />
            ))}
          </div>
        )}

        {/* Categories rail */}
        {categoryTiles.length > 0 ? (
          <section className="space-y-4 pt-2">
            <div className="flex items-end justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <h2 className="font-headline text-xl sm:text-2xl font-bold text-black">
                  Categories
                </h2>
                <p className="text-sm text-neutral-500">
                  Find a group by browsing top categories.
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => scrollCategories(-1)}
                  className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-[#e4e1da] bg-white hover:bg-neutral-50"
                  aria-label="Scroll categories left"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => scrollCategories(1)}
                  className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-[#e4e1da] bg-white hover:bg-neutral-50"
                  aria-label="Scroll categories right"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            <div
              ref={categoriesRailRef}
              className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory"
            >
              {categoryTiles.map((tile) => {
                const active = selectedCategory === tile.id
                return (
                  <button
                    key={tile.id}
                    type="button"
                    onClick={() =>
                      setSelectedCategory((prev) => (prev === tile.id ? '' : tile.id))
                    }
                    className={`relative shrink-0 w-[9.5rem] sm:w-44 h-28 sm:h-32 rounded-2xl overflow-hidden snap-start border ${
                      active ? 'border-black ring-2 ring-black/20' : 'border-[#e4e1da]'
                    }`}
                  >
                    {tile.cover ? (
                      <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${tile.cover})` }}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-neutral-600" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-3 text-left">
                      <p className="text-white font-semibold text-sm capitalize truncate">
                        {tile.label}
                      </p>
                      <p className="text-white/75 text-xs mt-0.5">
                        {tile.count} communit{tile.count === 1 ? 'y' : 'ies'}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>
        ) : null}
      </main>

      <Footer />
    </div>
  )
}
