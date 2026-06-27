'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { FAQEditor } from './editor'

interface FAQ {
  id?: string
  question: string
  answer: string
  category: string
  order: number
  status: 'published' | 'draft'
}

const CATEGORIES = ['General', 'Community', 'Events', 'Volunteering', 'Support']

export default function FAQManagementPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null)
  const [showEditor, setShowEditor] = useState(false)

  useEffect(() => {
    loadFAQs()
  }, [])

  const loadFAQs = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await fetch('/api/faqs?admin=true', {
        headers: { 'x-admin-auth': 'true' },
        cache: 'no-store',
      })
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) {
        setFaqs(json.data.sort((a: FAQ, b: FAQ) => (a.order || 0) - (b.order || 0)))
      } else {
        setFaqs([])
      }
    } catch (err) {
      console.error('[v0] Error loading FAQs:', err)
      setError('Failed to load FAQs')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (faq: FAQ) => {
    try {
      setError('')
      setSuccess('')
      const res = await fetch('/api/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(faq),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Failed to save')
      setSuccess('FAQ created successfully')
      await loadFAQs()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save FAQ')
      throw err
    }
  }

  const handleUpdate = async (faq: FAQ) => {
    try {
      setError('')
      setSuccess('')
      const res = await fetch('/api/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(faq),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Failed to save')
      setSuccess('FAQ updated successfully')
      await loadFAQs()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update FAQ')
      throw err
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return
    try {
      setError('')
      const res = await fetch(`/api/faqs?id=${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Failed to delete')
      setSuccess('FAQ deleted successfully')
      await loadFAQs()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete FAQ')
    }
  }

  const handleToggleStatus = async (faq: FAQ) => {
    const newStatus = faq.status === 'published' ? 'draft' : 'published'
    await handleUpdate({ ...faq, status: newStatus })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black">FAQ Management</h1>
          <p className="text-gray-600 mt-2">Create, edit, and manage frequently asked questions</p>
        </div>
        <button
          onClick={() => {
            setEditingFAQ(null)
            setShowEditor(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900"
        >
          <Plus className="w-5 h-5" />
          New FAQ
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-600">
          {success}
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading FAQs...</div>
        ) : faqs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No FAQs yet. Click "New FAQ" to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Question</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Category</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {faqs.map((faq) => (
                  <tr key={faq.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{faq.question}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{faq.category}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        faq.status === 'published'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {faq.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm flex items-center gap-2">
                      <button
                        onClick={() => handleToggleStatus(faq)}
                        title={faq.status === 'published' ? 'Unpublish' : 'Publish'}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                      >
                        {faq.status === 'published' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => {
                          setEditingFAQ(faq)
                          setShowEditor(true)
                        }}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => faq.id && handleDelete(faq.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showEditor && (
        <FAQEditor
          faq={editingFAQ || undefined}
          onClose={() => {
            setShowEditor(false)
            setEditingFAQ(null)
          }}
          onSave={editingFAQ ? handleUpdate : handleCreate}
        />
      )}
    </div>
  )
}
