/**
 * Send event registration confirmation (or waitlist/pending) via Gmail SMTP.
 * Failures are logged only — registration must not fail because of email.
 */

export async function sendEventRegistrationEmail(opts: {
  to: string
  eventTitle: string
  eventUrl: string
  status: string
  checkInCode?: string | null
  waitlistPosition?: number | null
}): Promise<boolean> {
  if (!opts.to) return false
  try {
    const { getGmailSmtpConfig, createGmailTransporter } = await import('@/lib/gmail-service')
    const config = await getGmailSmtpConfig()
    if (!config?.gmailEmail || !config?.gmailAppPassword) {
      console.warn('[events] Gmail SMTP not configured — confirmation email skipped')
      return false
    }
    const transporter = createGmailTransporter({
      enabled: true,
      gmailEmail: config.gmailEmail,
      gmailAppPassword: config.gmailAppPassword,
      fromName: config.fromName || 'Passive Blessings',
    } as any)
    if (!transporter) return false

    let subject = `Registered: ${opts.eventTitle}`
    let body = `<p>You're registered for <strong>${opts.eventTitle}</strong>.</p>`
    if (opts.status === 'waitlisted') {
      subject = `Waitlisted: ${opts.eventTitle}`
      body = `<p>You're on the waitlist for <strong>${opts.eventTitle}</strong>${
        opts.waitlistPosition ? ` (position #${opts.waitlistPosition})` : ''
      }.</p>`
    } else if (opts.status === 'pending') {
      subject = `Pending approval: ${opts.eventTitle}`
      body = `<p>Your registration for <strong>${opts.eventTitle}</strong> is pending host approval.</p>`
    } else if (opts.checkInCode) {
      body += `<p>Your check-in code: <strong style="font-family:monospace;letter-spacing:0.1em">${opts.checkInCode}</strong></p>`
    }
    body += `<p><a href="${opts.eventUrl}">View event</a></p><p>— Passive Blessings</p>`

    await transporter.sendMail({
      from: `"${config.fromName || 'Passive Blessings'}" <${config.gmailEmail}>`,
      to: opts.to,
      subject,
      html: body,
    })
    return true
  } catch (e) {
    console.warn('[events] confirmation email failed:', e)
    return false
  }
}
