'use client'

import React, { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { MemberHeader } from '@/components/member-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Award, Download, Share2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<any[]>([])
  const [badges, setBadges] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const firebaseUser = auth.currentUser
    if (!firebaseUser) return

    // Fetch certificates
    const certUnsubscribe = onSnapshot(
      query(collection(db, 'certificates'), where('userId', '==', firebaseUser.uid)),
      (snapshot) => {
        setCertificates(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        )
      }
    )

    // Fetch badges
    const badgeUnsubscribe = onSnapshot(
      query(collection(db, 'badges'), where('userId', '==', firebaseUser.uid)),
      (snapshot) => {
        setBadges(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        )
        setLoading(false)
      }
    )

    return () => {
      certUnsubscribe()
      badgeUnsubscribe()
    }
  }, [])

  return (
    <>
      <MemberHeader
        title="Certificates & Badges"
        subtitle="View your achievements and credentials"
        open={sidebarOpen}
        setOpen={setSidebarOpen}
      />

      <div className="p-8 space-y-8">
        {/* Badges Section */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Your Badges</h2>
          {loading ? (
            <p className="text-muted-foreground">Loading badges...</p>
          ) : badges.length === 0 ? (
            <Card className="p-6">
              <div className="text-center">
                <Award size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-muted-foreground">No badges earned yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Complete activities to earn badges
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {badges.map((badge) => (
                <Card key={badge.id} className="p-4 text-center hover:shadow-lg transition">
                  <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500 rounded-full text-white text-2xl">
                    {badge.icon || <Award size={32} />}
                  </div>
                  <h3 className="font-bold text-sm">{badge.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{badge.description}</p>
                  <p className="text-xs mt-2" style={{ color: '#888888' }}>
                    {badge.earnedAt
                      ? new Date(badge.earnedAt).toLocaleDateString()
                      : 'Recently'}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Certificates Section */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Your Certificates</h2>
          {loading ? (
            <p className="text-muted-foreground">Loading certificates...</p>
          ) : certificates.length === 0 ? (
            <Card className="p-6">
              <div className="text-center">
                <Award size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-muted-foreground">No certificates yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Complete courses and volunteer hours to earn certificates
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {certificates.map((cert) => (
                <Card key={cert.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-lg">{cert.title}</h3>
                      <p className="text-muted-foreground text-sm mt-1">{cert.issuedBy}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Issued:{' '}
                        {cert.issuedDate
                          ? new Date(cert.issuedDate).toLocaleDateString()
                          : 'N/A'}
                      </p>
                      {cert.expiryDate && (
                        <p className="text-xs text-muted-foreground">
                          Expires:{' '}
                          {new Date(cert.expiryDate).toLocaleDateString()}
                        </p>
                      )}
                      {cert.credentialId && (
                        <p className="text-xs text-blue-600 mt-2 font-medium">
                          ID: {cert.credentialId}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Download certificate
                          console.log('Download:', cert.id)
                        }}
                      >
                        <Download size={16} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Share certificate
                          console.log('Share:', cert.id)
                        }}
                      >
                        <Share2 size={16} />
                      </Button>
                    </div>
                  </div>

                  {cert.description && (
                    <p className="text-sm mt-4 text-muted-foreground">
                      {cert.description}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
