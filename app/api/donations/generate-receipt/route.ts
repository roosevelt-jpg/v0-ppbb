import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { generateDonationReceipt } from '@/lib/pdf-receipt-generator'
import { storage } from '@/lib/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

export async function POST(req: NextRequest) {
  try {
    const { donationId } = await req.json()

    if (!donationId) {
      return NextResponse.json({ error: 'Donation ID required' }, { status: 400 })
    }

    // Get donation details from Firestore
    const donationDoc = await getDoc(doc(db, 'donationSubmissions', donationId))

    if (!donationDoc.exists()) {
      return NextResponse.json({ error: 'Donation not found' }, { status: 404 })
    }

    const donation = donationDoc.data()

    // Get cause details
    const causeDoc = await getDoc(doc(db, 'causes', donation.causeId))
    const cause = causeDoc.data() || {}

    // Get partner details
    const partnerDoc = await getDoc(doc(db, 'charityPartners', donation.partnerId))
    const partner = partnerDoc.data() || {}

    // Generate PDF receipt
    const receiptBuffer = await generateDonationReceipt({
      donationId,
      donorName: donation.donorName || 'Valued Donor',
      donorEmail: donation.donorEmail || 'donor@example.com',
      amount: donation.amount,
      currency: 'AED',
      causeName: cause.name || donation.causeName,
      category: cause.category || 'General',
      partnerName: partner.name || donation.partnerName,
      referenceNumber: donation.referenceNumber,
      verificationDate: donation.verifiedAt || new Date(),
      notes: donation.notes,
      organizationName: 'Passive Blessings',
    })

    // Upload PDF to Firebase Storage
    const timestamp = new Date().getTime()
    const fileName = `receipts/donation_${donationId}_${timestamp}.pdf`
    const fileRef = ref(storage, fileName)

    await uploadBytes(fileRef, receiptBuffer, {
      contentType: 'application/pdf',
      metadata: {
        customMetadata: {
          donationId,
          donorEmail: donation.donorEmail,
        },
      },
    })

    // Get download URL
    const downloadURL = await getDownloadURL(fileRef)

    return NextResponse.json({
      success: true,
      receiptUrl: downloadURL,
      fileName,
    })
  } catch (error: any) {
    console.error('[v0] Error generating receipt:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
