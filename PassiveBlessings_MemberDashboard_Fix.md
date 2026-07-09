# Passive Blessings — Member Dashboard: Emergency Fix Prompt

---

> ## ⚠ CRITICAL — READ BEFORE TOUCHING ANY CODE
>
> This is an **EMERGENCY FIX** task on the Member Dashboard at `/dashboard/*`.
> **Do not rebuild any page from scratch.**
> Fix only the root cause of each confirmed bug. Extend only where specified.
>
> ## CONFIRMED BROKEN PAGES (from screenshots — exact URLs):
>
> | # | URL | Error |
> |---|---|---|
> | 1 | `/dashboard` | "This page couldn't load" — main dashboard crashes |
> | 2 | `/dashboard/events` | "This page couldn't load" — crash |
> | 3 | `/dashboard/volunteering` | "This page couldn't load" — crash |
> | 4 | `/dashboard/donations` | "This page couldn't load" — crash |
> | 5 | `/dashboard/community/create` | Crushed narrow column + vertical text bug |
> | 6 | `/dashboard/settings` | Labels and values overlapping/colliding |
> | 7 | `/dashboard/learning` | Workshop cards render as empty white boxes |
> | 8 | `/dashboard/marketplace` | Categories exist but no products load |
> | 9 | `/dashboard/opportunities` | First tab button has no label (blank pill) |
>
> **Confirmed working pages (do NOT touch these):**
> - `/dashboard/learning` — page structure loads (filter tabs + headings visible)
> - `/dashboard/marketplace` — categories sidebar loads (Merchandise, Books, Courses, Discounts)
> - `/dashboard/opportunities` — page loads, filter tabs visible, search works
>
> **Confirmed member sidebar links (from screenshots):**
> Dashboard | My Events | My Donations | Volunteering | Charity Requests |
> Opportunities | Marketplace | Orders | Messages | Learning |
> Certificates | Membership | Settings
>
> **Tech stack already in place:**
> - Next.js App Router
> - Firebase Admin SDK → API routes and server actions ONLY
> - Firebase Client SDK → React components and frontend code ONLY
> - Firestore — structured data only (never binary, never undefined)
> - Firebase Storage — all files (images, PDFs, videos)
> - Tailwind CSS + existing Passive Blessings design system
> - Auth: `users/{uid}.role = "admin" | "member" | "business"`
> - Auth: `users/{uid}.gender = "male" | "female"`

---

## PLATFORM-WIDE DESIGN RULES — ENFORCE ON EVERY PAGE AND COMPONENT

```
These rules apply to the ENTIRE platform — not just the dashboard.
Fix every violation found, even on pages not listed above.

BUTTONS:
  All buttons across the entire platform:
    Primary action buttons → bg-black text-white
    Cancel / secondary buttons → bg-white text-black border border-gray-300
    Destructive buttons → bg-red-600 text-white
  NO exceptions. No grey primary buttons. No white primary buttons.
  Check every page in the dashboard, business dashboard, admin panel,
  and public pages. Fix any button that violates this rule.

NAVIGATION:
  All sidebar links → fully working, navigate to real pages
  All tab buttons → must have visible labels (no blank/empty pills)
  All "Back" links → navigate to the correct previous page
  Active sidebar item → black background, white text (already correct per screenshots)

CHECKBOXES & RADIO BUTTONS:
  Checked state → black fill / black border with white checkmark
  Use consistent Tailwind classes throughout

FORM LAYOUTS:
  All form containers → w-full max-w-2xl mx-auto
  All headings → render horizontally (fix any vertical text rendering)
  All fields → full width within container
  Labels above inputs, never overlapping
  No fields crushed into narrow columns

TYPOGRAPHY:
  Labels and values never overlap or collide
  Each field: label on one line, value on next line
  Sufficient padding between field groups (gap-6 minimum)

LOADING STATES:
  Every data-fetching page → show skeleton loader while loading
  Never show blank white page during load

ERROR STATES:
  Every page → show friendly error message if Firestore fails
  "Something went wrong. Please try again." + Retry button (bg-black text-white)
  Never show a browser-level crash (white screen with triangle icon)

EMPTY STATES:
  Every list/grid → show icon + descriptive message when data is empty
  Never show blank space where content should be
```

---

## GLOBAL ROOT CAUSE FIXES — APPLY FIRST TO ALL DASHBOARD PAGES

These fixes address the root causes shared across multiple crashing pages.
Apply them globally before fixing individual pages.

### ROOT CAUSE 1 — Undefined values crashing Firestore reads

Every component reading from Firestore must use safe null fallbacks:

```ts
// WRONG — crashes if snapshot or docs is undefined
const items = snapshot.docs.map(doc => doc.data())

// CORRECT — safe at every level
const items = snapshot?.docs?.map(doc => ({
  id: doc.id,
  ...doc.data()
})) ?? []
```

Apply `?? []` or `?? null` to every Firestore read result before use.
Never call `.map()`, `.filter()`, `.find()`, or `.length` on a value
that could be undefined or null without first checking.

### ROOT CAUSE 2 — Missing error boundaries causing white screen crashes

Add an error boundary to the member dashboard layout so no individual
page crash takes down the whole dashboard:

```tsx
// app/dashboard/layout.tsx — update existing layout
'use client'
import { ErrorBoundary } from 'react-error-boundary'

function DashboardErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8">
      <div className="text-4xl">⚠️</div>
      <h2 className="text-xl font-semibold">This page couldn't load</h2>
      <p className="text-gray-500 text-sm text-center max-w-sm">
        Something went wrong loading this section.
        Please try again or contact support if the problem continues.
      </p>
      <div className="flex gap-3">
        <button
          onClick={resetErrorBoundary}
          className="bg-black text-white px-6 py-2 rounded-lg text-sm"
        >
          Try Again
        </button>
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="bg-white text-black border border-gray-300 px-6 py-2 rounded-lg text-sm"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  )
}

export default function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1">
        <ErrorBoundary
          FallbackComponent={DashboardErrorFallback}
          onReset={() => window.location.reload()}
        >
          {children}
        </ErrorBoundary>
      </main>
    </div>
  )
}
```

### ROOT CAUSE 3 — Firebase environment variables not available client-side

Verify all Firebase config env vars are prefixed with `NEXT_PUBLIC_` and
present in `.env.local`. Add a runtime guard at the top of Firebase
client config:

```ts
// lib/firebase/client.ts
if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
  throw new Error(
    'Missing Firebase client config. ' +
    'Ensure all NEXT_PUBLIC_FIREBASE_* variables are set in .env.local'
  )
}
```

### ROOT CAUSE 4 — Sanitize all Firestore writes

Create this utility and import it in every form submission handler:

```ts
// lib/sanitize.ts
export function sanitizeForFirestore(
  data: Record<string, unknown>
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(data).map(([k, v]) => [
      k,
      v === undefined ? null : Number.isNaN(v as number) ? null : v
    ])
  )
}
```

Also add to Firebase Admin initialization:
```ts
db.settings({ ignoreUndefinedProperties: true })
```

### ROOT CAUSE 5 — Server components using browser APIs

Any dashboard page component that uses `window`, `localStorage`,
`document`, or `navigator` must have `'use client'` at the top.
Any component using Firebase Client SDK (auth, onSnapshot, storage)
must have `'use client'` at the top.
Audit every file under `app/dashboard/` for this issue.

---

## FIX 1 — `/dashboard` MAIN DASHBOARD — CRITICAL

**Error:** "This page couldn't load" — the main dashboard itself crashes.
This is the most critical fix. The entire member experience is blocked.

**Root cause diagnosis — check in order:**

```
Step 1: Check app/dashboard/page.tsx for:
  a) Missing 'use client' directive if using Firebase Client SDK
  b) Any .map() on data that might be undefined at first render
  c) Any import that resolves to a non-existent file
  d) Any usage of window/localStorage outside useEffect
  e) Any unhandled async/await without try/catch

Step 2: Check if the page tries to fetch multiple Firestore collections
  at once and one returns undefined, causing the whole component to crash.
  Fix: wrap each data fetch independently in try/catch

Step 3: Check if auth state is read synchronously before it's available
  Fix: use auth loading state — don't render dashboard until auth resolves
  Show skeleton loader while auth is loading
```

**Implement the main dashboard page with safe data fetching:**

```tsx
// app/dashboard/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth' // existing auth hook

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const [data, setData] = useState({
    upcomingEvents: [],
    myApplications: [],
    myDonations: [],
    recentActivity: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        // Fetch each collection independently — one failure won't crash all
        const [events, applications] = await Promise.allSettled([
          fetchUpcomingEvents(user.uid),
          fetchMyApplications(user.uid),
        ])
        setData({
          upcomingEvents: events.status === 'fulfilled' ? events.value : [],
          myApplications: applications.status === 'fulfilled' ? applications.value : [],
          myDonations: [],
          recentActivity: [],
        })
      } catch (err) {
        setError('Failed to load dashboard data.')
      } finally {
        setLoading(false)
      }
    }
    fetchDashboardData()
  }, [user])

  if (authLoading || loading) return <DashboardSkeleton />
  if (error) return <ErrorState message={error} />

  return <DashboardContent data={data} user={user} />
}
```

**Dashboard home content sections (implement all):**

```
Header:
  "Dashboard" (heading)
  "[Name] • Active member" (subheading — from users/{uid})
  Current date + time

Summary stat cards (top row):
  [Upcoming Events]  [My Applications]  [My Donations]  [Volunteer Hours]
  Each card: number pulled from Firestore, click → relevant dashboard section

Section 1 — Upcoming Events:
  Heading: "Upcoming Events"
  Show next 3 published events (gender-filtered: mixed + matching user.gender)
  Event cards: banner thumbnail, title, date, location, "View" button
  "View All Events" link → /dashboard/events

Section 2 — My Applications (jobs):
  Heading: "Recent Applications"
  Show last 3 job applications from jobs/{jobId}/applications where applicantId = uid
  Application row: job title, company, date applied, status badge
  "View All" → /dashboard/opportunities → My Applications tab

Section 3 — Quick Links:
  Grid of quick action cards:
  [Browse Jobs] [Browse Marketplace] [Volunteer] [Make Donation]
  [View Certificates] [Learning Resources] [My Communities] [Settings]
  All buttons: bg-black text-white

Section 4 — Notifications (if any):
  Fetch from notifications/{uid} subcollection, last 5
  Show as a list with dismiss button
  Empty: hide section entirely (do not show empty state for notifications)
```

---

## FIX 2 — `/dashboard/events` — CRASH

**Error:** "This page couldn't load"
**Confirmed from screenshot:** URL is `/dashboard/events`

**Fix the existing page — do not rebuild:**

```tsx
// app/dashboard/events/page.tsx
'use client'

export default function DashboardEventsPage() {
  const { user } = useAuth()
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [registeredEvents, setRegisteredEvents] = useState([])
  const [activeTab, setActiveTab] = useState<'upcoming' | 'registered'>('upcoming')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) return
    try {
      // Real-time listener for upcoming published events
      const eventsQuery = query(
        collection(db, 'events'),
        where('status', '==', 'published'),
        where('startDate', '>=', new Date()),
        orderBy('startDate', 'asc')
      )
      const unsubEvents = onSnapshot(eventsQuery, (snap) => {
        const allEvents = snap?.docs?.map(d => ({ id: d.id, ...d.data() })) ?? []
        // Gender filter: show mixed + matching gender
        const filtered = allEvents.filter(e =>
          e.genderRestriction === 'mixed' || e.genderRestriction === user.gender
        )
        setUpcomingEvents(filtered)
        setLoading(false)
      }, (err) => {
        setError('Failed to load events.')
        setLoading(false)
      })

      return () => unsubEvents()
    } catch (err) {
      setError('Failed to load events.')
      setLoading(false)
    }
  }, [user])

  // Registered events — checked separately
  // ...similar pattern for registrations subcollection

  if (loading) return <SkeletonLoader />
  if (error) return <ErrorState message={error} />

  return (/* existing page layout with tabs */)
}
```

**Page layout (match existing design):**

```
Page header: "My Events"
Subtitle: "Your upcoming and registered events"

Tabs: [Upcoming Events]  [Registered Events]
  Both tabs: bg-black text-white when active, outlined when inactive

Tab 1 — Upcoming Events:
  Fetch: events where status = "published", startDate >= now
  Auto gender-filter: show mixed + events matching user.gender
  Hide events where genderRestriction doesn't match
  Event cards: banner, title, date, location, gender badge, tags
  Register / RSVP button on each card (bg-black text-white)
  Empty state: "No upcoming events right now. Check back soon."

Tab 2 — Registered Events:
  Fetch: events where user UID exists in events/{id}/registrations subcollection
  Query: collectionGroup('registrations') where applicantId == user.uid
  OR: store registered event IDs on user profile for easier lookup
  Show: event title, date, registration status badge, payment status
  "Add to Calendar" button, "Cancel Registration" link
  Empty state: "You haven't registered for any events yet."
```

---

## FIX 3 — `/dashboard/volunteering` — CRASH

**Error:** "This page couldn't load"
**Confirmed from screenshot:** URL is `/dashboard/volunteering`

**Find the crash cause (check in order):**
```
a) Missing 'use client' directive
b) Firestore query on undefined collection reference
c) .map() on undefined volunteer data
d) Import resolving to non-existent module
```

**Implement the page with safe data fetching:**

```
Page header: "Volunteering"
Subtitle: "Give your time and skills to causes that matter"

Tabs: [Available Opportunities]  [My Volunteer History]

Tab 1 — Available Opportunities:
  Fetch: jobs collection where roleType = "volunteer", status = "published"
  Apply same gender gate as opportunities page
  Volunteer cards match job card design but with green "Volunteer" badge
  "Apply to Volunteer" button (bg-black text-white)
  Empty state: "No volunteering opportunities right now. Check back soon."

Tab 2 — My Volunteer History:
  Fetch: jobs/{jobId}/applications where applicantId = user.uid
    AND job.roleType = "volunteer"
  Show: role title, organization, date applied, hours (if tracked), status
  Empty state: "You haven't volunteered yet. Browse opportunities above."

Volunteer hours tracker (if data exists):
  Show total volunteer hours from user profile or separate tracking
  "X volunteer hours contributed" — displayed as a stat card at top

All data from Firestore via Client SDK onSnapshot
Wrap entire fetch in try/catch with error state
```

---

## FIX 4 — `/dashboard/donations` — CRASH

**Error:** "This page couldn't load"
**Confirmed from screenshot:** URL is `/dashboard/donations`
**Note:** Sidebar shows "My Donations" as the link label

**Find the crash cause — same checklist as Fix 3.**

**Implement the page:**

```
Page header: "My Donations"
Subtitle: "Your giving history and impact"

Summary stat cards:
  [Total Donated]  [Causes Supported]  [Last Donation]

Tabs: [Donation History]  [Active Charity Cases]

Tab 1 — Donation History:
  Fetch: donations collection where userId = user.uid
    ordered by createdAt descending
  Table rows:
    Cause/Charity Name | Date | Amount | Currency | Status | Receipt
  Status badges: Completed (green) | Pending (amber) | Refunded (red)
  "Download Receipt" link per row (if receiptURL exists in Firestore)
  Empty state: "No donations yet. Browse charity cases to make your first donation."
  [Browse Charity Cases] button (bg-black text-white) → /charity

Tab 2 — Active Charity Cases:
  Fetch: charityCases collection where status = "active"
    ordered by createdAt descending
  Charity case cards:
    Banner image (from Firebase Storage URL)
    Cause title, description (truncated)
    Progress bar: amount raised / goal amount
    "Donate Now" button (bg-black text-white)
  Empty state: "No active charity cases right now."

Firestore data model for donations:
  donations/{donationId}:
    userId: string
    userName: string
    userEmail: string
    charityCaseId: string | null
    charityName: string
    amount: number
    currency: string
    status: "completed" | "pending" | "refunded"
    paymentGateway: string
    paymentReference: string | null
    receiptURL: string | null    // Firebase Storage URL only
    createdAt: timestamp
```

---

## FIX 5 — `/dashboard/community/create` — CRUSHED LAYOUT + VERTICAL TEXT

**Error confirmed from screenshot:**
- URL: `/dashboard/community/create`
- Page title says "Create New Group" (not "Create Community" — this is the member's group creation)
- Form is crushed into an ~80px wide column
- All fields (Group Name, Description) are tiny
- "Create New Group" heading renders vertically (each word on own line)

**Fix A — vertical heading text (same fix pattern as business dashboard):**

```
Find the element containing "Create New Group" and its subtitle.
Check for and remove:
  writing-mode: vertical-lr / vertical-rl
  OR a parent container with fixed narrow width
  OR display: flex flex-direction: column on a text element
  OR literal \n in the heading string

After fix:
  Heading: "Create New Group"  ← single horizontal line, text-3xl font-bold
  Subtitle: "Build a group for your community"  ← normal paragraph
```

**Fix B — crushed form container:**

```
Find the form card/container. Fix its width:
  Remove any: w-16 / w-20 / w-24 / max-w-[80px] / width: 80px
  Add: w-full max-w-2xl mx-auto px-6 py-8

After fix, form must render at full readable width with:
  Group Name: full-width text input
  Description: full-width textarea, min 4 rows
  Any other fields: full-width
  [Create Group] [Cancel] buttons: horizontal row, right-aligned
  Create Group → bg-black text-white
  Cancel → bg-white text-black border
```

**Also verify this page is appropriate for members:**

Members at `/dashboard/community/create` are creating groups.
Check the page logic:
- If this page is for creating communities (not groups), update the
  title to "Create New Community" and ensure the Firestore write goes
  to the `communities` collection with `createdBy = user.uid`
- If this is for creating groups within a community, ensure it writes
  to `communities/{communityId}/groups` subcollection
- The "Back" button must navigate to the correct previous page

---

## FIX 6 — `/dashboard/settings` — OVERLAPPING LABELS AND VALUES

**Error confirmed from screenshot:**
- URL: `/dashboard/settings`
- "First" and "Last" labels overlap ("FirstLast")
- "Name" and "Name" overlap ("NameName")
- First name and last name values merge into one string ("ernestdnapo")
- Other fields (Email, Phone, Location, Bio) appear to render correctly

**Root cause:** The first name and last name fields are positioned
absolutely or using a layout that causes them to stack on top of each other
instead of side by side or one below the other.

**Fix the layout of the name fields:**

```tsx
// WRONG — absolute or overlapping positioning
<div style={{ position: 'absolute' }}>
  <label>First Name</label>
  <span>ernesto</span>
</div>
<div style={{ position: 'absolute' }}>
  <label>Last Name</label>
  <span>dnapo</span>
</div>

// CORRECT — grid layout for side-by-side, or flex column for stacked
<div className="grid grid-cols-2 gap-4">
  <div className="flex flex-col gap-1">
    <label className="text-sm text-gray-500">First Name</label>
    <span className="text-base font-medium">ernesto</span>
  </div>
  <div className="flex flex-col gap-1">
    <label className="text-sm text-gray-500">Last Name</label>
    <span className="text-base font-medium">dnapo</span>
  </div>
</div>
```

**Fix the entire settings page layout:**

```
Page header: "Personal Information" (existing — keep)

Form card layout (fix to be consistent):
  Use flex flex-col gap-6 for all field groups
  Each field group:
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-500">{label}</label>
      <p className="text-base">{value}</p>  // view mode
      OR
      <input className="w-full border rounded-lg px-3 py-2" />  // edit mode
    </div>

Name fields: side-by-side using grid grid-cols-2 gap-4
  First Name | Last Name

Full-width fields (each on own row):
  Email
  Phone
  Location
  Bio

Make settings editable:
  Add [Edit Profile] button (bg-black text-white)
  Clicking switches view mode → edit mode (inline, no page reload)
  In edit mode: all fields become text inputs
  [Save Changes] (bg-black text-white) | [Cancel] (outlined)
  On save: update users/{uid} document via server action (Admin SDK)

Additional settings sections (add below Personal Information):
  Notification Preferences:
    Toggle: Email notifications
    Toggle: Push notifications (FCM)
    Toggle: Event reminders
    Toggle: Newsletter
  
  Privacy Settings:
    Toggle: Show profile to community members
    Toggle: Show in member directory
  
  Account:
    [Change Password] link
    [Delete Account] link (red text, confirmation required)
```

---

## FIX 7 — `/dashboard/learning` — EMPTY WORKSHOP CARDS

**Error confirmed from screenshot:**
- URL: `/dashboard/learning`
- Filter tabs exist and show (All / Video / Document / Workshop) ✓
- "Learning Resources" heading shows ✓
- "Upcoming Workshops" heading shows ✓
- "Spiritual Development" workshop card exists BUT content area is empty
  (three blank white boxes where workshop sessions/content should be)

**Root cause:** The workshop card component renders a container but
the inner content (session cards, images, titles, dates) fails to load.
Either the data is undefined or the child component crashes silently.

**Fix the workshop card component:**

```tsx
// Find the WorkshopCard or WorkshopSession component
// The three empty white boxes are likely mapped from an array that is
// returning items but failing to render content

// Add null checks on every field:
{sessions?.map((session) => (
  <div key={session?.id ?? Math.random()} className="...">
    {session?.title && <h3>{session.title}</h3>}
    {session?.date && <p>{formatDate(session.date)}</p>}
    {session?.description && <p>{session.description}</p>}
    {/* Never render undefined directly */}
  </div>
)) ?? null}
```

**Wire the Learning page to Firestore:**

```
Firestore collections to read:

learningResources collection:
  Filter tabs:
    All      → fetch all where status = "published"
    Video    → where type = "video"
    Document → where type = "document"
    Workshop → where type = "workshop"

workshops collection (or events where category = "educational_workshop"):
  "Upcoming Workshops" section:
    Fetch events where category in ["educational_workshop", "spiritual_workshop"]
    AND status = "published"
    AND startDate >= now
    Order by startDate ascending

Workshop card content (fix empty boxes):
  Each workshop session card must show:
    Session title (text)
    Date + time (formatted)
    Facilitator/speaker name (if set)
    Short description (truncated to 2 lines)
    [Register] button (bg-black text-white)
    OR [Registered ✓] if already registered
  If session data is null/undefined → show skeleton, not empty white box

Learning Resources section:
  Cards for videos, documents, worksheets
  Each card:
    Thumbnail/icon based on type
    Title
    Description (truncated)
    Type badge (Video / Document / Workshop)
    [View] or [Download] button (bg-black text-white)
    File URL from Firebase Storage (for documents/videos)

Empty state per filter:
  "No [type] resources available yet."
```

---

## FIX 8 — `/dashboard/marketplace` — NOT WIRED TO FIRESTORE

**Status confirmed from screenshot:**
- URL: `/dashboard/marketplace`
- Left sidebar categories exist (All / Merchandise / Books / Courses / Discounts) ✓
- Right content area shows "No products in this category" for ALL categories

**Root cause:** The marketplace page is not connected to Firestore.
The category sidebar is hardcoded but the product fetch is broken or missing.

**Wire to Firestore — do NOT change the existing category sidebar layout:**

```tsx
// Fix the product fetch in the existing component

useEffect(() => {
  try {
    const q = selectedCategory === 'All'
      ? query(
          collection(db, 'offers'),
          where('status', '==', 'published'),
          where('isAvailable', '==', true),
          orderBy('createdAt', 'desc')
        )
      : query(
          collection(db, 'offers'),
          where('status', '==', 'published'),
          where('isAvailable', '==', true),
          where('category', '==', selectedCategory.toLowerCase()),
          orderBy('createdAt', 'desc')
        )

    const unsub = onSnapshot(q, (snap) => {
      const products = snap?.docs?.map(d => ({ id: d.id, ...d.data() })) ?? []
      setProducts(products)
      setLoading(false)
    }, (err) => {
      setError('Failed to load marketplace.')
      setLoading(false)
    })

    return () => unsub()
  } catch (err) {
    setError('Failed to load marketplace.')
    setLoading(false)
  }
}, [selectedCategory])
```

**Category mapping (wire existing sidebar labels to Firestore):**

```
Sidebar label → Firestore category field value:
  All          → no filter (fetch all published)
  Merchandise  → category = "merchandise"
  Books        → category = "books" OR "education"
  Courses      → category = "courses" OR "coaching" OR "education"
  Discounts    → isMemberDiscount = true (special filter)
```

**Product card design (render when products exist):**

```
Product card layout (grid: 3 cols desktop, 2 cols tablet, 1 col mobile):

┌─────────────────────────────────┐
│  [Product Image - 4:3 ratio]    │
│  [object-fit: cover]            │
├─────────────────────────────────┤
│  [Category badge pill]          │
│  Product Title (bold)           │
│  Business/Seller name (muted)   │
│  Description (2 lines max)      │
│  Price: AED X                   │
│  [Member Discount badge if set] │
│  [View Details] [Buy Now]       │
│  Both: bg-black text-white      │
└─────────────────────────────────┘

Image from: offers/{id}.imageURLs[0] (Firebase Storage URL)
Fallback: grey placeholder with product icon

Member Discount:
  If isMemberDiscount = true and user.role = "member":
    Show "X% OFF for Members" badge (green)
    Show discounted price alongside original (strikethrough)
  If user is not member:
    Show "Join to unlock member pricing" badge (grey)
```

**"No products in this category" empty state:**

Keep the existing empty state text. Only show it when Firestore
genuinely returns 0 results for the selected category.
Show skeleton cards while loading (not empty state during load).

---

## FIX 9 — `/dashboard/opportunities` — BLANK FIRST TAB BUTTON

**Error confirmed from screenshot:**
- URL: `/dashboard/opportunities`
- Page loads ✓
- Header "Opportunities" shows ✓
- Subtitle "Browse and apply to jobs, internships, and gigs..." shows ✓
- Two tab buttons visible but FIRST tab has NO LABEL (solid black pill, blank)
- Second tab correctly labeled "My Applications" ✓
- Filter tabs (All / Job / Internship / Gig / Volunteer / Contract) show ✓
- Search bar shows ✓
- Empty state shows ✓

**Fix the blank first tab button:**

```tsx
// Find the tab buttons component for this page
// The first tab is rendering without a label string

// WRONG — label is undefined, null, or empty string
<button className="bg-black text-white px-4 py-2 rounded-full">
  {tab.label}  {/* tab.label is undefined */}
</button>

// CORRECT — ensure label is always a string
<button className="bg-black text-white px-4 py-2 rounded-full">
  {tab.label ?? 'Browse Opportunities'}
</button>

// The correct label for the first tab should be:
// "Browse" or "All Opportunities" or "Browse Opportunities"
// Check the tab configuration object and add the missing label string
```

**The tabs should be:**

```
Tab 1: "Browse Opportunities"  ← add missing label
Tab 2: "My Applications"       ← already correct

Tab 1 content (already partially working — fix the Firestore wiring):
  Fetch: jobs collection where status = "published"
  Apply gender restriction gate (same logic as public /opportunities page)
  Render job cards (see job card design in previous prompts)
  Wire existing filter tabs (All/Job/Internship/Gig/Volunteer/Contract)
  Wire existing search bar (debounced 300ms, client-side filter)

Tab 2 content — "My Applications":
  Fetch: jobs/{jobId}/applications where applicantId = user.uid
  Use collectionGroup query:
    collectionGroup(db, 'applications')
      .where('applicantId', '==', user.uid)
      .orderBy('appliedAt', 'desc')
  
  Application list rows:
    Job title (from application or denormalized field)
    Company name
    Applied date (formatted)
    Status badge: Submitted (grey) | Reviewed (blue) | Shortlisted (green) | Rejected (red)
    CV download link (if cvURL exists — Firebase Storage URL)
    [Withdraw Application] link (if status = "submitted")
  
  Empty state: "You haven't applied to any opportunities yet."
  [Browse Opportunities] button (bg-black text-white) → switches to Tab 1
```

---

## MEMBER SIDEBAR — VERIFY ALL LINKS WORK

**Confirmed sidebar links from screenshots. Every link must route correctly:**

```
Dashboard        → /dashboard           (fix crash — Fix 1)
My Events        → /dashboard/events    (fix crash — Fix 2)
My Donations     → /dashboard/donations (fix crash — Fix 4)
Volunteering     → /dashboard/volunteering (fix crash — Fix 3)
Charity Requests → /dashboard/charity-requests  (verify this page exists)
Opportunities    → /dashboard/opportunities (fix blank tab — Fix 9)
Marketplace      → /dashboard/marketplace  (fix Firestore wiring — Fix 8)
Orders           → /dashboard/orders       (verify this page exists and loads)
Messages         → /dashboard/messages     (verify this page exists and loads)
Learning         → /dashboard/learning     (fix empty cards — Fix 7)
Certificates     → /dashboard/certificates (verify this page exists and loads)
Membership       → /dashboard/membership   (verify this page exists and loads)
Settings         → /dashboard/settings     (fix overlapping fields — Fix 6)
```

**For any sidebar link that leads to a page that doesn't exist yet,
create a placeholder page that loads without crashing:**

```tsx
// Template for any missing page
export default function PlaceholderPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-2">{PageTitle}</h1>
      <p className="text-gray-500 mb-6">{PageSubtitle}</p>
      <div className="flex items-center justify-center min-h-[40vh] border rounded-xl">
        <div className="text-center">
          <p className="text-gray-400">Coming soon</p>
        </div>
      </div>
    </div>
  )
}
```

---

## COMPLETE VERIFICATION CHECKLIST

```
Run through every item after implementation:

CRASHES FIXED:
□ /dashboard              — loads without crash, shows content
□ /dashboard/events       — loads, shows upcoming + registered tabs
□ /dashboard/volunteering — loads, shows opportunities + history
□ /dashboard/donations    — loads, shows history + charity cases
□ All pages above show skeleton loader while fetching (not blank)
□ All pages above show friendly error message if Firestore fails

LAYOUT BUGS FIXED:
□ /dashboard/community/create — heading renders horizontally
□ /dashboard/community/create — form renders at full width
□ /dashboard/settings — First Name and Last Name on separate rows/columns
□ /dashboard/settings — no overlapping labels or values anywhere

DATA WIRING FIXED:
□ /dashboard/learning — workshop cards show title, date, description
□ /dashboard/learning — learning resources load from Firestore
□ /dashboard/marketplace — products load when they exist in Firestore
□ /dashboard/marketplace — category filter works with real data
□ /dashboard/opportunities — first tab has label "Browse Opportunities"
□ /dashboard/opportunities — jobs load from Firestore in real-time
□ /dashboard/opportunities — My Applications tab loads user's applications

DESIGN RULES ENFORCED:
□ ALL primary buttons across entire platform → bg-black text-white
□ ALL secondary/cancel buttons → bg-white text-black border
□ NO primary buttons with grey, blue, or other colors
□ ALL sidebar active states → black background, white text
□ ALL tab active states → black background, white text
□ ALL form headings → render horizontally (no vertical text anywhere)
□ ALL form containers → full readable width
□ ALL loading states → skeleton loaders (not blank white screens)
□ ALL empty states → icon + descriptive message + CTA button
□ ALL error states → friendly message + Retry button (bg-black text-white)

FIREBASE RULES:
□ All Firestore reads use ?. and ?? [] null-safe patterns
□ All Firestore writes use sanitizeForFirestore utility
□ Admin SDK used ONLY in server actions and API routes
□ Client SDK used ONLY in React components
□ Firebase Storage URLs stored in Firestore — never binary data
□ ignoreUndefinedProperties: true set on Admin Firestore instance
□ Error boundary wraps entire dashboard layout
□ All NEXT_PUBLIC_FIREBASE_* env vars verified present
```
