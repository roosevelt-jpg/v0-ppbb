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
  /** Max width of the dialog panel (default compact card). */
  maxWidth?: string
  /** Tighter padding / typography (default on — denser cards across dashboards). */
  compact?: boolean
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  maxWidth = '22rem',
  compact = true,
}: DialogProps) {
  if (!open) return null

  const pad = compact ? '14px 16px' : '24px'
  const footerPad = compact ? '10px 16px' : '16px 24px'

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
        width: compact ? 'min(92vw, 20rem)' : '90vw',
        maxWidth,
        maxHeight: compact ? '85vh' : '90vh',
        overflowY: 'auto',
        padding: '0',
      }}>
        <div
          className="border-border bg-card"
          style={{
            border: '1px solid',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            borderRadius: '8px',
          }}
        >
          {/* Header */}
          <div
            className="border-border"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid',
              padding: pad,
              gap: '10px',
            }}
          >
            <div>
              <h2
                className="text-card-foreground"
                style={{
                  fontSize: compact ? '15px' : '18px',
                  fontWeight: '600',
                  margin: '0',
                  lineHeight: 1.3,
                }}
              >
                {title}
              </h2>
              {description && (
                <p
                  className="text-muted-foreground"
                  style={{
                    fontSize: compact ? '12px' : '14px',
                    marginTop: compact ? '2px' : '4px',
                    margin: '0',
                    lineHeight: 1.35,
                  }}
                >
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label="Close"
              className="bg-foreground text-background"
              style={{
                border: 'none',
                cursor: 'pointer',
                padding: compact ? '4px' : '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                borderRadius: '6px',
                width: compact ? '28px' : '32px',
                height: compact ? '28px' : '32px',
              }}
            >
              <X className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
            </button>
          </div>

          {/* Content */}
          <div style={{ padding: pad }}>{children}</div>

          {/* Footer */}
          {footer && (
            <div className="border-border" style={{ borderTop: '1px solid', padding: footerPad }}>
              {footer}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
