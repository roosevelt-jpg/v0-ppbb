'use client'

import React from 'react'

type ContentProtectionProps = {
  children: React.ReactNode
  /** Show a one-time notice when copy is attempted */
  showNotice?: boolean
}

/**
 * Light deterrence for authenticated areas — not foolproof.
 * Real protection is: auth + Firestore rules + noindex on private routes.
 */
export function ContentProtection({ children, showNotice = true }: ContentProtectionProps) {
  React.useEffect(() => {
    const onCopy = (e: ClipboardEvent) => {
      const target = e.target
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return
      }
      if (showNotice) {
        e.preventDefault()
      }
    }

    const onContextMenu = (e: MouseEvent) => {
      const target = e.target
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return
      }
      e.preventDefault()
    }

    document.addEventListener('copy', onCopy)
    document.addEventListener('contextmenu', onContextMenu)
    return () => {
      document.removeEventListener('copy', onCopy)
      document.removeEventListener('contextmenu', onContextMenu)
    }
  }, [showNotice])

  return (
    <div
      className="contents select-none"
      data-content-protected
      onDragStart={(e) => e.preventDefault()}
    >
      {children}
    </div>
  )
}
