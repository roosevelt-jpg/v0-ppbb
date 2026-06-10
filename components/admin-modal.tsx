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

  if (!isOpen) return null

  const handleSubmit = async (formData: any) => {
    setIsSubmitting(true)
    try {
      await onSubmit(formData)
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
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
      }}
    >
      <Card
        style={{
          backgroundColor: '#ffffff',
          borderColor: '#e4e1da',
          width: '90%',
          maxWidth: '500px',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-6 border-b"
          style={{ borderColor: '#e4e1da' }}
        >
          <h2 style={{ color: '#111111', fontSize: '18px', fontWeight: 600 }}>{title}</h2>
          <button
            onClick={onClose}
            style={{ color: '#888888', cursor: 'pointer', background: 'none', border: 'none' }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">{children}</div>

        {/* Footer */}
        <div className="flex gap-2 p-6 border-t" style={{ borderColor: '#e4e1da', justifyContent: 'flex-end' }}>
          <Button
            onClick={onClose}
            disabled={isSubmitting || isLoading}
            style={{
              backgroundColor: '#f7f6f2',
              color: '#111111',
              border: '1px solid #e4e1da',
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleSubmit({})}
            disabled={isSubmitting || isLoading}
            style={{
              backgroundColor: '#111111',
              color: '#f7f6f2',
            }}
          >
            {isSubmitting ? 'Saving...' : submitLabel}
          </Button>
        </div>
      </Card>
    </div>
  )
}
