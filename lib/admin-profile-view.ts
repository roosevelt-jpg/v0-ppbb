import { formatRecordPhoneDisplay, formatUserPhoneDisplay, getUserDisplayName } from '@/lib/user-profile'

export type AdminProfileKind = 'member' | 'volunteer' | 'business' | 'sponsor'

export interface AdminProfileStat {
  label: string
  value: string
}

export interface AdminProfileViewData {
  id: string
  kind: AdminProfileKind
  name: string
  email?: string
  phone?: string
  roleLabel: string
  location?: string
  joinedAt?: string | Date | null
  status?: string
  profilePictureURL?: string | null
  stats?: AdminProfileStat[]
  editHref?: string
}

function locationFromUser(record: Record<string, unknown>): string {
  const loc = record.location
  if (typeof loc === 'string' && loc.trim()) return loc.trim()
  if (loc && typeof loc === 'object') {
    const city = (loc as { city?: string }).city
    const country = (loc as { country?: string }).country
    const parts = [city, country].filter(Boolean)
    if (parts.length) return parts.join(', ')
  }
  if (typeof record.emirate === 'string' && record.emirate.trim()) return record.emirate.trim()
  if (typeof record.city === 'string' && record.city.trim()) return record.city.trim()
  return '—'
}

export function profileFromMember(member: Record<string, unknown>): AdminProfileViewData {
  const role = String(member.role || member.userType || 'member')
  return {
    id: String(member.id || ''),
    kind: role === 'volunteer' ? 'volunteer' : role === 'business' ? 'business' : role === 'sponsor' ? 'sponsor' : 'member',
    name: getUserDisplayName(member),
    email: String(member.email || ''),
    phone: formatUserPhoneDisplay(member),
    roleLabel: role.charAt(0).toUpperCase() + role.slice(1).replace(/\+/g, ' + '),
    location: locationFromUser(member),
    joinedAt: (member.dateJoined || member.joinedAt || member.createdAt) as string | Date | null,
    status: String(member.status || 'active'),
    profilePictureURL: (member.profilePictureURL || member.avatarUrl) as string | null,
    stats: [
      { label: 'Volunteer hours', value: `${Number(member.volunteerHours ?? member.volunteeredHours ?? 0)} hrs` },
    ],
    editHref: `/admin/members/${member.id}`,
  }
}

export function profileFromVolunteer(volunteer: Record<string, unknown>): AdminProfileViewData {
  return {
    id: String(volunteer.id || ''),
    kind: 'volunteer',
    name: getUserDisplayName(volunteer),
    email: String(volunteer.email || ''),
    phone: formatUserPhoneDisplay(volunteer),
    roleLabel: 'Volunteer',
    location: locationFromUser(volunteer),
    joinedAt: volunteer.createdAt as string | Date | null,
    status: String(volunteer.status || 'active'),
    profilePictureURL: (volunteer.profilePictureURL || volunteer.avatarUrl) as string | null,
    stats: [
      { label: 'Volunteer hours', value: `${Number(volunteer.volunteeredHours ?? volunteer.volunteerHours ?? 0)} hrs` },
    ],
    editHref: `/admin/volunteers/${volunteer.id}`,
  }
}

export function profileFromBusiness(biz: Record<string, unknown>): AdminProfileViewData {
  const isApproved = biz.isApproved === true
  const isActive = biz.isActive !== false
  let status = 'pending'
  if (!isActive) status = 'suspended'
  else if (isApproved) status = 'active'

  const stats: AdminProfileStat[] = [
    { label: 'Category', value: String(biz.category || '—') },
    { label: 'Owner', value: String(biz.ownerName || '—') },
  ]
  if (biz.isVerified) stats.push({ label: 'Verification', value: 'Verified' })
  if (biz.featured) stats.push({ label: 'Featured', value: 'Yes' })
  if (biz.referralCode) {
    stats.push({ label: 'Referral code', value: String(biz.referralCode) })
  }

  return {
    id: String(biz.id || ''),
    kind: 'business',
    name: String(biz.name || 'Business'),
    email: String(biz.email || ''),
    phone: formatRecordPhoneDisplay(biz.phone),
    roleLabel: 'Business',
    location: String(biz.location || biz.emirate || biz.city || '—'),
    joinedAt: biz.createdAt as string | Date | null,
    status,
    profilePictureURL: (biz.ownerProfilePictureURL || biz.logoURL || biz.logoUrl) as string | null,
    stats,
    editHref: `/admin/businesses/${biz.id}`,
  }
}

export function profileFromSponsor(row: Record<string, unknown>): AdminProfileViewData {
  const source = String(row.source || 'sponsors')
  const stats: AdminProfileStat[] = [
    { label: 'Sponsor type', value: String(row.type || '—') },
    { label: 'Source', value: source === 'businesses' ? 'Platform business' : 'External sponsor' },
    { label: 'Contribution', value: String(row.contribution || '—') },
    { label: 'Campaign', value: String(row.campaign || '—') },
  ]
  if (row.isRecurring) stats.push({ label: 'Recurring', value: 'Yes' })
  if (row.websiteURL) stats.push({ label: 'Website', value: String(row.websiteURL) })

  return {
    id: String(row.id || ''),
    kind: 'sponsor',
    name: String(row.name || 'Sponsor'),
    email: String(row.email || ''),
    phone: formatRecordPhoneDisplay(row.phone),
    roleLabel: 'Sponsor',
    location: '—',
    joinedAt: null,
    status: String(row.status || 'active'),
    profilePictureURL: (row.logoURL || row.logoUrl) as string | null,
    stats,
    editHref: source === 'businesses' ? `/admin/businesses/${row.id}` : undefined,
  }
}
