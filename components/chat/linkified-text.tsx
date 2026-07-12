'use client'

import React from 'react'

const URL_REGEX =
  /(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+|wa\.me\/[^\s<>"']+|chat\.whatsapp\.com\/[^\s<>"']+)/gi

function normalizeHref(raw: string): string {
  const trimmed = raw.replace(/[),.]+$/g, '')
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function displayLabel(href: string, raw: string): string {
  const lower = href.toLowerCase()
  if (lower.includes('whatsapp.com') || lower.includes('wa.me')) {
    return 'Open WhatsApp'
  }
  return raw.replace(/[),.]+$/g, '')
}

type LinkifiedTextProps = {
  text: string
  className?: string
  /** Use lighter link styles on dark (user) bubbles */
  onDark?: boolean
}

/** Renders plain text with http(s)/www/WhatsApp URLs as clickable links. */
export function LinkifiedText({ text, className = '', onDark = false }: LinkifiedTextProps) {
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  const source = String(text || '')
  const regex = new RegExp(URL_REGEX.source, URL_REGEX.flags)
  let match: RegExpExecArray | null

  while ((match = regex.exec(source)) !== null) {
    const raw = match[0]
    const start = match.index
    if (start > lastIndex) {
      parts.push(source.slice(lastIndex, start))
    }

    const trailing = raw.match(/[),.]+$/)?.[0] || ''
    const core = trailing ? raw.slice(0, -trailing.length) : raw
    const href = normalizeHref(core)
    const label = displayLabel(href, core)

    parts.push(
      <a
        key={`${start}-${core}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={
          onDark
            ? 'underline underline-offset-2 font-medium text-white hover:opacity-90 break-all'
            : 'underline underline-offset-2 font-medium text-black hover:opacity-80 break-all'
        }
        onClick={(e) => e.stopPropagation()}
      >
        {label}
      </a>
    )

    if (trailing) parts.push(trailing)
    lastIndex = start + raw.length
  }

  if (lastIndex < source.length) {
    parts.push(source.slice(lastIndex))
  }

  return (
    <span className={className} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
      {parts.length > 0 ? parts : source}
    </span>
  )
}
