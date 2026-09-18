'use client'

import React, { useMemo } from 'react'

function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '')
}

/** Collapse placeholder numbered lists like "1 2 3 4 5" / empty digit-only <li>s. */
function scrubPlaceholderLists(html: string): string {
  const stripped = html
    .replace(/<li[^>]*>\s*(?:<a[^>]*>)?\s*\d+\s*(?:<\/a>)?\s*<\/li>/gi, '')
    .replace(/<ol[^>]*>\s*<\/ol>/gi, '')
    .replace(/<ul[^>]*>\s*<\/ul>/gi, '')

  const textOnly = stripped.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  if (/^(\d+\s*){2,}$/.test(textOnly)) {
    return ''
  }
  return stripped
}

interface RichTextContentProps {
  html: string
  className?: string
}

const baseClass =
  'break-words [overflow-wrap:anywhere] [&_a]:underline [&_a]:break-all [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 last:[&_p]:mb-0'

export function RichTextContent({ html, className = '' }: RichTextContentProps) {
  const safe = useMemo(() => {
    const trimmed = (html || '').trim()
    if (!trimmed) return ''
    if (!trimmed.includes('<')) {
      if (/^(\d+\s*){2,}$/.test(trimmed)) return ''
      return trimmed.replace(/\n/g, '<br />')
    }
    return scrubPlaceholderLists(sanitizeHtml(trimmed)).trim()
  }, [html])

  if (!safe) {
    return (
      <div className={`${baseClass} ${className}`.trim()}>
        <p className="text-neutral-500">No description provided.</p>
      </div>
    )
  }

  return (
    <div
      className={`${baseClass} ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  )
}
