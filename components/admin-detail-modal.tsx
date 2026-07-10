'use client'

import React from 'react'
import { X } from 'lucide-react'
import {
  ADMIN_DETAIL_MODAL_BACKDROP,
  ADMIN_DETAIL_MODAL_CLOSE,
  ADMIN_DETAIL_MODAL_OVERLAY,
  ADMIN_DETAIL_MODAL_PANEL,
} from '@/lib/admin-design-system'

interface AdminDetailModalProps {
  open: boolean
  onClose: () => void
  title: string
  titleId?: string
  children: React.ReactNode
  footer?: React.ReactNode
  /** Optional max width override (default compact panel) */
  panelClassName?: string
}

/** Compact admin detail modal — shared by profile views, review dialogs, etc. */
export function AdminDetailModal({
  open,
  onClose,
  title,
  titleId = 'admin-detail-modal-title',
  children,
  footer,
  panelClassName = '',
}: AdminDetailModalProps) {
  if (!open) return null

  return (
    <div className={ADMIN_DETAIL_MODAL_OVERLAY}>
      <button
        type="button"
        className={ADMIN_DETAIL_MODAL_BACKDROP}
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`${ADMIN_DETAIL_MODAL_PANEL} ${panelClassName}`.trim()}
      >
        <div className="flex items-start justify-between gap-2 p-3 sm:p-4 border-b border-neutral-200">
          <h2 id={titleId} className="font-headline text-base font-bold text-neutral-900 pr-6">
            {title}
          </h2>
          <button
            type="button"
            data-dashboard-control
            onClick={onClose}
            className={ADMIN_DETAIL_MODAL_CLOSE}
            aria-label="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-3 sm:p-4 overflow-y-auto max-h-[calc(85vh-7rem)]">{children}</div>

        {footer ? (
          <div className="p-3 sm:p-4 border-t border-neutral-200 flex flex-col-reverse sm:flex-row gap-2">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  )
}
