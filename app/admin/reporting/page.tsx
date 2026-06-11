'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { Download, Calendar, TrendingUp } from 'lucide-react'

export default function ReportingPage() {
  const [stats, setStats] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [dateRange, setDateRange] = React.useState('month')

  React.useEffect(() => {
    const fetchReportData = async () => {
      try {
        // Fetch all necessary data
        const [membersSnap, donationsSnap, eventsSnap, volunteersSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'donations')),
          getDocs(collection(db, 'events')),
          getDocs(query(collection(db, 'users'), where('role', '==', 'volunteer')))
        ])

        setStats({
          totalMembers: membersSnap.size,
          totalDonations: donationsSnap.size,
          totalEvents: eventsSnap.size,
          totalVolunteers: volunteersSnap.size,
        })
      } catch (error) {
        console.error('[v0] Error fetching report data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchReportData()
  }, [dateRange])

  const handleExport = () => {
    alert('Export functionality coming soon. Will support CSV and PDF formats.')
  }

  return (
    <>
      
      <div className="p-8 bg-neutral-50 space-y-8">
        {/* Date Range Selector */}
        <div className="flex gap-4 items-center flex-wrap">
          <Calendar className="w-5 h-5 text-neutral-600" />
          <div className="flex gap-2">
            {['week', 'month', 'year'].map(range => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  dateRange === range
                    ? 'bg-neutral-900 text-white'
                    : 'bg-white text-neutral-700 border border-neutral-200 hover:border-neutral-300'
                }`}
              >
                {range === 'week' ? 'This Week' : range === 'month' ? 'This Month' : 'This Year'}
              </button>
            ))}
          </div>
          <button
            onClick={handleExport}
            className="ml-auto flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 rounded-lg text-neutral-700 font-medium hover:border-neutral-300"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Members', value: stats?.totalMembers || 0, icon: TrendingUp },
            { label: 'Total Volunteers', value: stats?.totalVolunteers || 0, icon: TrendingUp },
            { label: 'Total Donations', value: stats?.totalDonations || 0, icon: TrendingUp },
            { label: 'Total Events', value: stats?.totalEvents || 0, icon: TrendingUp },
          ].map(metric => {
            const Icon = metric.icon
            return (
              <Card key={metric.label} className="p-6 border border-neutral-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-neutral-600 uppercase tracking-wide">{metric.label}</p>
                    <p className="text-3xl font-bold text-neutral-900 mt-2">{loading ? '...' : metric.value}</p>
                  </div>
                  <Icon className="w-5 h-5 text-neutral-400" />
                </div>
              </Card>
            )
          })}
        </div>

        {/* Report Sections */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-neutral-900">Available Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: 'Member Analytics', description: 'Demographics, activity, retention' },
              { title: 'Donation Reports', description: 'Trends, contributions, impact' },
              { title: 'Event Performance', description: 'Attendance, engagement, feedback' },
              { title: 'Volunteer Metrics', description: 'Hours, participation, satisfaction' },
            ].map(report => (
              <Card key={report.title} className="p-6 border border-neutral-200 cursor-pointer hover:shadow-md transition">
                <h3 className="font-semibold text-neutral-900">{report.title}</h3>
                <p className="text-sm text-neutral-600 mt-2">{report.description}</p>
                <button className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700">View Report →</button>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
