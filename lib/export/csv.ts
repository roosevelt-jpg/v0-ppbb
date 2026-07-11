import { formatReportValue } from '@/lib/reporting/loaders'
import type { ReportPayload, ReportRow } from '@/lib/reporting/types'

function escapeCsvCell(value: unknown): string {
  const text = formatReportValue(value)
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

export function rowsToCsv(rows: ReportRow[]): string {
  if (!rows.length) return ''
  const headers = Object.keys(rows[0]!)
  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => escapeCsvCell(row[h])).join(',')),
  ]
  return lines.join('\n')
}

export function reportToCsv(payload: ReportPayload): string {
  const meta = [
    ['Report', payload.type],
    ['Description', payload.description],
    ['Generated', payload.generatedAt],
    ['Date range', payload.dateRange],
    ['Total records', String(payload.total)],
  ]
  if (payload.totalAmount != null) {
    meta.push(['Total amount (AED)', String(payload.totalAmount)])
  }
  const metaBlock = meta.map((row) => row.map(escapeCsvCell).join(',')).join('\n')
  const body = rowsToCsv(payload.details)
  return `Passive Blessings Report\n${metaBlock}\n\n${body}`
}

export function downloadTextFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  window.URL.revokeObjectURL(url)
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  window.URL.revokeObjectURL(url)
}

export function safeReportFilename(title: string, ext: string): string {
  const safe = title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase()
  return `${safe || 'report'}-${new Date().toISOString().slice(0, 10)}.${ext}`
}
