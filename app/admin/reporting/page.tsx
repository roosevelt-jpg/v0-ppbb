'use client'

import React from 'react'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { AdminTableScroll } from '@/components/admin-table'
import { Card } from '@/components/ui/card'
import { db } from '@/lib/firebase'
import { collection, getDocs } from 'firebase/firestore'
import { Download, Calendar, TrendingUp, BarChart3, X } from 'lucide-react'
import { BUTTON_PRIMARY, BUTTON_SECONDARY, BUTTON_ICON_PRIMARY, FILTER_PILL_ACTIVE, FILTER_PILL_INACTIVE } from '@/lib/admin-design-system'

type ReportType = 'members' | 'donations' | 'events' | 'volunteers'

type ReportRow = Record<string, string | number>

interface ReportPayload {
  type: string
  total: number
  totalAmount?: number
  details: ReportRow[]
}

const VOLUNTEER_ROLES = ['volunteer', 'member+volunteer'] as const

function isVolunteerUser(data: Record<string, unknown>): boolean {
  const role = data.role
  const userType = data.userType
  if (role === 'volunteer' || userType === 'volunteer') return true
  if (Array.isArray(role) && role.some((r) => String(r).toLowerCase().includes('volunteer'))) return true
  if (typeof role === 'string' && VOLUNTEER_ROLES.includes(role as (typeof VOLUNTEER_ROLES)[number])) return true
  return false
}

function formatReportValue(value: unknown): string {
  if (value == null || value === '') return '—'
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    try {
      return (value as { toDate: () => Date }).toDate().toLocaleString()
    } catch {
      return '—'
    }
  }
  if (value instanceof Date) return value.toLocaleString()
  if (typeof value === 'number') return String(value)
  return String(value).trim() || '—'
}

async function loadReportData(reportType: ReportType): Promise<ReportPayload> {
  switch (reportType) {
    case 'members': {
      const snap = await getDocs(collection(db, 'users'))
      return {
        type: 'Member Analytics',
        total: snap.size,
        details: snap.docs.map((d) => {
          const row = d.data()
          return {
            id: d.id,
            name: `${row.firstName || ''} ${row.lastName || ''}`.trim() || row.displayName || '—',
            email: row.email || '—',
            role: String(row.role || '—'),
            joinedAt: formatReportValue(row.createdAt),
            status: row.status || 'active',
          }
        }),
      }
    }
    case 'donations': {
      const snap = await getDocs(collection(db, 'donations'))
      const totalAmount = snap.docs.reduce((sum, d) => sum + (Number(d.data().amount) || 0), 0)
      return {
        type: 'Donation Reports',
        total: snap.size,
        totalAmount,
        details: snap.docs.map((d) => {
          const row = d.data()
          return {
            id: d.id,
            donor: row.donorName || row.donorEmail || 'Anonymous',
            amount: Number(row.amount) || 0,
            date: formatReportValue(row.createdAt),
            status: row.status || 'completed',
          }
        }),
      }
    }
    case 'events': {
      const snap = await getDocs(collection(db, 'events'))
      return {
        type: 'Event Performance',
        total: snap.size,
        details: snap.docs.map((d) => {
          const row = d.data()
          return {
            id: d.id,
            name: row.name || row.title || 'Untitled',
            date: formatReportValue(row.date || row.startDate),
            attendees: Number(row.attendees || row.attendeeCount || 0),
            status: row.status || 'scheduled',
          }
        }),
      }
    }
    case 'volunteers': {
      const snap = await getDocs(collection(db, 'users'))
      const volunteerDocs = snap.docs.filter((d) => isVolunteerUser(d.data()))
      return {
        type: 'Volunteer Metrics',
        total: volunteerDocs.length,
        details: volunteerDocs.map((d) => {
          const row = d.data()
          return {
            id: d.id,
            name: `${row.firstName || ''} ${row.lastName || ''}`.trim() || '—',
            email: row.email || '—',
            hours: Number(row.volunteeredHours || row.volunteerHours || 0),
            status: row.status || 'active',
          }
        }),
      }
    }
    default:
      throw new Error(`Unknown report type: ${reportType}`)
  }
}

function exportReportPayload(data: ReportPayload) {
  const csv = generateCSV(data.details)
  const safeName = data.type.replace(/\s+/g, '-').toLowerCase()
  downloadCSV(csv, `${safeName}-${new Date().toISOString().slice(0, 10)}.csv`)
}

function escapeCsvCell(value: unknown): string {
  const text = formatReportValue(value)
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

function generateCSV(rows: ReportRow[]): string {
  if (!rows.length) return ''
  const headers = Object.keys(rows[0])
  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => escapeCsvCell(row[h])).join(',')),
  ]
  return lines.join('\n')
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  window.URL.revokeObjectURL(url)
}

export default function ReportingPage() {
  const [stats, setStats] = React.useState<{
    totalMembers: number
    totalDonations: number
    totalEvents: number
    totalVolunteers: number
  } | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [dateRange, setDateRange] = React.useState('month')
  const [selectedReport, setSelectedReport] = React.useState<ReportType | null>(null)
  const [reportData, setReportData] = React.useState<ReportPayload | null>(null)
  const [reportLoading, setReportLoading] = React.useState(false)
  const [reportError, setReportError] = React.useState<string | null>(null)
  const [exportingType, setExportingType] = React.useState<ReportType | null>(null)

  React.useEffect(() => {
    const fetchReportData = async () => {
      try {
        const [membersSnap, donationsSnap, eventsSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'donations')),
          getDocs(collection(db, 'events')),
        ])

        const volunteerCount = membersSnap.docs.filter((d) => isVolunteerUser(d.data())).length

        setStats({
          totalMembers: membersSnap.size,
          totalDonations: donationsSnap.size,
          totalEvents: eventsSnap.size,
          totalVolunteers: volunteerCount,
        })
      } catch (error) {
        console.error('[v0] Error fetching report data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchReportData()
  }, [dateRange])

  const closeModal = () => {
    setReportData(null)
    setSelectedReport(null)
    setReportError(null)
  }

  const handleViewReport = async (reportType: ReportType) => {
    setSelectedReport(reportType)
    setReportLoading(true)
    setReportData(null)
    setReportError(null)
    try {
      const data = await loadReportData(reportType)
      setReportData(data)
    } catch (error) {
      console.error('[v0] Error fetching report:', error)
      setReportError('Failed to load report data. Please try again.')
    } finally {
      setReportLoading(false)
    }
  }

  const handleExportReport = async (reportType: ReportType) => {
    setExportingType(reportType)
    try {
      const data = reportData && selectedReport === reportType ? reportData : await loadReportData(reportType)
      if (!data.details.length) {
        window.alert('No records to export for this report.')
        return
      }
      exportReportPayload(data)
    } catch (error) {
      console.error('[v0] Error exporting report:', error)
      window.alert('Failed to export report. Please try again.')
    } finally {
      setExportingType(null)
    }
  }

  const handleExport = () => {
    if (!reportData?.details?.length) return
    exportReportPayload(reportData)
  }

  const reportColumns = reportData?.details?.length ? Object.keys(reportData.details[0]) : []

  return (
    <AdminPageLayout title="Reporting" subtitle="Generate and export comprehensive reports">
      <div className="space-y-8 min-w-0">
        {/* Date Range Selector */}
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-neutral-600 shrink-0" />
            <div className="flex flex-wrap gap-2">
              {(['week', 'month', 'year'] as const).map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setDateRange(range)}
                  className={dateRange === range ? FILTER_PILL_ACTIVE : FILTER_PILL_INACTIVE}
                >
                  {range === 'week' ? 'This Week' : range === 'month' ? 'This Month' : 'This Year'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Members', value: stats?.totalMembers ?? 0 },
            { label: 'Total Volunteers', value: stats?.totalVolunteers ?? 0 },
            { label: 'Total Donations', value: stats?.totalDonations ?? 0 },
            { label: 'Total Events', value: stats?.totalEvents ?? 0 },
          ].map((metric) => (
            <Card key={metric.label} className="p-6 border border-neutral-200">
              <p className="text-sm text-neutral-600 uppercase tracking-wide font-eyebrow">{metric.label}</p>
              <p className="text-3xl font-bold text-neutral-900 mt-2 font-headline">
                {loading ? '…' : metric.value.toLocaleString()}
              </p>
            </Card>
          ))}
        </div>

        {/* Report Sections */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-neutral-900 font-headline">Available Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: 'Member Analytics', description: 'Demographics, activity, retention', type: 'members' as ReportType },
              { title: 'Donation Reports', description: 'Trends, contributions, impact', type: 'donations' as ReportType },
              { title: 'Event Performance', description: 'Attendance, engagement, feedback', type: 'events' as ReportType },
              { title: 'Volunteer Metrics', description: 'Hours, participation, satisfaction', type: 'volunteers' as ReportType },
            ].map((report) => (
              <Card key={report.title} className="p-6 border border-neutral-200">
                <h3 className="font-semibold text-neutral-900">{report.title}</h3>
                <p className="text-sm text-neutral-600 mt-2">{report.description}</p>
                <div className="mt-4 flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    data-dashboard-control
                    onClick={() => void handleViewReport(report.type)}
                    className={`${BUTTON_PRIMARY} gap-2 text-sm flex-1 justify-center`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    View Report
                  </button>
                  <button
                    type="button"
                    data-dashboard-control
                    onClick={() => void handleExportReport(report.type)}
                    disabled={exportingType === report.type}
                    className={`${BUTTON_SECONDARY} gap-2 text-sm flex-1 justify-center`}
                  >
                    <Download className="w-4 h-4" />
                    {exportingType === report.type ? 'Exporting…' : 'Export CSV'}
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Report Detail Modal */}
        {selectedReport && (
          <div className="admin-modal-overlay p-4">
            <div className="admin-modal-content admin-modal-content--wide max-h-[90vh] w-full">
              <div className="p-4 sm:p-6 border-b border-neutral-200 flex-shrink-0 flex items-center justify-between gap-4">
                <h2 className="text-xl sm:text-2xl font-bold font-headline">
                  {reportData?.type || 'Loading report…'}
                </h2>
                <button
                  type="button"
                  data-dashboard-control
                  onClick={closeModal}
                  className={`${BUTTON_ICON_PRIMARY} !min-h-[36px] !min-w-[36px]`}
                  aria-label="Close report"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0">
                {reportLoading ? (
                  <div className="animate-pulse space-y-3">
                    <div className="h-16 bg-neutral-200 rounded-lg" />
                    <div className="h-48 bg-neutral-200 rounded-lg" />
                  </div>
                ) : reportData ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      <Card className="p-4 border border-neutral-200">
                        <p className="text-xs text-neutral-600 uppercase font-eyebrow">Total Records</p>
                        <p className="text-3xl font-bold mt-2">{reportData.total}</p>
                      </Card>
                      {reportData.totalAmount !== undefined && (
                        <Card className="p-4 border border-neutral-200">
                          <p className="text-xs text-neutral-600 uppercase font-eyebrow">Total Amount</p>
                          <p className="text-3xl font-bold mt-2">AED {reportData.totalAmount.toLocaleString()}</p>
                        </Card>
                      )}
                    </div>

                    <p className="text-sm text-neutral-600 mb-3">
                      Showing {reportData.details.length} of {reportData.total} records
                    </p>

                    <div className="border border-neutral-200 rounded-lg min-w-0">
                      <AdminTableScroll>
                        <table className="w-full text-sm min-w-[720px]">
                          <thead className="bg-neutral-100 border-b border-neutral-200">
                            <tr>
                              {reportColumns.map((key) => (
                                <th
                                  key={key}
                                  className="px-4 py-3 text-left font-semibold text-neutral-900 whitespace-nowrap"
                                >
                                  {key.charAt(0).toUpperCase() + key.slice(1)}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {reportData.details.length === 0 ? (
                              <tr>
                                <td colSpan={reportColumns.length || 1} className="px-4 py-8 text-center text-neutral-500">
                                  No records found
                                </td>
                              </tr>
                            ) : (
                              reportData.details.map((item, idx) => (
                                <tr key={item.id?.toString() || idx} className="border-b border-neutral-200 hover:bg-neutral-50">
                                  {reportColumns.map((key) => (
                                    <td key={key} className="px-4 py-3 text-neutral-700 whitespace-nowrap">
                                      {formatReportValue(item[key])}
                                    </td>
                                  ))}
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </AdminTableScroll>
                    </div>
                  </>
                ) : reportError ? (
                  <p className="text-red-600">{reportError}</p>
                ) : (
                  <p className="text-neutral-600">Failed to load report data.</p>
                )}
              </div>

              <div className="p-4 sm:p-6 border-t border-neutral-200 flex-shrink-0 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  data-dashboard-control
                  onClick={handleExport}
                  disabled={!reportData?.details?.length}
                  className={`${BUTTON_PRIMARY} flex-1 gap-2 justify-center`}
                >
                  <Download className="w-4 h-4" />
                  Export as CSV
                </button>
                <button type="button" data-dashboard-control onClick={closeModal} className={`${BUTTON_SECONDARY} flex-1 justify-center`}>
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
