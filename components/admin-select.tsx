'use client'

import React from 'react'
import { ChevronDown } from 'lucide-react'
import { useAdminPopover } from '@/hooks/use-admin-popover'
import { SELECT_STYLE, FIELD_TRIGGER_RESET } from '@/lib/admin-design-system'

export interface AdminSelectOption {
  value: string
  label: string
}

interface AdminSelectProps {
  value: string
  onChange: (value: string) => void
  options: AdminSelectOption[]
  className?: string
  id?: string
  'aria-label'?: string
}

/** Custom admin dropdown — avoids native <select> OS blue highlight. */
export function AdminSelect({
  value,
  onChange,
  options,
  className = '',
  id,
  'aria-label': ariaLabel,
}: AdminSelectProps) {
  const { open, setOpen, containerRef } = useAdminPopover()
  const selected = options.find((option) => option.value === value)

  const handleSelect = (nextValue: string) => {
    onChange(nextValue)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        id={id}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onMouseDown={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((prev) => !prev)
        }}
        className={`${SELECT_STYLE} ${FIELD_TRIGGER_RESET} w-full flex items-center justify-between gap-2 text-left`}
      >
        <span className="truncate">{selected?.label ?? 'Select...'}</span>
        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={ariaLabel}
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute left-0 right-0 top-[calc(100%+4px)] z-[100] max-h-[min(60vh,240px)] overflow-y-auto rounded-lg border border-neutral-200 bg-white py-1 shadow-lg"
        >
          {options.map((option) => {
            const isSelected = option.value === value
            return (
              <li key={option.value} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full px-3 py-2.5 text-left text-sm font-body transition !min-h-0 !rounded-none !font-normal !shadow-none hover:!shadow-none ${
                    isSelected
                      ? '!bg-black !text-white hover:!bg-black'
                      : '!bg-white !text-black hover:!bg-neutral-50'
                  }`}
                >
                  {option.label}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
