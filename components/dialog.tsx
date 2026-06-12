'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export function Dialog({ open, onOpenChange, title, description, children, footer }: DialogProps) {
  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/5"
        onClick={() => onOpenChange(false)}
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}
      />

      {/* Dialog */}
      <div className="fixed left-[50%] top-[50%] z-50 w-screen max-w-4xl translate-x-[-50%] translate-y-[-50%] max-h-[90vh] overflow-y-auto p-4">
        <div
          className="border shadow-lg rounded-lg"
          style={{
            backgroundColor: '#ffffff',
            borderColor: '#e4e1da',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b p-6" style={{ borderColor: '#e4e1da' }}>
            <div>
              <h2 className="text-lg font-semibold" style={{ color: '#111111' }}>
                {title}
              </h2>
              {description && (
                <p className="text-sm mt-1" style={{ color: '#888888' }}>
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">{children}</div>

          {/* Footer */}
          {footer && <div className="border-t px-6 py-4" style={{ borderColor: '#e4e1da' }}>{footer}</div>}
        </div>
      </div>
    </>
  )
}
