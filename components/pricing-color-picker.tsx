'use client'

import React from 'react'
import { createPortal } from 'react-dom'
import { useAdminPopover } from '@/hooks/use-admin-popover'
import { INPUT_STYLE } from '@/lib/admin-design-system'

const PRESET_COLORS = [
  '#111111',
  '#6B7280',
  '#D4A574',
  '#92400E',
  '#7C3AED',
  '#BE123C',
  '#0F766E',
  '#1D4ED8',
  '#CA8A04',
  '#FFFFFF',
] as const

interface PricingColorPickerProps {
  value: string
  onChange: (color: string) => void
}

export function PricingColorPicker({ value, onChange }: PricingColorPickerProps) {
  const { open, setOpen, containerRef } = useAdminPopover()
  const swatchRef = React.useRef<HTMLButtonElement>(null)
  const [panelStyle, setPanelStyle] = React.useState<React.CSSProperties>({})
  const displayColor = /^#[0-9A-Fa-f]{6}$/.test(value) ? value : '#111111'

  const updatePanelPosition = React.useCallback(() => {
    const anchor = swatchRef.current
    if (!anchor) return
    const rect = anchor.getBoundingClientRect()
    setPanelStyle({
      position: 'fixed',
      top: rect.bottom + 8,
      left: Math.min(rect.left, window.innerWidth - 288 - 16),
      width: Math.min(288, window.innerWidth - 32),
      zIndex: 200,
    })
  }, [])

  React.useEffect(() => {
    if (!open) return
    updatePanelPosition()
    window.addEventListener('resize', updatePanelPosition)
    window.addEventListener('scroll', updatePanelPosition, true)
    return () => {
      window.removeEventListener('resize', updatePanelPosition)
      window.removeEventListener('scroll', updatePanelPosition, true)
    }
  }, [open, updatePanelPosition])

  const handleToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setOpen((prev) => !prev)
  }

  const handlePresetSelect = (color: string) => {
    onChange(color)
    setOpen(false)
  }

  const popover =
    open && typeof document !== 'undefined'
      ? createPortal(
          <div
            role="dialog"
            aria-label="Color palette"
            style={panelStyle}
            className="rounded-lg border border-neutral-200 bg-white p-3 shadow-lg"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <p className="text-xs font-medium text-neutral-600 uppercase tracking-wide mb-2 font-body">
              Preset colors
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handlePresetSelect(color)}
                  className={`w-10 h-10 rounded-lg border-2 transition shrink-0 !min-h-0 !p-0 !shadow-none hover:!shadow-none ${
                    value.toLowerCase() === color.toLowerCase()
                      ? '!border-black ring-2 ring-black ring-offset-1'
                      : '!border-neutral-300 hover:!border-neutral-500'
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Select color ${color}`}
                  aria-pressed={value.toLowerCase() === color.toLowerCase()}
                />
              ))}
            </div>
            <label className="block text-xs font-medium text-neutral-600 mb-1 font-body">Custom hex</label>
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className={`${INPUT_STYLE} w-full font-mono text-sm !shadow-none`}
              placeholder="#111111"
              maxLength={7}
            />
          </div>,
          document.body
        )
      : null

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-3">
        <button
          ref={swatchRef}
          type="button"
          aria-label="Open color palette"
          aria-haspopup="dialog"
          aria-expanded={open}
          onMouseDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onClick={handleToggle}
          className="w-11 h-11 rounded-lg border border-neutral-300 shrink-0 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition !min-h-0 !p-0 !shadow-none hover:!shadow-none"
          style={{ backgroundColor: displayColor }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${INPUT_STYLE} flex-1 font-mono text-sm !shadow-none`}
          placeholder="#111111"
          maxLength={7}
          aria-label="Plan color hex value"
        />
      </div>
      {popover}
    </div>
  )
}
