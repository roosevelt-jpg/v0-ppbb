/**
 * CMS pages store author-facing plain text. We convert to light HTML only for
 * public rendering so pasted policies keep paragraph / line breaks.
 */

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/gi, '&')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#160;/gi, ' ')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
}

/** Strip HTML to editable plain text (preserves line breaks from block tags). */
export function htmlToPlainText(content: string): string {
  const raw = (content || '').trim()
  if (!raw) return ''

  if (!/<[a-z][\s\S]*>/i.test(raw)) {
    return decodeHtmlEntities(raw.replace(/\r\n/g, '\n'))
  }

  let text = raw
    .replace(/\r\n/g, '\n')
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/\s*(p|div|h[1-6]|li|tr|blockquote)\s*>/gi, '\n')
    .replace(/<\s*(p|div|h[1-6]|li|tr|blockquote)[^>]*>/gi, '')
    .replace(/<\/\s*(ul|ol)\s*>/gi, '\n')
    .replace(/<\s*li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')

  text = decodeHtmlEntities(text)
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return text
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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * When pasted text lost newlines (common with old HTML saves), restore breaks
 * before numbered sections and common policy labels.
 */
export function restorePlainTextBreaks(plain: string): string {
  let text = plain.replace(/\r\n/g, '\n').trim()
  if (!text) return ''

  if (/\n/.test(text)) {
    return text.replace(/\n{3,}/g, '\n\n')
  }

  // Single-line blob: insert paragraph breaks before "1. Title", "2. Title", …
  text = text.replace(/\s+(\d{1,2}\.\s+[A-Z])/g, '\n\n$1')
  text = text.replace(/\s+(Effective Date:)/gi, '\n\n$1')
  text = text.replace(/\s+(Last Updated:)/gi, '\n\n$1')
  text = text.replace(/\s+(Contact Us)\b/gi, '\n\n$1')
  text = text.replace(/\s+(Privacy Policy)\b/gi, '\n\n$1')
  // Bullet-like runs after a colon often need a break before capital items
  text = text.replace(/:\s+([A-Z][a-z]+(?:\s+[a-z]+){0,3}(?:\s+[A-Z][a-z]+)*)/g, ':\n$1')

  return text.replace(/\n{3,}/g, '\n\n').trim()
}

/**
 * Convert plain text (or legacy HTML) into paragraph HTML for public pages.
 */
export function ensureCmsParagraphs(content: string): string {
  const plain = restorePlainTextBreaks(htmlToPlainText(content))
  if (!plain) return ''

  return plain
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block.split('\n').map((l) => escapeHtml(l.trim())).filter(Boolean)
      if (lines.length === 0) return ''
      // Numbered heading line alone → <h2>
      if (lines.length === 1 && /^\d{1,2}\.\s+\S/.test(block.trim())) {
        return `<h2>${lines[0]}</h2>`
      }
      return `<p>${lines.join('<br>')}</p>`
    })
    .join('')
}

/** Public page body HTML from stored CMS content. */
export function cmsContentToHtml(content: string, ...titles: string[]): string {
  return stripDuplicateCmsHeadings(ensureCmsParagraphs(content || ''), ...titles)
}
