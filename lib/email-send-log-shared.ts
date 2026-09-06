/**
 * Client-safe types + helpers for email send CRM logs.
 * Server writes live in email-send-log.ts (Admin SDK).
 */

export const EMAIL_SEND_LOGS_COLLECTION = 'emailSendLogs'

export type EmailSendLogStatus = 'sent' | 'failed' | 'skipped'

export type EmailSendLog = {
  id: string
  to: string
  subject: string
  purpose: string
  department?: string | null
  status: EmailSendLogStatus
  error?: string | null
  userId?: string | null
  relatedType?: string | null
  relatedId?: string | null
  ctaUrl?: string | null
  preview?: string | null
  createdAt: Date
}

function toDate(value: unknown): Date {
  if (value instanceof Date) return value
  if (value && typeof value === 'object' && 'toDate' in value) {
    try {
      return (value as { toDate: () => Date }).toDate()
    } catch {
      /* fall through */
    }
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value)
    if (!Number.isNaN(d.getTime())) return d
  }
  return new Date(0)
}

export function mapEmailSendLogDoc(
  id: string,
  data: Record<string, unknown>
): EmailSendLog {
  return {
    id,
    to: String(data.to || ''),
    subject: String(data.subject || ''),
    purpose: String(data.purpose || ''),
    department: (data.department as string) || null,
    status: (data.status as EmailSendLogStatus) || 'failed',
    error: (data.error as string) || null,
    userId: (data.userId as string) || null,
    relatedType: (data.relatedType as string) || null,
    relatedId: (data.relatedId as string) || null,
    ctaUrl: (data.ctaUrl as string) || null,
    preview: (data.preview as string) || null,
    createdAt: toDate(data.createdAt),
  }
}
