import {
  AlignmentType,
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  BorderStyle,
} from 'docx'
import { DEFAULT_LOGO_ON_LIGHT_BG } from '@/lib/brand-assets'
import { formatReportValue } from '@/lib/reporting/loaders'
import type { ReportPayload } from '@/lib/reporting/types'
import { downloadBlob, safeReportFilename } from '@/lib/export/csv'

async function fetchLogoBytes(): Promise<Uint8Array | null> {
  try {
    const res = await fetch(DEFAULT_LOGO_ON_LIGHT_BG)
    if (!res.ok) return null
    const buffer = await res.arrayBuffer()
    return new Uint8Array(buffer)
  } catch {
    return null
  }
}

function cell(text: string, bold = false) {
  return new TableCell({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            bold,
            size: 18,
            font: 'Calibri',
          }),
        ],
      }),
    ],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: 'E4E1DA' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E4E1DA' },
      left: { style: BorderStyle.SINGLE, size: 4, color: 'E4E1DA' },
      right: { style: BorderStyle.SINGLE, size: 4, color: 'E4E1DA' },
    },
  })
}

export async function exportReportDocx(payload: ReportPayload): Promise<void> {
  const logoBytes = await fetchLogoBytes()
  const rows = payload.details.slice(0, 1000)
  const headers = rows.length ? Object.keys(rows[0]!) : ['info']

  const children: (Paragraph | Table)[] = []

  if (logoBytes) {
    children.push(
      new Paragraph({
        children: [
          new ImageRun({
            data: logoBytes,
            transformation: { width: 96, height: 96 },
            type: 'png',
          }),
        ],
      })
    )
  }

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Passive Blessings',
          bold: true,
          size: 36,
          font: 'Georgia',
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'Official Platform Report',
          size: 20,
          color: '555555',
          font: 'Calibri',
        }),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({
      text: payload.type,
      heading: HeadingLevel.HEADING_1,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: payload.description,
          size: 20,
          color: '555555',
        }),
      ],
      spacing: { after: 120 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Generated: ${new Date(payload.generatedAt).toLocaleString()}  ·  Date range: ${payload.dateRange}  ·  Records: ${payload.total}${
            payload.totalAmount != null
              ? `  ·  Total amount: AED ${payload.totalAmount.toLocaleString()}`
              : ''
          }`,
          size: 18,
          color: '666666',
        }),
      ],
      spacing: { after: 300 },
    })
  )

  const tableRows = [
    new TableRow({
      children: headers.map((h) => cell(h.charAt(0).toUpperCase() + h.slice(1), true)),
    }),
    ...(rows.length
      ? rows.map(
          (row) =>
            new TableRow({
              children: headers.map((h) => cell(formatReportValue(row[h]))),
            })
        )
      : [
          new TableRow({
            children: [cell('No records found for this report')],
          }),
        ]),
  ]

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: tableRows,
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400 },
      children: [
        new TextRun({
          text: 'Passive Blessings · Confidential',
          size: 16,
          color: '888888',
          italics: true,
        }),
      ],
    })
  )

  const doc = new Document({
    creator: 'Passive Blessings',
    title: payload.type,
    description: payload.description,
    sections: [
      {
        properties: {},
        children,
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  downloadBlob(blob, safeReportFilename(payload.type, 'docx'))
}
