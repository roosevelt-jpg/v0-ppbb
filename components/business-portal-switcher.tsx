'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Briefcase } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { hasBusinessAccess, isBasicMember } from '@/lib/roles'
import { UpgradeToBusinessModal } from '@/components/upgrade-to-business-modal'

/**
 * Header control: business users go to portal; basic members see Part 10C upgrade modal.
 * Full listing form remains at /join?type=business after upgrade CTA.
 */
export function BusinessPortalSwitcher() {
  const router = useRouter()
  const { user } = useAuth()
  const [upgradeOpen, setUpgradeOpen] = React.useState(false)

  const hasBusinessRole = hasBusinessAccess(user)

  const handleClick = () => {
    if (hasBusinessRole) {
      router.push('/business/dashboard')
      return
    }
    if (isBasicMember(user) || user) {
      setUpgradeOpen(true)
      return
    }
    router.push('/join?type=business')
  }

  return (
    <>
      <button
        onClick={handleClick}
        className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-black text-white hover:bg-neutral-900 transition-colors text-sm font-medium min-h-[44px]"
        style={{ fontFamily: 'Inter, sans-serif' }}
        title={
          hasBusinessRole ? 'Go to Business Portal' : 'Upgrade to Business Account'
        }
      >
        <Briefcase className="w-4 h-4" />
        <span className="hidden sm:inline">
          {hasBusinessRole ? 'Business Portal' : 'Upgrade to Business'}
        </span>
      </button>

      <UpgradeToBusinessModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </>
  )
}
