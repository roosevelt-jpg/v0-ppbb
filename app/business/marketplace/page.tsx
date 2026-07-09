'use client'
export const dynamic = 'force-dynamic'

import React from 'react'
import { useAuth } from '@/lib/auth-context'
import { hasBusinessAccess } from '@/lib/roles'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, MessageCircle, Send } from 'lucide-react'

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

  const handleSendMessage = () => {
    if (!selectedMember) return
    if (message.trim()) {
      sessionStorage.setItem(`dm_draft_${selectedMember.id}`, message.trim())
    }
    router.push(`/dashboard/messages?to=${selectedMember.id}`)
  }

  if (!user || !hasBusinessAccess(user)) {
    return <div className="text-center py-8">Access Denied</div>
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#faf9f7' }}>
      <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e4e1da', padding: '32px' }}>
        <div className="max-w-6xl mx-auto">
          <h1 style={{ color: '#111111', fontSize: '32px', fontWeight: 700 }}>
            Marketplace & Networking
          </h1>
          <p style={{ color: '#888888', marginTop: '8px' }}>
            Connect with community members who opted into the member directory
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search members by name, location, or bio…"
          className="w-full mb-6 px-4 py-3 border border-neutral-300 rounded-lg text-sm"
        />

        {error ? <p className="text-sm text-red-600 mb-4">{error}</p> : null}

        {loading ? (
          <div className="text-center py-8">Loading members…</div>
        ) : members.length === 0 ? (
          <Card style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da', padding: '48px', textAlign: 'center' }}>
            <Users className="w-12 h-12 mx-auto mb-4 text-neutral-400" />
            <p style={{ color: '#888888' }}>No members in the directory yet.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <Card style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da', padding: '24px' }}>
                <h3 style={{ color: '#111111', fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
                  Community Members
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      onClick={() => setSelectedMember(member)}
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        backgroundColor:
                          selectedMember?.id === member.id ? '#f0f0f0' : '#ffffff',
                        border:
                          selectedMember?.id === member.id
                            ? '2px solid #111111'
                            : '1px solid #e4e1da',
                      }}
                    >
                      <p style={{ color: '#111111', fontWeight: 600 }}>{member.displayName}</p>
                      {member.location ? (
                        <p style={{ color: '#888888', fontSize: '12px' }}>{member.location}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div className="lg:col-span-2">
              {selectedMember ? (
                <Card style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da', padding: '24px' }}>
                  <h3 style={{ color: '#111111', fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>
                    {selectedMember.displayName}
                  </h3>

                  <div className="space-y-4 mb-6">
                    {selectedMember.location ? (
                      <div>
                        <p style={{ color: '#888888', fontSize: '12px', textTransform: 'uppercase' }}>
                          Location
                        </p>
                        <p style={{ color: '#111111', fontWeight: 600, marginTop: '4px' }}>
                          {selectedMember.location}
                        </p>
                      </div>
                    ) : null}
                    {selectedMember.bio ? (
                      <div>
                        <p style={{ color: '#888888', fontSize: '12px', textTransform: 'uppercase' }}>
                          Bio
                        </p>
                        <p style={{ color: '#111111', marginTop: '4px', whiteSpace: 'pre-wrap' }}>
                          {selectedMember.bio}
                        </p>
                      </div>
                    ) : null}
                    {selectedMember.skills && selectedMember.skills.length > 0 ? (
                      <div>
                        <p style={{ color: '#888888', fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px' }}>
                          Skills
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selectedMember.skills.map((skill) => (
                            <span
                              key={skill}
                              style={{
                                backgroundColor: '#f0f0f0',
                                color: '#111111',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                fontSize: '12px',
                              }}
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div style={{ borderTop: '1px solid #e4e1da', paddingTop: '16px' }}>
                    <p style={{ color: '#888888', fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Message
                    </p>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Write your message…"
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #e4e1da',
                        borderRadius: '8px',
                        color: '#111111',
                        fontFamily: 'inherit',
                        marginBottom: '12px',
                      }}
                    />
                    <Button
                      onClick={handleSendMessage}
                      style={{ backgroundColor: '#111111', color: '#ffffff' }}
                      className="flex items-center gap-2 w-full justify-center"
                    >
                      <Send className="w-4 h-4" />
                      Open Messages
                    </Button>
                  </div>
                </Card>
              ) : (
                <Card style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da', padding: '48px', textAlign: 'center' }}>
                  <MessageCircle style={{ color: '#888888', opacity: 0.3 }} className="w-12 h-12 mx-auto mb-4" />
                  <p style={{ color: '#888888' }}>Select a member to start connecting</p>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
