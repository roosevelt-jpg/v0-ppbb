'use client'

import React from 'react'

const PLAN_EMOJIS = [
  '🎯', '⭐', '💎', '🏆', '👑', '🌟', '✨', '🔥', '💫', '🎖️',
  '🛡️', '💼', '🤝', '🎁', '📦', '🚀', '💡', '🎓', '🌍', '❤️',
  '🙌', '⚡', '🏅', '📈', '🔑', '🌱', '🎪', '🧭', '💪', '🎉',
] as const

interface PricingEmojiPickerProps {
  value: string
  onChange: (emoji: string) => void
}

export function PricingEmojiPicker({ value, onChange }: PricingEmojiPickerProps) {
  return (
    <div className="space-y-3">
      <div
        className="flex items-center justify-center w-14 h-14 rounded-lg border-2 border-neutral-900 bg-neutral-50 text-3xl"
        aria-label="Selected icon"
      >
        {value || '🎯'}
      </div>
      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
        {PLAN_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onChange(emoji)}
            className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border text-xl transition ${
              value === emoji
                ? 'border-black bg-black text-white scale-105'
                : 'border-neutral-200 bg-white hover:border-neutral-400 hover:bg-neutral-50'
            }`}
            aria-label={`Select ${emoji}`}
            aria-pressed={value === emoji}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )
}
