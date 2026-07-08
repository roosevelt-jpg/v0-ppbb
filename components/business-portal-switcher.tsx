'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Briefcase, Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { hasBusinessAccess } from '@/lib/roles'
import { BusinessOnboardingModal, BusinessFormData } from './business-onboarding-modal'

export function BusinessPortalSwitcher() {
  const router = useRouter()
  const { firebaseUser, user } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const hasBusinessRole = hasBusinessAccess(user)

  const handleClick = async () => {
    if (hasBusinessRole) {
      router.push('/business/dashboard')
    } else {
      // Logged-in members: in-place upgrade + listing form
      // Anonymous visitors get the join funnel
      if (firebaseUser) {
        setIsModalOpen(true)
      } else {
        router.push('/join?type=business')
      }
    }
  }

  const handleOnboardingSubmit = async (formData: BusinessFormData) => {
    setIsLoading(true)

    try {
      if (!firebaseUser || !user) {
        throw new Error('Not authenticated')
      }

      const response = await fetch('/api/user/upgrade-to-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: firebaseUser.uid,
          businessName: formData.businessName,
          businessType: formData.businessType,
          businessDescription: formData.businessDescription,
          communityBenefit: formData.communityBenefit,
          services: formData.services,
          tradeLicenceURL: formData.tradeLicenceURL,
          productImages: formData.productImages,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create business profile')
      }

      setIsModalOpen(false)
      window.location.href = '/business/dashboard?listing=pending'
    } catch (err: unknown) {
      console.error('[v0] Business upgrade error:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isLoading}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-800 transition-colors text-sm font-medium disabled:opacity-50 min-h-[44px]"
        title={
          hasBusinessRole
            ? 'Go to Business Portal'
            : 'Upgrade to Business Account'
        }
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Working…</span>
          </>
        ) : (
          <>
            <Briefcase className="w-4 h-4" />
            <span>{hasBusinessRole ? 'Business Portal' : 'Upgrade to Business'}</span>
          </>
        )}
      </button>

      <BusinessOnboardingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleOnboardingSubmit}
        isLoading={isLoading}
      />
    </>
  )
}
