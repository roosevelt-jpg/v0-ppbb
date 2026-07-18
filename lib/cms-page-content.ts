/**
 * CMS page content: rich HTML in the admin editor, sanitized for public pages.
 * Legacy plain-text pages still convert to paragraphs / headings / simple lists.
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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** True when content already has structural / inline HTML from the rich editor. */
export function looksLikeRichHtml(content: string): boolean {
  return /<\s*(p|div|ul|ol|li|h[1-6]|strong|em|b|i|u|a|br|span)\b/i.test(content || '')
}

/**
 * Allowlist sanitize for CMS HTML (no scripts / handlers / dangerous URLs).
 */
export function sanitizeCmsHtml(html: string): string {
  let out = String(html || '')
  out = out
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')

  // Drop tags outside the allowlist (keep their text)
  out = out.replace(
    /<\/?(?!\/?(?:p|br|ul|ol|li|h[1-6]|strong|em|b|i|u|a|span|div)\b)[a-z][^>]*>/gi,
    ''
  )

  // Restrict <a> to http(s), mailto, or relative paths
  out = out.replace(/<a\b([^>]*)>/gi, (_full, attrs: string) => {
    const hrefMatch = attrs.match(/\bhref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i)
    const href = (hrefMatch?.[2] || hrefMatch?.[3] || hrefMatch?.[4] || '').trim()
    const safe =
      !href ||
      /^(https?:\/\/|mailto:|\/|#)/i.test(href)
    if (!safe) return '<a>'
    const cleanHref = href.replace(/"/g, '&quot;')
    return `<a href="${cleanHref}" target="_blank" rel="noopener noreferrer">`
  })

  return out.trim()
}

/** Strip HTML to editable plain text (preserves line breaks from block tags). */
export function htmlToPlainText(content: string): string {
  const raw = (content || '').trim()
  if (!raw) return ''

  let text = decodeHtmlEntities(raw.replace(/\r\n/g, '\n'))

  if (!/<[a-z/!][\s\S]*>/i.test(text)) {
    return text.trim()
  }

  text = text
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/\s*(p|div|h[1-6]|li|tr|blockquote)\s*>/gi, '\n')
    .replace(/<\s*(p|div|h[1-6]|li|tr|blockquote)[^>]*>/gi, '')
    .replace(/<\/\s*(ul|ol)\s*>/gi, '\n')
    .replace(/<\s*li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')

  return decodeHtmlEntities(text)
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
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
 * When pasted text lost newlines (common with old HTML saves), restore breaks
 * before numbered sections and common policy labels.
 */
export function restorePlainTextBreaks(plain: string): string {
  let text = plain.replace(/\r\n/g, '\n').trim()
  if (!text) return ''

  if (/\n/.test(text)) {
    return text.replace(/\n{3,}/g, '\n\n')
  }

  text = text.replace(/\s+(\d{1,2}\.\s+[A-Z])/g, '\n\n$1')
  text = text.replace(/\s+(Effective Date:)/gi, '\n\n$1')
  text = text.replace(/\s+(Last Updated:)/gi, '\n\n$1')
  text = text.replace(/\s+(Contact Us)\b/gi, '\n\n$1')
  text = text.replace(/\s+(Privacy Policy)\b/gi, '\n\n$1')
  text = text.replace(/:\s+([A-Z][a-z]+(?:\s+[a-z]+){0,3}(?:\s+[A-Z][a-z]+)*)/g, ':\n$1')

  return text.replace(/\n{3,}/g, '\n\n').trim()
}

function isBulletLine(line: string): boolean {
  return /^([•\-\*]|\d{1,2}[.)])\s+\S/.test(line.trim())
}

function stripBulletPrefix(line: string): string {
  return line.trim().replace(/^([•\-\*]|\d{1,2}[.)])\s+/, '')
}

/**
 * Convert plain text (or legacy HTML) into paragraph / list HTML for public pages.
 */
export function ensureCmsParagraphs(content: string): string {
  const plain = restorePlainTextBreaks(htmlToPlainText(content))
  if (!plain) return ''

  return plain
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
      if (lines.length === 0) return ''

      if (lines.length === 1 && /^\d{1,2}\.\s+\S/.test(lines[0]) && lines[0].length < 80) {
        return `<h2>${escapeHtml(lines[0])}</h2>`
      }

      const bulletLines = lines.filter(isBulletLine)
      if (bulletLines.length >= 2 && bulletLines.length === lines.length) {
        const ordered = lines.every((l) => /^\d{1,2}[.)]\s+/.test(l))
        const tag = ordered ? 'ol' : 'ul'
        const items = lines
          .map((l) => `<li>${escapeHtml(stripBulletPrefix(l))}</li>`)
          .join('')
        return `<${tag}>${items}</${tag}>`
      }

      // Intro line ending with ":" then short follow-on lines → paragraph + bullets
      if (lines.length >= 3 && /:\s*$/.test(lines[0])) {
        const rest = lines.slice(1)
        const shortItems = rest.every((l) => l.length < 120 && !/[.!?]$/.test(l))
        if (shortItems) {
          return `<p>${escapeHtml(lines[0])}</p><ul>${rest
            .map((l) => `<li>${escapeHtml(stripBulletPrefix(l))}</li>`)
            .join('')}</ul>`
        }
      }

      return `<p>${lines.map((l) => escapeHtml(l)).join('<br>')}</p>`
    })
    .join('')
}

/** Load content into the rich-text editor (HTML). */
export function prepareCmsContentForEditor(content: string): string {
  const raw = (content || '').trim()
  if (!raw) return ''
  if (looksLikeRichHtml(raw)) return sanitizeCmsHtml(raw)
  return ensureCmsParagraphs(raw)
}

/** Normalize + sanitize content before saving a CMS page. */
export function normalizeCmsContentForSave(content: string, ...titles: string[]): string {
  return cmsContentToHtml(content || '', ...titles)
}

/** Public page body HTML from stored CMS content. */
export function cmsContentToHtml(content: string, ...titles: string[]): string {
  const raw = (content || '').trim()
  if (!raw) return ''

  if (looksLikeRichHtml(raw)) {
    return stripDuplicateCmsHeadings(sanitizeCmsHtml(raw), ...titles)
  }

  return stripDuplicateCmsHeadings(ensureCmsParagraphs(raw), ...titles)
}
