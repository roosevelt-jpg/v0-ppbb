import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, getAdminBucket } from '@/lib/firebase-admin'
import { generateDonationReceipt } from '@/lib/pdf-receipt-generator'
import { uploadBufferToPath } from '@/lib/storage-server'

export async function POST(req: NextRequest) {
  try {
    const { donationId } = await req.json()

    if (!donationId) {
      return NextResponse.json({ error: 'Donation ID required' }, { status: 400 })
    }

    // Get donation details from Firestore using Admin SDK
    const db = getAdminDb()
    const donationDoc = await db.collection('donationSubmissions').doc(donationId).get()

    if (!donationDoc.exists) {
      return NextResponse.json({ error: 'Donation not found' }, { status: 404 })
    }

    const donation = donationDoc.data() as any

    // Get cause details
    const causeDoc = await db.collection('causes').doc(donation.causeId).get()
    const cause = causeDoc.data() || {}

    // Get partner details
    const partnerDoc = await db.collection('charityPartners').doc(donation.partnerId).get()
    const partner = partnerDoc.data() || {}

    // Generate PDF receipt
    const receiptBuffer = await generateDonationReceipt({
      donationId,
      donorName: donation.donorName || 'Valued Donor',
      donorEmail: donation.donorEmail || 'donor@example.com',
      amount: donation.amount,
      currency: 'AED',
      causeName: (cause as any).name || donation.causeName,
      category: (cause as any).category || 'General',
      partnerName: (partner as any).name || donation.partnerName,
      referenceNumber: donation.referenceNumber,
      verificationDate: donation.verifiedAt || new Date(),
      notes: donation.notes,
      organizationName: 'Passive Blessings',
    })

    // Upload PDF to Firebase Storage using Admin SDK
    const timestamp = new Date().getTime()
    const path = `receipts/donation_${donationId}_${timestamp}.pdf`

    const result = await uploadBufferToPath(receiptBuffer, 'application/pdf', path, {
      donationId,
      donorEmail: donation.donorEmail,
    })

    return NextResponse.json({
      success: true,
      receiptUrl: result.url,
      fileName: `donation_${donationId}_${timestamp}.pdf`,
    })
  } catch (error: any) {
    console.error('[v0] Error generating receipt:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
