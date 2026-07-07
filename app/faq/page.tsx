'use client'

import { useState, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'

interface FAQ {
  id: string
  question: string
  answer: string
  category: string
  order: number
  status: 'published' | 'draft'
}

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadFAQs()
  }, [selectedCategory])

  const loadFAQs = async () => {
    try {
      setLoading(true)
      setError('')
      const url = selectedCategory
        ? `/api/faqs?category=${encodeURIComponent(selectedCategory)}`
        : '/api/faqs'

      const res = await fetch(url, { cache: 'no-store' })
      const json = await res.json()

      if (json.success && Array.isArray(json.data)) {
        setFaqs(json.data)
        // Extract unique categories on first load
        if (!selectedCategory) {
          const uniqueCategories = [...new Set(json.data.map((faq: FAQ) => faq.category))]
          setCategories(uniqueCategories)
        }
      } else {
        setFaqs([])
      }
    } catch (err) {
      console.error('[v0] Error loading FAQs:', err)
      setError('Failed to load FAQs. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedIds(newExpanded)
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white">
        {/* Header */}
        <section className="w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 bg-gray-50">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-headline mb-4 text-black">
              Frequently Asked Questions
            </h1>
            <p className="text-gray-600 text-base sm:text-lg">
              Find answers to common questions about Passive Blessings
            </p>
          </div>
        </section>

        {/* Category Filter */}
        {categories.length > 0 && (
          <section className="w-full px-4 sm:px-6 lg:px-8 py-8 bg-white border-b border-gray-200">
            <div className="max-w-4xl mx-auto">
              <p className="text-sm font-semibold text-gray-600 mb-4">Filter by category:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    !selectedCategory
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedCategory === cat
                        ? 'bg-black text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* FAQs Content */}
        <section className="w-full px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-4xl mx-auto">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Loading FAQs...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12 bg-red-50 rounded-lg p-6">
                <p className="text-red-600">{error}</p>
              </div>
            ) : faqs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No FAQs found. Check back soon!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {faqs.map((faq) => (
                  <div
                    key={faq.id}
                    className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <button
                      onClick={() => toggleExpand(faq.id)}
                      className="w-full px-6 py-4 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-black">{faq.question}</h3>
                        <p className="text-sm text-gray-500 mt-1">{faq.category}</p>
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-600 transition-transform flex-shrink-0 ml-4 ${
                          expandedIds.has(faq.id) ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {expandedIds.has(faq.id) && (
                      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {faq.answer}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
