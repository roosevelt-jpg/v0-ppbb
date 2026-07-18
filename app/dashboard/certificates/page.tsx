'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { auth, db } from '@/lib/firebase'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { Card } from '@/components/ui/card'
import { Award, Printer, RefreshCw } from 'lucide-react'
import {
  DashboardPageShell,
  DashboardSkeleton,
  DashboardErrorState,
  DashboardEmptyState,
} from '@/components/dashboard-states'
import { CertificateDesignPreview } from '@/components/certificate-design-preview'
import { normalizeIssuedCertificate, type IssuedCertificate } from '@/lib/certificate-templates'

export default function CertificatesPage() {
  const { user, loading: authLoading } = useAuth()
  const [certificates, setCertificates] = useState<IssuedCertificate[]>([])
  const [badges, setBadges] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const [totalHours, setTotalHours] = useState<number | null>(null)

  const issueMyCertificates = async () => {
    if (!user?.id) return
    setSyncing(true)
    setSyncMessage(null)
    try {
      const token = await auth.currentUser?.getIdToken()
      if (!token) throw new Error('Sign in required')
      const res = await fetch('/api/certificates/check-milestones', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Could not issue certificates')

      const issuedList = Array.isArray(json.data?.issued) ? json.data.issued : []
      const issued = issuedList.length
      const hours = typeof json.data?.totalHours === 'number' ? json.data.totalHours : null
      if (hours != null) setTotalHours(hours)

      if (issued > 0) {
        setSyncMessage(
          `Issued ${issued} certificate${issued === 1 ? '' : 's'} for your volunteer milestones.`
        )
      } else if (hours != null && hours <= 0) {
        setSyncMessage(
          'No volunteer hours recorded yet. Log hours under Volunteering, then come back to issue your certificate.'
        )
      } else if (typeof json.data?.eligibleCount === 'number' && json.data.eligibleCount === 0) {
        setSyncMessage(
          `You have ${hours ?? 0} volunteer hour${hours === 1 ? '' : 's'}. Keep going until you reach the next milestone, then issue again.`
        )
      } else {
        setSyncMessage('You’re up to date — all earned milestone certificates are already issued.')
      }
    } catch (err) {
      setSyncMessage(err instanceof Error ? err.message : 'Could not issue certificates')
    } finally {
      setSyncing(false)
    }
  }

  useEffect(() => {
    if (authLoading) return
    if (!user?.id) {
      setLoading(false)
      return
    }

    // Auto-claim any earned certificates when the page opens
    void issueMyCertificates()

    let certDone = false
    let badgeDone = false
    const maybeDone = () => {
      if (certDone && badgeDone) setLoading(false)
    }

    const certUnsub = onSnapshot(
      query(collection(db, 'certificates'), where('userId', '==', user.id)),
      (snapshot) => {
        const rows =
          snapshot?.docs
            ?.map((d) => normalizeIssuedCertificate(d.id, d.data() as Record<string, unknown>))
            .sort((a, b) => b.issuedAt.getTime() - a.issuedAt.getTime()) ?? []
        setCertificates(rows)
        certDone = true
        maybeDone()
      },
      (err) => {
        console.error('[v0] certificates error:', err)
        setError('Failed to load certificates.')
        certDone = true
        maybeDone()
      }
    )

    const badgeUnsub = onSnapshot(
      query(collection(db, 'badges'), where('userId', '==', user.id)),
      (snapshot) => {
        setBadges(snapshot?.docs?.map((d) => ({ id: d.id, ...d.data() })) ?? [])
        badgeDone = true
        maybeDone()
      },
      () => {
        badgeDone = true
        maybeDone()
      }
    )

    return () => {
      certUnsub()
      badgeUnsub()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per user session
  }, [authLoading, user?.id])

  const handlePrint = (certId: string) => {
    setPreviewId(certId)
    window.setTimeout(() => {
      window.print()
    }, 300)
  }

  if (authLoading || loading) return <DashboardSkeleton />
  if (error) return <DashboardErrorState message={error} />

  const previewCert = certificates.find((c) => c.id === previewId)
  const hoursDisplay =
    totalHours != null
      ? totalHours
      : typeof user?.volunteeredHours === 'number'
        ? user.volunteeredHours
        : null

  const issueButton = (
    <button
      type="button"
      onClick={() => void issueMyCertificates()}
      disabled={syncing}
      className="min-h-[44px] inline-flex items-center justify-center gap-2 !bg-black !text-white px-5 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
    >
      <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
      {syncing ? 'Issuing…' : 'Issue my certificates'}
    </button>
  )

  return (
    <DashboardPageShell
      title="Certificates"
      subtitle="Issue and print certificates you’ve earned through volunteer service"
    >
      <Card className="p-4 sm:p-5 mb-8 border border-neutral-200 bg-neutral-50 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="font-semibold text-neutral-900">Issue certificates</h2>
            <p className="text-sm text-neutral-600 mt-1">
              Claim milestone certificates yourself based on your logged volunteer hours
              {hoursDisplay != null ? (
                <>
                  {' '}
                  — currently{' '}
                  <span className="font-semibold text-neutral-900">
                    {hoursDisplay} hour{hoursDisplay === 1 ? '' : 's'}
                  </span>
                </>
              ) : null}
              .
            </p>
          </div>
          {issueButton}
        </div>
        {syncMessage ? (
          <p className="text-sm text-neutral-700 bg-white border border-neutral-200 rounded-lg px-3 py-2">
            {syncMessage}
          </p>
        ) : null}
        <p className="text-xs text-neutral-500">
          Hours come from charity events you attend — confirm attendance under{' '}
          <Link href="/dashboard/volunteering" className="underline font-medium text-neutral-800">
            Volunteering
          </Link>{' '}
          or My Events, then issue here.
        </p>
      </Card>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4 text-neutral-900">Your Badges</h2>
        {badges.length === 0 ? (
          <DashboardEmptyState
            icon={<Award className="w-12 h-12" />}
            title="No badges yet"
            description="Complete activities to earn badges."
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {badges.map((badge) => (
              <Card key={String(badge.id)} className="p-4 text-center border border-neutral-200">
                <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center bg-neutral-900 rounded-full text-white">
                  <Award size={32} />
                </div>
                <h3 className="font-bold text-sm">{String(badge.name ?? 'Badge')}</h3>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4 text-neutral-900">Your Certificates</h2>
        {certificates.length === 0 ? (
          <DashboardEmptyState
            icon={<Award className="w-12 h-12" />}
            title="No certificates yet"
            description="Confirm attendance at charity events to earn hours, then tap Issue my certificates when you hit a milestone — print or save as PDF."
            action={
              <div className="flex flex-col sm:flex-row items-center gap-3">
                {issueButton}
                <Link
                  href="/dashboard/volunteering"
                  className="min-h-[44px] inline-flex items-center justify-center px-5 py-2.5 border border-neutral-300 rounded-lg text-sm font-semibold"
                >
                  Go to Volunteering
                </Link>
              </div>
            }
          />
        ) : (
          <div className="space-y-8">
            {certificates.map((cert) => (
              <div key={cert.id} className="space-y-4">
                <CertificateDesignPreview
                  id={`cert-${cert.id}`}
                  data={{
                    title: cert.title,
                    subtitle: cert.subtitle,
                    bodyText: cert.bodyText,
                    memberName: cert.memberName,
                    hours: cert.hoursAtIssuance,
                    credentialId: cert.credentialId,
                    issuedDate: cert.issuedAt.toLocaleDateString('en-GB'),
                    accentColor: cert.accentColor,
                    logoURL: cert.logoURL,
                    signatories: cert.signatories,
                  }}
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handlePrint(cert.id)}
                    className="!bg-black !text-white px-4 py-2 rounded-lg text-sm inline-flex items-center gap-2"
                  >
                    <Printer size={16} />
                    Print / Save PDF
                  </button>
                  <span className="text-xs text-neutral-500 self-center">
                    Issued {cert.issuedAt.toLocaleDateString('en-GB')} · {cert.hoursAtIssuance} hours
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {previewCert ? (
        <div className="hidden print:block fixed inset-0 bg-white p-8 z-[9999]">
          <CertificateDesignPreview
            data={{
              title: previewCert.title,
              subtitle: previewCert.subtitle,
              bodyText: previewCert.bodyText,
              memberName: previewCert.memberName,
              hours: previewCert.hoursAtIssuance,
              credentialId: previewCert.credentialId,
              issuedDate: previewCert.issuedAt.toLocaleDateString('en-GB'),
              accentColor: previewCert.accentColor,
              logoURL: previewCert.logoURL,
              signatories: previewCert.signatories,
            }}
          />
        </div>
      ) : null}
    </DashboardPageShell>
  )
}
