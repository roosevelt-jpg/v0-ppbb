'use client'

import React, { useState, useEffect } from 'react'
import { FAQ } from '@/lib/types'
import { getAllFAQsAdmin, addFAQ, updateFAQ, deleteFAQ, toggleFAQStatus } from '@/lib/faq-queries'

const DEFAULT_FAQS: Omit<FAQ, 'id'>[] = [
  {
    question: 'What is Passive Blessings?',
    answer: 'Passive Blessings is a community-driven platform dedicated to connecting members, volunteers, businesses, and sponsors to create meaningful social impact. We facilitate volunteering, charitable giving, community support, and partnerships.',
    category: 'general',
    keywords: ['what', 'passive', 'blessings', 'platform', 'community'],
    order: 1,
    isActive: true,
    views: 0,
    helpful: 0,
    notHelpful: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    question: 'How do I become a member?',
    answer: 'You can register on our website by providing your basic information. Choose your role (Member, Volunteer, Business, or Sponsor) and complete your profile. Membership is free and open to all.',
    category: 'general',
    keywords: ['member', 'register', 'signup', 'join', 'account'],
    order: 2,
    isActive: true,
    views: 0,
    helpful: 0,
    notHelpful: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    question: 'What are the membership tiers?',
    answer: 'We offer three membership tiers: Standard (free), Gold (premium features), and Platinum (full access). Each tier provides different benefits and features.',
    category: 'general',
    keywords: ['membership', 'tiers', 'standard', 'gold', 'platinum'],
    order: 3,
    isActive: true,
    views: 0,
    helpful: 0,
    notHelpful: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    question: 'How can I volunteer?',
    answer: 'Browse our volunteering opportunities on the dashboard. Select opportunities that match your skills and interests, apply, and once approved, you can start contributing. You can track your volunteer hours on your profile.',
    category: 'volunteering',
    keywords: ['volunteer', 'opportunities', 'hours', 'apply', 'contribute'],
    order: 1,
    isActive: true,
    views: 0,
    helpful: 0,
    notHelpful: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    question: 'How do I track my volunteering hours?',
    answer: 'Your volunteer hours are automatically tracked in your dashboard. Visit the "Volunteering" section to see your total hours, monthly activity, and earned badges.',
    category: 'volunteering',
    keywords: ['hours', 'track', 'volunteer', 'activity', 'badges'],
    order: 2,
    isActive: true,
    views: 0,
    helpful: 0,
    notHelpful: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    question: 'What is the sponsorship program?',
    answer: 'Our sponsorship program allows businesses and organizations to partner with Passive Blessings to support our community initiatives. Sponsors gain visibility and recognition while supporting social causes.',
    category: 'sponsorship',
    keywords: ['sponsorship', 'sponsor', 'partner', 'business', 'support'],
    order: 1,
    isActive: true,
    views: 0,
    helpful: 0,
    notHelpful: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    question: 'How can my business join the marketplace?',
    answer: 'Register as a Business user, complete your business profile with details and logo, and start posting opportunities and offers. Your business will be visible to our community members.',
    category: 'community',
    keywords: ['business', 'marketplace', 'register', 'profile', 'opportunities'],
    order: 1,
    isActive: true,
    views: 0,
    helpful: 0,
    notHelpful: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    question: 'Is there a referral program?',
    answer: 'Yes! Our referral program rewards you for bringing new members. Share your referral code and earn benefits when they join. Check your dashboard for details.',
    category: 'community',
    keywords: ['referral', 'program', 'rewards', 'benefits', 'code'],
    order: 2,
    isActive: true,
    views: 0,
    helpful: 0,
    notHelpful: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    question: 'How do I request charity support?',
    answer: 'Visit the "Charity Support Request" page and fill out the comprehensive form with your details and supporting documents. Your request will be reviewed by our team and you\'ll be notified of the decision.',
    category: 'support',
    keywords: ['charity', 'support', 'request', 'help', 'assistance'],
    order: 1,
    isActive: true,
    views: 0,
    helpful: 0,
    notHelpful: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    question: 'How is my personal data protected?',
    answer: 'We use industry-standard encryption (AES-256) to protect all personal data. View our UAE Data Protection Policy for detailed information about how we handle your information.',
    category: 'support',
    keywords: ['data', 'protection', 'privacy', 'security', 'encryption'],
    order: 2,
    isActive: true,
    views: 0,
    helpful: 0,
    notHelpful: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    question: 'What is the AI matching system?',
    answer: 'Our AI matching system recommends volunteer opportunities and jobs based on your skills, interests, and availability. You\'ll see personalized matches on your dashboard.',
    category: 'technical',
    keywords: ['ai', 'matching', 'recommendations', 'smart', 'opportunities'],
    order: 1,
    isActive: true,
    views: 0,
    helpful: 0,
    notHelpful: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

export default function AdminFAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'general' as const,
    keywords: '',
    order: 1,
  })
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    let isMounted = true
    let unsubscribe: any

    const loadFAQs = async () => {
      try {
        unsubscribe = getAllFAQsAdmin((foundFaqs) => {
          if (!isMounted) return
          if (foundFaqs.length === 0) {
            initializeDefaultFAQs()
          } else {
            setFaqs(foundFaqs)
          }
          setLoading(false)
        })
      } catch (error) {
        console.error('[v0] Error loading FAQs:', error)
        if (isMounted) {
          setLoading(false)
          setFaqs([])
        }
      }
    }

    // Set a timeout to ensure loading state doesn't hang forever
    const timeout = setTimeout(() => {
      if (isMounted && loading) {
        console.warn('[v0] FAQ loading timeout - displaying empty state')
        setLoading(false)
      }
    }, 5000)

    loadFAQs()

    return () => {
      isMounted = false
      clearTimeout(timeout)
      if (unsubscribe) unsubscribe()
    }
  }, [])

  const initializeDefaultFAQs = async () => {
    try {
      for (const faq of DEFAULT_FAQS) {
        await addFAQ(faq)
      }
      const unsubscribe = getAllFAQsAdmin(setFaqs)
      return () => unsubscribe()
    } catch (error) {
      console.error('Error initializing FAQs:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.question.trim() || !formData.answer.trim()) return

    try {
      const keywordsList = formData.keywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k)

      if (editingId) {
        await updateFAQ(editingId, {
          question: formData.question,
          answer: formData.answer,
          category: formData.category,
          keywords: keywordsList,
          order: formData.order,
        })
      } else {
        await addFAQ({
          question: formData.question,
          answer: formData.answer,
          category: formData.category,
          keywords: keywordsList,
          order: formData.order,
          isActive: true,
          views: 0,
          helpful: 0,
          notHelpful: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      }

      setFormData({ question: '', answer: '', category: 'general', keywords: '', order: 1 })
      setEditingId(null)
      setShowForm(false)
    } catch (error) {
      console.error('Error saving FAQ:', error)
    }
  }

  const handleEdit = (faq: FAQ) => {
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

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this FAQ?')) {
      try {
        await deleteFAQ(id)
      } catch (error) {
        console.error('Error deleting FAQ:', error)
      }
    }
  }

  const handleToggleStatus = async (id: string, isActive: boolean) => {
    try {
      await toggleFAQStatus(id, !isActive)
    } catch (error) {
      console.error('Error toggling status:', error)
    }
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#111111' }}>FAQ Management</h1>
        <button
          onClick={() => {
            setShowForm(!showForm)
            setEditingId(null)
            setFormData({ question: '', answer: '', category: 'general', keywords: '', order: 1 })
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: '#111111',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          {showForm ? 'Cancel' : 'Add FAQ'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ backgroundColor: '#f9f7f4', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>Question</label>
            <input
              type="text"
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
              required
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>Answer</label>
            <textarea
              value={formData.answer}
              onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', minHeight: '120px', boxSizing: 'border-box', fontFamily: 'inherit' }}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
              >
                <option value="general">General</option>
                <option value="community">Community</option>
                <option value="sponsorship">Sponsorship</option>
                <option value="volunteering">Volunteering</option>
                <option value="support">Support</option>
                <option value="technical">Technical</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>Order</label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
                min="1"
              />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>Keywords (comma-separated)</label>
            <input
              type="text"
              value={formData.keywords}
              onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
              placeholder="e.g., help, question, faq"
            />
          </div>

          <button
            type="submit"
            style={{
              padding: '10px 20px',
              backgroundColor: '#111111',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            {editingId ? 'Update FAQ' : 'Create FAQ'}
          </button>
        </form>
      )}

      <div style={{ display: 'grid', gap: '16px' }}>
        {faqs.map((faq) => (
          <div key={faq.id} style={{ border: '1px solid #ddd', padding: '16px', borderRadius: '8px', backgroundColor: faq.isActive ? '#fff' : '#f0f0f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
              <div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 600, color: '#111111' }}>{faq.question}</h3>
                <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>
                  <span style={{ backgroundColor: '#e4e1da', padding: '2px 8px', borderRadius: '4px', marginRight: '8px' }}>{faq.category}</span>
                  Views: {faq.views} | Helpful: {faq.helpful} | Not Helpful: {faq.notHelpful}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleToggleStatus(faq.id, faq.isActive)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: faq.isActive ? '#4caf50' : '#f44336',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  {faq.isActive ? 'Active' : 'Inactive'}
                </button>
                <button
                  onClick={() => handleEdit(faq)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#2196f3',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(faq.id)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#f44336',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
            <p style={{ margin: '12px 0 0 0', fontSize: '14px', color: '#555', lineHeight: '1.5' }}>{faq.answer}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
