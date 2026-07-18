import { getAdminDb } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'
import { interpolateCertificateText } from '@/lib/certificate-templates'
import { paragraphs, sendBrandedEmail } from '@/lib/platform-email'

type TemplateRow = {
  id: string
  title: string
  subtitle: string
  bodyText: string
  hoursRequired: number
  accentColor: string
  logoURL: string
  signatories: { name: string; title: string; signatureURL: string }[]
  emailSubject: string
  emailBody: string
  status: string
}

function memberDisplayName(data: Record<string, unknown>): string {
  const first = String(data.firstName || '').trim()
  const last = String(data.lastName || '').trim()
  const full = `${first} ${last}`.trim()
  return full || String(data.displayName || data.name || 'Community Member')
}

export async function getMemberVolunteerHours(userId: string): Promise<number> {
  const db = getAdminDb()
  const [userSnap, recordsSnap] = await Promise.all([
    db.collection('users').doc(userId).get(),
    db.collection('volunteerRecords').where('userId', '==', userId).get(),
  ])

  const profileHours = Number(userSnap.data()?.volunteeredHours ?? userSnap.data()?.volunteerHours ?? 0)
  const recordHours = recordsSnap.docs.reduce((sum, d) => sum + Number(d.data().hours || 0), 0)
  return Math.max(profileHours, recordHours)
}

function generateCredentialId(): string {
  const year = new Date().getFullYear()
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `PB-${year}-${rand}`
}

export async function evaluateCertificateMilestonesForUser(userId: string): Promise<{
  issued: string[]
  skipped: string[]
  totalHours: number
  eligibleCount: number
  alreadyHadCount: number
}> {
  const db = getAdminDb()
  const userSnap = await db.collection('users').doc(userId).get()
  if (!userSnap.exists) {
    return {
      issued: [],
      skipped: ['user_not_found'],
      totalHours: 0,
      eligibleCount: 0,
      alreadyHadCount: 0,
    }
  }

  const userData = userSnap.data() || {}
  const memberName = memberDisplayName(userData)
  const memberEmail = String(userData.email || '').trim()
  const totalHours = await getMemberVolunteerHours(userId)

  const templatesSnap = await db.collection('certificateTemplates').where('status', '==', 'active').get()
  const templates: TemplateRow[] = templatesSnap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<TemplateRow, 'id'>) }))
    .filter((t) => Number(t.hoursRequired) > 0 && totalHours >= Number(t.hoursRequired))
    .sort((a, b) => a.hoursRequired - b.hoursRequired)

  const issued: string[] = []
  const skipped: string[] = []
  let alreadyHadCount = 0

  const site = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://www.passive-blessings.com'
  ).replace(/\/$/, '')

  for (const template of templates) {
    const certDocId = `${userId}_${template.id}`
    const existing = await db.collection('certificates').doc(certDocId).get()
    if (existing.exists) {
      skipped.push(template.id)
      alreadyHadCount += 1
      continue
    }

    const issuedDate = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

    const vars = {
      memberName,
      hours: totalHours,
      hoursRequired: template.hoursRequired,
      title: template.title,
      date: issuedDate,
    }

    const bodyText = interpolateCertificateText(template.bodyText, vars)
    const credentialId = generateCredentialId()
    const now = Timestamp.now()

    const signatories = Array.isArray(template.signatories) ? template.signatories : []

    await db
      .collection('certificates')
      .doc(certDocId)
      .set({
        userId,
        templateId: template.id,
        title: template.title,
        subtitle: template.subtitle,
        bodyText,
        memberName,
        memberEmail,
        hoursAtIssuance: totalHours,
        hoursRequired: template.hoursRequired,
        credentialId,
        accentColor: template.accentColor || '#111111',
        logoURL:
          template.logoURL ||
          'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/PB%20ORIGINAL%20LOGO%20%5Bblack%5D-9KcTa1PocHznEBM4QR6dN4R2eseFlT.png',
        signatories,
        issuedAt: now,
        createdAt: now,
        emailSent: false,
      })

    issued.push(template.id)

    if (memberEmail) {
      try {
        const subject = interpolateCertificateText(template.emailSubject, vars)
        const body = interpolateCertificateText(template.emailBody, vars)
        const result = await sendBrandedEmail({
          to: memberEmail,
          subject,
          purpose: 'Volunteer certificate milestone',
          headline: template.title,
          bodyHtml: paragraphs(
            'Assalamu alaikum,',
            ...body.split(/\n+/).map((p) => p.trim()).filter(Boolean),
            `${totalHours} volunteer hours logged.`
          ),
          cta: { label: 'View certificates', url: `${site}/dashboard/certificates` },
        })
        if (result.ok) {
          await db.collection('certificates').doc(certDocId).update({
            emailSent: true,
            emailSentAt: Timestamp.now(),
          })
        }
      } catch (err) {
        console.error('[certificates] email failed for', userId, template.id, err)
      }
    }
  }

  return {
    issued,
    skipped,
    totalHours,
    eligibleCount: templates.length,
    alreadyHadCount,
  }
}
