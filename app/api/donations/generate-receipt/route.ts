import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'
import { generateDonationReceipt } from '@/lib/pdf-receipt-generator'
import { uploadBufferToPath } from '@/lib/storage-server'
import { sanitizeForFirestore } from '@/lib/firestore-utils'

export async function POST(req: NextRequest) {
  try {
    const { donationId } = await req.json()

    if (!donationId) {
      return NextResponse.json({ error: 'Donation ID required' }, { status: 400 })
    }

    const db = getAdminDb()
    const donationDoc = await db.collection('donationSubmissions').doc(donationId).get()

    if (!donationDoc.exists) {
      return NextResponse.json({ error: 'Donation not found' }, { status: 404 })
    }

    const donation = donationDoc.data() as Record<string, unknown>
    const causeId = donation.causeId ? String(donation.causeId) : ''

    let cause: Record<string, unknown> = {}
    if (causeId) {
      const caseSnap = await db.collection('charityCases').doc(causeId).get()
      if (caseSnap.exists) cause = caseSnap.data() || {}
      else {
        const legacy = await db.collection('causes').doc(causeId).get()
        if (legacy.exists) cause = legacy.data() || {}
      }
    }

    const partnerId = donation.partnerId ? String(donation.partnerId) : ''
    let partner: Record<string, unknown> = {}
    if (partnerId) {
      const partnerSnap = await db.collection('charityPartners').doc(partnerId).get()
      if (partnerSnap.exists) partner = partnerSnap.data() || {}
    }

    const donationType = donation.donationType ? String(donation.donationType) : ''
    const categoryLabel = donationType
      ? donationType.charAt(0).toUpperCase() + donationType.slice(1)
      : String(cause.category || 'General')

    const receiptBuffer = await generateDonationReceipt({
      donationId,
      donorName: String(donation.donorName || 'Valued Donor'),
      donorEmail: String(donation.donorEmail || 'donor@example.com'),
      amount: Number(donation.amount) || 0,
      currency: 'AED',
      causeName: String(cause.title || cause.name || donation.causeName || 'Cause'),
      category: categoryLabel,
      partnerName: String(partner.name || donation.partnerName || 'Partner'),
      referenceNumber: String(donation.referenceNumber || ''),
      verificationDate: (donation.verifiedAt as never) || new Date(),
      notes: donation.notes ? String(donation.notes) : undefined,
      organizationName: 'Passive Blessings',
    })

    const timestamp = Date.now()
    const path = `receipts/donation_${donationId}_${timestamp}.pdf`

    const result = await uploadBufferToPath(receiptBuffer, 'application/pdf', path, {
      donationId,
      donorEmail: String(donation.donorEmail || ''),
    })

    await donationDoc.ref.update(
      sanitizeForFirestore({
        receiptURL: result.url,
        receiptGeneratedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })
    )

    return NextResponse.json({
      success: true,
      receiptUrl: result.url,
      fileName: `donation_${donationId}_${timestamp}.pdf`,
    })
  } catch (error: unknown) {
    console.error('[generate-receipt]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Receipt generation failed' },
      { status: 500 }
    )
  }
}
