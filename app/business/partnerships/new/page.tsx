'use client'
export const dynamic = 'force-dynamic'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { hasBusinessAccess } from '@/lib/roles'
import { auth } from '@/lib/firebase'
import { uploadFileToFirebase } from '@/lib/upload-utils'
import { RichTextEditor } from '@/components/rich-text-editor'
import { DashboardPageShell } from '@/components/dashboard-states'
import { ChevronLeft, Upload, Loader2 } from 'lucide-react'

const REQUEST_TYPES = [
  'Partnership',
  'Campaign',
  'Sponsorship',
  'Charity Support',
  'Event Hosting',
]

export default function NewPartnershipRequestPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)
  const [uploading, setUploading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [form, setForm] = React.useState({
    type: 'Partnership',
    title: '',
    description: '',
    proposedBudget: '',
    attachmentURL: '',
  })

  React.useEffect(() => {
    if (user && !hasBusinessAccess(user)) router.push('/login')
  }, [user, router])

  const handleAttachment = async (file: File) => {
    if (!user) return
    setUploading(true)
    setError(null)
    try {
      const ext = file.name.split('.').pop() || 'pdf'
      const url = await uploadFileToFirebase(
        file,
        `partnerships/${user.id}`,
        `partnerships/${user.id}/attachment-${Date.now()}.${ext}`
      )
      setForm((p) => ({ ...p, attachmentURL: url }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const token = await auth.currentUser?.getIdToken()
      const res = await fetch('/api/business/partnerships', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Submit failed')
      alert('Request submitted successfully!')
      router.push('/business/partnerships')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submit failed')
    } finally {
      setLoading(false)
    }
  }

  if (!user || !hasBusinessAccess(user)) {
    return <div className="text-center py-8">Access Denied</div>
  }

  return (
    <DashboardPageShell title="Submit a Request" subtitle="Partner with Passive Blessings">
      <Link
        href="/business/partnerships"
        className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 mb-6"
      >
        <ChevronLeft className="w-4 h-4" /> Back to Partnerships
      </Link>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl mx-auto bg-white border border-[#e4e1da] rounded-xl p-6 sm:p-8 flex flex-col gap-6"
      >
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div>
          <label className="block text-sm font-medium mb-1">Request Type *</label>
          <select
            required
            value={form.type}
            onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          >
            {REQUEST_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Title *</label>
          <input
            required
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description *</label>
          <RichTextEditor
            value={form.description}
            onChange={(html) => setForm((p) => ({ ...p, description: html }))}
            minHeight={160}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Proposed Budget (optional)</label>
          <input
            value={form.proposedBudget}
            onChange={(e) => setForm((p) => ({ ...p, proposedBudget: e.target.value }))}
            placeholder="e.g. AED 5,000–AED 10,000"
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Attachment (PDF, JPG, PNG)</label>
          <label className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer text-sm">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {form.attachmentURL ? 'Replace file' : 'Upload file'}
            <input
              type="file"
              accept=".pdf,image/jpeg,image/png"
              className="sr-only"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void handleAttachment(file)
                e.target.value = ''
              }}
            />
          </label>
          {form.attachmentURL ? (
            <a
              href={form.attachmentURL}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-xs text-blue-600 mt-2 underline"
            >
              View uploaded attachment
            </a>
          ) : null}
        </div>

        <div className="flex flex-row gap-3 justify-end mt-4">
          <Link
            href="/business/partnerships"
            className="!bg-white !text-black border border-gray-300 px-6 py-2 rounded-lg text-sm"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="!bg-black !text-white px-6 py-2 rounded-lg text-sm disabled:opacity-50"
          >
            {loading ? 'Submitting…' : 'Submit Request'}
          </button>
        </div>
      </form>
    </DashboardPageShell>
  )
}
