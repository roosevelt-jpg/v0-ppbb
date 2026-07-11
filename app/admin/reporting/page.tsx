'use client'

import React from 'react'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { AdminTableScroll } from '@/components/admin-table'
import { Card } from '@/components/ui/card'
import {
  Calendar,
  BarChart3,
  X,
  FileText,
  FileSpreadsheet,
  FileType,
} from 'lucide-react'
import {
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  BUTTON_ICON_PRIMARY,
  FILTER_PILL_ACTIVE,
  FILTER_PILL_INACTIVE,
} from '@/lib/admin-design-system'
import { exportReport } from '@/lib/export/report-export'
import { formatReportValue, loadReportData, loadReportingOverview } from '@/lib/reporting/loaders'
import {
  REPORT_CATEGORY_LABELS,
  REPORT_DEFINITIONS,
  type ExportFormat,
  type ReportDateRange,
  type ReportPayload,
  type ReportType,
} from '@/lib/reporting/types'

type ExportingState = { type: ReportType; format: ExportFormat } | null

export default function ReportingPage() {
  const [stats, setStats] = React.useState<{
    totalMembers: number
    totalVolunteers: number
    totalDonations: number
    donationAmount: number
    totalEvents: number
    totalBusinesses: number
    totalCommunities: number
  } | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [dateRange, setDateRange] = React.useState<ReportDateRange>('month')
  const [selectedReport, setSelectedReport] = React.useState<ReportType | null>(null)
  const [reportData, setReportData] = React.useState<ReportPayload | null>(null)
  const [reportLoading, setReportLoading] = React.useState(false)
  const [reportError, setReportError] = React.useState<string | null>(null)
  const [exporting, setExporting] = React.useState<ExportingState>(null)

  React.useEffect(() => {
    let cancelled = false
    const fetchOverview = async () => {
      setLoading(true)
      try {
        const overview = await loadReportingOverview(dateRange)
        if (!cancelled) setStats(overview)
      } catch (error) {
        console.error('[v0] Error fetching report overview:', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void fetchOverview()
    return () => {
      cancelled = true
    }
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
      const data = await loadReportData(reportType, dateRange)
      setReportData(data)
    } catch (error) {
      console.error('[v0] Error fetching report:', error)
      setReportError('Failed to load report data. Please try again.')
    } finally {
      setReportLoading(false)
    }
  }

  const handleExport = async (reportType: ReportType, format: ExportFormat) => {
    setExporting({ type: reportType, format })
    try {
      const data =
        reportData && selectedReport === reportType
          ? reportData
          : await loadReportData(reportType, dateRange)
      if (!data.details.length && format === 'csv') {
        window.alert('No records to export for this report.')
        return
      }
      await exportReport(data, format)
    } catch (error) {
      console.error('[v0] Error exporting report:', error)
      window.alert(
        error instanceof Error ? error.message : 'Failed to export report. Please try again.'
      )
    } finally {
      setExporting(null)
    }
  }

  const reportColumns = reportData?.details?.length ? Object.keys(reportData.details[0]!) : []
  const categories = Array.from(new Set(REPORT_DEFINITIONS.map((r) => r.category)))

  const isExporting = (type: ReportType, format: ExportFormat) =>
    exporting?.type === type && exporting.format === format

  const exportButtons = (type: ReportType, compact = false) => (
    <div className={`flex flex-wrap gap-2 ${compact ? '' : 'mt-4'}`}>
      <button
        type="button"
        data-dashboard-control
        onClick={() => void handleExport(type, 'csv')}
        disabled={!!exporting}
        className={`${BUTTON_SECONDARY} gap-1.5 text-xs sm:text-sm justify-center min-h-[40px]`}
      >
        <FileSpreadsheet className="w-3.5 h-3.5" />
        {isExporting(type, 'csv') ? 'CSV…' : 'CSV'}
      </button>
      <button
        type="button"
        data-dashboard-control
        onClick={() => void handleExport(type, 'pdf')}
        disabled={!!exporting}
        className={`${BUTTON_SECONDARY} gap-1.5 text-xs sm:text-sm justify-center min-h-[40px]`}
      >
        <FileText className="w-3.5 h-3.5" />
        {isExporting(type, 'pdf') ? 'PDF…' : 'PDF'}
      </button>
      <button
        type="button"
        data-dashboard-control
        onClick={() => void handleExport(type, 'docx')}
        disabled={!!exporting}
        className={`${BUTTON_SECONDARY} gap-1.5 text-xs sm:text-sm justify-center min-h-[40px]`}
      >
        <FileType className="w-3.5 h-3.5" />
        {isExporting(type, 'docx') ? 'Word…' : 'Word'}
      </button>
    </div>
  )

  return (
    <AdminPageLayout
      title="Reporting"
      subtitle="Comprehensive branded reports — export as CSV, PDF, or Word"
    >
      <div className="space-y-8 min-w-0">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Calendar className="w-5 h-5 text-neutral-600 shrink-0" />
            <div className="flex flex-wrap gap-2">
              {(['week', 'month', 'year', 'all'] as const).map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setDateRange(range)}
                  className={dateRange === range ? FILTER_PILL_ACTIVE : FILTER_PILL_INACTIVE}
                >
                  {range === 'week'
                    ? 'This Week'
                    : range === 'month'
                      ? 'This Month'
                      : range === 'year'
                        ? 'This Year'
                        : 'All Time'}
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-neutral-500">
            Exports include the Passive Blessings logo on PDF and Word files.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          {[
            { label: 'Members', value: stats?.totalMembers ?? 0 },
            { label: 'Volunteers', value: stats?.totalVolunteers ?? 0 },
            { label: 'Donations', value: stats?.totalDonations ?? 0 },
            {
              label: 'Donation AED',
              value: stats?.donationAmount ?? 0,
              money: true,
            },
            { label: 'Events', value: stats?.totalEvents ?? 0 },
            { label: 'Businesses', value: stats?.totalBusinesses ?? 0 },
            { label: 'Communities', value: stats?.totalCommunities ?? 0 },
          ].map((metric) => (
            <Card key={metric.label} className="p-4 sm:p-5 border border-neutral-200 min-w-0">
              <p className="text-xs text-neutral-600 uppercase tracking-wide">{metric.label}</p>
              <p className="text-2xl sm:text-3xl font-bold text-neutral-900 mt-2 font-headline truncate">
                {loading
                  ? '…'
                  : metric.money
                    ? Number(metric.value).toLocaleString()
                    : Number(metric.value).toLocaleString()}
              </p>
            </Card>
          ))}
        </div>

        {categories.map((category) => (
          <div key={category} className="space-y-4">
            <h2 className="text-xl font-bold text-neutral-900 font-headline">
              {REPORT_CATEGORY_LABELS[category]}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {REPORT_DEFINITIONS.filter((r) => r.category === category).map((report) => (
                <Card key={report.type} className="p-5 border border-neutral-200 flex flex-col min-w-0">
                  <h3 className="font-semibold text-neutral-900">{report.title}</h3>
                  <p className="text-sm text-neutral-600 mt-2 flex-1">{report.description}</p>
                  <div className="mt-4 flex flex-col gap-2">
                    <button
                      type="button"
                      data-dashboard-control
                      onClick={() => void handleViewReport(report.type)}
                      className={`${BUTTON_PRIMARY} gap-2 text-sm justify-center w-full`}
                    >
                      <BarChart3 className="w-4 h-4" />
                      View Report
                    </button>
                    {exportButtons(report.type)}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}

        {selectedReport && (
          <div className="admin-modal-overlay p-4">
            <div className="admin-modal-content admin-modal-content--wide max-h-[90vh] w-full">
              <div className="p-4 sm:p-6 border-b border-neutral-200 flex-shrink-0 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-xl sm:text-2xl font-bold font-headline truncate">
                    {reportData?.type || 'Loading report…'}
                  </h2>
                  {reportData?.description ? (
                    <p className="text-sm text-neutral-600 mt-1">{reportData.description}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  data-dashboard-control
                  onClick={closeModal}
                  className={`${BUTTON_ICON_PRIMARY} !min-h-[36px] !min-w-[36px] shrink-0`}
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
                        <p className="text-xs text-neutral-600 uppercase">Total Records</p>
                        <p className="text-3xl font-bold mt-2">{reportData.total}</p>
                      </Card>
                      {reportData.totalAmount !== undefined && (
                        <Card className="p-4 border border-neutral-200">
                          <p className="text-xs text-neutral-600 uppercase">Total Amount</p>
                          <p className="text-3xl font-bold mt-2">
                            AED {reportData.totalAmount.toLocaleString()}
                          </p>
                        </Card>
                      )}
                      {reportData.summary &&
                        Object.entries(reportData.summary)
                          .filter(([key]) => key !== 'totalAmountAED' && key !== 'records')
                          .slice(0, 2)
                          .map(([key, value]) => (
                            <Card key={key} className="p-4 border border-neutral-200">
                              <p className="text-xs text-neutral-600 uppercase">{key}</p>
                              <p className="text-3xl font-bold mt-2">
                                {typeof value === 'number' ? value.toLocaleString() : value}
                              </p>
                            </Card>
                          ))}
                    </div>

                    <p className="text-sm text-neutral-600 mb-3">
                      Showing {reportData.details.length} record
                      {reportData.details.length === 1 ? '' : 's'} · Range: {reportData.dateRange}
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
                                <td
                                  colSpan={reportColumns.length || 1}
                                  className="px-4 py-8 text-center text-neutral-500"
                                >
                                  No records found for this date range
                                </td>
                              </tr>
                            ) : (
                              reportData.details.map((item, idx) => (
                                <tr
                                  key={item.id?.toString() || idx}
                                  className="border-b border-neutral-200 hover:bg-neutral-50"
                                >
                                  {reportColumns.map((key) => (
                                    <td
                                      key={key}
                                      className="px-4 py-3 text-neutral-700 whitespace-nowrap"
                                    >
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

              <div className="p-4 sm:p-6 border-t border-neutral-200 flex-shrink-0 flex flex-col gap-3">
                {selectedReport ? (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <p className="text-sm text-neutral-600 shrink-0">Export branded report:</p>
                    {exportButtons(selectedReport, true)}
                  </div>
                ) : null}
                <button
                  type="button"
                  data-dashboard-control
                  onClick={closeModal}
                  className={`${BUTTON_SECONDARY} justify-center`}
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
