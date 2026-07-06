'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { hasBusinessAccess } from '@/lib/roles'
import { ArrowLeft } from 'lucide-react'

export default function CreateCommunityPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'business',
    visibility: 'public',
    rules: '',
  })

  React.useEffect(() => {
    if (user && !hasBusinessAccess(user)) {
      router.push('/login')
    }
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      alert('You must be logged in')
      return
    }

    setLoading(true)
    try {
      console.log('[v0] Creating business community:', { ...formData, createdBy: user.id, businessId: user.id })

      const response = await fetch('/api/communities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          createdBy: user.id,
          businessId: user.id,
          rules: formData.rules.split('\n').filter(r => r.trim()),
        }),
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.error)

      console.log('[v0] Community created successfully:', data.data.id)
      alert('Community created successfully!')
      router.push('/business/communities')
    } catch (error: any) {
      console.error('[v0] Error creating community:', error)
      alert(`Failed to create community: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#faf9f7' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e4e1da', padding: '24px 32px' }}>
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button
            onClick={() => router.back()}
            style={{
              backgroundColor: 'transparent',
              color: '#111111',
              padding: '8px',
              borderRadius: '6px',
            }}
            className="hover:bg-gray-100"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ color: '#111111', fontSize: '28px', fontWeight: 700 }}>Create Community</h1>
            <p style={{ color: '#888888', marginTop: '4px' }}>Build a community for your business</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-8">
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-lg border border-gray-200">
          <div>
            <label style={{ display: 'block', color: '#111111', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
              Community Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="e.g., Tech Startups"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e4e1da',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                color: '#111111',
                fontSize: '14px',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: '#111111', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Describe the community purpose and who should join..."
              rows={4}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e4e1da',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                color: '#111111',
                fontSize: '14px',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label style={{ display: 'block', color: '#111111', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e4e1da',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff',
                  color: '#111111',
                  fontSize: '14px',
                }}
              >
                <option value="business">Business</option>
                <option value="networking">Networking</option>
                <option value="interest">Interest Group</option>
                <option value="support">Support</option>
                <option value="events">Events</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', color: '#111111', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                Visibility *
              </label>
              <select
                value={formData.visibility}
                onChange={(e) => setFormData({...formData, visibility: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e4e1da',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff',
                  color: '#111111',
                  fontSize: '14px',
                }}
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="restricted">Restricted</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', color: '#111111', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
              Community Rules (one per line)
            </label>
            <textarea
              value={formData.rules}
              onChange={(e) => setFormData({...formData, rules: e.target.value})}
              placeholder="1. Be respectful&#10;2. No spam&#10;3. Follow guidelines"
              rows={4}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e4e1da',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                color: '#111111',
                fontSize: '14px',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', paddingTop: '16px', borderTop: '1px solid #e4e1da' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px 24px',
                backgroundColor: '#111111',
                color: '#ffffff',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '14px',
              }}
              className="hover:bg-black disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Community'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              style={{
                padding: '12px 24px',
                backgroundColor: '#f0f0f0',
                color: '#111111',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '14px',
              }}
              className="hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
