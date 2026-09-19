'use client'

import React, { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { EUDataProtectionPolicy } from '@/lib/types'
import { AlertCircle } from 'lucide-react'
import { isDashboardRoute } from '@/lib/dashboard-routes'

function isScrolledToEnd(el: HTMLElement): boolean {
  // Content that fits in the box counts as "read"
  if (el.scrollHeight <= el.clientHeight + 8) return true
  return el.scrollHeight - el.scrollTop - el.clientHeight < 48
}

export function EUDataProtectionPopup() {
  const pathname = usePathname()
  const contentRef = useRef<HTMLDivElement>(null)
  const [policy, setPolicy] = useState<EUDataProtectionPolicy | null>(null)
  const [showPopup, setShowPopup] = useState(false)
  const [loading, setLoading] = useState(true)
  const [scrolledToEnd, setScrolledToEnd] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    const auth = getAuth()
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid || null)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const loadPolicy = async () => {
      try {
        const res = await fetch('/api/eu-policy', { cache: 'no-store' })
        const json = await res.json()

        if (json.success && json.data) {
          const policyData = json.data as EUDataProtectionPolicy
          setPolicy(policyData)

          const requires =
            policyData.requiresAcceptance === true || policyData.acceptanceRequired === true

          if (requires && policyData.status === 'active') {
            const hasAccepted = localStorage.getItem('eu-data-protection-accepted')
            const acceptanceVersion = localStorage.getItem('eu-data-protection-version')

            if (!hasAccepted || acceptanceVersion !== String(policyData.version)) {
              setShowPopup(true)
            }
          }
        }
      } catch (error) {
        console.error('[v0] Error loading EU Data Protection Policy:', error)
      } finally {
        setLoading(false)
      }
    }

    void loadPolicy()
  }, [])

  // Re-check scroll after content renders (short policies never fire onScroll)
  useEffect(() => {
    if (!showPopup || !policy) return
    const el = contentRef.current
    if (!el) return
    const check = () => setScrolledToEnd(isScrolledToEnd(el))
    check()
    const t = window.setTimeout(check, 100)
    window.addEventListener('resize', check)
    return () => {
      window.clearTimeout(t)
      window.removeEventListener('resize', check)
    }
  }, [showPopup, policy])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrolledToEnd(isScrolledToEnd(e.currentTarget))
  }

  const handleAccept = async () => {
    if (!policy || !scrolledToEnd || !accepted) return

    setIsSubmitting(true)
    setSubmitError(null)
    try {
      localStorage.setItem('eu-data-protection-accepted', 'true')
      localStorage.setItem('eu-data-protection-version', String(policy.version))
      localStorage.setItem('eu-data-protection-accepted-at', new Date().toISOString())

      try {
        const token = userId ? await getAuth().currentUser?.getIdToken() : null
        const res = await fetch('/api/eu-policy/accept', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            policyId: policy.id || 'current',
            policyVersion: Number(policy.version),
          }),
        })
        const json = await res.json().catch(() => null)
        if (!res.ok || !json?.success) {
          console.warn('[v0] Acceptance API:', json?.error || res.status)
          // Still close — local acceptance is stored; admin can re-prompt on version bump
        }
      } catch (error) {
        console.warn('[v0] Could not record acceptance server-side:', error)
      }

      setShowPopup(false)
    } catch (error) {
      console.error('[v0] Error handling acceptance:', error)
      setSubmitError('Could not save your acceptance. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReject = () => {
    window.location.href = '/'
  }

  if (loading || !policy || !showPopup || isDashboardRoute(pathname)) {
    return null
  }

  const effectiveLabel = (() => {
    try {
      const d = new Date(policy.effectiveDate as string | Date)
      return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString()
    } catch {
      return '—'
    }
  })()

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="eu-policy-title"
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '24px',
            borderBottom: '1px solid #e4e1da',
            backgroundColor: '#f7f6f2',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <AlertCircle style={{ color: '#111111', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h2
                id="eu-policy-title"
                style={{ margin: 0, color: '#111111', fontSize: '20px', fontWeight: 'bold' }}
              >
                {policy.title}
              </h2>
              <p style={{ margin: '4px 0 0 0', color: '#666666', fontSize: '14px' }}>
                Please read and accept to continue
              </p>
            </div>
          </div>
        </div>

        <div
          ref={contentRef}
          onScroll={handleScroll}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
            backgroundColor: '#ffffff',
            color: '#333333',
            lineHeight: '1.6',
            fontSize: '14px',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            minHeight: '120px',
          }}
        >
          {policy.content}
        </div>

        <div
          style={{
            padding: '24px',
            borderTop: '1px solid #e4e1da',
            backgroundColor: '#f7f6f2',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: scrolledToEnd ? 'pointer' : 'not-allowed',
              color: '#111111',
              fontSize: '14px',
            }}
          >
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              disabled={!scrolledToEnd}
              style={{ cursor: scrolledToEnd ? 'pointer' : 'not-allowed' }}
            />
            <span>
              I have read and accept the <strong>{policy.title || 'EU Data Protection Policy'}</strong>
              {!scrolledToEnd && (
                <span style={{ color: '#888888' }}> (Please scroll to the end)</span>
              )}
            </span>
          </label>

          {submitError ? (
            <p style={{ margin: 0, fontSize: '13px', color: '#b91c1c' }}>{submitError}</p>
          ) : null}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={handleReject}
              disabled={isSubmitting}
              style={{
                flex: 1,
                padding: '10px 16px',
                backgroundColor: '#f0f0f0',
                color: '#111111',
                border: '1px solid #e4e1da',
                borderRadius: '6px',
                fontWeight: '500',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.6 : 1,
              }}
            >
              Reject & Exit
            </button>
            <button
              type="button"
              onClick={() => void handleAccept()}
              disabled={!scrolledToEnd || !accepted || isSubmitting}
              style={{
                flex: 1,
                padding: '10px 16px',
                backgroundColor: !scrolledToEnd || !accepted ? '#ccc' : '#111111',
                color: '#f7f6f2',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '500',
                cursor: !scrolledToEnd || !accepted || isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.8 : 1,
              }}
            >
              {isSubmitting ? 'Accepting...' : 'Accept & Continue'}
            </button>
          </div>

          <p style={{ margin: 0, fontSize: '12px', color: '#888888', textAlign: 'center' }}>
            Version {policy.version} • Effective from {effectiveLabel}
          </p>
        </div>
      </div>
    </div>
  )
}
