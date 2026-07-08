'use client'

import React from 'react'
import { ChevronDown } from 'lucide-react'
import { useAdminPopover } from '@/hooks/use-admin-popover'

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
  const { open, setOpen, containerRef } = useAdminPopover()
  const displayEmoji = value || '🎯'

  const handleSelect = (emoji: string) => {
    onChange(emoji)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="Select plan icon"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center justify-between gap-2 w-full sm:w-auto min-w-[4.5rem] h-11 px-3 rounded-lg border border-neutral-300 bg-white text-black hover:border-neutral-500 hover:bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition font-body !min-h-0 !font-normal !shadow-none hover:!shadow-none"
      >
        <span className="text-2xl leading-none" aria-hidden>
          {displayEmoji}
        </span>
        <ChevronDown className={`w-4 h-4 text-neutral-600 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Plan icon options"
          className="absolute left-0 z-50 mt-1 w-[min(calc(100vw-2rem),18rem)] sm:w-72 rounded-lg border border-neutral-200 bg-white p-3 shadow-lg"
        >
          <div className="grid grid-cols-6 gap-2">
            {PLAN_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                role="option"
                aria-selected={value === emoji}
                onClick={() => handleSelect(emoji)}
                className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border text-xl transition !p-0 !shadow-none hover:!shadow-none ${
                  value === emoji
                    ? '!border-black !bg-black !text-white hover:!bg-black'
                    : '!border-neutral-200 !bg-white !text-black hover:!border-neutral-400 hover:!bg-neutral-50'
                }`}
                aria-label={`Select ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
