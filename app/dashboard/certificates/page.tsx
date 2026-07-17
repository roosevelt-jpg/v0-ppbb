'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { auth, db } from '@/lib/firebase'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { Card } from '@/components/ui/card'
import { Award, Printer } from 'lucide-react'
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

  const syncMilestones = async () => {
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
      if (!res.ok) throw new Error(json.error || 'Could not sync certificates')
      const issuedList = Array.isArray(json.data?.issued) ? json.data.issued : []
      const issued = issuedList.length
      setSyncMessage(
        issued > 0
          ? `Issued ${issued} new certificate${issued === 1 ? '' : 's'}.`
          : 'You’re up to date — no new milestones to issue.'
      )
    } catch (err) {
      setSyncMessage(err instanceof Error ? err.message : 'Sync failed')
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

    void syncMilestones()

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

  return (
    <DashboardPageShell title="Certificates" subtitle="Milestone certificates earned through volunteer service">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void syncMilestones()}
          disabled={syncing}
          className="!bg-black !text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
        >
          {syncing ? 'Checking milestones…' : 'Issue / sync milestones'}
        </button>
        {syncMessage ? <p className="text-sm text-neutral-600">{syncMessage}</p> : null}
      </div>
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
            description="Certificates are awarded automatically when you reach volunteer hour milestones. Log hours via volunteering activities."
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
