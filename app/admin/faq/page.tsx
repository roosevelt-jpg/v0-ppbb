'use client'

import React, { useState, useEffect } from 'react'
import { FAQ } from '@/lib/types'
import { getAllFAQsAdmin, addFAQ, updateFAQ, deleteFAQ, toggleFAQStatus } from '@/lib/faq-queries'
import { Edit2, Trash2, Eye, EyeOff, Plus, X } from 'lucide-react'

const CATEGORIES = ['general', 'community', 'sponsorship', 'volunteering', 'support', 'technical']

export default function FAQManagementPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'general',
    keywords: '',
    order: 1,
  })

  // Load FAQs on mount
  useEffect(() => {
    loadFAQs()
  }, [])

  const loadFAQs = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Set a timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.warn('[v0] FAQ loading timeout')
        setLoading(false)
      }, 5000)

      getAllFAQsAdmin((loadedFaqs) => {
        clearTimeout(timeoutId)
        setFaqs(loadedFaqs)
        setLoading(false)
      })
    } catch (err) {
      console.error('[v0] Error loading FAQs:', err)
      setError('Failed to load FAQs')
      setLoading(false)
    }
  }

  const handleAddFAQ = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.question.trim() || !formData.answer.trim()) {
      setError('Question and answer are required')
      return
    }

    try {
      setError('')
      setLoading(true)
      
      const newFAQ: Omit<FAQ, 'id'> = {
        question: formData.question,
        answer: formData.answer,
        category: formData.category as any,
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k),
        order: formData.order,
        isActive: true,
        views: 0,
        helpful: 0,
        notHelpful: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      if (editingId) {
        // Update existing FAQ
        await updateFAQ(editingId, newFAQ)
        setSuccess('FAQ updated successfully!')
        setEditingId(null)
      } else {
        // Add new FAQ
        await addFAQ(newFAQ)
        setSuccess('FAQ added successfully!')
      }

      // Reset form
      setFormData({
        question: '',
        answer: '',
        category: 'general',
        keywords: '',
        order: 1,
      })
      setShowForm(false)
      
      // Reload FAQs
      await new Promise(resolve => setTimeout(resolve, 500))
      loadFAQs()
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('[v0] Error saving FAQ:', err)
      setError(err instanceof Error ? err.message : 'Failed to save FAQ')
    } finally {
      setLoading(false)
    }
  }

  const handleEditFAQ = (faq: FAQ) => {
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      keywords: faq.keywords.join(', '),
      order: faq.order,
    })
    setEditingId(faq.id)
    setShowForm(true)
  }

  const handleDeleteFAQ = async (faqId: string) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return

    try {
      setError('')
      await deleteFAQ(faqId)
      setSuccess('FAQ deleted successfully!')
      loadFAQs()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('[v0] Error deleting FAQ:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete FAQ')
    }
  }

  const handleToggleFAQStatus = async (faq: FAQ) => {
    try {
      setError('')
      await toggleFAQStatus(faq.id)
      setSuccess(`FAQ ${faq.isActive ? 'disabled' : 'enabled'} successfully!`)
      loadFAQs()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('[v0] Error toggling FAQ status:', err)
      setError(err instanceof Error ? err.message : 'Failed to toggle FAQ status')
    }
  }

  const handleCancel = () => {
    setFormData({
      question: '',
      answer: '',
      category: 'general',
      keywords: '',
      order: 1,
    })
    setEditingId(null)
    setShowForm(false)
    setError('')
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">FAQ Management</h1>
          <p className="text-neutral-600 mt-2">Create, edit, and manage frequently asked questions</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-6 py-2 bg-neutral-900 text-white rounded-lg font-semibold hover:bg-neutral-800 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add FAQ
          </button>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
          {success}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="mb-8 p-6 bg-neutral-50 border border-neutral-200 rounded-lg">
          <form onSubmit={handleAddFAQ} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-neutral-900 mb-2">Question *</label>
              <input
                type="text"
                value={formData.question}
                onChange={(e) => setFormData({...formData, question: e.target.value})}
                placeholder="Enter FAQ question..."
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-900 mb-2">Answer *</label>
              <textarea
                value={formData.answer}
                onChange={(e) => setFormData({...formData, answer: e.target.value})}
                placeholder="Enter FAQ answer..."
                rows={5}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-900 mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat} className="capitalize">
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-900 mb-2">Order</label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({...formData, order: parseInt(e.target.value) || 1})}
                  min="1"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-900 mb-2">Keywords (comma-separated)</label>
              <input
                type="text"
                value={formData.keywords}
                onChange={(e) => setFormData({...formData, keywords: e.target.value})}
                placeholder="e.g. membership, join, register"
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-2 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:bg-gray-600"
              >
                {loading ? 'Saving...' : editingId ? 'Update FAQ' : 'Create FAQ'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 px-6 py-2 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FAQ List */}
      <div className="space-y-3">
        {loading && !faqs.length ? (
          <p className="text-center py-12 text-neutral-600">Loading FAQs...</p>
        ) : faqs.length === 0 ? (
          <div className="text-center py-12 bg-neutral-50 border border-neutral-200 rounded-lg">
            <p className="text-neutral-600">No FAQs yet. Create your first one!</p>
          </div>
        ) : (
          faqs.map((faq) => (
            <div key={faq.id} className="border border-neutral-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-neutral-900 mb-2">{faq.question}</h3>
                  <p className="text-neutral-600 text-sm mb-3">{faq.answer}</p>
                  <div className="flex gap-2 items-center flex-wrap">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded capitalize font-medium">
                      {faq.category}
                    </span>
                    <span className="text-xs text-neutral-600">
                      Views: {faq.views} | Helpful: {faq.helpful}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleFAQStatus(faq)}
                    className="p-2 text-neutral-600 hover:text-neutral-900 transition-colors"
                    title={faq.isActive ? 'Disable FAQ' : 'Enable FAQ'}
                  >
                    {faq.isActive ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => handleEditFAQ(faq)}
                    className="p-2 text-neutral-600 hover:text-neutral-900 transition-colors"
                    title="Edit FAQ"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteFAQ(faq.id)}
                    className="p-2 text-red-600 hover:text-red-900 transition-colors"
                    title="Delete FAQ"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
