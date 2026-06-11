import { jsPDF } from 'jspdf'
import { Timestamp } from 'firebase/firestore'

interface ReceiptData {
  donationId: string
  donorName: string
  donorEmail: string
  amount: number
  currency: string
  causeName: string
  category: string
  partnerName: string
  referenceNumber: string
  verificationDate: Timestamp | Date | string
  notes?: string
  organizationName?: string
  organizationLogo?: string
}

export async function generateDonationReceipt(data: ReceiptData): Promise<Uint8Array> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.getPageWidth()
  const pageHeight = doc.getPageHeight()
  const margin = 15
  const contentWidth = pageWidth - margin * 2

  let yPosition = margin

  // Header with logo placeholder
  doc.setFillColor(17, 24, 39) // Dark background
  doc.rect(0, 0, pageWidth, 40, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont(undefined, 'bold')
  doc.text(data.organizationName || 'Passive Blessings', margin, 20)

  doc.setFontSize(10)
  doc.setFont(undefined, 'normal')
  doc.text('TAX EXEMPT DONATION RECEIPT', margin, 28)

  yPosition = 50

  // Receipt Number and Date
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(9)
  doc.setFont(undefined, 'bold')
  doc.text('RECEIPT NUMBER:', margin, yPosition)
  doc.setFont(undefined, 'normal')
  doc.text(data.donationId, margin + 50, yPosition)

  yPosition += 7

  doc.setFont(undefined, 'bold')
  doc.text('RECEIPT DATE:', margin, yPosition)
  doc.setFont(undefined, 'normal')
  const receiptDate = data.verificationDate instanceof Timestamp
    ? data.verificationDate.toDate().toLocaleDateString()
    : new Date(data.verificationDate).toLocaleDateString()
  doc.text(receiptDate, margin + 50, yPosition)

  yPosition += 12

  // Donor Information Section
  doc.setFillColor(240, 245, 250)
  doc.rect(margin, yPosition - 5, contentWidth, 25, 'F')

  doc.setFont(undefined, 'bold')
  doc.setFontSize(10)
  doc.text('DONOR INFORMATION', margin + 3, yPosition)

  yPosition += 6
  doc.setFontSize(9)
  doc.setFont(undefined, 'normal')
  doc.text(`Name: ${data.donorName}`, margin + 3, yPosition)

  yPosition += 5
  doc.text(`Email: ${data.donorEmail}`, margin + 3, yPosition)

  yPosition += 12

  // Donation Details Section
  doc.setFillColor(240, 245, 250)
  doc.rect(margin, yPosition - 5, contentWidth, 35, 'F')

  doc.setFont(undefined, 'bold')
  doc.setFontSize(10)
  doc.text('DONATION DETAILS', margin + 3, yPosition)

  yPosition += 6
  doc.setFontSize(9)
  doc.setFont(undefined, 'normal')
  doc.text(`Cause: ${data.causeName}`, margin + 3, yPosition)

  yPosition += 5
  doc.text(`Category: ${data.category}`, margin + 3, yPosition)

  yPosition += 5
  doc.text(`Collected By: ${data.partnerName}`, margin + 3, yPosition)

  yPosition += 5
  doc.text(`Partner Reference: ${data.referenceNumber}`, margin + 3, yPosition)

  yPosition += 12

  // Donation Amount - Highlighted
  doc.setFillColor(34, 197, 94)
  doc.rect(margin, yPosition - 5, contentWidth, 20, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont(undefined, 'bold')
  doc.setFontSize(16)
  const amountText = `${data.currency} ${data.amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
  doc.text(amountText, pageWidth / 2, yPosition + 8, { align: 'center' })

  yPosition += 25

  // Tax Information
  doc.setTextColor(0, 0, 0)
  doc.setFillColor(240, 245, 250)
  doc.rect(margin, yPosition - 5, contentWidth, 30, 'F')

  doc.setFont(undefined, 'bold')
  doc.setFontSize(9)
  doc.text('TAX INFORMATION', margin + 3, yPosition)

  yPosition += 6
  doc.setFont(undefined, 'normal')
  doc.setFontSize(8)
  const taxText = `This receipt is issued for a donation made through Passive Blessings in partnership with ${data.partnerName}. 
Your donation is tax-deductible as permitted by law. For tax purposes, please retain this receipt. 
Passive Blessings is a registered charity organization.`

  doc.text(taxText, margin + 3, yPosition, { maxWidth: contentWidth - 6 })

  yPosition += 22

  // Additional Notes
  if (data.notes) {
    doc.setFont(undefined, 'bold')
    doc.setFontSize(9)
    doc.text('DONOR MESSAGE:', margin, yPosition)

    yPosition += 5
    doc.setFont(undefined, 'normal')
    doc.setFontSize(8)
    doc.text(data.notes, margin, yPosition, { maxWidth: contentWidth })

    yPosition += 15
  }

  // Footer
  yPosition = pageHeight - 20

  doc.setFillColor(17, 24, 39)
  doc.rect(0, yPosition, pageWidth, pageHeight - yPosition, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(8)
  doc.setFont(undefined, 'normal')
  doc.text('Thank you for your generosity and support!', pageWidth / 2, yPosition + 5, {
    align: 'center',
  })
  doc.text(
    `Receipt Generated: ${new Date().toLocaleDateString()} | Donation ID: ${data.donationId}`,
    pageWidth / 2,
    yPosition + 10,
    { align: 'center' }
  )

  return doc.output('arraybuffer') as Uint8Array
}
