'use client'

import { RichTextEditor } from '@/components/rich-text-editor'

export const dynamic = 'force-dynamic'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { getOpportunityById, updateOpportunity } from '@/lib/business-queries'
import type { BusinessOpportunity } from '@/lib/types'

export default function EditJobPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const id = params.id as string
  const [job, setJob] = useState<BusinessOpportunity | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    void getOpportunityById(id).then((j) => {
      setJob(j)
      setLoading(false)
    })
  }, [id])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!job) return
    setSaving(true)
    try {
      await updateOpportunity(id, job)
      router.push('/business/opportunities')
    } catch {
      alert('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="p-8">Loading…</p>
  if (!job) return <p className="p-8">Job not found</p>

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-8">
      <h1 className="text-2xl font-bold mb-6">Edit Job</h1>
      <form onSubmit={handleSave} className="space-y-4 bg-white border rounded-lg p-6">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input value={job.title} onChange={(e) => setJob({ ...job, title: e.target.value })} className="w-full min-h-[44px] px-3 border rounded-lg" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <RichTextEditor
            value={job.description || ''}
            onChange={(html) => setJob({ ...job, description: html })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Location</label>
          <input value={job.location || ''} onChange={(e) => setJob({ ...job, location: e.target.value })} className="w-full min-h-[44px] px-3 border rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Salary / compensation</label>
          <input value={job.salary || job.compensation || ''} onChange={(e) => setJob({ ...job, salary: e.target.value })} className="w-full min-h-[44px] px-3 border rounded-lg" />
        </div>
        <button type="submit" disabled={saving} className="w-full min-h-[44px] bg-black text-white rounded-lg font-semibold disabled:opacity-50">
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}
