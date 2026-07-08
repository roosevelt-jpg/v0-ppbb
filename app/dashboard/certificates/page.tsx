'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { db } from '@/lib/firebase'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { Card } from '@/components/ui/card'
import { Award, Download, Share2 } from 'lucide-react'
import {
  DashboardPageShell,
  DashboardSkeleton,
  DashboardErrorState,
  DashboardEmptyState,
} from '@/components/dashboard-states'

export default function CertificatesPage() {
  const { user, loading: authLoading } = useAuth()
  const [certificates, setCertificates] = useState<Record<string, unknown>[]>([])
  const [badges, setBadges] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!user?.id) {
      setLoading(false)
      return
    }

    let certDone = false
    let badgeDone = false
    const maybeDone = () => {
      if (certDone && badgeDone) setLoading(false)
    }

    const certUnsub = onSnapshot(
      query(collection(db, 'certificates'), where('userId', '==', user.id)),
      (snapshot) => {
        setCertificates(snapshot?.docs?.map((d) => ({ id: d.id, ...d.data() })) ?? [])
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
      (err) => {
        console.error('[v0] badges error:', err)
        badgeDone = true
        maybeDone()
      }
    )

    return () => {
      certUnsub()
      badgeUnsub()
    }
  }, [authLoading, user?.id])

  if (authLoading || loading) return <DashboardSkeleton />
  if (error) return <DashboardErrorState message={error} />

  return (
    <DashboardPageShell title="Certificates" subtitle="Your earned badges and certificates">
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
                {badge.description ? (
                  <p className="text-xs text-neutral-500 mt-1">{String(badge.description)}</p>
                ) : null}
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
            description="Complete courses and volunteer hours to earn certificates."
          />
        ) : (
          <div className="space-y-4">
            {certificates.map((cert) => (
              <Card key={String(cert.id)} className="p-5 border border-neutral-200">
                <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-lg">{String(cert.title ?? 'Certificate')}</h3>
                    {cert.issuedBy ? (
                      <p className="text-sm text-neutral-500 mt-1">{String(cert.issuedBy)}</p>
                    ) : null}
                    {cert.credentialId ? (
                      <p className="text-xs text-neutral-600 mt-2 font-mono">ID: {String(cert.credentialId)}</p>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    {cert.downloadUrl ? (
                      <a
                        href={String(cert.downloadUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="!bg-black !text-white px-3 py-2 rounded-lg text-sm inline-flex items-center gap-1"
                      >
                        <Download size={16} /> Download
                      </a>
                    ) : (
                      <button type="button" className="!bg-white !text-black border border-gray-300 px-3 py-2 rounded-lg text-sm inline-flex items-center gap-1">
                        <Download size={16} /> Download
                      </button>
                    )}
                    <button type="button" className="!bg-white !text-black border border-gray-300 px-3 py-2 rounded-lg text-sm inline-flex items-center gap-1">
                      <Share2 size={16} /> Share
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </DashboardPageShell>
  )
}
