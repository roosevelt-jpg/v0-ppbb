'use client'

import React, { useState, useEffect } from 'react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { FAQ } from '@/lib/types'
import { getAllFAQs, searchFAQs, incrementFAQViews, markFAQHelpful } from '@/lib/faq-queries'
import { initializeFAQs } from '@/lib/initialize-faqs'

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  const categories = ['general', 'community', 'sponsorship', 'volunteering', 'support', 'technical']

  // Initialize FAQs on mount
  useEffect(() => {
    console.log('[v0] Starting FAQ initialization...')
    initializeFAQs()
      .then(() => {
        console.log('[v0] FAQ initialization complete')
        setInitialized(true)
      })
      .catch(err => {
        console.error('[v0] FAQ init error:', err)
        setInitialized(true) // Set to true anyway to proceed
      })
  }, [])

  // Fetch FAQs after initialization
  useEffect(() => {
    if (!initialized) return

    console.log('[v0] Fetching FAQs with search term:', searchTerm)
    setLoading(true)
    
    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.log('[v0] FAQ loading timeout, setting default state')
      setFaqs([])
      setLoading(false)
    }, 5000)

    if (searchTerm.trim()) {
      const unsubscribe = searchFAQs(searchTerm, (foundFaqs) => {
        console.log('[v0] Search found', foundFaqs.length, 'FAQs')
        setFaqs(foundFaqs)
        setLoading(false)
      })
      return () => {
        clearTimeout(timeout)
        unsubscribe()
      }
    } else {
      const unsubscribe = getAllFAQs((foundFaqs) => {
        console.log('[v0] Got', foundFaqs.length, 'FAQs')
        setFaqs(foundFaqs)
        setLoading(false)
      })
      return () => {
        clearTimeout(timeout)
        unsubscribe()
      }
    }
  }, [searchTerm, initialized])

  const filteredFaqs = selectedCategory === 'all' ? faqs : faqs.filter(faq => faq.category === selectedCategory)

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
      incrementFAQViews(id)
    }
    setExpandedItems(newExpanded)
  }

  const handleHelpful = (id: string, helpful: boolean) => {
    markFAQHelpful(id, helpful)
  }

  return (
    <>
      <Navbar />
      <main style={{ minHeight: '100vh', backgroundColor: '#f9f7f4', paddingTop: '40px', paddingBottom: '60px' }}>
      {/* Header */}
      <section style={{ textAlign: 'center', marginBottom: '48px', paddingX: '20px' }}>
        <h1 style={{ fontSize: '48px', fontWeight: 700, color: '#111111', marginBottom: '16px', textAlign: 'center' }}>
          Frequently Asked Questions
        </h1>
        <p style={{ fontSize: '18px', color: '#666', marginBottom: '32px', maxWidth: '600px', margin: '0 auto' }}>
          Find answers to common questions about Passive Blessings, our community, sponsorships, and more.
        </p>

        {/* Search Box */}
        <div style={{ maxWidth: '500px', margin: '0 auto', marginBottom: '32px' }}>
          <input
            type="text"
            placeholder="Search FAQs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '2px solid #e4e1da',
              borderRadius: '8px',
              fontSize: '16px',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Category Filter */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', maxWidth: '800px', margin: '0 auto' }}>
          <button
            onClick={() => setSelectedCategory('all')}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: 'none',
              backgroundColor: selectedCategory === 'all' ? '#111111' : '#e4e1da',
              color: selectedCategory === 'all' ? '#fff' : '#111111',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: 'none',
                backgroundColor: selectedCategory === category ? '#111111' : '#e4e1da',
                color: selectedCategory === category ? '#fff' : '#111111',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                textTransform: 'capitalize',
              }}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      {/* FAQs List */}
      <section style={{ maxWidth: '800px', margin: '0 auto', paddingX: '20px', paddingLeft: '20px', paddingRight: '20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <p style={{ color: '#666' }}>Loading FAQs...</p>
          </div>
        ) : filteredFaqs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <p style={{ color: '#666', fontSize: '16px' }}>
              {searchTerm ? 'No FAQs found matching your search.' : 'No FAQs available in this category.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredFaqs.map((faq) => (
              <div
                key={faq.id}
                style={{
                  border: '2px solid #e4e1da',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  backgroundColor: '#fff',
                }}
              >
                <button
                  onClick={() => toggleExpand(faq.id)}
                  style={{
                    width: '100%',
                    padding: '20px',
                    backgroundColor: '#fff',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9f7f4'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
                >
                  <span style={{ fontSize: '16px', fontWeight: 600, color: '#111111' }}>{faq.question}</span>
                  <span style={{ fontSize: '20px', color: '#666', transition: 'transform 0.2s', transform: expandedItems.has(faq.id) ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    ▼
                  </span>
                </button>

                {expandedItems.has(faq.id) && (
                  <div style={{ padding: '0 20px 20px 20px', borderTop: '1px solid #e4e1da', backgroundColor: '#fafaf8' }}>
                    <p style={{ margin: '16px 0', lineHeight: '1.6', color: '#444' }}>{faq.answer}</p>

                    {/* Helpful Buttons */}
                    <div style={{ display: 'flex', gap: '12px', marginTop: '16px', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', color: '#666' }}>Was this helpful?</span>
                      <button
                        onClick={() => handleHelpful(faq.id, true)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#e8f5e9',
                          border: '1px solid #4caf50',
                          borderRadius: '4px',
                          color: '#2e7d32',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#4caf50'
                          e.currentTarget.style.color = '#fff'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#e8f5e9'
                          e.currentTarget.style.color = '#2e7d32'
                        }}
                      >
                        👍 Yes ({faq.helpful})
                      </button>
                      <button
                        onClick={() => handleHelpful(faq.id, false)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#ffebee',
                          border: '1px solid #f44336',
                          borderRadius: '4px',
                          color: '#c62828',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f44336'
                          e.currentTarget.style.color = '#fff'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#ffebee'
                          e.currentTarget.style.color = '#c62828'
                        }}
                      >
                        👎 No ({faq.notHelpful})
                      </button>
                      <span style={{ fontSize: '12px', color: '#999', marginLeft: 'auto' }}>Views: {faq.views}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Contact Section */}
      <section style={{ maxWidth: '800px', margin: '60px auto 0', paddingX: '20px', textAlign: 'center', paddingLeft: '20px', paddingRight: '20px' }}>
        <div style={{ backgroundColor: '#f0ebe5', padding: '40px', borderRadius: '12px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#111111', marginBottom: '16px' }}>Didn&apos;t find your answer?</h2>
          <p style={{ color: '#666', marginBottom: '24px' }}>Contact our support team or visit our ChatBot for immediate assistance.</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href="mailto:support@passiveblessings.com"
              style={{
                padding: '12px 24px',
                backgroundColor: '#111111',
                color: '#fff',
                textDecoration: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 600,
                display: 'inline-block',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Email Support
            </a>
            <a
              href="/chatbot"
              style={{
                padding: '12px 24px',
                backgroundColor: '#111111',
                color: '#fff',
                textDecoration: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 600,
                display: 'inline-block',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Ask ChatBot
            </a>
          </div>
        </div>
      </section>
      </main>
      <Footer />
    </>
  )
}
