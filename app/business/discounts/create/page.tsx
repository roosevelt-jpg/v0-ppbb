'use client'

export const dynamic = 'force-dynamic'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { hasBusinessAccess } from '@/lib/roles'
import { auth } from '@/lib/firebase'
import { RichTextEditor } from '@/components/rich-text-editor'

function generateCode() {
  return `PB${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

export default function CreateDiscountPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    discountCode: generateCode(),
    discountType: 'percent' as 'percent' | 'fixed',
    discountValue: 10,
    currency: 'AED',
    isMemberOnly: true,
    usageLimit: '',
    validUntil: '',
    status: 'pending_approval',
  })

  React.useEffect(() => {
    if (user && !hasBusinessAccess(user)) router.push('/login')
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const token = await auth.currentUser?.getIdToken()
      const res = await fetch('/api/business/discounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          ...form,
          usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
          validUntil: form.validUntil || null,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      router.push('/business/discounts')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create discount')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-8">
      <h1 className="text-2xl font-bold mb-6">Create Member Discount</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-[#e4e1da] rounded-lg p-6">
        <div>
          <label className="block text-sm font-medium mb-1">Title *</label>
          <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full min-h-[44px] px-3 border rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <RichTextEditor
            value={form.description}
            onChange={(html) => setForm({ ...form, description: html })}
          />
        </div>
        <div className="flex gap-2">
          <input value={form.discountCode} onChange={(e) => setForm({ ...form, discountCode: e.target.value })} className="flex-1 min-h-[44px] px-3 border rounded-lg font-mono" />
          <button type="button" onClick={() => setForm({ ...form, discountCode: generateCode() })} className="px-3 border rounded-lg text-sm">Regenerate</button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value as 'percent' | 'fixed' })} className="w-full min-h-[44px] px-3 border rounded-lg">
              <option value="percent">% off</option>
              <option value="fixed">Fixed amount</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Value</label>
            <input type="number" min={0} value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })} className="w-full min-h-[44px] px-3 border rounded-lg" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Valid until (optional)</label>
          <input type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} className="w-full min-h-[44px] px-3 border rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Usage limit (optional)</label>
          <input type="number" min={1} value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} className="w-full min-h-[44px] px-3 border rounded-lg" />
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.isMemberOnly} onChange={(e) => setForm({ ...form, isMemberOnly: e.target.checked })} />
          <span className="text-sm">Members only</span>
        </label>
        <button type="submit" disabled={loading} className="w-full min-h-[44px] bg-black text-white rounded-lg font-semibold disabled:opacity-50">
          {loading ? 'Saving…' : 'Create Discount'}
        </button>
      </form>
    </div>
  )
}
