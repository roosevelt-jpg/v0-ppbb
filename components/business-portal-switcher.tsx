'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Briefcase, Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { BusinessOnboardingModal, BusinessFormData } from './business-onboarding-modal'

export function BusinessPortalSwitcher() {
  const router = useRouter()
  const { firebaseUser, user } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Check if user has business role
  const hasBusinessRole = user?.roles?.includes('business') || false

  const handleClick = async () => {
    if (hasBusinessRole) {
      // Direct redirect if already has business role
      router.push('/admin/business')
    } else {
      // Show onboarding modal
      setIsModalOpen(true)
    }
  }

  const handleOnboardingSubmit = async (formData: BusinessFormData) => {
    setIsLoading(true)
    setError('')

    try {
      if (!firebaseUser || !user) {
        throw new Error('Not authenticated')
      }

      const response = await fetch('/api/user/upgrade-to-business', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          userId: firebaseUser.uid,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create business profile')
      }

      console.log('[v0] Business upgrade successful')

      // Close modal and redirect to business portal
      setIsModalOpen(false)
      router.push('/admin/business')
    } catch (err: any) {
      console.error('[v0] Business upgrade error:', err)
      setError(err.message || 'Failed to upgrade to business')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isLoading}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-800 transition-colors text-sm font-medium disabled:opacity-50"
        title={hasBusinessRole ? 'Go to Business Portal' : 'Create Business Profile'}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Creating...</span>
          </>
        ) : (
          <>
            <Briefcase className="w-4 h-4" />
            <span>Business Portal</span>
          </>
        )}
      </button>

      <BusinessOnboardingModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setError('')
        }}
        onSubmit={handleOnboardingSubmit}
        isLoading={isLoading}
      />
    </>
  )
}
