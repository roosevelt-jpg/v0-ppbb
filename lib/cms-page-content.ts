function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/gi, '&')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
}

export function normalizeCmsHeadingText(text: string): string {
  return decodeHtmlEntities(text.replace(/<[^>]+>/g, ''))
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

/** Remove leading headings in CMS body HTML that repeat the public page title. */
export function stripDuplicateCmsHeadings(content: string, ...titles: string[]): string {
  if (!content?.trim()) return content || ''

  const normalizedTitles = new Set(
    titles.filter(Boolean).map((title) => normalizeCmsHeadingText(title))
  )

  if (normalizedTitles.size === 0) return content

  let result = content.trim()
  let removed = true

  while (removed) {
    removed = false
    result = result.replace(/^<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>\s*/i, (match, inner: string) => {
      const innerText = normalizeCmsHeadingText(inner)
      if (normalizedTitles.has(innerText)) {
        removed = true
        return ''
      }
      return match
    })
  }

  return result
}

/**
 * If content is plain text (or pasted text without block tags), wrap paragraphs
 * so public pages don't collapse everything onto one line.
 */
export function ensureCmsParagraphs(content: string): string {
  const raw = (content || '').trim()
  if (!raw) return ''

  // Already has block-level HTML — keep as rich content from the editor
  if (/<(p|div|h[1-6]|ul|ol|li|br)\b/i.test(raw)) {
    return raw
  }

  // Escape minimal HTML then convert newlines to paragraphs
  const escaped = raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  return escaped
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${block.replace(/\n/g, '<br>')}</p>`)
    .join('')
}

