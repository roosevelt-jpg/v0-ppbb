'use client'

import React, { useEffect, useState } from 'react'

/** Keep only digits and insert slashes: 15031990 → 15/03/1990 */
export function formatDobTyping(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  let out = digits.slice(0, 2)
  if (digits.length > 2) out += `/${digits.slice(2, 4)}`
  if (digits.length > 4) out += `/${digits.slice(4, 8)}`
  return out
}

export function isoToDobDisplay(value: string): string {
  const iso = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`
  return formatDobTyping(value)
}

/** Returns YYYY-MM-DD when the typed date is real and not in the future. */
export function dobDisplayToIso(display: string): string | null {
  const match = display.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return null
  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3])
  if (year < 1900) return null
  const date = new Date(year, month - 1, day)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (date > today) return null
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/**
 * Date of birth as typed numbers. type="date" opens a calendar on many phones
 * and never shows the keypad.
 */
export function DobTextInput({
  value,
  onChange,
  style,
  id,
}: {
  value: string
  onChange: (isoDate: string) => void
  style?: React.CSSProperties
  id?: string
}) {
  const [text, setText] = useState(() => isoToDobDisplay(value))

  useEffect(() => {
    if (!value) return
    const shown = isoToDobDisplay(value)
    setText((current) => (dobDisplayToIso(current) === value || current === shown ? current : shown))
  }, [value])

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      autoComplete="bday"
      enterKeyHint="next"
      placeholder="DD/MM/YYYY"
      value={text}
      onChange={(e) => {
        const next = formatDobTyping(e.target.value)
        setText(next)
        onChange(dobDisplayToIso(next) || '')
      }}
      style={{
        width: '100%',
        padding: '0.75rem',
        border: '1px solid #e4e1da',
        borderRadius: '0.375rem',
        fontSize: '16px',
        boxSizing: 'border-box',
        ...style,
      }}
    />
  )
}
