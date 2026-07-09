'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Briefcase } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { hasBusinessAccess, isBasicMember } from '@/lib/roles'
import { UpgradeToBusinessModal } from '@/components/upgrade-to-business-modal'

/**
 * Business portal / upgrade control. Header variant removed from member header;
 * sidebar variant lives in MemberSidebar below Settings.
 */
export function BusinessPortalSwitcher({
  variant = 'header',
  onNavigate,
}: {
  variant?: 'header' | 'sidebar'
  onNavigate?: () => void
}) {
  const router = useRouter()
  const { user } = useAuth()
  const [upgradeOpen, setUpgradeOpen] = React.useState(false)

  const hasBusinessRole = hasBusinessAccess(user)

  const handleClick = () => {
    if (hasBusinessRole) {
      onNavigate?.()
      router.push('/business/dashboard')
      return
    }
    if (isBasicMember(user) || user) {
      onNavigate?.()
      setUpgradeOpen(true)
      return
    }
    onNavigate?.()
    router.push('/join?type=business')
  }

  const label = hasBusinessRole ? 'Business Portal' : 'Upgrade to Business'
  const title = hasBusinessRole ? 'Go to Business Portal' : 'Upgrade to Business Account'

  if (variant === 'sidebar') {
    return (
      <>
        <button
          type="button"
          onClick={handleClick}
          title={title}
          className="flex items-center gap-3 px-4 py-2 rounded-lg transition-colors w-full text-left text-foreground hover:bg-secondary"
        >
          <Briefcase className="h-4 w-4" />
          <span className="text-sm font-medium">{label}</span>
        </button>
        <UpgradeToBusinessModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
      </>
    )
  }

  return (
    <>
      <button
        onClick={handleClick}
        className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-black text-white hover:bg-neutral-900 transition-colors text-sm font-medium min-h-[44px]"
        style={{ fontFamily: 'Inter, sans-serif' }}
        title={title}
      >
        <Briefcase className="w-4 h-4" />
        <span className="hidden sm:inline">{label}</span>
      </button>

      <UpgradeToBusinessModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </>
  )
}
