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
      <main className="min-h-screen bg-neutral-50 py-10 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <section className="max-w-6xl mx-auto mb-12 sm:mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-start">
            {/* Left: Title and Description */}
            <div className="lg:col-span-2">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-900 mb-6 leading-tight">
                Frequently Asked Questions
              </h1>
              <p className="text-base sm:text-lg text-neutral-600 leading-relaxed">
                Find answers to common questions about Passive Blessings, our community, sponsorships, and more.
              </p>
            </div>
            
            {/* Right: Search Bar */}
            <div className="lg:col-span-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search FAQs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 sm:px-6 py-3 sm:py-4 border-2 border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-lg"
                />
              </div>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 sm:gap-3 justify-start">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 sm:px-6 py-2 rounded-full font-semibold text-sm sm:text-base transition-all ${
                selectedCategory === 'all'
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-200 text-neutral-900 hover:bg-neutral-300'
              }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 sm:px-6 py-2 rounded-full font-semibold text-sm sm:text-base transition-all capitalize ${
                  selectedCategory === category
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-200 text-neutral-900 hover:bg-neutral-300'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </section>

        {/* FAQs List */}
        <section className="max-w-6xl mx-auto">
          {loading ? (
            <div className="text-center py-12 sm:py-16">
              <p className="text-neutral-600 text-base sm:text-lg">Loading FAQs...</p>
            </div>
          ) : filteredFaqs.length === 0 ? (
            <div className="text-center py-12 sm:py-16">
              <p className="text-neutral-600 text-base sm:text-lg">
                {searchTerm ? 'No FAQs found matching your search.' : 'No FAQs available in this category.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {filteredFaqs.map((faq) => (
                <div key={faq.id} className="border-2 border-neutral-200 rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow">
                  <button
                    onClick={() => toggleExpand(faq.id)}
                    className="w-full px-4 sm:px-6 py-4 sm:py-5 bg-white hover:bg-neutral-50 transition-colors flex justify-between items-start sm:items-center gap-4 text-left"
                    aria-expanded={expandedItems.has(faq.id)}
                  >
                    <span className="text-base sm:text-lg font-semibold text-neutral-900 flex-1 break-words">
                      {faq.question}
                    </span>
                    <span
                      className="text-xl sm:text-2xl text-neutral-600 flex-shrink-0 transition-transform"
                      style={{ transform: expandedItems.has(faq.id) ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    >
                      ▼
                    </span>
                  </button>

                  {expandedItems.has(faq.id) && (
                    <div className="px-4 sm:px-6 py-4 sm:py-5 border-t-2 border-neutral-200 bg-neutral-50">
                      <p className="text-neutral-700 leading-relaxed mb-4 sm:mb-6 text-sm sm:text-base">
                        {faq.answer}
                      </p>

                      {/* Helpful Buttons */}
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-start sm:items-center">
                        <span className="text-xs sm:text-sm text-neutral-600 font-medium">Was this helpful?</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleHelpful(faq.id, true)}
                            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-green-50 hover:bg-green-100 border border-green-300 rounded text-green-700 text-xs sm:text-sm font-semibold transition-colors"
                          >
                            👍 Yes ({faq.helpful})
                          </button>
                          <button
                            onClick={() => handleHelpful(faq.id, false)}
                            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-red-50 hover:bg-red-100 border border-red-300 rounded text-red-700 text-xs sm:text-sm font-semibold transition-colors"
                          >
                            👎 No ({faq.notHelpful})
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Contact Section */}
        <section className="max-w-6xl mx-auto mt-16 sm:mt-20">
          <div className="bg-neutral-100 p-8 sm:p-10 rounded-lg text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-3 sm:mb-4">
              Didn&apos;t find your answer?
            </h2>
            <p className="text-neutral-600 mb-6 sm:mb-8 text-base sm:text-lg">
              Contact our support team or visit our ChatBot for immediate assistance.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <a
                href="mailto:support@passiveblessings.com"
                className="px-4 sm:px-6 py-2 sm:py-3 bg-neutral-900 text-white rounded-lg font-semibold text-sm sm:text-base hover:bg-neutral-800 transition-colors"
              >
                Email Support
              </a>
              <button
                onClick={() => {
                  // This would open the chat widget
                  const chatButton = document.querySelector('button[aria-label="Open chat"]')
                  if (chatButton) {
                    (chatButton as HTMLButtonElement).click()
                  }
                }}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-neutral-900 text-white rounded-lg font-semibold text-sm sm:text-base hover:bg-neutral-800 transition-colors"
              >
                Ask ChatBot
              </button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

