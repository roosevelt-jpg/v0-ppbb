/**
 * Shared short email layout: Logo → Greeting → Body → Signature
 */

export function escapeEmailHtml(value: string): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export type SimpleEmailCta = { label: string; url: string }

/**
 * Very short branded email:
 * 1. Header (logo)
 * 2. Greeting
 * 3. Body
 * 4. Signature (purpose + PB Admin)
 */
export function renderSimpleEmailHtml(opts: {
  logoUrl: string
  greeting?: string
  bodyHtml: string
  purpose: string
  cta?: SimpleEmailCta
}): string {
  const greeting = opts.greeting?.trim()
    ? `<p style="margin:0 0 12px 0;font-size:15px;line-height:1.5;color:#111;">${escapeEmailHtml(opts.greeting.trim())}</p>`
    : ''

  const cta = opts.cta
    ? `<p style="margin:16px 0 0 0;"><a href="${escapeEmailHtml(opts.cta.url)}" style="color:#111;font-weight:700;text-decoration:underline;">${escapeEmailHtml(opts.cta.label)}</a></p>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#ffffff;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;margin:0 auto;padding:24px 16px;font-family:Arial,Helvetica,sans-serif;">
    <tr>
      <td align="center" style="padding:0 0 20px 0;text-align:center;">
        <img src="${escapeEmailHtml(opts.logoUrl)}" alt="Passive Blessings" width="140" style="display:block;margin:0 auto;max-width:140px;height:auto;border:0;" />
      </td>
    </tr>
    <tr>
      <td style="padding:0;font-size:15px;line-height:1.55;color:#333;">
        ${greeting}
        <div>${opts.bodyHtml}</div>
        ${cta}
      </td>
    </tr>
    <tr>
      <td style="padding:24px 0 0 0;font-size:14px;line-height:1.5;color:#555;">
        <p style="margin:0 0 2px 0;">${escapeEmailHtml(opts.purpose)}</p>
        <p style="margin:0;font-weight:700;color:#111;">PB Admin</p>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function emailParagraph(text: string): string {
  return `<p style="margin:0 0 10px 0;">${escapeEmailHtml(text)}</p>`
}

export function emailParagraphs(...lines: string[]): string {
  return lines.filter(Boolean).map(emailParagraph).join('')
}
