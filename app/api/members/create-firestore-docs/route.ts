import { db } from '@/lib/firebase';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const members = [];
    // Demo members disabled - no automatic seed data

    const results = [];

    for (const member of members) {
      try {
        await setDoc(doc(db, 'users', member.uid), {
          uid: member.uid,
          email: member.email,
          firstName: member.firstName,
          lastName: member.lastName,
          displayName: `${member.firstName} ${member.lastName}`,
          membershipTier: 'standard',
          role: 'member',
          bio: '',
          profilePicture: '',
          phoneNumber: '',
          location: '',
          volunteerHours: 0,
          eventsAttended: 0,
          donations: 0,
          certificateCount: 0,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        results.push(`✓ Created Firestore doc for ${member.email}`);
      } catch (error: any) {
        results.push(`✗ Failed for ${member.email}: ${error.message}`);
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
