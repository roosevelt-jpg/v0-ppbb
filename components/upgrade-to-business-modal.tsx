'use client'

import React from 'react'
import Link from 'next/link'
import { X, Briefcase } from 'lucide-react'

export type UpgradeToBusinessModalProps = {
  open: boolean
  onClose: () => void
  /** Optional context line, e.g. "Post a Job" */
  featureLabel?: string
}

/**
 * Part 10C — shown when a basic member hits a business-only action.
 * Does not perform the upgrade itself; CTA goes to /join?type=business.
 */
export function UpgradeToBusinessModal({
  open,
  onClose,
  featureLabel,
}: UpgradeToBusinessModalProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-business-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-t-2xl sm:rounded-lg shadow-xl w-full max-w-md max-h-[92vh] overflow-y-auto p-5 sm:p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-neutral-500 hover:text-neutral-900"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center">
            <Briefcase className="w-6 h-6 text-neutral-900" />
          </div>
        </div>

        <p
          className="text-xs uppercase tracking-[0.2em] text-neutral-500 text-center mb-2"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          Business feature
        </p>
        <h2
          id="upgrade-business-title"
          className="text-2xl text-center text-neutral-900 mb-3"
          style={{ fontFamily: 'Cormorant Garamond, serif' }}
        >
          This feature is available for Business Members.
        </h2>
        <p
          className="text-sm text-neutral-600 text-center leading-relaxed mb-6"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          {featureLabel
            ? `"${featureLabel}" requires a business account. `
            : null}
          Upgrade your account to list your business, post jobs, and connect with the community.
        </p>

        <div className="flex flex-col gap-3" style={{ fontFamily: 'Inter, sans-serif' }}>
          <Link
            href="/join?type=business"
            className="min-h-[44px] inline-flex items-center justify-center bg-black hover:bg-neutral-900 text-white px-5 py-2.5 rounded text-sm font-semibold"
            onClick={onClose}
          >
            Upgrade to Business Account
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] inline-flex items-center justify-center bg-white text-black border border-neutral-300 hover:bg-neutral-50 px-5 py-2.5 rounded text-sm font-semibold"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Hook + button wrapper: basic members open the upgrade modal instead of navigating.
 */
export function useUpgradeToBusinessGate() {
  const [open, setOpen] = React.useState(false)
  const [featureLabel, setFeatureLabel] = React.useState<string | undefined>()

  const openUpgrade = React.useCallback((label?: string) => {
    setFeatureLabel(label)
    setOpen(true)
  }, [])

  const modal = (
    <UpgradeToBusinessModal
      open={open}
      onClose={() => setOpen(false)}
      featureLabel={featureLabel}
    />
  )

  return { openUpgrade, modal, isOpen: open, closeUpgrade: () => setOpen(false) }
}
