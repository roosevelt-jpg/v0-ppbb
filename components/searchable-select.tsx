'use client'

import React, { useEffect, useId, useMemo, useRef, useState } from 'react'

export interface SearchableSelectOption {
  value: string
  label: string
}

interface SearchableSelectProps {
  id?: string
  label: string
  value: string
  options: SearchableSelectOption[]
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
}

export function SearchableSelect({
  id,
  label,
  value,
  options,
  onChange,
  placeholder = 'Search…',
  required = false,
  disabled = false,
}: SearchableSelectProps) {
  const autoId = useId()
  const inputId = id || autoId
  const listId = `${inputId}-list`
  const containerRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const selectedLabel = options.find((o) => o.value === value)?.label || ''

  useEffect(() => {
    setQuery(selectedLabel)
  }, [selectedLabel])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options.slice(0, 80)
    return options.filter(
      (o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q)
    )
  }, [options, query])

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  return (
    <div ref={containerRef} className="relative w-full">
      <label htmlFor={inputId} className="block text-xs font-semibold text-neutral-900 mb-1">
        {label}
        {required ? ' *' : ''}
      </label>
      <input
        id={inputId}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        list={listId}
        value={query}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
          const exact = options.find(
            (o) => o.label.toLowerCase() === e.target.value.trim().toLowerCase()
          )
          if (exact) onChange(exact.value)
        }}
        className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-900 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
      />
      {open && filtered.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-neutral-200 bg-white shadow-lg"
        >
          {filtered.map((option) => (
            <li key={option.value} role="option" aria-selected={option.value === value}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-100 text-neutral-900"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(option.value)
                  setQuery(option.label)
                  setOpen(false)
                }}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
