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
      className={className}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  )
}
