'use client'
export const dynamic = 'force-dynamic'

import React, { Suspense } from 'react'
import { useAuth } from '@/lib/auth-context'
import { hasBusinessAccess } from '@/lib/roles'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, MessageCircle, Send, ArrowLeft, Loader2 } from 'lucide-react'
import { DmInbox } from '@/components/dm/dm-inbox'

type DirectoryMember = {
  id: string
  displayName: string
  firstName?: string
  lastName?: string
  location?: string
  bio?: string
  skills?: string[]
}

export default function Marketplace() {
  const { user } = useAuth()
  const router = useRouter()
  const [members, setMembers] = React.useState<DirectoryMember[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [selectedMember, setSelectedMember] = React.useState<DirectoryMember | null>(null)
  const [message, setMessage] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [chatOpen, setChatOpen] = React.useState(false)

  React.useEffect(() => {
    if (!user || !hasBusinessAccess(user)) {
      router.push('/login')
      return
    }

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({ limit: '100' })
        if (search.trim()) params.set('search', search.trim())
        const res = await fetch(`/api/members/directory?${params.toString()}`)
        const json = await res.json()
        if (!json.success) throw new Error(json.error || 'Failed to load members')
        setMembers(
          (json.data || []).map((m: DirectoryMember) => ({
            ...m,
            skills: Array.isArray(m.skills) ? m.skills : [],
          }))
        )
      } catch (err) {
        console.error('[v0] Marketplace directory error:', err)
        setError('Unable to load member directory.')
        setMembers([])
      } finally {
        setLoading(false)
      }
    }

    const t = setTimeout(() => void load(), search ? 300 : 0)
    return () => clearTimeout(t)
  }, [user, router, search])

  const openChatWithMember = () => {
    if (!selectedMember) return
    if (message.trim()) {
      sessionStorage.setItem(`dm_draft_${selectedMember.id}`, message.trim())
    }
    setChatOpen(true)
  }

  if (!user || !hasBusinessAccess(user)) {
    return <div className="text-center py-8">Access Denied</div>
  }

  const showMobileDetail = Boolean(selectedMember)

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <div className="bg-white border-b border-[#e4e1da] px-4 py-6 sm:px-6 sm:py-8">
        <div className="max-w-6xl mx-auto min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111111]">Marketplace & Networking</h1>
          <p className="text-[#888888] mt-2 text-sm sm:text-base">
            Connect with community members who opted into the member directory
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 min-w-0">
        {chatOpen && selectedMember ? (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setChatOpen(false)}
              className="inline-flex items-center gap-2 text-sm font-medium text-[#111111] underline"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to {selectedMember.displayName}’s profile
            </button>
            <Card className="bg-white border-[#e4e1da] p-2 sm:p-4 overflow-hidden">
              <Suspense
                fallback={
                  <div className="flex justify-center py-16">
                    <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
                  </div>
                }
              >
                <DmInbox
                  key={selectedMember.id}
                  recipientId={selectedMember.id}
                  recipientLabel={selectedMember.displayName}
                  focused
                  onBack={() => setChatOpen(false)}
                  backLabel="Back to profile"
                />
              </Suspense>
            </Card>
          </div>
        ) : (
          <>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search members by name, location, or bio…"
              className="w-full mb-6 min-h-[44px] px-4 py-3 border border-neutral-300 rounded-lg text-sm"
            />

            {error ? <p className="text-sm text-red-600 mb-4">{error}</p> : null}

            {loading ? (
              <div className="text-center py-8">Loading members…</div>
            ) : members.length === 0 ? (
              <Card className="bg-white border-[#e4e1da] p-8 sm:p-12 text-center">
                <Users className="w-12 h-12 mx-auto mb-4 text-neutral-400" />
                <p className="text-[#888888]">No members in the directory yet.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 min-w-0">
                <div className={`lg:col-span-1 min-w-0 ${showMobileDetail ? 'hidden lg:block' : 'block'}`}>
                  <Card className="bg-white border-[#e4e1da] p-4 sm:p-6">
                    <h3 className="text-lg font-semibold text-[#111111] mb-4">Community Members</h3>
                    <div className="space-y-2 max-h-[min(24rem,50vh)] lg:max-h-96 overflow-y-auto">
                      {members.map((member) => {
                        const selected = selectedMember?.id === member.id
                        return (
                          <div
                            key={member.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                              setSelectedMember(member)
                              setChatOpen(false)
                              setMessage('')
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                setSelectedMember(member)
                                setChatOpen(false)
                                setMessage('')
                              }
                            }}
                            className={`w-full text-left p-3 min-h-[44px] rounded-lg border cursor-pointer transition-colors ${
                              selected
                                ? 'border-[#111111] border-2 bg-neutral-100'
                                : 'border-[#e4e1da] bg-white hover:bg-neutral-50'
                            }`}
                          >
                            <p className="font-semibold text-[#111111] truncate">{member.displayName}</p>
                            {member.location ? (
                              <p className="text-[#888888] text-xs truncate mt-0.5">{member.location}</p>
                            ) : null}
                          </div>
                        )
                      })}
                    </div>
                  </Card>
                </div>

                <div
                  className={`lg:col-span-2 min-w-0 ${showMobileDetail ? 'block' : 'hidden lg:block'}`}
                >
                  {selectedMember ? (
                    <Card className="bg-white border-[#e4e1da] p-4 sm:p-6">
                      <div className="flex items-center gap-2 mb-4 min-h-[44px]">
                        <button
                          type="button"
                          onClick={() => setSelectedMember(null)}
                          className="lg:hidden inline-flex items-center justify-center min-h-[36px] min-w-[36px] rounded-lg hover:bg-neutral-100"
                          aria-label="Back to members"
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </button>
                        <h3 className="text-lg sm:text-xl font-semibold text-[#111111] truncate">
                          {selectedMember.displayName}
                        </h3>
                      </div>

                      <div className="space-y-4 mb-6">
                        {selectedMember.location ? (
                          <div>
                            <p className="text-[#888888] text-xs uppercase">Location</p>
                            <p className="text-[#111111] font-semibold mt-1 break-words">
                              {selectedMember.location}
                            </p>
                          </div>
                        ) : null}
                        {selectedMember.bio ? (
                          <div>
                            <p className="text-[#888888] text-xs uppercase">Bio</p>
                            <p className="text-[#111111] mt-1 whitespace-pre-wrap break-words">
                              {selectedMember.bio}
                            </p>
                          </div>
                        ) : null}
                        {selectedMember.skills && selectedMember.skills.length > 0 ? (
                          <div>
                            <p className="text-[#888888] text-xs uppercase mb-2">Skills</p>
                            <div className="flex flex-wrap gap-2">
                              {selectedMember.skills.map((skill) => (
                                <span
                                  key={skill}
                                  className="bg-neutral-100 text-[#111111] px-3 py-1 rounded text-xs"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>

                      <div className="border-t border-[#e4e1da] pt-4">
                        <p className="text-[#888888] text-xs uppercase mb-2">Message</p>
                        <textarea
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Write your message…"
                          rows={4}
                          className="w-full min-h-[88px] p-3 border border-[#e4e1da] rounded-lg text-[#111111] text-sm mb-3 resize-y"
                        />
                        <Button
                          onClick={openChatWithMember}
                          className="flex items-center gap-2 w-full justify-center min-h-[44px] bg-[#111111] text-white hover:bg-neutral-800"
                        >
                          <Send className="w-4 h-4" />
                          Message {selectedMember.displayName}
                        </Button>
                      </div>
                    </Card>
                  ) : (
                    <Card className="bg-white border-[#e4e1da] p-8 sm:p-12 text-center hidden lg:block">
                      <MessageCircle className="w-12 h-12 mx-auto mb-4 text-[#888888] opacity-30" />
                      <p className="text-[#888888]">Select a member to start connecting</p>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
