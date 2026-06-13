import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({
    envVars: {
      GCP_SERVICE_ACCOUNT: process.env.GCP_SERVICE_ACCOUNT ? 'SET (length: ' + process.env.GCP_SERVICE_ACCOUNT.length + ')' : 'NOT SET',
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'NOT SET',
      FIREBASE_ADMIN_CLIENT_EMAIL: process.env.FIREBASE_ADMIN_CLIENT_EMAIL || 'NOT SET',
      FIREBASE_ADMIN_PRIVATE_KEY: process.env.FIREBASE_ADMIN_PRIVATE_KEY ? 'SET (length: ' + process.env.FIREBASE_ADMIN_PRIVATE_KEY.length + ')' : 'NOT SET',
    },
    timestamp: new Date().toISOString()
  })
}
