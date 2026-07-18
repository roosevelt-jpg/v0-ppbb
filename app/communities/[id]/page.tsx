'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { subscribeToCommunity, subscribeToCommunityGroups, joinGroup, subscribeToUserGroupMemberships } from '@/lib/community-queries'
import type { Community, Group } from '@/lib/community-types'
import { useAuth } from '@/lib/auth-context'
import { ChevronLeft, Users, Tag, MessageCircle, Lock } from 'lucide-react'
import { canJoinByGenderRestriction, genderRestrictionBadgeClass, genderRestrictionLabel } from '@/lib/community-governance'

export default function CommunityDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const communityId = params.id as string

  const [community, setCommunity] = React.useState<Community | null>(null)
  const [groups, setGroups] = React.useState<Group[]>([])
  const [userGroups, setUserGroups] = React.useState<Record<string, 'active' | 'pending' | 'rejected'>>({})
  const [loading, setLoading] = React.useState(true)
  const [joiningGroup, setJoiningGroup] = React.useState<string | null>(null)

  React.useEffect(() => {
    const unsubCommunity = subscribeToCommunity(communityId, (data) => {
      setCommunity(data)
      setLoading(false)
    })

    const unsubGroups = subscribeToCommunityGroups(communityId, (data) => {
      setGroups(data)
    }, user?.id)

    let unsubMemberships = () => {}
    if (user?.id) {
      unsubMemberships = subscribeToUserGroupMemberships(communityId, user.id, setUserGroups)
    }

    return () => {
      unsubCommunity()
      unsubGroups()
      unsubMemberships()
    }
  }, [communityId, user?.id])

  const handleJoinGroup = async (group: Group) => {
    if (!user) {
      alert('Please log in to join groups')
      return
    }

    setJoiningGroup(group.id!)
    try {
      const status = await joinGroup(
        communityId,
        group.id!,
        user.id,
        user.displayName || '',
        user.email || '',
        user.gender || '',
        user.photoURL || ''
      )
      setUserGroups((prev) => ({ ...prev, [group.id!]: status }))
    } catch (error) {
      console.error('[v0] Error joining group:', error)
      alert(error instanceof Error ? error.message : 'Failed to join group')
    } finally {
      setJoiningGroup(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Loading community...</p>
        </main>
        <Footer />
      </div>
    )
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center">
          <p className="text-gray-500 mb-4">Community not found</p>
          <button
            onClick={() => router.push('/communities')}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900"
          >
            Back to Communities
          </button>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 md:py-12">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ChevronLeft size={20} />
          Back
        </button>

        {/* Header */}
        <div className="space-y-4 mb-8">
          {community.bannerURL && (
            <div
              className="w-full h-40 md:h-56 bg-gray-200 bg-cover bg-center rounded-lg"
              style={{ backgroundImage: `url(${community.bannerURL})` }}
            />
          )}

          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-black mb-2">
              {community.name}
            </h1>
            <p className="text-gray-600 text-base md:text-lg mb-4">
              {community.description}
            </p>

            {/* Tags */}
            {community.tags && community.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {community.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700"
                  >
                    <Tag size={14} />
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Rules */}
          {community.rules && community.rules.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-bold text-black mb-3">Community Rules</h3>
              <ul className="space-y-2">
                {community.rules.map((rule, idx) => (
                  <li key={idx} className="text-sm text-gray-700 flex gap-2">
                    <span className="font-bold text-blue-600">{idx + 1}.</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-1">
                <Users size={16} className="text-gray-600" />
                <p className="text-sm text-gray-600">Members</p>
              </div>
              <p className="text-2xl font-bold text-black">{community.memberCount}</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600 mb-1">Groups</p>
              <p className="text-2xl font-bold text-black">{community.groupCount}</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600 mb-1">Category</p>
              <p className="text-lg font-bold text-black">{community.category}</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600 mb-1">Access</p>
              <p className="text-lg font-bold text-black capitalize">
                {community.genderRestriction === 'mixed'
                  ? 'All'
                  : community.genderRestriction.replace('-', ' ')}
              </p>
            </div>
          </div>
        </div>

        {/* Groups Section */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-black">Discussion Groups</h2>

          {groups.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No groups available yet</p>
            </div>
          ) : (
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {groups.map((group) => {
                const membership = userGroups[group.id!]
                const isCreator = Boolean(user?.id && group.createdBy === user.id)
                const isMember = membership === 'active' || isCreator
                const isPending = membership === 'pending' && !isCreator
                const genderCheck = canJoinByGenderRestriction(group.genderRestriction, user?.gender)
                const isRestricted = !isCreator && !genderCheck.allowed

                return (
                  <div
                    key={group.id}
                    className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 space-y-2.5 overflow-hidden"
                  >
                    {group.iconURL && (
                      <img
                        src={group.iconURL}
                        alt={group.name}
                        className="w-full h-20 sm:h-24 object-cover rounded-md"
                      />
                    )}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-black text-sm sm:text-base mb-0.5 line-clamp-1">
                          {group.name}
                        </h3>
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {group.description}
                        </p>
                      </div>
                      {isRestricted && (
                        <Lock className="text-gray-400 shrink-0" size={16} />
                      )}
                    </div>

                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full inline-block ${genderRestrictionBadgeClass(group.genderRestriction)}`}
                    >
                      {genderRestrictionLabel(group.genderRestriction)}
                    </span>

                    {/* Group Stats */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <Users size={12} />
                        {group.memberCount} members
                      </div>
                      <span className="text-[11px] bg-gray-100 px-1.5 py-0.5 rounded capitalize text-gray-700">
                        {group.type.replace('-', ' ')}
                      </span>
                    </div>

                    {/* Gender Restriction Badge */}
                    {isRestricted && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs">
                        <p className="text-amber-900 font-medium flex items-center gap-1">
                          <Lock size={12} />
                          {genderRestrictionLabel(group.genderRestriction)} group
                        </p>
                        <p className="text-amber-700 text-[11px] mt-0.5">
                          {genderCheck.reason || 'This group has a gender restriction.'}
                        </p>
                      </div>
                    )}

                    {/* Action Button */}
                    {isMember ? (
                      <button
                        type="button"
                        onClick={() => router.push(`/communities/${communityId}/groups/${group.id}`)}
                        className="w-full px-3 py-1.5 rounded-lg font-medium text-xs sm:text-sm bg-black !text-white hover:bg-gray-900 min-h-[36px]"
                      >
                        Enter Group
                      </button>
                    ) : isPending ? (
                      <button
                        type="button"
                        disabled
                        className="w-full px-3 py-1.5 rounded-lg font-medium text-xs sm:text-sm bg-white border border-gray-300 text-black min-h-[36px]"
                      >
                        Pending Approval
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleJoinGroup(group)}
                        disabled={joiningGroup === group.id || isRestricted}
                        className={`w-full px-3 py-1.5 rounded-lg font-medium text-xs sm:text-sm transition-colors min-h-[36px] ${
                          isRestricted
                            ? 'bg-white border border-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-black !text-white hover:bg-gray-900'
                        }`}
                      >
                        {isRestricted
                          ? 'Access Denied'
                          : joiningGroup === group.id
                          ? 'Joining...'
                          : 'Join Group'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
