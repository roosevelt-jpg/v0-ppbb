'use client'

import React, { useMemo } from 'react'

function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '')
}

interface RichTextContentProps {
  html: string
  className?: string
}

const baseClass =
  'break-words [overflow-wrap:anywhere] [&_a]:underline [&_a]:break-all [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 last:[&_p]:mb-0'

export function RichTextContent({ html, className = '' }: RichTextContentProps) {
  const safe = useMemo(() => {
    const trimmed = html.trim()
    if (!trimmed.includes('<')) {
      return trimmed.replace(/\n/g, '<br />')
    }
    return sanitizeHtml(trimmed)
  }, [html])

  return (
    <div
      className={`${baseClass} ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  )
}
