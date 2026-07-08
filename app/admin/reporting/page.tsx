'use client'

import React from 'react'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { Card } from '@/components/ui/card'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { Download, Calendar, TrendingUp, BarChart3 } from 'lucide-react'

type ReportType = 'members' | 'donations' | 'events' | 'volunteers'

export default function ReportingPage() {
  const [stats, setStats] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [dateRange, setDateRange] = React.useState('month')
  const [selectedReport, setSelectedReport] = React.useState<ReportType | null>(null)
  const [reportData, setReportData] = React.useState<any>(null)

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

  const handleViewReport = async (reportType: ReportType) => {
    console.log('[v0] handleViewReport called with:', reportType)
    console.log('[v0] Current state - selectedReport:', selectedReport, 'reportData exists:', !!reportData)
    try {
      console.log('[v0] Setting selected report to:', reportType)
      setSelectedReport(reportType)
      let data: any = null

      switch (reportType) {
        case 'members': {
          try {
            console.log('[v0] Fetching members collection...')
            const snap = await getDocs(collection(db, 'users'))
            console.log('[v0] Members fetched:', snap.size, 'docs')
            data = {
              type: 'Member Analytics',
              total: snap.size,
              details: snap.docs.map(d => ({
                id: d.id,
                name: (d.data().firstName || '') + ' ' + (d.data().lastName || ''),
                email: d.data().email,
                joinedAt: d.data().createdAt,
                status: d.data().status || 'active'
              }))
            }
          } catch (err) {
            console.error('[v0] Error fetching members:', err)
            throw err
          }
          break
        }
        case 'donations': {
          try {
            console.log('[v0] Fetching donations collection...')
            const snap = await getDocs(collection(db, 'donations'))
            console.log('[v0] Donations fetched:', snap.size, 'docs')
            const total = snap.docs.reduce((sum, d) => sum + (d.data().amount || 0), 0)
            data = {
              type: 'Donation Reports',
              total: snap.size,
              totalAmount: total,
              details: snap.docs.map(d => ({
                id: d.id,
                donor: d.data().donorName || 'Anonymous',
                amount: d.data().amount || 0,
                date: d.data().createdAt,
                status: d.data().status || 'completed'
              }))
            }
          } catch (err) {
            console.error('[v0] Error fetching donations:', err)
            throw err
          }
          break
        }
        case 'events': {
          try {
            console.log('[v0] Fetching events collection...')
            const snap = await getDocs(collection(db, 'events'))
            console.log('[v0] Events fetched:', snap.size, 'docs')
            data = {
              type: 'Event Performance',
              total: snap.size,
              details: snap.docs.map(d => ({
                id: d.id,
                name: d.data().name || 'Untitled',
                date: d.data().date,
                attendees: d.data().attendees || 0,
                status: d.data().status || 'scheduled'
              }))
            }
          } catch (err) {
            console.error('[v0] Error fetching events:', err)
            throw err
          }
          break
        }
        case 'volunteers': {
          try {
            console.log('[v0] Fetching volunteers...')
            const snap = await getDocs(query(collection(db, 'users'), where('role', '==', 'volunteer')))
            console.log('[v0] Volunteers fetched:', snap.size, 'docs')
            data = {
              type: 'Volunteer Metrics',
              total: snap.size,
              details: snap.docs.map(d => ({
                id: d.id,
                name: (d.data().firstName || '') + ' ' + (d.data().lastName || ''),
                hours: d.data().volunteerHours || 0,
                status: d.data().status || 'active'
              }))
            }
          } catch (err) {
            console.error('[v0] Error fetching volunteers:', err)
            throw err
          }
          break
        }
      }

      console.log('[v0] Report data loaded:', data)
      console.log('[v0] Setting reportData state with:', data)
      setReportData(data)
      console.log('[v0] Modal should now be visible')
    } catch (error) {
      console.error('[v0] Error fetching report:', error)
      console.log('[v0] Error details:', error instanceof Error ? error.message : error)
    }
  }

  const handleExport = () => {
    if (!reportData) return
    const csv = generateCSV(reportData.details)
    downloadCSV(csv, `${reportData.type}.csv`)
  }

  const generateCSV = (data: any[]) => {
    if (!data || data.length === 0) return ''
    const headers = Object.keys(data[0])
    const rows = data.map(item => headers.map(h => item[h]).join(','))
    return [headers.join(','), ...rows].join('\n')
  }

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
  }

  return (
    <AdminPageLayout title="Reporting" subtitle="Generate and export comprehensive reports">
      <div className="space-y-8">
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
              { title: 'Member Analytics', description: 'Demographics, activity, retention', type: 'members' as ReportType },
              { title: 'Donation Reports', description: 'Trends, contributions, impact', type: 'donations' as ReportType },
              { title: 'Event Performance', description: 'Attendance, engagement, feedback', type: 'events' as ReportType },
              { title: 'Volunteer Metrics', description: 'Hours, participation, satisfaction', type: 'volunteers' as ReportType },
            ].map(report => (
              <Card key={report.title} className="p-6 border border-neutral-200 cursor-pointer hover:shadow-md transition">
                <h3 className="font-semibold text-neutral-900">{report.title}</h3>
                <p className="text-sm text-neutral-600 mt-2">{report.description}</p>
                <button 
                  type="button"
                  onClick={(e) => {
                    console.log('[v0] BUTTON CLICKED - report type:', report.type)
                    console.log('[v0] Event target:', e.target)
                    console.log('[v0] Event type:', e.type)
                    handleViewReport(report.type)
                  }}
                  className="mt-4 px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  View Report →
                </button>
              </Card>
            ))}
          </div>
        </div>

        {/* Report Detail Modal */}
        {reportData && selectedReport && (
          <div className="admin-modal-overlay">
            <div className="admin-modal-content bg-white rounded-lg w-full max-w-4xl flex flex-col">
              {/* Modal Header */}
              <div className="p-6 border-b border-neutral-200 flex-shrink-0 flex items-center justify-between">
                <h2 className="text-2xl font-bold">{reportData.type}</h2>
                <button
                  type="button"
                  onClick={() => {
                    console.log('[v0] Closing report modal')
                    setReportData(null)
                    setSelectedReport(null)
                  }}
                  className="w-8 h-8 flex items-center justify-center bg-neutral-900 text-white rounded-full hover:bg-neutral-800 transition"
                >
                  ×
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {reportData.total !== undefined && (
                    <Card className="p-4 border border-neutral-200">
                      <p className="text-xs text-neutral-600 uppercase">Total Records</p>
                      <p className="text-3xl font-bold mt-2">{reportData.total}</p>
                    </Card>
                  )}
                  {reportData.totalAmount !== undefined && (
                    <Card className="p-4 border border-neutral-200">
                      <p className="text-xs text-neutral-600 uppercase">Total Amount</p>
                      <p className="text-3xl font-bold mt-2">AED {reportData.totalAmount.toLocaleString()}</p>
                    </Card>
                  )}
                </div>

                <div className="border border-neutral-200 rounded-lg min-w-0">
                  <div className="admin-table-scroll">
                  <table className="w-full text-sm min-w-[640px]">
                    <thead className="bg-neutral-100 border-b border-neutral-200">
                      <tr>
                        {reportData.details.length > 0 && Object.keys(reportData.details[0]).map((key) => (
                          <th key={key} className="px-4 py-3 text-left font-semibold text-neutral-900">
                            {key.charAt(0).toUpperCase() + key.slice(1)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.details.map((item: any, idx: number) => (
                        <tr key={idx} className="border-b border-neutral-200 hover:bg-neutral-50">
                          {Object.values(item).map((value: any, vidx: number) => (
                            <td key={vidx} className="px-4 py-3 text-neutral-700">
                              {typeof value === 'object' ? new Date(value).toLocaleDateString() : value}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-neutral-200 flex-shrink-0 flex gap-3">
                <button
                  type="button"
                  onClick={handleExport}
                  className="flex-1 px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition flex items-center justify-center gap-2 font-medium"
                >
                  <Download className="w-4 h-4" />
                  Export as CSV
                </button>
                <button
                  type="button"
                  onClick={() => {
                    console.log('[v0] Closing report modal')
                    setReportData(null)
                    setSelectedReport(null)
                  }}
                  className="flex-1 px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminPageLayout>
  )
}
