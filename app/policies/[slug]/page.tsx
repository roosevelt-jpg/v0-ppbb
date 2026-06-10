'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { getPolicy, DEFAULT_POLICIES } from '@/lib/policy-manager'
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
        if (data) {
          setPolicy(data)
        } else {
          // Fall back to default policies if not found in Firestore
          const policyKey = slug.replace('-policy', '').replace(/-/g, '') as keyof typeof DEFAULT_POLICIES
          const defaultPolicy = DEFAULT_POLICIES[policyKey]
          if (defaultPolicy) {
            setPolicy({
              id: policyKey,
              type: policyKey as 'privacy' | 'terms' | 'codeofconduct',
              title: defaultPolicy.title,
              slug: defaultPolicy.slug,
              content: defaultPolicy.content,
              version: 1,
              lastUpdated: new Date(),
              effectiveDate: new Date(),
              status: 'active',
              createdAt: new Date(),
              updatedAt: new Date(),
            })
          }
        }
      } catch (error) {
        console.error('[v0] Error fetching policy:', error)
        // Try to use default policy as fallback
        const policyKey = slug.replace('-policy', '').replace(/-/g, '') as keyof typeof DEFAULT_POLICIES
        const defaultPolicy = DEFAULT_POLICIES[policyKey]
        if (defaultPolicy) {
          setPolicy({
            id: policyKey,
            type: policyKey as 'privacy' | 'terms' | 'codeofconduct',
            title: defaultPolicy.title,
            slug: defaultPolicy.slug,
            content: defaultPolicy.content,
            version: 1,
            lastUpdated: new Date(),
            effectiveDate: new Date(),
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        }
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
              style={{ fontSize: '1rem', color: '#444', whiteSpace: 'pre-wrap' }}
            >
              {policy.content}
            </div>
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
