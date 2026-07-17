'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { db } from '@/lib/firebase'
import { collection, onSnapshot } from 'firebase/firestore'

interface FAQ {
  id: string
  question: string
  answer: string
  category: string
  order: number
  status: 'published' | 'draft'
}

function mapFaq(id: string, data: Record<string, unknown>): FAQ | null {
  const status =
    data.status === 'published' || data.isActive === true ? 'published' : 'draft'
  if (status !== 'published') return null
  return {
    id,
    question: String(data.question || ''),
    answer: String(data.answer || ''),
    category: String(data.category || 'General'),
    order: typeof data.order === 'number' ? data.order : 0,
    status,
  }
}

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'faqs'),
      (snap) => {
        const rows = snap.docs
          .map((d) => mapFaq(d.id, d.data() as Record<string, unknown>))
          .filter((f): f is FAQ => f != null)
          .sort((a, b) => a.order - b.order || a.question.localeCompare(b.question))
        setFaqs(rows)
        setLoading(false)
        setError('')
      },
      (err) => {
        console.error('[faq] snapshot error:', err)
        setError('Failed to load FAQs. Please try again.')
        setLoading(false)
      }
    )
    return () => unsub()
  }, [])

  const categories = useMemo(
    () => [...new Set(faqs.map((f) => f.category))].sort(),
    [faqs]
  )

  const visible = selectedCategory
    ? faqs.filter((f) => f.category === selectedCategory)
    : faqs

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white">
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

        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          {categories.length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-8 justify-center">
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-lg text-sm font-medium bg-black text-white ${
                  selectedCategory === null ? 'ring-2 ring-offset-1 ring-black' : 'opacity-70'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium bg-black text-white ${
                    selectedCategory === cat ? 'ring-2 ring-offset-1 ring-black' : 'opacity-70'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          ) : null}

          {error ? (
            <p className="text-center text-red-600 text-sm">{error}</p>
          ) : loading ? (
            <p className="text-center text-gray-500">Loading FAQs…</p>
          ) : visible.length === 0 ? (
            <p className="text-center text-gray-500">No FAQs published yet.</p>
          ) : (
            <div className="space-y-3">
              {visible.map((faq) => {
                const open = expandedIds.has(faq.id)
                return (
                  <div key={faq.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleExpand(faq.id)}
                      className="w-full flex items-center justify-between gap-3 px-4 py-4 text-left bg-white hover:bg-gray-50 !bg-white !text-black !shadow-none !min-h-0 !rounded-none !px-4"
                      data-slot="button"
                    >
                      <span className="font-semibold text-black">{faq.question}</span>
                      <ChevronDown
                        className={`w-5 h-5 shrink-0 text-neutral-600 transition-transform ${
                          open ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {open ? (
                      <div className="px-4 pb-4 text-gray-700 text-sm leading-relaxed whitespace-pre-wrap border-t border-gray-100 pt-3">
                        {faq.answer}
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  )
}
