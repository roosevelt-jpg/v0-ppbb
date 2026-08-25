'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { X } from 'lucide-react'

interface AdminModalProps {
  isOpen: boolean
  title: string
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
  children: React.ReactNode
  submitLabel?: string
  isLoading?: boolean
}

export function AdminModal({
  isOpen,
  title,
  onClose,
  onSubmit,
  children,
  submitLabel = 'Save',
  isLoading = false,
}: AdminModalProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const formRef = React.useRef<HTMLFormElement>(null)

  if (!isOpen) return null

  const handleSubmit = async () => {
    // Collects values from any named field inside `children` — this modal
    // never sees the caller's field state directly, so it relies on the
    // body being rendered as normal form fields with `name` attributes.
    const data = formRef.current ? Object.fromEntries(new FormData(formRef.current)) : {}
    setIsSubmitting(true)
    try {
      await onSubmit(data)
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
      }}
    >
      <Card
        className="bg-card border-border"
        style={{
          width: '90%',
          maxWidth: '800px',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-card-foreground" style={{ fontSize: '18px', fontWeight: 600 }}>{title}</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground"
            style={{ cursor: 'pointer', background: 'none', border: 'none' }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form ref={formRef} className="p-6" onSubmit={(e) => e.preventDefault()}>
          {children}
        </form>

        {/* Footer */}
        <div className="flex gap-2 p-6 border-t border-border" style={{ justifyContent: 'flex-end' }}>
          <Button
            onClick={onClose}
            disabled={isSubmitting || isLoading}
            className="bg-secondary text-secondary-foreground border border-border"
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleSubmit()}
            disabled={isSubmitting || isLoading}
            className="bg-foreground text-background"
          >
            {isSubmitting ? 'Saving...' : submitLabel}
          </Button>
        </div>
      </Card>
    </div>
  )
}
