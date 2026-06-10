'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { getPolicy } from '@/lib/policy-manager'
import { Policy } from '@/lib/types'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'

export default function PolicyPage() {
  const params = useParams()
  const slug = params.slug as string
  const [policy, setPolicy] = useState<Policy | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const data = await getPolicy(slug)
        setPolicy(data)
      } catch (error) {
        console.error('[v0] Error fetching policy:', error)
      } finally {
        setLoading(false)
      }
    }

    if (slug) fetchPolicy()
  }, [slug])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <Navbar />
      
      <main style={{ flex: 1, padding: '2rem 1rem', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ fontSize: '1rem', color: '#666' }}>Loading policy...</p>
          </div>
        ) : policy ? (
          <article style={{ lineHeight: 1.8, color: '#333' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '1rem', color: '#111' }}>
              {policy.title}
            </h1>
            <div style={{ fontSize: '0.875rem', color: '#888', marginBottom: '2rem' }}>
              Last updated: {new Date(policy.lastUpdated).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
            <div
              style={{ fontSize: '1rem', color: '#444' }}
              dangerouslySetInnerHTML={{
                __html: policy.content
                  .replace(/^# /gm, '<h2 style="font-size: 1.875rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.75rem; color: #111;">')
                  .replace(/^## /gm, '<h3 style="font-size: 1.5rem; font-weight: 600; margin-top: 1.25rem; margin-bottom: 0.5rem; color: #222;">')
                  .replace(/\n\n/g, '</p><p>')
                  .replace(/^- /gm, '<li style="margin-left: 1.5rem; margin-bottom: 0.5rem;">')
                  .replace(/\n- /g, '</li><li style="margin-left: 1.5rem; margin-bottom: 0.5rem;">')
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .split('\n')
                  .map((line) => `<p style="margin-bottom: 1rem;">${line}</p>`)
                  .join('')
              }}
            />
          </article>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ fontSize: '1rem', color: '#666' }}>Policy not found</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
