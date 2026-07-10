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
