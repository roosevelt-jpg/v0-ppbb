import { seedDonationData } from '@/lib/seed-donation-data'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const result = await seedDonationData()
    return NextResponse.json({
      success: true,
      message: 'Donation data seeded successfully',
      data: result,
    })
  } catch (error) {
    console.error('[v0] Seed error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to seed data' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST to this endpoint to seed donation data',
    endpoint: '/api/seed-donation-data',
  })
}
