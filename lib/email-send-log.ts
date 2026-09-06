/**
 * CRM-style log of every branded outbound email (membership, events, payments, etc.).
 * Writes are Admin SDK only; failures must never block sending.
 */

import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'
import type { EmailDepartmentKey } from '@/lib/email-departments'
import {
  EMAIL_SEND_LOGS_COLLECTION,
  type EmailSendLogStatus,
} from '@/lib/email-send-log-shared'

export {
  EMAIL_SEND_LOGS_COLLECTION,
  mapEmailSendLogDoc,
  type EmailSendLog,
  type EmailSendLogStatus,
} from '@/lib/email-send-log-shared'

export type EmailSendLogInput = {
  to: string
  subject: string
  purpose: string
  department?: EmailDepartmentKey | string | null
  status: EmailSendLogStatus
  error?: string | null
  userId?: string | null
  relatedType?: string | null
  relatedId?: string | null
  ctaUrl?: string | null
  /** Short plain-text preview (no full HTML body stored). */
  preview?: string | null
}

function plainPreview(html: string, max = 280): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
}

export async function recordEmailSendLog(input: EmailSendLogInput): Promise<void> {
  try {
    const db = getAdminDb()
    await db.collection(EMAIL_SEND_LOGS_COLLECTION).add({
      to: String(input.to || '')
        .trim()
        .toLowerCase(),
      subject: String(input.subject || '').trim().slice(0, 300),
      purpose: String(input.purpose || '').trim().slice(0, 200),
      department: input.department || null,
      status: input.status,
      error: input.error ? String(input.error).slice(0, 500) : null,
      userId: input.userId || null,
      relatedType: input.relatedType || null,
      relatedId: input.relatedId || null,
      ctaUrl: input.ctaUrl || null,
      preview: input.preview ? plainPreview(input.preview) : null,
      createdAt: FieldValue.serverTimestamp(),
    })
  } catch (error) {
    console.warn('[email-send-log] failed to write log:', error)
  }
}

export function previewFromBodyHtml(bodyHtml: string, headline?: string): string {
  const parts = [headline?.trim() || '', bodyHtml || ''].filter(Boolean)
  return plainPreview(parts.join(' '))
}
