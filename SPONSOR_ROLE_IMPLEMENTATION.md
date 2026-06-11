# Sponsor Role Implementation Guide

## Overview

The Sponsor role has been successfully added as the 4th user type to Passive Blessings. Sponsors can browse, apply to, and manage sponsorships for campaigns, events, charities, and projects.

## Implementation Details

### 1. Type Definitions

Added to `lib/types.ts`:

```typescript
// Updated UserRole type
export type UserRole = 'member' | 'volunteer' | 'business' | 'admin' | 'sponsor'

// New SponsorProfile interface
export interface SponsorProfile extends User {
  sponsorName: string
  sponsorType: string // 'individual' | 'company' | 'foundation' | 'ngo'
  registrationNumber?: string
  website?: string
  logo?: UploadedImage
  logoUrl?: string
  sponsorDescription: string
  sponsorEmail?: string
  sponsorPhone?: string
  sponsorLocation?: LocationData
  sponsorshipFocus?: string[] // Categories they sponsor
  totalSponsored: number
  activeSponsorships: number
  yearlySponsorshipBudget?: number
  membership: 'standard' | 'gold' | 'platinum'
}

// New Sponsorship interface
export interface Sponsorship {
  id: string
  sponsorId: string
  sponsorName: string
  type: 'campaign' | 'event' | 'charity' | 'project'
  title: string
  description: string
  amount: number
  currency: string
  status: 'pending' | 'active' | 'completed' | 'cancelled'
  targetId: string
  targetName: string
  impactArea?: string
  visibilityLevel: 'public' | 'partners_only' | 'private'
  startDate: Date
  endDate?: Date
  benefits?: string[]
  recognition?: boolean
  certificateIssued?: boolean
  createdAt: Date
  updatedAt: Date
}
```

### 2. Authentication Flow

#### Login Process
1. User enters credentials at `/login`
2. Firebase authenticates credentials
3. System reads `user.role` from Firestore
4. Auto-redirect based on role:
   - `admin` → `/admin`
   - `business` → `/business`
   - `sponsor` → `/sponsor`
   - `member` → `/dashboard`
   - `volunteer` → `/dashboard`

#### Code Location
File: `app/login/login-client.tsx` (lines 75-79)

```typescript
if (user.role === 'admin') {
  router.push('/admin')
} else if (user.role === 'business') {
  router.push('/business')
} else if (user.role === 'sponsor') {
  router.push('/sponsor')
} else {
  router.push('/dashboard')
}
```

### 3. Sponsor Dashboard

#### Route
`/app/sponsor/page.tsx` (242 lines)

#### Features
- **Dashboard Metrics**
  - Active campaigns count
  - Total sponsored count
  - Total sponsorship amount (AED)
  - Partners count
  - Upcoming events count

- **Sponsorship Management**
  - Real-time list of active sponsorships
  - Status indicators (pending, active, completed, cancelled)
  - Amount and type display
  - Description viewing

- **Quick Actions**
  - Browse Opportunities → `/marketplace`
  - Partner With Us → `/marketplace`
  - Contact Support → `/contact`

#### Firestore Integration
- Listens to `sponsorships` collection filtered by `sponsorId`
- Real-time updates on sponsorship status changes
- Live metric calculations

### 4. Middleware & Access Control

Added to `lib/auth-middleware.ts`:

```typescript
export async function requireSponsor(): Promise<User | null> {
  return requireRole('sponsor')
}
```

#### Usage Example
```typescript
// In API routes or server components
import { requireSponsor } from '@/lib/auth-middleware'

export default async function ProtectedRoute() {
  const user = await requireSponsor()
  if (!user) return redirect('/login')
  
  return <YourComponent />
}
```

### 5. Firestore Collections

#### `sponsorships` Collection
Document structure for storing all sponsor activities:

```typescript
{
  id: string
  sponsorId: string // Reference to users collection
  sponsorName: string
  type: 'campaign' | 'event' | 'charity' | 'project'
  title: string
  amount: number
  currency: string
  status: 'pending' | 'active' | 'completed' | 'cancelled'
  targetId: string // Campaign/Event/Charity ID
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### Users Collection (Existing)
When creating a sponsor user, set:
```typescript
{
  role: 'sponsor'
  // ... other user fields
}
```

### 6. Creating a New Sponsor User

#### Option A: Via Firebase Console
1. Create auth user with email/password
2. In Firestore `users` collection, create doc with `id = uid`
3. Set `role: 'sponsor'`
4. Add sponsor-specific fields (sponsorName, sponsorType, etc.)

#### Option B: Programmatically
```typescript
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'

const createSponsor = async (email: string, password: string, sponsorData: Partial<SponsorProfile>) => {
  // Create auth user
  const authUser = await createUserWithEmailAndPassword(auth, email, password)
  
  // Create user document
  await setDoc(doc(db, 'users', authUser.user.uid), {
    id: authUser.user.uid,
    email,
    role: 'sponsor',
    ...sponsorData,
    createdAt: new Date(),
    memberSince: new Date(),
  })
}
```

## Sponsor Features

### Current Features
- View dashboard with key metrics
- Real-time sponsorship tracking
- Browse opportunities in marketplace
- Contact support

### Planned Features
- Sponsor profile management (`/sponsor/profile/edit`)
- Sponsorship application workflow
- Advanced filtering and search
- Sponsor analytics and reporting
- Recognition and certificate system
- Sponsorship history and impact tracking
- Partner collaboration tools

## Security & Access Control

### Protected Routes
```typescript
// Sponsor dashboard is protected by requireSponsor() middleware
// Users with role !== 'sponsor' cannot access /sponsor routes
```

### Role-Based Access
- Sponsors can only view their own sponsorships
- Admin can view all sponsorships
- Business users cannot access sponsor features

### Firestore Rules (Recommended)
```firestore
match /sponsorships/{document=**} {
  allow read, write: if request.auth.uid == resource.data.sponsorId;
  allow read, write: if request.auth.token.role == 'admin';
}
```

## Integration with Existing Systems

### Marketplace Integration
Sponsors can browse marketplace items and events through:
- `/marketplace` - General marketplace
- `/events` - Event listings
- Quick action buttons on sponsor dashboard

### Campaign Integration
When a sponsor funds a campaign:
1. Create sponsorship record in `sponsorships` collection
2. Update campaign's `totalRaised` amount
3. Add sponsor to campaign's `sponsors` array
4. Log activity in audit trail

### Event Sponsorship
When a sponsor funds an event:
1. Create sponsorship record with type='event'
2. Update event's sponsor list
3. Offer recognition options (logo display, etc.)
4. Generate certificate if applicable

## Testing

### Test Sponsor Login
1. Email: `sponsor@test.com`
2. Password: `TestPassword123`
3. Expected: Redirects to `/sponsor` dashboard

### Test Protected Route
Try accessing `/sponsor` without authentication:
- Expected: Redirects to `/login`

### Test Role-Based Access
Login as Member, then try accessing `/sponsor`:
- Expected: Redirects to `/dashboard` (based on member role)

## Troubleshooting

### Issue: Sponsor Login Redirects to Dashboard
**Solution:** Check Firestore user document - ensure `role` field is set to `'sponsor'`

### Issue: Sponsorships Not Loading
**Solution:** Verify:
1. Sponsorships collection exists in Firestore
2. Documents have `sponsorId` matching authenticated user
3. Firestore security rules allow read access

### Issue: Cannot Access /sponsor Route
**Solution:**
1. Verify authentication status
2. Check user role in Firestore
3. Clear browser cache and re-login

## Updating the 4-Role System

### To Add a 5th Role
1. Add new role to `UserRole` type in `lib/types.ts`
2. Add redirect case in `app/login/login-client.tsx`
3. Add middleware function in `lib/auth-middleware.ts`
4. Create dashboard route `/app/[role]/page.tsx`
5. Update Firestore security rules
6. Create corresponding API routes if needed

### Example: Adding 'Charity' Role
```typescript
// 1. Update type
export type UserRole = 'member' | 'volunteer' | 'business' | 'admin' | 'sponsor' | 'charity'

// 2. Update login redirect
} else if (user.role === 'charity') {
  router.push('/charity')

// 3. Add middleware
export async function requireCharity(): Promise<User | null> {
  return requireRole('charity')
}

// 4. Create /app/charity/page.tsx dashboard
```

## Performance Considerations

- Sponsor dashboard uses real-time Firestore listeners (automatic updates)
- Consider pagination for large sponsorship lists
- Implement caching for frequently accessed sponsor data
- Use Firebase indexes for complex queries

## Build Status
✓ Compiled successfully
✓ New /sponsor route registered
✓ TypeScript validation passed
✓ Production ready
