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
    })

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
        user.gender,
        user.photoURL
      )
      setUserGroups((prev) => ({ ...prev, [group.id!]: status }))
    } catch (error) {
      console.error('[v0] Error joining group:', error)
      alert('Failed to join group')
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
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              {groups.map((group) => {
                const membership = userGroups[group.id!]
                const isMember = membership === 'active'
                const isPending = membership === 'pending'
                const genderCheck = canJoinByGenderRestriction(group.genderRestriction, user?.gender)
                const isRestricted = !genderCheck.allowed

                return (
                  <div
                    key={group.id}
                    className="bg-white rounded-lg border border-gray-200 p-6 space-y-4 overflow-hidden"
                  >
                    {group.iconURL && (
                      <img
                        src={group.iconURL}
                        alt={group.name}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-black text-lg mb-1">
                          {group.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {group.description}
                        </p>
                      </div>
                      {isRestricted && (
                        <Lock className="text-gray-400" size={20} />
                      )}
                    </div>

                    <span
                      className={`text-xs font-medium px-3 py-1 rounded-full inline-block ${genderRestrictionBadgeClass(group.genderRestriction)}`}
                    >
                      {genderRestrictionLabel(group.genderRestriction)}
                    </span>

                    {/* Group Stats */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Users size={14} />
                        {group.memberCount} members
                      </div>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded capitalize text-gray-700">
                        {group.type.replace('-', ' ')}
                      </span>
                    </div>

                    {/* Gender Restriction Badge */}
                    {isRestricted && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
                        <p className="text-amber-900 font-medium flex items-center gap-1">
                          <Lock size={14} />
                          {genderRestrictionLabel(group.genderRestriction)} group
                        </p>
                        <p className="text-amber-700 text-xs mt-1">
                          {genderCheck.reason || 'This group has a gender restriction.'}
                        </p>
                      </div>
                    )}

                    {/* Action Button */}
                    {isMember ? (
                      <button
                        type="button"
                        onClick={() => router.push(`/communities/${communityId}/groups/${group.id}`)}
                        className="w-full px-4 py-2 rounded-lg font-medium bg-black !text-white hover:bg-gray-900 min-h-[44px]"
                      >
                        Enter Group
                      </button>
                    ) : isPending ? (
                      <button
                        type="button"
                        disabled
                        className="w-full px-4 py-2 rounded-lg font-medium bg-white border border-gray-300 text-black min-h-[44px]"
                      >
                        Pending Approval
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleJoinGroup(group)}
                        disabled={joiningGroup === group.id || isRestricted}
                        className={`w-full px-4 py-2 rounded-lg font-medium transition-colors min-h-[44px] ${
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
