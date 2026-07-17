'use client'

import { useEffect, useState } from 'react'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { Plus, Edit2, Trash2, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { FAQEditor } from './editor'
import { ACTION_ROW, BUTTON_ICON_COMPACT, BUTTON_PRIMARY } from '@/lib/admin-design-system'
import { adminApiFetch } from '@/lib/admin-api-client'
import { db } from '@/lib/firebase'
import { collection, onSnapshot } from 'firebase/firestore'

interface FAQ {
  id?: string
  question: string
  answer: string
  category: string
  order: number
  status: 'published' | 'draft'
}

function mapFaq(id: string, data: Record<string, unknown>): FAQ {
  const status =
    data.status === 'published' || data.isActive === true ? 'published' : 'draft'
  return {
    id,
    question: String(data.question || ''),
    answer: String(data.answer || ''),
    category: String(data.category || 'General'),
    order: typeof data.order === 'number' ? data.order : 0,
    status,
  }
}

export default function FAQManagementPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [actingId, setActingId] = useState<string | null>(null)

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'faqs'),
      (snap) => {
        const rows = snap.docs
          .map((d) => mapFaq(d.id, d.data() as Record<string, unknown>))
          .sort((a, b) => a.order - b.order || a.question.localeCompare(b.question))
        setFaqs(rows)
        setLoading(false)
        setError('')
      },
      (err) => {
        console.error('[admin/faq] snapshot error:', err)
        setError('Failed to load FAQs in realtime. Check you are signed in as admin.')
        setLoading(false)
      }
    )
    return () => unsub()
  }, [])

  const saveFaq = async (faq: FAQ) => {
    setError('')
    setSuccess('')
    const json = await adminApiFetch('/api/faqs', {
      method: 'POST',
      body: JSON.stringify({
        id: faq.id,
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        order: faq.order ?? faqs.length,
        status: faq.status,
      }),
    })
    if (!json.success) throw new Error(json.error || 'Failed to save FAQ')
    setSuccess(faq.id ? 'FAQ updated — live on /faq when Published' : 'FAQ created')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this FAQ? It will disappear from the public FAQ page immediately.')) return
    setActingId(id)
    setError('')
    try {
      const json = await adminApiFetch(`/api/faqs?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      if (!json.success) throw new Error(json.error || 'Failed to delete')
      setSuccess('FAQ deleted')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete FAQ')
    } finally {
      setActingId(null)
    }
  }

  const handleToggleStatus = async (faq: FAQ) => {
    if (!faq.id) return
    setActingId(faq.id)
    try {
      await saveFaq({
        ...faq,
        status: faq.status === 'published' ? 'draft' : 'published',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status')
    } finally {
      setActingId(null)
    }
  }

  return (
    <AdminPageLayout
      title="FAQ Management"
      subtitle="Create, edit, and publish FAQs — changes sync live to /faq"
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-neutral-600">
            Set status to <strong>Published</strong> to show on the public FAQ page in realtime.
          </p>
          <button
            type="button"
            onClick={() => {
              setEditingFAQ(null)
              setShowEditor(true)
            }}
            className={`inline-flex items-center gap-2 ${BUTTON_PRIMARY}`}
          >
            <Plus className="w-4 h-4" />
            New FAQ
          </button>
        </div>

        {error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        ) : null}

        {success ? (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
            {success}
          </div>
        ) : null}

        <div className="bg-white rounded-lg border border-gray-200">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading FAQs…</div>
          ) : faqs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No FAQs yet. Click “New FAQ” to create one.
            </div>
          ) : (
            <div className="admin-table-scroll">
              <table className="w-full min-w-[720px]">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Question
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {faqs.map((faq) => (
                    <tr key={faq.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-md">
                        {faq.question}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{faq.category}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            faq.status === 'published'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {faq.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className={ACTION_ROW}>
                          <button
                            type="button"
                            disabled={actingId === faq.id}
                            onClick={() => void handleToggleStatus(faq)}
                            title={faq.status === 'published' ? 'Unpublish' : 'Publish'}
                            className={BUTTON_ICON_COMPACT}
                          >
                            {faq.status === 'published' ? (
                              <Eye className="w-3 h-3" />
                            ) : (
                              <EyeOff className="w-3 h-3" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingFAQ(faq)
                              setShowEditor(true)
                            }}
                            title="Edit FAQ"
                            className={BUTTON_ICON_COMPACT}
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={actingId === faq.id}
                            onClick={() => faq.id && void handleDelete(faq.id)}
                            title="Delete FAQ"
                            className={BUTTON_ICON_COMPACT}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showEditor ? (
          <FAQEditor
            key={editingFAQ?.id || 'new'}
            faq={editingFAQ || undefined}
            onClose={() => {
              setShowEditor(false)
              setEditingFAQ(null)
            }}
            onSave={saveFaq}
          />
        ) : null}
      </div>
    </AdminPageLayout>
  )
}
