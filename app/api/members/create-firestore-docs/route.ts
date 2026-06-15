import { db } from '@/lib/firebase';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const members = [
      { uid: '0ZwvKrBr1NMGoGN94lPzUmk7J863', email: 'member1@passiveblessings.ae', firstName: 'Ahmed', lastName: 'Al-Mansouri' },
      { uid: 'xgmFmBoTsEgh7AdycAK1642aHNn2', email: 'member2@passiveblessings.ae', firstName: 'Fatima', lastName: 'Al-Zahra' },
      { uid: 'Fr1XgOmwIRarM2o1UyRf3JpKS1t1', email: 'member3@passiveblessings.ae', firstName: 'Mohammed', lastName: 'Al-Qasimi' },
      { uid: 'uplD3AlxzbTzdy4MO7BNsPemrex2', email: 'member4@passiveblessings.ae', firstName: 'Aisha', lastName: 'Al-Noor' },
      { uid: 'M6v1XCa5xUgJ1ntE41Va9LWElAu1', email: 'member5@passiveblessings.ae', firstName: 'Hassan', lastName: 'Al-Tamimi' },
    ];

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
