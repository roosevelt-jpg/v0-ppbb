'use client'

import React from 'react'

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
  const displayColor = /^#[0-9A-Fa-f]{6}$/.test(value) ? value : '#111111'

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-lg border border-neutral-300 shrink-0"
          style={{ backgroundColor: displayColor }}
          aria-hidden
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 font-mono"
          placeholder="#111111"
          maxLength={7}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className={`w-10 h-10 rounded-lg border-2 transition shrink-0 ${
              value.toLowerCase() === color.toLowerCase()
                ? 'border-black ring-2 ring-black ring-offset-1'
                : 'border-neutral-300 hover:border-neutral-500'
            }`}
            style={{ backgroundColor: color }}
            aria-label={`Select color ${color}`}
            aria-pressed={value.toLowerCase() === color.toLowerCase()}
          />
        ))}
      </div>
    </div>
  )
}
