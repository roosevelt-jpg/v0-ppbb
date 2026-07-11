import { downloadTextFile, reportToCsv, safeReportFilename } from '@/lib/export/csv'
import { exportReportDocx } from '@/lib/export/docx-report'
import { exportReportPdf } from '@/lib/export/pdf-report'
import type { ExportFormat, ReportPayload } from '@/lib/reporting/types'

export async function exportReport(payload: ReportPayload, format: ExportFormat): Promise<void> {
  if (!payload.details.length && format !== 'pdf' && format !== 'docx') {
    throw new Error('No records to export for this report.')
  }

  if (format === 'csv') {
    const csv = reportToCsv(payload)
    downloadTextFile(csv, safeReportFilename(payload.type, 'csv'), 'text/csv;charset=utf-8;')
    return
  }

  if (format === 'pdf') {
    await exportReportPdf(payload)
    return
  }

  if (format === 'docx') {
    await exportReportDocx(payload)
    return
  }

  throw new Error(`Unsupported export format: ${format}`)
}
