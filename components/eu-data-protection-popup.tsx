'use client'

import React, { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { doc, getDoc, setDoc, collection, addDoc } from 'firebase/firestore'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { EUDataProtectionPolicy } from '@/lib/types'
import { AlertCircle, X } from 'lucide-react'

export function EUDataProtectionPopup() {
  const [policy, setPolicy] = useState<EUDataProtectionPolicy | null>(null)
  const [showPopup, setShowPopup] = useState(false)
  const [loading, setLoading] = useState(true)
  const [scrolledToEnd, setScrolledToEnd] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Track auth state
  useEffect(() => {
    const auth = getAuth()
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid || null)
    })
    return () => unsubscribe()
  }, [])

  // Load policy and check acceptance status
  useEffect(() => {
    const loadPolicy = async () => {
      try {
        // Get active policy from Firestore
        const policyRef = doc(db, 'euDataProtectionPolicy', 'current')
        const policySnap = await getDoc(policyRef)

        if (policySnap.exists()) {
          const policyData = policySnap.data() as EUDataProtectionPolicy
          setPolicy(policyData)

          // Only show popup if policy requires acceptance and is active
          if (policyData.requiresAcceptance && policyData.status === 'active') {
            // Check if user has already accepted in localStorage
            const hasAccepted = localStorage.getItem('eu-data-protection-accepted')
            const acceptanceVersion = localStorage.getItem('eu-data-protection-version')

            // Show popup if not accepted or if policy version changed
            if (!hasAccepted || acceptanceVersion !== policyData.version.toString()) {
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

    loadPolicy()
  }, [])

  // Handle scroll to end of policy text
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget
    const isAtEnd = element.scrollHeight - element.scrollTop < 50
    setScrolledToEnd(isAtEnd)
  }

  // Handle acceptance
  const handleAccept = async () => {
    if (!policy) return

    setIsSubmitting(true)
    try {
      // Store acceptance in localStorage
      localStorage.setItem('eu-data-protection-accepted', 'true')
      localStorage.setItem('eu-data-protection-version', policy.version.toString())
      localStorage.setItem('eu-data-protection-accepted-at', new Date().toISOString())

      // If user is logged in, also record in Firestore
      if (userId) {
        try {
          await addDoc(collection(db, 'policyAcceptances'), {
            userId: userId,
            policyId: policy.id,
            policyVersion: policy.version,
            acceptedAt: new Date(),
            userAgent: navigator.userAgent,
            acceptedAtISO: new Date().toISOString(),
          })
        } catch (error) {
          console.warn('[v0] Could not record acceptance in Firestore:', error)
          // Continue anyway - localStorage is sufficient
        }
      }

      // Close popup
      setShowPopup(false)
    } catch (error) {
      console.error('[v0] Error handling acceptance:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle rejection (prevent access)
  const handleReject = () => {
    // Redirect to a rejection page or show message
    window.location.href = '/'
  }

  if (loading || !policy || !showPopup) {
    return null
  }

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
        {/* Header */}
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
              <h2 style={{ margin: 0, color: '#111111', fontSize: '20px', fontWeight: 'bold' }}>
                {policy.title}
              </h2>
              <p style={{ margin: '4px 0 0 0', color: '#666666', fontSize: '14px' }}>
                Please read and accept to continue
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div
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
          }}
        >
          {policy.content}
        </div>

        {/* Footer */}
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
              cursor: 'pointer',
              color: '#111111',
              fontSize: '14px',
            }}
          >
            <input
              type="checkbox"
              checked={scrolledToEnd && accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              disabled={!scrolledToEnd}
              style={{ cursor: scrolledToEnd ? 'pointer' : 'not-allowed' }}
            />
            <span>
              I have read and accept the{' '}
              <strong>EU Data Protection Policy</strong>
              {!scrolledToEnd && <span style={{ color: '#888888' }}> (Please scroll to the end)</span>}
            </span>
          </label>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
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
              onClick={handleAccept}
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
            Version {policy.version} • Effective from {new Date(policy.effectiveDate).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  )
}
