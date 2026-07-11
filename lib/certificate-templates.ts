'use client'

import { db } from '@/lib/firebase'
import { collection, onSnapshot, type Unsubscribe } from 'firebase/firestore'

export type CertificateTemplateStatus = 'active' | 'draft'

export interface CertificateSignatory {
  name: string
  title: string
  signatureURL: string
}

export interface CertificateTemplate {
  id: string
  title: string
  subtitle: string
  bodyText: string
  hoursRequired: number
  accentColor: string
  logoURL: string
  signatories: CertificateSignatory[]
  emailSubject: string
  emailBody: string
  status: CertificateTemplateStatus
  sortOrder: number
  createdAt?: Date
  updatedAt?: Date
}

export interface IssuedCertificate {
  id: string
  userId: string
  templateId: string
  title: string
  subtitle: string
  bodyText: string
  memberName: string
  hoursAtIssuance: number
  hoursRequired: number
  credentialId: string
  accentColor: string
  logoURL: string
  signatories: CertificateSignatory[]
  issuedAt: Date
  emailSent?: boolean
}

export const DEFAULT_CERTIFICATE_TEMPLATE: Omit<CertificateTemplate, 'id'> = {
  title: 'Certificate of Volunteer Service',
  subtitle: 'Passive Blessings Community',
  bodyText:
    'This is to certify that {memberName} has generously contributed {hours} hours of volunteer service to our community, demonstrating compassion, dedication, and faith in action.',
  hoursRequired: 10,
  accentColor: '#111111',
  logoURL:
    'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/PB%20ORIGINAL%20LOGO%20%5Bblack%5D-9KcTa1PocHznEBM4QR6dN4R2eseFlT.png',
  signatories: [
    { name: 'Founder Name', title: 'Founder', signatureURL: '' },
  ],
  emailSubject: 'Congratulations — you earned your {title}!',
  emailBody:
    'Dear {memberName},\n\nCongratulations on reaching {hours} volunteer hours! Your certificate is now available in your member dashboard.\n\nThank you for serving our community with heart and purpose.\n\nWith gratitude,\nPassive Blessings',
  status: 'draft',
  sortOrder: 0,
}

export function interpolateCertificateText(
  template: string,
  vars: { memberName: string; hours: number; hoursRequired: number; title?: string; date?: string }
): string {
  return template
    .replace(/\{memberName\}/g, vars.memberName)
    .replace(/\{hours\}/g, String(vars.hours))
    .replace(/\{hoursRequired\}/g, String(vars.hoursRequired))
    .replace(/\{title\}/g, vars.title || '')
    .replace(/\{date\}/g, vars.date || new Date().toLocaleDateString('en-GB'))
}

function toDate(value: unknown): Date | undefined {
  if (!value) return undefined
  if (value instanceof Date) return value
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate()
  }
  const d = new Date(String(value))
  return Number.isNaN(d.getTime()) ? undefined : d
}

function normalizeTemplate(id: string, data: Record<string, unknown>): CertificateTemplate {
  const signatories = Array.isArray(data.signatories)
    ? data.signatories
        .filter((s): s is Record<string, unknown> => typeof s === 'object' && s !== null)
        .map((s) => ({
          name: String(s.name || ''),
          title: String(s.title || ''),
          signatureURL: String(s.signatureURL || ''),
        }))
    : []

  return {
    id,
    title: String(data.title || ''),
    subtitle: String(data.subtitle || ''),
    bodyText: String(data.bodyText || ''),
    hoursRequired: Number(data.hoursRequired || 0),
    accentColor: String(data.accentColor || '#111111'),
    logoURL: String(data.logoURL || ''),
    signatories,
    emailSubject: String(data.emailSubject || DEFAULT_CERTIFICATE_TEMPLATE.emailSubject),
    emailBody: String(data.emailBody || DEFAULT_CERTIFICATE_TEMPLATE.emailBody),
    status: data.status === 'active' ? 'active' : 'draft',
    sortOrder: Number(data.sortOrder || 0),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  }
}

export function subscribeToCertificateTemplates(
  callback: (templates: CertificateTemplate[]) => void
): Unsubscribe {
  return onSnapshot(collection(db, 'certificateTemplates'), (snap) => {
    const rows = snap.docs
      .map((d) => normalizeTemplate(d.id, d.data() as Record<string, unknown>))
      .sort((a, b) => a.hoursRequired - b.hoursRequired || a.sortOrder - b.sortOrder)
    callback(rows)
  })
}

export function normalizeIssuedCertificate(id: string, data: Record<string, unknown>): IssuedCertificate {
  const signatories = Array.isArray(data.signatories)
    ? data.signatories
        .filter((s): s is Record<string, unknown> => typeof s === 'object' && s !== null)
        .map((s) => ({
          name: String(s.name || ''),
          title: String(s.title || ''),
          signatureURL: String(s.signatureURL || ''),
        }))
    : []

  return {
    id,
    userId: String(data.userId || ''),
    templateId: String(data.templateId || ''),
    title: String(data.title || ''),
    subtitle: String(data.subtitle || ''),
    bodyText: String(data.bodyText || ''),
    memberName: String(data.memberName || ''),
    hoursAtIssuance: Number(data.hoursAtIssuance || 0),
    hoursRequired: Number(data.hoursRequired || 0),
    credentialId: String(data.credentialId || ''),
    accentColor: String(data.accentColor || '#111111'),
    logoURL: String(data.logoURL || ''),
    signatories,
    issuedAt: toDate(data.issuedAt) || new Date(),
    emailSent: data.emailSent === true,
  }
}
