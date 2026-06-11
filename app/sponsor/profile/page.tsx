'use client'

import React from 'react'
import { useAuth } from '@/lib/auth-context'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Mail, Phone, MapPin, Globe, Edit, Award, Users, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default function SponsorProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [stats, setStats] = React.useState({
    activeSponsorships: 0,
    totalSponsored: 0,
    partnersCount: 0,
    certificateCount: 0,
  })

  React.useEffect(() => {
    if (!user?.id) return

    const fetchProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.id))
        if (userDoc.exists()) {
          setProfile({
            id: userDoc.id,
            ...userDoc.data(),
          })
        }
      } catch (error) {
        console.error('[v0] Error fetching sponsor profile:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user?.id])

  React.useEffect(() => {
    if (!user?.id) return

    const fetchStats = async () => {
      try {
        // These would be real queries to sponsorships collection
        setStats({
          activeSponsorships: 0,
          totalSponsored: 0,
          partnersCount: 0,
          certificateCount: 0,
        })
      } catch (error) {
        console.error('[v0] Error fetching stats:', error)
      }
    }

    fetchStats()
  }, [user?.id])

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen bg-neutral-50">
        <div className="text-neutral-600">Loading profile...</div>
      </div>
    )
  }

  const sponsorType = profile?.sponsorType || 'unknown'
  const membershipTier = profile?.membership || 'standard'

  return (
    <div className="p-8 bg-neutral-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">{profile?.sponsorName || 'Sponsor Profile'}</h1>
            <p className="text-neutral-600 mt-1">Manage your sponsorship account and partnerships</p>
          </div>
          <Link href="/sponsor/profile/edit">
            <Button className="flex items-center gap-2">
              <Edit className="w-4 h-4" />
              Edit Profile
            </Button>
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 border border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 font-medium">Active Sponsorships</p>
                <p className="text-3xl font-bold text-neutral-900 mt-2">{stats.activeSponsorships}</p>
              </div>
              <Award className="w-10 h-10 text-blue-500 opacity-20" />
            </div>
          </Card>

          <Card className="p-6 border border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 font-medium">Total Sponsored</p>
                <p className="text-3xl font-bold text-neutral-900 mt-2">AED {stats.totalSponsored.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-500 opacity-20" />
            </div>
          </Card>

          <Card className="p-6 border border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 font-medium">Partners</p>
                <p className="text-3xl font-bold text-neutral-900 mt-2">{stats.partnersCount}</p>
              </div>
              <Users className="w-10 h-10 text-purple-500 opacity-20" />
            </div>
          </Card>

          <Card className="p-6 border border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 font-medium">Certificates</p>
                <p className="text-3xl font-bold text-neutral-900 mt-2">{stats.certificateCount}</p>
              </div>
              <Award className="w-10 h-10 text-amber-500 opacity-20" />
            </div>
          </Card>
        </div>

        {/* Profile Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Profile Card */}
          <div className="lg:col-span-2">
            <Card className="p-8 border border-neutral-200">
              <h2 className="text-xl font-bold text-neutral-900 mb-6">Profile Information</h2>

              <div className="space-y-6">
                {/* Name and Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-neutral-600 font-medium">Sponsor Name</label>
                    <p className="text-neutral-900 font-medium mt-2">{profile?.sponsorName}</p>
                  </div>
                  <div>
                    <label className="text-sm text-neutral-600 font-medium">Sponsor Type</label>
                    <div className="mt-2">
                      <Badge variant="outline" className="capitalize">
                        {sponsorType}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="border-t border-neutral-200 pt-6">
                  <h3 className="font-semibold text-neutral-900 mb-4">Contact Information</h3>
                  <div className="space-y-3">
                    {profile?.sponsorEmail && (
                      <div className="flex items-center gap-3 text-neutral-700">
                        <Mail className="w-5 h-5 text-neutral-400" />
                        <a href={`mailto:${profile.sponsorEmail}`} className="text-blue-600 hover:underline">
                          {profile.sponsorEmail}
                        </a>
                      </div>
                    )}
                    {profile?.sponsorPhone && (
                      <div className="flex items-center gap-3 text-neutral-700">
                        <Phone className="w-5 h-5 text-neutral-400" />
                        <a href={`tel:${profile.sponsorPhone}`} className="text-blue-600 hover:underline">
                          {profile.sponsorPhone}
                        </a>
                      </div>
                    )}
                    {profile?.sponsorLocation && (
                      <div className="flex items-center gap-3 text-neutral-700">
                        <MapPin className="w-5 h-5 text-neutral-400" />
                        <span>{profile.sponsorLocation}</span>
                      </div>
                    )}
                    {profile?.website && (
                      <div className="flex items-center gap-3 text-neutral-700">
                        <Globe className="w-5 h-5 text-neutral-400" />
                        <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {profile.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                {profile?.sponsorDescription && (
                  <div className="border-t border-neutral-200 pt-6">
                    <h3 className="font-semibold text-neutral-900 mb-4">About</h3>
                    <p className="text-neutral-700 leading-relaxed">{profile.sponsorDescription}</p>
                  </div>
                )}

                {/* Sponsorship Focus */}
                {profile?.sponsorshipFocus && profile.sponsorshipFocus.length > 0 && (
                  <div className="border-t border-neutral-200 pt-6">
                    <h3 className="font-semibold text-neutral-900 mb-4">Sponsorship Focus</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.sponsorshipFocus.map((focus: string) => (
                        <Badge key={focus} variant="secondary">
                          {focus}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Membership Tier */}
            <Card className="p-6 border border-neutral-200">
              <h3 className="font-semibold text-neutral-900 mb-4">Membership</h3>
              <Badge className="capitalize text-lg py-2 px-3 bg-blue-100 text-blue-800">
                {membershipTier} Member
              </Badge>
              <p className="text-sm text-neutral-600 mt-4">
                Unlock premium features by upgrading your membership tier.
              </p>
            </Card>

            {/* Quick Actions */}
            <Card className="p-6 border border-neutral-200">
              <h3 className="font-semibold text-neutral-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link href="/sponsor/marketplace" className="block">
                  <Button variant="outline" className="w-full justify-center">
                    Browse Opportunities
                  </Button>
                </Link>
                <Link href="/sponsor/partnerships" className="block">
                  <Button variant="outline" className="w-full justify-center">
                    View Partnerships
                  </Button>
                </Link>
                <Link href="/sponsor/analytics" className="block">
                  <Button variant="outline" className="w-full justify-center">
                    View Analytics
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
