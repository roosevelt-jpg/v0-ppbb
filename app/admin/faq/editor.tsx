'use client'

import { useEffect, useState } from 'react'
import { X, Save } from 'lucide-react'

interface FAQ {
  id?: string
  question: string
  answer: string
  category: string
  order: number
  status: 'published' | 'draft'
}

const CATEGORIES = ['General', 'Community', 'Events', 'Volunteering', 'Support', 'Sponsorship']

export function FAQEditor({
  faq,
  onClose,
  onSave,
}: {
  faq?: FAQ
  onClose: () => void
  onSave: (faq: FAQ) => Promise<void>
}) {
  const [formData, setFormData] = useState<FAQ>(
    faq || {
      question: '',
      answer: '',
      category: CATEGORIES[0],
      order: 0,
      status: 'draft',
    }
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setFormData(
      faq || {
        question: '',
        answer: '',
        category: CATEGORIES[0],
        order: 0,
        status: 'draft',
      }
    )
  }, [faq])

  const handleChange = (field: keyof FAQ, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await onSave({
        ...formData,
        question: formData.question.trim(),
        answer: formData.answer.trim(),
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save FAQ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex justify-between items-center z-10">
          <h2 className="text-xl font-bold">{faq?.id ? 'Edit FAQ' : 'New FAQ'}</h2>
          <button
            type="button"
            onClick={onClose}
            className="pb-compact-btn h-6 w-6 inline-flex items-center justify-center rounded-md bg-black text-white"
            aria-label="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
          {error ? (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          ) : null}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Question</label>
            <input
              type="text"
              value={formData.question}
              onChange={(e) => handleChange('question', e.target.value)}
              placeholder="Enter FAQ question"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Answer</label>
            <p className="text-xs text-neutral-500 mb-1">Plain text — line breaks are preserved.</p>
            <textarea
              value={formData.answer}
              onChange={(e) => handleChange('answer', e.target.value)}
              placeholder="Enter FAQ answer"
              rows={8}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black whitespace-pre-wrap"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="draft">Draft (hidden)</option>
                <option value="published">Published (live on /faq)</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[44px] px-4 py-2 bg-black text-white rounded-lg font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 min-h-[44px] px-4 py-2 bg-black text-white rounded-lg font-semibold disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving…' : 'Save FAQ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
