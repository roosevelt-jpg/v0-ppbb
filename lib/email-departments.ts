/**
 * Department signatures for branded transactional emails.
 */

export type EmailSignature = {
  purpose: string
  department: string
  signerName?: string
  signerTitle?: string
}

export const EMAIL_DEPARTMENTS = {
  membership: {
    department: 'Membership & Billing',
    signerName: 'Passive Blessings Membership Team',
    signerTitle: 'Admin, Finance & Compliance',
  },
  marketplace: {
    department: 'Marketplace',
    signerName: 'Passive Blessings Marketplace',
    signerTitle: 'Business & Commerce',
  },
  advertising: {
    department: 'Advertising & Promotions',
    signerName: 'Passive Blessings Partnerships',
    signerTitle: 'Strategy & Partnerships',
  },
  events: {
    department: 'Events',
    signerName: 'Passive Blessings Events',
    signerTitle: 'Community Programs',
  },
  security: {
    department: 'Account Security',
    signerName: 'Passive Blessings Admin',
    signerTitle: 'Platform Security',
  },
  admin: {
    department: 'PB Admin',
    signerName: 'Passive Blessings Admin',
    signerTitle: 'Platform Administration',
  },
  founder: {
    department: 'Office of the Founder',
    signerName: 'Yusef Bouattoura',
    signerTitle: 'Founder & Chief Executive Officer',
  },
} as const

export type EmailDepartmentKey = keyof typeof EMAIL_DEPARTMENTS

export function signatureFor(
  key: EmailDepartmentKey,
  purpose: string,
  overrides?: Partial<Pick<EmailSignature, 'signerName' | 'signerTitle' | 'department'>>
): EmailSignature {
  const base = EMAIL_DEPARTMENTS[key]
  return {
    purpose,
    department: overrides?.department || base.department,
    signerName: overrides?.signerName || base.signerName,
    signerTitle: overrides?.signerTitle || base.signerTitle,
  }
}

export async function resolveFounderSignature(
  purpose = 'Member welcome'
): Promise<EmailSignature> {
  const fallback = signatureFor('founder', purpose)
  try {
    const { getAdminDb } = await import('@/lib/firebase-admin')
    const snap = await getAdminDb().collection('teamMembers').limit(40).get()
    const members = snap.docs.map((d) => d.data() || {})
    const founder =
      members.find((m) => {
        const title = String(m.title || m.role || '').toLowerCase()
        const name = String(m.name || '').toLowerCase()
        const active = m.isActive !== false
        return (
          active &&
          (title.includes('founder') ||
            name.includes('yusef') ||
            name.includes('yousef') ||
            name.includes('yusuf') ||
            name.includes('bouattoura'))
        )
      }) || null

    if (founder && typeof founder.name === 'string' && founder.name.trim()) {
      return {
        purpose,
        department: 'Office of the Founder',
        signerName: founder.name.trim(),
        signerTitle:
          (typeof founder.title === 'string' && founder.title.trim()) ||
          (typeof founder.role === 'string' && founder.role.trim()) ||
          fallback.signerTitle,
      }
    }
  } catch (err) {
    console.warn('[email-departments] founder lookup failed, using default:', err)
  }
  return fallback
}
