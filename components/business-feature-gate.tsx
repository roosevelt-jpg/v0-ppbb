'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { hasBusinessAccess, isBasicMember } from '@/lib/roles'
import {
  UpgradeToBusinessModal,
  useUpgradeToBusinessGate,
} from '@/components/upgrade-to-business-modal'

type BusinessFeatureButtonProps = {
  featureLabel: string
  href: string
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
  /** When true, always navigate (business/admin). When member, open upgrade modal. */
}

/**
 * Intercepts clicks for basic members → Part 10C upgrade modal.
 * Business/admin users navigate to `href` as normal.
 */
export function BusinessFeatureLink({
  featureLabel,
  href,
  className,
  style,
  children,
}: BusinessFeatureButtonProps) {
  const { user } = useAuth()
  const router = useRouter()
  const { openUpgrade, modal } = useUpgradeToBusinessGate()

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (hasBusinessAccess(user)) {
      router.push(href)
      return
    }
    if (isBasicMember(user) || !user) {
      openUpgrade(featureLabel)
      return
    }
    openUpgrade(featureLabel)
  }

  return (
    <>
      <button type="button" onClick={handleClick} className={className} style={style}>
        {children}
      </button>
      {modal}
    </>
  )
}

/**
 * Full-page gate when a basic member lands on /business/* via direct URL.
 */
export function BusinessPortalAccessDenied() {
  const router = useRouter()
  const [open, setOpen] = React.useState(true)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#faf9f7] px-4">
      <UpgradeToBusinessModal
        open={open}
        onClose={() => {
          setOpen(false)
          router.push('/dashboard')
        }}
        featureLabel="Business Portal"
      />
      {!open ? (
        <p className="text-sm text-neutral-500" style={{ fontFamily: 'Inter, sans-serif' }}>
          Redirecting to your member dashboard…
        </p>
      ) : null}
    </div>
  )
}
