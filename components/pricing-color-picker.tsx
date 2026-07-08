'use client'

import React from 'react'
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
  const displayColor = /^#[0-9A-Fa-f]{6}$/.test(value) ? value : '#111111'

  const handlePresetSelect = (color: string) => {
    onChange(color)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Open color palette"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
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

      {open && (
        <div
          role="dialog"
          aria-label="Color palette"
          className="absolute left-0 right-0 sm:right-auto z-50 mt-2 w-full sm:w-72 rounded-lg border border-neutral-200 bg-white p-3 shadow-lg"
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
        </div>
      )}
    </div>
  )
}
