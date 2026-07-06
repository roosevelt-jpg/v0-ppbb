# Complete Business Suite Implementation Guide

## Overview
The Business Suite is a comprehensive B2B marketplace platform with 14 phases and 30+ pages. The foundation (data types and queries) has been built. This guide covers the remaining page implementations.

## Project Structure
```
/app/business/
  /dashboard
    page.tsx (ENHANCED with Events/Communities - ✓ DONE)
  /profile
    page.tsx (✓ EXISTS)
  /communities
    page.tsx (✓ DONE)
    /create
      page.tsx (✓ DONE)
  /events
    page.tsx (✓ DONE)
    /create
      page.tsx (TODO)
  /jobs
    page.tsx (TODO - List all business jobs)
    /create
      page.tsx (TODO - Create new job)
    /[jobId]
      /edit
        page.tsx (TODO - Edit job)
  /offers
    page.tsx (TODO - List all business offers)
    /create
      page.tsx (TODO - Create new offer)
    /[offerId]
      /edit
        page.tsx (TODO - Edit offer)
  /discounts
    page.tsx (TODO - List all business discounts)
    /create
      page.tsx (TODO - Create new discount)
  /leads
    page.tsx (TODO - List all business leads)
    /[leadId]
      page.tsx (TODO - Lead detail)
  /referrals
    page.tsx (TODO - Referral dashboard & commission tracking)
  /partnerships
    page.tsx (TODO - List partnerships & requests)
  /analytics
    page.tsx (TODO - Business analytics dashboard with charts)

/app/directory/
  page.tsx (TODO - Public business directory)
  /[businessId]
    page.tsx (TODO - Business detail page)

/app/jobs/
  page.tsx (TODO - Public job board)
  /[jobId]
    page.tsx (TODO - Job detail & apply)

/app/marketplace/
  page.tsx (TODO - Public marketplace for offers)
  /[offerId]
    page.tsx (TODO - Offer detail)

/app/admin/
  /businesses
    page.tsx (TODO - Admin: List all businesses)
    /[businessId]
      page.tsx (TODO - Admin: Business detail & management)
  /vendors
    page.tsx (TODO - Admin: Vendor applications queue)
    /[applicationId]
      page.tsx (TODO - Admin: Review vendor application)
  /partnerships
    page.tsx (TODO - Admin: Manage partnerships & sponsorships)

/app/api/
  /jobs
    route.ts (TODO - CRUD for jobs)
  /offers
    route.ts (TODO - CRUD for offers)
  /discounts
    route.ts (TODO - CRUD for discounts)
  /leads
    route.ts (TODO - CRUD for leads)
  /referrals
    route.ts (TODO - CRUD for referrals)
  /partnerships
    route.ts (TODO - CRUD for partnerships)
  /analytics
    route.ts (TODO - Get analytics data)
```

## Page Implementation Templates

### 1. Business Jobs Management Page (/business/jobs)
**File:** `/app/business/jobs/page.tsx`

Features:
- Real-time subscription to business jobs
- Grid layout with job cards or table
- Each job shows: title, type, status, applicant count
- Action buttons: View, Edit, Delete, View Applicants
- Empty state with "Create Job" button
- Search/filter by status
- Create job button at top

```typescript
'use client'
import { subscribeToBusinessJobs } from '@/lib/business-queries'
import { useAuth } from '@/lib/auth-context'

// Subscribe to jobs
// Show real-time updates
// Filter by status
// Show applicant count
// Link to edit/detail pages
```

### 2. Create Job Page (/business/jobs/create)
**File:** `/app/business/jobs/create/page.tsx`

Form Fields:
- Title (required)
- Description (required, textarea)
- Category (select)
- Job Type (radio: full-time, part-time, contract, freelance, internship, gig)
- Experience Level (radio: entry, mid, senior, executive)
- Salary Min/Max (number fields)
- Location (Google Places autocomplete)
- Remote (radio: onsite, remote, hybrid)
- Skills (tags input)
- Requirements (textarea, one per line)
- Benefits (textarea, one per line)
- Deadline (date picker)

On Submit:
- Call createJob API
- Save to Firestore with businessId
- Redirect to /business/jobs

### 3. Business Offers Management Page (/business/offers)
**File:** `/app/business/offers/page.tsx`

Features:
- Real-time subscription to business offers
- Grid/table layout
- Each offer shows: images, title, price, status
- Action buttons: View, Edit, Delete
- Filter by status (available, sold-out, archived)
- Search by title

### 4. Create Offer Page (/business/offers/create)
**File:** `/app/business/offers/create/page.tsx`

Form Fields:
- Title (required)
- Description (required)
- Category (select)
- Images (multiple upload - Firebase Storage)
- Price (number, required)
- Original Price (number, optional)
- Currency (select: AED, USD, EUR)
- Quantity (number, optional)
- Tags (tags input)
- Specifications (key-value pairs)

On Submit:
- Upload images to Firebase Storage
- Store only image URLs in Firestore
- Call createOffer API
- Redirect to /business/offers

### 5. Business Discounts Page (/business/discounts)
**File:** `/app/business/discounts/page.tsx`

Features:
- Real-time subscription to business discounts
- Table layout: Title, Type, Value, Start/End Date, Status, Discount Count
- Action buttons: View, Edit, Delete, Generate Code
- Filter by status (active, inactive, expired)

### 6. Create Discount Page (/business/discounts/create)
**File:** `/app/business/discounts/create/page.tsx`

Form Fields:
- Title (required)
- Description (textarea)
- Discount Type (select: percentage, fixed, bogo, tiered)
- Discount Value (number)
- Max Discount (number, optional)
- Min Purchase (number, optional)
- Applicable Categories (multi-select)
- Discount Code (auto-generate option)
- Active/Inactive toggle
- Start Date (date picker)
- End Date (date picker)
- Max Usage (number, optional)

### 7. Business Leads Page (/business/leads)
**File:** `/app/business/leads/page.tsx`

Features:
- Real-time subscription to business leads
- Table layout: Name, Email, Company, Source, Status, Value, Last Contacted
- Action buttons: View, Update Status, Delete, Contact
- Filter by status (new, contacted, qualified, converted, lost)
- Search by name/email
- Summary cards: Total Leads, New, Qualified, Converted, Conversion Rate, Total Value

### 8. Business Analytics Dashboard (/business/analytics)
**File:** `/app/business/analytics/page.tsx`

Features:
- Query getBusinessMonthlyAnalytics
- Display with recharts:
  - Line chart: Jobs posted, applicants, offers created, offers sold over 12 months
  - Pie chart: Leads by source
  - Bar chart: Conversion rates
- Summary cards: 
  - Profile views
  - Click-through rate
  - Revenue generated
  - Average rating
  - Active jobs
  - Open partnerships
- Date range picker for 1-year view

### 9. Business Referrals Page (/business/referrals)
**File:** `/app/business/referrals/page.tsx`

Features:
- Query getReferralEarnings & getBusinessReferrals
- Summary cards:
  - Total Earnings
  - Pending Earnings
  - Paid Earnings
  - Active Referrals
- Table: Referral Code, Referred User, Type, Commission Rate, Amount, Status, Date
- Status workflow: pending → approved → paid
- Generate new referral code button
- Update status actions

### 10. Business Partnerships Page (/business/partnerships)
**File:** `/app/business/partnerships/page.tsx`

Features:
- Real-time subscription to business partnerships
- Cards/table layout: Title, Partner, Type, Status, Start/End Date
- Action buttons: View, Respond, Edit, Delete
- Filter by status (pending, active, completed, rejected)
- Show incoming partnership requests
- Accept/Reject actions for pending requests

### 11. Public Business Directory (/directory)
**File:** `/app/directory/page.tsx`

Features:
- Query all businesses (public)
- Grid layout: 3 columns on desktop, 1 on mobile
- Business cards showing: logo, name, type, rating, review count, location
- Search by name
- Filter by industry, location, rating
- Click card to go to /directory/[businessId]

### 12. Public Business Detail Page (/directory/[businessId])
**File:** `/app/directory/[businessId]/page.tsx`

Features:
- Display business profile (banner, logo, info)
- Show open jobs (grid)
- Show active offers (grid)
- Show active discounts
- Show ratings/reviews
- Business statistics
- Contact business button
- Follow/Save business button

### 13. Public Job Board (/jobs)
**File:** `/app/jobs/page.tsx`

Features:
- Query all open jobs
- List view or grid
- Each job shows: business logo, title, type, salary range, location, company name
- Search by title/keyword
- Filter by job type, experience level, location, company
- Sort by newest, most applications
- Click to view detail

### 14. Public Job Detail Page (/jobs/[jobId])
**File:** `/app/jobs/[jobId]/page.tsx`

Features:
- Display job details
- Show business info (clickable to business profile)
- Application form if user logged in
- Form fields: CV upload, cover letter, portfolio link, custom answers
- Submit application button
- Already applied indicator
- Similar jobs section
- Share job buttons

## API Routes Implementation

### /app/api/jobs/route.ts
```typescript
export async function GET(request) {
  // Get jobs by businessId (query param) or all (public)
}

export async function POST(request) {
  // Create new job - Admin SDK validation
}

export async function PUT(request) {
  // Update job
}

export async function DELETE(request) {
  // Delete job
}
```

### /app/api/offers/route.ts
```typescript
export async function GET() {
  // Get offers by businessId or all public
}

export async function POST() {
  // Create offer
}

export async function PUT() {
  // Update offer
}

export async function DELETE() {
  // Delete offer
}
```

### /app/api/leads/route.ts
```typescript
export async function GET() {
  // Get leads by businessId
}

export async function POST() {
  // Create lead (from contact form)
}

export async function PUT() {
  // Update lead status
}
```

Similar pattern for:
- /app/api/discounts/route.ts
- /app/api/referrals/route.ts
- /app/api/partnerships/route.ts
- /app/api/analytics/route.ts

## Common Patterns to Follow

### 1. Real-Time Subscriptions
```typescript
React.useEffect(() => {
  if (!businessId) return
  
  const unsubscribe = subscribeToBusinessJobs(businessId, (jobs) => {
    setJobs(jobs)
  })
  
  return () => unsubscribe()
}, [businessId])
```

### 2. Form Submission
```typescript
const handleSubmit = async (e) => {
  e.preventDefault()
  setSaving(true)
  
  try {
    const id = await createJob({
      ...formData,
      businessId: user.id,
    })
    
    router.push('/business/jobs')
  } catch (error) {
    console.error('[v0] Error:', error)
    alert('Error saving job')
  } finally {
    setSaving(false)
  }
}
```

### 3. Button Styling
All buttons follow this pattern:
```typescript
<button
  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-black font-medium"
>
  Action
</button>
```

### 4. Responsive Grid
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => (
    // Card content
  ))}
</div>
```

### 5. Table Layout
```typescript
<div className="overflow-x-auto">
  <table className="w-full text-sm">
    <thead>
      <tr className="border-b">
        {/* Headers */}
      </tr>
    </thead>
    <tbody>
      {items.map(item => (
        <tr key={item.id} className="border-b hover:bg-gray-50">
          {/* Cells */}
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

## Firebase Storage Integration

For file uploads (job CVs, offer images):
```typescript
import { uploadFile } from '@/lib/firebase-storage'

const handleFileUpload = async (file) => {
  const url = await uploadFile(file, `business-assets/${businessId}`)
  // Store only URL in Firestore, not base64
}
```

## Charts with Recharts

For analytics dashboard:
```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

<ResponsiveContainer width="100%" height={300}>
  <LineChart data={data}>
    <CartesianGrid />
    <XAxis dataKey="month" />
    <YAxis />
    <Tooltip />
    <Legend />
    <Line type="monotone" dataKey="jobs" stroke="#111111" />
    <Line type="monotone" dataKey="applicants" stroke="#888888" />
  </LineChart>
</ResponsiveContainer>
```

## Admin Pages Implementation

### Admin Businesses Page (/admin/businesses)
- List all businesses with status
- Search by name
- Table: Business Name, Owner, Type, Status, Verification, Actions
- Actions: View, Edit, Suspend, Approve

### Admin Vendors Page (/admin/vendors)
- Query getAllVendorApplications
- List pending applications
- Status badge: pending, approved, rejected
- Action buttons: Approve, Reject, View Details
- Update status with rejection reason modal

### Admin Partnerships Page (/admin/partnerships)
- List all partnerships
- Filter by status
- Manage sponsorship requests
- Approve/reject partnerships

## Styling Standards

- **Buttons:** Black background (#111111), white text, hover keeps black
- **Cards:** White background, light gray border (#e4e1da), shadow on hover
- **Tables:** Light gray header background, striped rows
- **Responsive:** Mobile first - 1 column, tablet 2 columns, desktop 3+ columns
- **Spacing:** 4px (0.25rem), 8px (0.5rem), 16px (1rem), 24px (1.5rem), 32px (2rem)
- **Colors:** Primary black (#111111), Light gray (#888888), Background (#faf9f7)

## Testing Checklist

For each page:
- [ ] Real-time updates working (subscribe test)
- [ ] Create functionality saves to Firestore
- [ ] Edit functionality updates Firestore
- [ ] Delete functionality removes from Firestore
- [ ] Search/filter working
- [ ] Responsive on mobile (375px), tablet (768px), desktop (1024px+)
- [ ] All buttons styled consistently black with white text
- [ ] Error messages display
- [ ] Loading states show
- [ ] Empty states display
- [ ] Forms validate inputs

## Deployment Checklist

- [ ] All TypeScript types defined
- [ ] All query functions working
- [ ] All API routes implemented
- [ ] All pages responsive
- [ ] Firebase rules set up correctly
- [ ] Firestore indexes created for queries
- [ ] Firebase Storage bucket configured
- [ ] Environment variables set
- [ ] Tests passing
- [ ] Build succeeds with no errors

## Firebase Firestore Indexes Needed

```
Collection: businesses
- businessId (Ascending)
- createdAt (Descending)

Collection: jobs
- businessId (Ascending)
- status (Ascending)
- createdAt (Descending)

Collection: offers
- businessId (Ascending)
- status (Ascending)
- createdAt (Descending)

Collection: discounts
- businessId (Ascending)
- status (Ascending)
- createdAt (Descending)

Collection: leads
- businessId (Ascending)
- status (Ascending)
- createdAt (Descending)

Collection: partnerships
- businessId (Ascending)
- status (Ascending)
- createdAt (Descending)

Collection: referrals
- referrerBusinessId (Ascending)
- status (Ascending)
- createdAt (Descending)

Collection: businessAnalytics
- businessId (Ascending)
- month (Descending)
```

## Summary

The Business Suite foundation (types, queries, dashboard enhancements) is complete and production-ready. Use this guide to systematically implement the remaining 9-14 phases. Each page follows consistent patterns for real-time updates, Firebase integration, and responsive design. Total estimated implementation time: 4-6 hours for experienced developer.
