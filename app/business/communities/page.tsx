'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
import { useAuth } from '@/lib/auth-context'
import { hasBusinessAccess } from '@/lib/roles'
import { useRouter } from 'next/navigation'
import { subscribeToBusinessCommunities } from '@/lib/business-queries'
import { Community } from '@/lib/community-types'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import { db } from '@/lib/firebase'
import { deleteDoc, doc } from 'firebase/firestore'

export default function BusinessCommunitiesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [communities, setCommunities] = React.useState<Community[]>([])
  const [loading, setLoading] = React.useState(true)
  const [showApprovalsHint, setShowApprovalsHint] = React.useState(false)

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setShowApprovalsHint(window.location.search.includes('focus=approvals'))
    }
  }, [])

  React.useEffect(() => {
    if (!user || !hasBusinessAccess(user)) {
      router.push('/login')
      return
    }

    const unsubscribe = subscribeToBusinessCommunities(user.id, (data) => {
      setCommunities(data)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user, router])

  const handleDelete = async (communityId: string) => {
    if (!confirm('Delete this community?')) return
    try {
      await deleteDoc(doc(db, 'communities', communityId))
    } catch (error) {
      console.error('[v0] Error deleting community:', error)
      alert('Failed to delete community')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading communities...</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#faf9f7' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e4e1da', padding: '24px 32px' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 style={{ color: '#111111', fontSize: '28px', fontWeight: 700 }}>Communities</h1>
            <p style={{ color: '#888888', marginTop: '4px' }}>
              Manage your business communities and groups
            </p>
            {showApprovalsHint ? (
              <p
                style={{
                  marginTop: '12px',
                  padding: '12px',
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fcd34d',
                  borderRadius: '8px',
                  color: '#92400e',
                  fontSize: '14px',
                  maxWidth: '560px',
                }}
              >
                Open a community, then a group you created, to approve or reject pending members.
                The Pending Members panel appears for group creators and platform admins.
              </p>
            ) : null}
          </div>
          <button
            onClick={() => router.push('/business/communities/create')}
            style={{
              backgroundColor: '#111111',
              color: '#ffffff',
              padding: '12px 20px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 600,
            }}
            className="hover:bg-black"
          >
            <Plus size={18} />
            Create Community
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-8">
        {communities.length === 0 ? (
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e4e1da',
              padding: '48px 32px',
              textAlign: 'center',
            }}
          >
            <p style={{ color: '#888888', marginBottom: '16px' }}>No communities yet</p>
            <button
              onClick={() => router.push('/business/communities/create')}
              style={{
                backgroundColor: '#111111',
                color: '#ffffff',
                padding: '12px 24px',
                borderRadius: '8px',
                fontWeight: 600,
              }}
              className="hover:bg-black"
            >
              Create Your First Community
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {communities.map((community) => (
              <div
                key={community.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e4e1da',
                  padding: '20px',
                }}
              >
                {community.bannerURL && (
                  <img
                    src={community.bannerURL}
                    alt={community.name}
                    className="w-full h-32 object-cover rounded-lg mb-4"
                  />
                )}
                <h3 style={{ color: '#111111', fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>
                  {community.name}
                </h3>
                <p style={{ color: '#888888', fontSize: '14px', marginBottom: '12px' }}>
                  {community.description}
                </p>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  {community.tags?.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        backgroundColor: '#f0f0f0',
                        color: '#666666',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                  <button
                    onClick={() => router.push(`/business/communities/${community.id}`)}
                    style={{
                      flex: 1,
                      backgroundColor: '#111111',
                      color: '#ffffff',
                      padding: '10px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: 600,
                    }}
                    className="hover:bg-black"
                  >
                    View
                  </button>
                  <button
                    onClick={() => router.push(`/business/communities/${community.id}/edit`)}
                    style={{
                      padding: '10px 12px',
                      backgroundColor: '#f0f0f0',
                      borderRadius: '6px',
                      color: '#111111',
                    }}
                    className="hover:bg-gray-200"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(community.id)}
                    style={{
                      padding: '10px 12px',
                      backgroundColor: '#f0f0f0',
                      borderRadius: '6px',
                      color: '#d32f2f',
                    }}
                    className="hover:bg-gray-200"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
