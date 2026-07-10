'use client'

import React, { useState } from 'react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { useAuth } from '@/lib/auth-context'
import { uploadFileToFirebase } from '@/lib/upload-utils'

const TYPES = ['partnership', 'campaign', 'sponsorship', 'charity', 'event']

export default function PartnershipsApplyPage() {
  const { user, firebaseUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    submitterName: '',
    submitterEmail: '',
    type: 'partnership',
    title: '',
    description: '',
    proposedBudget: '',
  })
  const [attachmentURL, setAttachmentURL] = useState('')

  React.useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        submitterName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        submitterEmail: user.email,
      }))
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const token = firebaseUser ? await firebaseUser.getIdToken() : null
      const res = await fetch('/api/partnerships/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ ...form, attachmentURL }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-12">
        <h1 className="text-3xl font-bold mb-2">Partnership & Sponsorship Request</h1>
        <p className="text-muted-foreground mb-8">
          Submit a partnership, campaign, charity, or event sponsorship proposal.
        </p>

        {success ? (
          <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">Request submitted. We will review and update you in your dashboard.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-[#e4e1da] rounded-lg p-6">
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Your name *</label>
                <input required value={form.submitterName} onChange={(e) => setForm({ ...form, submitterName: e.target.value })} className="w-full min-h-[44px] px-3 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input required type="email" value={form.submitterEmail} onChange={(e) => setForm({ ...form, submitterEmail: e.target.value })} className="w-full min-h-[44px] px-3 border rounded-lg" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Request type *</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full min-h-[44px] px-3 border rounded-lg">
                {TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full min-h-[44px] px-3 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description *</label>
              <textarea required rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Proposed budget (optional)</label>
              <input value={form.proposedBudget} onChange={(e) => setForm({ ...form, proposedBudget: e.target.value })} placeholder="e.g. AED 2,000–5,000" className="w-full min-h-[44px] px-3 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Attachment (optional)</label>
              <input type="file" accept=".pdf,image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadFileToFirebase(f, 'partnerships', `attach_${Date.now()}`).then(setAttachmentURL) }} className="w-full text-sm" />
            </div>
            <button type="submit" disabled={loading} className="w-full min-h-[44px] bg-black text-white rounded-lg font-semibold disabled:opacity-50">
              {loading ? 'Submitting…' : 'Submit Request'}
            </button>
          </form>
        )}
      </main>
      <Footer />
    </div>
  )
}
