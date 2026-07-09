'use client'

import React from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

type DashboardModalProps = {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
  footer?: React.ReactNode
}

export function DashboardModal({ open, title, onClose, children, footer }: DashboardModalProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full sm:max-w-lg max-h-[90vh] overflow-hidden rounded-t-xl sm:rounded-xl bg-white shadow-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dashboard-modal-title"
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 sm:px-6 sm:py-4">
          <h2 id="dashboard-modal-title" className="text-lg font-semibold text-neutral-900">
            {title}
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px]"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">{children}</div>
        {footer ? (
          <div className="border-t border-neutral-200 px-4 py-3 sm:px-6 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  )
}
