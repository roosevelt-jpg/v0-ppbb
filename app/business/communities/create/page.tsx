'use client'

import React, { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { hasBusinessAccess } from '@/lib/roles'
import { ArrowLeft } from 'lucide-react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export default function CreateCommunityPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')
  const isEditMode = Boolean(editId)
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [loadingExisting, setLoadingExisting] = useState(Boolean(editId))
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

  React.useEffect(() => {
    if (!editId || !user) return

    const loadCommunity = async () => {
      try {
        const snap = await getDoc(doc(db, 'communities', editId))
        if (!snap.exists()) {
          alert('Community not found')
          router.push('/business/communities')
          return
        }
        const data = snap.data()
        if (data.businessId !== user.id) {
          alert('You can only edit your own communities')
          router.push('/business/communities')
          return
        }
        setFormData({
          name: data.name || '',
          description: data.description || '',
          category: data.category || 'business',
          visibility: data.visibility || 'public',
          rules: Array.isArray(data.rules) ? data.rules.join('\n') : '',
        })
      } catch (error) {
        console.error('[v0] Error loading community:', error)
        alert('Failed to load community')
      } finally {
        setLoadingExisting(false)
      }
    }

    void loadCommunity()
  }, [editId, user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      alert('You must be logged in')
      return
    }

    setLoading(true)
    try {
      const payload = {
        ...formData,
        createdBy: user.id,
        businessId: user.id,
        createdByName: user.displayName || user.firstName || 'Business owner',
        createdByEmail: user.email || '',
        rules: formData.rules.split('\n').filter((r) => r.trim()),
      }

      const response = await fetch('/api/communities', {
        method: isEditMode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEditMode ? { id: editId, ...payload } : payload),
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.error)

      alert(
        isEditMode
          ? 'Community updated successfully!'
          : 'Community submitted for admin approval. You will be notified when it goes live.'
      )
      router.push('/business/communities')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error('[v0] Error saving community:', error)
      alert(`Failed to save community: ${message}`)
    } finally {
      setLoading(false)
    }
  }

  if (loadingExisting) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-neutral-500 dark:text-muted-foreground">
        Loading community…
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[#faf9f7] dark:bg-neutral-950">
      <div className="border-b border-[#e4e1da] dark:border-border bg-white dark:bg-card px-4 py-6 sm:px-8">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="min-h-[44px] min-w-[44px] rounded-md text-neutral-900 dark:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl sm:text-[28px] font-bold text-neutral-900 dark:text-foreground">
              {isEditMode ? 'Edit Community' : 'Create Community'}
            </h1>
            <p className="text-neutral-500 dark:text-muted-foreground mt-1 text-sm">
              {isEditMode ? 'Update your community details' : 'Build a community for your business'}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-8">
        <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-card p-8 rounded-lg border border-gray-200 dark:border-border">
          <div>
            <label style={{ display: 'block', color: 'var(--foreground)', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
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
                border: '1px solid var(--border)',
                borderRadius: '8px',
                backgroundColor: 'var(--card)',
                color: 'var(--foreground)',
                fontSize: '14px',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: 'var(--foreground)', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
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
                border: '1px solid var(--border)',
                borderRadius: '8px',
                backgroundColor: 'var(--card)',
                color: 'var(--foreground)',
                fontSize: '14px',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label style={{ display: 'block', color: 'var(--foreground)', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  backgroundColor: 'var(--card)',
                  color: 'var(--foreground)',
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
              <label style={{ display: 'block', color: 'var(--foreground)', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                Visibility *
              </label>
              <select
                value={formData.visibility}
                onChange={(e) => setFormData({...formData, visibility: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  backgroundColor: 'var(--card)',
                  color: 'var(--foreground)',
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
            <label style={{ display: 'block', color: 'var(--foreground)', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
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
                border: '1px solid var(--border)',
                borderRadius: '8px',
                backgroundColor: 'var(--card)',
                color: 'var(--foreground)',
                fontSize: '14px',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
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
              {loading ? (isEditMode ? 'Saving...' : 'Creating...') : isEditMode ? 'Save changes' : 'Create Community'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              style={{
                padding: '12px 24px',
                backgroundColor: 'var(--muted)',
                color: 'var(--foreground)',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '14px',
              }}
              className="hover:bg-gray-200 dark:hover:bg-neutral-700"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
