import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { DEFAULT_LOGO_ON_LIGHT_BG } from '@/lib/brand-assets'
import { formatReportValue } from '@/lib/reporting/loaders'
import type { ReportPayload } from '@/lib/reporting/types'
import { downloadBlob, safeReportFilename } from '@/lib/export/csv'

async function fetchLogoDataUrl(): Promise<string | null> {
  try {
    const res = await fetch(DEFAULT_LOGO_ON_LIGHT_BG)
    if (!res.ok) return null
    const blob = await res.blob()
    return await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : null)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

export async function exportReportPdf(payload: ReportPayload): Promise<void> {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 14
  let y = 12

  const logo = await fetchLogoDataUrl()
  if (logo) {
    try {
      doc.addImage(logo, 'PNG', margin, y, 22, 22)
    } catch {
      // Logo optional — continue without it
    }
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(17, 17, 17)
  doc.text('Passive Blessings', logo ? margin + 28 : margin, y + 8)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(85, 85, 85)
  doc.text('Official Platform Report', logo ? margin + 28 : margin, y + 14)

  y = 40
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(17, 17, 17)
  doc.text(payload.type, margin, y)

  y += 7
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(85, 85, 85)
  doc.text(payload.description, margin, y)

  y += 8
  const meta = [
    `Generated: ${new Date(payload.generatedAt).toLocaleString()}`,
    `Date range: ${payload.dateRange}`,
    `Records: ${payload.total}`,
  ]
  if (payload.totalAmount != null) {
    meta.push(`Total amount: AED ${payload.totalAmount.toLocaleString()}`)
  }
  doc.text(meta.join('   |   '), margin, y)

  const rows = payload.details.slice(0, 500)
  const headers = rows.length ? Object.keys(rows[0]!) : ['info']
  const body = rows.length
    ? rows.map((row) => headers.map((h) => formatReportValue(row[h])))
    : [['No records found for this report']]

  autoTable(doc, {
    startY: y + 6,
    head: [headers.map((h) => h.charAt(0).toUpperCase() + h.slice(1))],
    body,
    styles: {
      fontSize: 8,
      cellPadding: 2,
      overflow: 'linebreak',
      textColor: [17, 17, 17],
    },
    headStyles: {
      fillColor: [17, 17, 17],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: { fillColor: [247, 246, 242] },
    margin: { left: margin, right: margin },
  })

  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(136, 136, 136)
    doc.text(
      `Passive Blessings · Confidential · Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' }
    )
  }

  const blob = doc.output('blob')
  downloadBlob(blob, safeReportFilename(payload.type, 'pdf'))
}
