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
 * Does not perform the upgrade itself; CTA goes to membership checkout.
 */
export function UpgradeToBusinessModal({
  open,
  onClose,
  featureLabel,
}: UpgradeToBusinessModalProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-business-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-transparent"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-lg border border-neutral-200 w-full max-w-[280px] p-4">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-2 right-2 min-h-[28px] min-w-[28px] inline-flex items-center justify-center text-neutral-500 hover:text-neutral-900"
          aria-label="Close"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="flex justify-center mb-2">
          <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-neutral-900" />
          </div>
        </div>

        <p
          className="text-[10px] uppercase tracking-[0.15em] text-neutral-500 text-center mb-1"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          Business feature
        </p>
        <h2
          id="upgrade-business-title"
          className="text-base text-center text-neutral-900 mb-2 leading-snug"
          style={{ fontFamily: 'Cormorant Garamond, serif' }}
        >
          This feature is available for Business Members.
        </h2>
        <p
          className="text-xs text-neutral-600 text-center leading-relaxed mb-3"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          {featureLabel
            ? `"${featureLabel}" requires a business account. `
            : null}
          Upgrade to list your business, post jobs, and connect with the community.
        </p>

        <div className="flex flex-col gap-2" style={{ fontFamily: 'Inter, sans-serif' }}>
          <Link
            href="/dashboard/membership?upgrade=business"
            className="min-h-[32px] inline-flex items-center justify-center bg-black hover:bg-neutral-900 text-white px-3 py-1.5 rounded text-xs font-semibold"
            onClick={onClose}
          >
            Upgrade to Business Account
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[32px] inline-flex items-center justify-center bg-white text-black border border-neutral-300 hover:bg-neutral-50 px-3 py-1.5 rounded text-xs font-semibold"
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
