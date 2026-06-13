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
        className="fixed inset-0 z-40"
        onClick={() => onOpenChange(false)}
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}
      />

      {/* Dialog - Properly Centered and Sized */}
      <div style={{
        position: 'fixed',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 50,
        width: '90vw',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '0',
      }}>
        <div
          style={{
            border: '1px solid #e4e1da',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            borderRadius: '8px',
            backgroundColor: '#ffffff',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #e4e1da',
            padding: '24px',
            gap: '12px',
          }}>
            <div>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#111111',
                margin: '0',
              }}>
                {title}
              </h2>
              {description && (
                <p style={{
                  fontSize: '14px',
                  marginTop: '4px',
                  color: '#888888',
                  margin: '0',
                }}>
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={() => onOpenChange(false)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#aaa',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div style={{ padding: '24px' }}>{children}</div>

          {/* Footer */}
          {footer && <div style={{
            borderTop: '1px solid #e4e1da',
            paddingLeft: '24px',
            paddingRight: '24px',
            paddingTop: '16px',
            paddingBottom: '16px',
          }}>{footer}</div>}
        </div>
      </div>
    </>
  )
}
