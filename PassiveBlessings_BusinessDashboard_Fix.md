# Passive Blessings — Business Dashboard: Emergency Fix & Complete Build Prompt

---

> ## ⚠ CRITICAL — READ BEFORE TOUCHING ANY CODE
>
> This is an **EMERGENCY FIX + EXTENSION** task. Multiple pages in the Business User
> dashboard are broken. **Do not rebuild any page from scratch.**
> Identify the root cause of each bug and fix only that.
> Then extend forms with missing fields as specified.
>
> **Confirmed broken pages from screenshots:**
> 1. `/business/opportunities/new` — vertical text rendering bug + incomplete form
> 2. `/business/offers/new` — vertical text rendering bug + missing fields
> 3. `/business/communities/new` — entire form layout crushed into narrow column
> 4. `/business/events/new` — Firestore `undefined` field crash error + missing fields
> 5. Two pages — browser-level "This page couldn't load" runtime crash
> 6. One page — `404 This page could not be found` (missing route)
>
> **Tech stack already in place:**
> - Next.js App Router
> - Firebase Admin SDK → API routes and server actions **only**
> - Firebase Client SDK → React components and frontend code **only**
> - Firestore (structured data only — no binary, no `undefined` values ever)
> - Firebase Storage (all files — images, PDFs, CVs, videos)
> - Tailwind CSS + existing Passive Blessings design system
> - Auth with `users/{uid}.role = "admin" | "member" | "business"`
> - Auth with `users/{uid}.gender = "male" | "female"`

---

## DESIGN RULES — NON-NEGOTIABLE, APPLY EVERYWHERE

```
✓ All buttons:          black background, white text (bg-black text-white)
✓ All text/headings:    render horizontally — never vertically
✓ All form containers:  full available width — never a tiny narrow column
✓ All navigation links: working, route to real pages with real data
✓ All checkboxes/radio: functional, correct checked state (black fill)
✓ No undefined values:  ever passed to Firestore
✓ No mock/static data:  all data from Firestore via real queries
```

---

## FIREBASE GOLDEN RULE — ENFORCE EVERYWHERE, NO EXCEPTIONS

```
Firestore stores ONLY:
  text, numbers, booleans, arrays, objects, timestamps,
  and Firebase Storage download URL strings

Firebase Storage holds ALL files:
  images, PDFs, CVs, videos, documents

The only correct flow:
  1. Upload file → Firebase Storage
  2. Get download URL from Storage
  3. Store that URL string in Firestore — NEVER the binary file

Firebase Admin SDK → server actions and API routes ONLY
Firebase Client SDK → React components and frontend ONLY
NEVER mix these. NEVER use Admin SDK in client components.
```

---

## GLOBAL FIXES — APPLY TO EVERY BUSINESS DASHBOARD PAGE FIRST

Before fixing individual pages, apply these fixes globally across all
business dashboard pages. These are the root causes of most crashes.

### G1 — Replace ALL `undefined` with `null` before any Firestore write

Every Firestore write (`setDoc`, `addDoc`, `updateDoc`) must sanitise
the data object first. Apply this utility to every form submission handler:

```ts
// lib/sanitize.ts — create this utility once, import everywhere
export function sanitizeForFirestore(data: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(data).map(([k, v]) => [
      k,
      v === undefined ? null : Number.isNaN(v) ? null : v
    ])
  )
}

// Usage in every form submit server action:
const clean = sanitizeForFirestore(formData)
await setDoc(ref, clean)
```

Also enable `ignoreUndefinedProperties` on the Firestore Admin instance
as a safety net. In your Firebase Admin initialization file:

```ts
const db = getFirestore(app)
db.settings({ ignoreUndefinedProperties: true }) // ADD THIS LINE
```

### G2 — Null safety on every Firestore read

Every component that reads from Firestore must handle `null`, `undefined`,
or empty snapshots without crashing:

```ts
// WRONG — crashes if snapshot is undefined
const items = snapshot.docs.map(doc => doc.data())

// CORRECT — safe fallback
const items = snapshot?.docs?.map(doc => ({ id: doc.id, ...doc.data() })) ?? []
```

Never call `.map()`, `.filter()`, or `.find()` directly on a value that
could be `undefined`. Always use `?? []` or `?? null` fallback.

### G3 — Loading states on every page

Every page that fetches Firestore data must show skeleton loaders while
loading. Never show a blank white page. Use existing skeleton components.

```tsx
if (loading) return <SkeletonLoader />   // use existing skeleton component
if (error)   return <ErrorState message="Something went wrong." onRetry={refetch} />
if (!data.length) return <EmptyState message="..." />
return <ActualContent data={data} />
```

### G4 — Error boundaries on every page

Wrap every business dashboard page in an error boundary to catch runtime
crashes instead of showing a white screen:

```tsx
// app/business/layout.tsx — add error boundary to business layout
'use client'
import { ErrorBoundary } from 'react-error-boundary'

function FallbackComponent({ error, resetErrorBoundary }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <p className="text-lg font-medium">Something went wrong.</p>
      <p className="text-sm text-gray-500">{error.message}</p>
      <button
        onClick={resetErrorBoundary}
        className="bg-black text-white px-6 py-2 rounded-lg"
      >
        Try Again
      </button>
    </div>
  )
}

export default function BusinessLayout({ children }) {
  return (
    <ErrorBoundary FallbackComponent={FallbackComponent}>
      {children}
    </ErrorBoundary>
  )
}
```

### G5 — Form layout rules for ALL business dashboard forms

Every form in the business dashboard must render with:

```
Container:      w-full max-w-2xl mx-auto px-6 py-8
Hero heading:   text-3xl font-bold (ONE horizontal line — no vertical rendering)
Hero subtitle:  text-base text-gray-500 mt-2 (normal paragraph wrapping)
Field groups:   flex flex-col gap-6
Side-by-side:   grid grid-cols-2 gap-4 (for paired fields like Price + Currency)
Labels:         block text-sm font-medium mb-1
Inputs:         w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2
Textarea:       w-full border rounded-lg px-3 py-2 min-h-[100px]
Action buttons: flex flex-row gap-3 justify-end mt-8
Primary button: bg-black text-white px-6 py-2 rounded-lg
Cancel button:  bg-white text-black border border-gray-300 px-6 py-2 rounded-lg
```

---

## FIX 1 — VERTICAL TEXT BUG

**Affects:** `/business/opportunities/new` AND `/business/offers/new`

**Confirmed from screenshots:** Both pages render hero heading and subtitle
text with each word on its own line vertically.

**Find and fix the root cause:**

```
Check 1 — writing-mode:
  Find any element with writing-mode: vertical-lr | vertical-rl | tb
  → Remove it. Set writing-mode: horizontal-tb or remove the property entirely.

Check 2 — Container too narrow:
  Check the hero section container for fixed narrow width (e.g. w-16, w-20,
  width: 80px, max-width: 100px)
  → Replace with w-full or remove fixed width entirely.

Check 3 — Flex column on text:
  Check if a parent div has display: flex + flex-direction: column where
  text elements are direct flex children
  → Wrap heading and subtitle in a <div> that is not a flex child,
    or change flex-direction to row on the parent.

Check 4 — Hardcoded \n in strings:
  Check if the heading or subtitle strings contain literal \n characters
  → Remove \n. Ensure white-space: normal on the text element.
```

**After fix, both pages must show:**

```
/business/opportunities/new:
  Heading:   "Post New Opportunity"   ← single horizontal line
  Subtitle:  "Share a job, internship, or gig with our community"
             ← normal horizontal wrapping paragraph

/business/offers/new:
  Heading:   "Post New Offer"         ← single horizontal line
  Subtitle:  "Share a product, service, or discount"
             ← normal horizontal wrapping paragraph
```

Do not change font size, weight, or color. Fix layout direction only.

---

## FIX 2 — CRUSHED FORM LAYOUT

**Affects:** `/business/communities/new`

**Confirmed from screenshot:** Entire form is crushed into an approximately
60–80px wide column. Labels overlap, inputs are tiny squares, textarea is
unreadable, "Category" and "Visibility" labels stack on top of each other.

**Find and fix the root cause:**

```
Check 1 — Form container has explicit narrow width:
  Find the <form> or card <div> wrapping the fields.
  Check for: w-16 / w-20 / w-24 / width: 80px / max-width: 80px
  → Replace with: w-full max-w-2xl mx-auto

Check 2 — Parent layout column is too narrow:
  The page layout grid/flex container that holds the form may have
  a column set to a tiny flex-basis or fixed pixel width.
  → Set the form column to flex: 1 or min-w-0 with appropriate width.

Check 3 — Tailwind grid misconfiguration:
  A grid-cols class may be placing the form in a 1-column grid where
  that column has a tiny fixed size.
  → Audit the page wrapper. Form should occupy a full readable column.

Check 4 — Same vertical text bug as Fix 1:
  The subtitle "Build a community for your business" also renders vertically.
  Apply the same fix from Fix 1 to this subtitle.
```

**After fix, the Create Community form must render:**

```
Full-width readable form — same width as /business/events/new (screenshot)
Community Name:    full-width text input
Description:       full-width textarea (min 4 rows)
Category:          full-width dropdown (not overlapping with Visibility)
Visibility:        full-width dropdown on its own row
Community Rules:   full-width textarea
Buttons row:       [Create Community] [Cancel] — horizontal, right-aligned
```

---

## FIX 3 — FIRESTORE CRASH ON EVENT CREATION

**Affects:** `/business/events/new`

**Confirmed error from screenshot:**
```
"Value for argument 'data' is not a valid Firestore document.
 Cannot use 'undefined' as a Firestore value
 (found in field 'locationPlaceId').
 If you want to ignore undefined values, enable 'ignoreUndefinedProperties'."
```

**Root cause:** The form submits the Firestore document before Google Places
Autocomplete has returned location data. `locationPlaceId`, `locationName`,
`locationAddress`, `locationLat`, `locationLng` are all `undefined` at
submission time. Firestore rejects `undefined` values.

**Fix — apply ALL of the following steps:**

**Step 1 — Sanitize location fields before submission:**
```ts
const eventData = {
  ...formData,
  locationPlaceId:  formData.locationPlaceId  ?? null,
  locationName:     formData.locationName     ?? null,
  locationAddress:  formData.locationAddress  ?? null,
  locationLat:      formData.locationLat      ?? null,
  locationLng:      formData.locationLng      ?? null,
  bannerURL:        formData.bannerURL        ?? null,
  calendarEventId:  null,
  speakers:         formData.speakers         ?? [],
  agenda:           formData.agenda           ?? [],
  tags:             formData.tags             ?? [],
  maxAttendees:     formData.maxAttendees      ?? null,
  publishedAt:      null,
}
```

**Step 2 — Apply Global Fix G1** (sanitizeForFirestore utility) to this
form's submit handler. See G1 above.

**Step 3 — Apply Global Fix G1 Step 2** (`ignoreUndefinedProperties: true`)
on the Admin Firestore instance.

**Step 4 — Fix the location input:**

The current form has two plain text inputs: "Venue Name" and "Address".
Replace these with a single **Google Places Autocomplete** input (the
Google Maps + Places API is already integrated on the platform):

```
Label:       "Event Location *"
Placeholder: "Start typing a venue or address..."

On place selection → auto-populate hidden fields:
  locationName    ← place.name
  locationAddress ← place.formatted_address
  locationPlaceId ← place.place_id
  locationLat     ← place.geometry.location.lat()
  locationLng     ← place.geometry.location.lng()

Below the autocomplete input:
  Show embedded Google Map with a pin at the selected location.
  Map updates live on each new place selection.

Keep "Venue Name" as a separate optional display field above the
autocomplete for cases where the venue name differs from the place name.
```

**Step 5 — Add form validation before submission:**
```ts
// Validate location before allowing submit
if (!formData.locationPlaceId) {
  setFieldError('location', 'Please select a location from the suggestions')
  return // prevent form submission
}
```

**Step 6 — Audit ALL other fields for undefined:**

Every field in the event document that is optional must default to
`null` or `[]`, never `undefined`:

```ts
// Firestore event document — all fields must be defined (not undefined)
{
  id: string,
  title: string,                    // required
  description: string,              // required
  bannerURL: null,                  // optional → null default
  category: string,                 // required
  tags: [],                         // optional → [] default
  genderRestriction: "mixed",       // required — default "mixed"
  speakers: [],                     // optional → [] default
  agenda: [],                       // optional → [] default
  locationName: null,               // set by Places Autocomplete
  locationAddress: null,
  locationPlaceId: null,
  locationLat: null,
  locationLng: null,
  startDate: timestamp,             // required
  endDate: timestamp,               // required
  timezone: string,                 // required
  pricingType: string,              // required
  price: null,                      // optional → null
  currency: null,                   // optional → null
  paymentGateway: null,             // optional → null
  maxAttendees: null,               // optional → null
  currentAttendees: 0,
  status: "draft",
  publishedAt: null,
  calendarEventId: null,
  isFeatured: false,
  createdBy: string,                // uid
  createdByRole: "business",
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
}
```

**Also add these missing fields to the existing form** (do not remove
existing fields — only add what is missing):

```
Missing from current form (confirmed from screenshot):

1. Event Banner upload
   - File input: JPG, PNG, WebP
   - Upload to Firebase Storage: events/{eventId}/banner.{ext}
   - Store ONLY the download URL in Firestore events/{id}.bannerURL
   - Show upload progress bar + live preview after upload
   - Display at 16:9 aspect ratio everywhere (object-fit: cover)

2. Tags multi-select chip picker
   - Options: Free | Paid | RSVP | Premium | Member Only |
     Ladies Only | Men Only | Featured | Virtual | In-Person |
     Workshop | Conference | Prayer | Outreach | Fellowship
   - Stored as string[] in events/{id}.tags

3. Speakers section (repeatable — add/remove rows)
   Each speaker entry:
     - Speaker Name (text)
     - Speaker Title / Role (text)
     - Speaker Bio (textarea)
     - Speaker Photo → Firebase Storage → store URL in speakers[].photoURL
     - Speaker Link (URL, optional)
   "+ Add Speaker" button adds new row
   "Remove" button per row

4. Agenda section (repeatable — add/remove rows)
   Each agenda item:
     - Time (time input)
     - Session Title (text)
     - Description (textarea, optional)
     - Speaker (dropdown from speakers added above)
     - Duration in minutes (number)
   "+ Add Agenda Item" button adds new row
   Drag handle for reordering

5. Max Attendees (number input, optional — blank = unlimited)

6. Timezone selector (dropdown)

7. "Save as Draft" button alongside "Create Event"
   Save as Draft → status = "draft" (not visible publicly)
   Create Event / Submit for Review → status = "pending_approval"
```

---

## FIX 4 — "THIS PAGE COULDN'T LOAD" RUNTIME CRASHES

**Affects:** Two pages in the business dashboard (browser-level crash,
white screen with warning triangle icon).

**These are likely:** `/business/leads` and `/business/referrals`
based on the sidebar links visible in screenshots. Confirm by checking
which sidebar links produce this error.

**Root cause identification — check each in order:**

```
A) Firestore query returns undefined and component calls .map() on it
   Fix: const items = snapshot?.docs?.map(...) ?? []

B) Unhandled promise rejection in useEffect or async function
   Fix: wrap in try/catch, set error state, render error UI

C) Component imports a module that doesn't exist
   Fix: verify all imports resolve to real files

D) Server component using browser-only API (window, localStorage, document)
   Fix: add 'use client' directive or move logic to useEffect

E) Missing environment variable causes Firebase init to fail silently
   Fix: verify all NEXT_PUBLIC_FIREBASE_* env vars in .env.local
        Add runtime check: if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY)
        throw new Error('Missing Firebase config')
```

**Apply Global Fix G4** (error boundary) to catch future crashes gracefully.

**Implement the actual content for each crashing page:**

### `/business/leads` — Leads & Conversions

```
Page header: "Leads & Conversions"

Stats row (fetch from Firestore leads collection where businessId = uid):
  [Total Leads]  [Converted]  [Conversion Rate %]  [Avg Value]

Filter row:
  By source type | By date range (last 7 / 30 / 90 days)

Table:
  Source Type | Date | User (if logged in) | Converted | Value | Actions

Source type badges:
  job_view → blue | offer_view → amber | profile_view → slate |
  message → purple | discount_use → green

Charts (recharts — match existing chart style):
  Line chart: daily leads over last 30 days
  Bar chart: leads by source type

Empty state:
  Icon + "No leads yet."
  "Leads are generated when members view your profile,
   listings, or opportunities."

Firestore query (client SDK, onSnapshot):
  leads collection where businessId == currentUser.uid
  ordered by createdAt descending
```

### `/business/referrals` — Referral Tracking

```
Page header: "Referrals & Commission"

Referral link section:
  Label: "Your Referral Link"
  Input (read-only): passiveblessings.com/ref/[uid]
  [Copy Link] button — black bg, white text
  On copy: show "Copied!" toast for 2 seconds

Referral % setting:
  Label: "Your referral contribution % to Passive Blessings"
  Number input (editable, saves to businesses/{uid}.referralPercent)
  [Save] button — black bg, white text

Stats row:
  [Total Referred]  [Converted]  [Pending]  [Total Commission]

Table:
  Referred User | Date | Status | Commission % | Amount | Settled

Status badges:
  Pending → amber | Converted → green | Failed → red

Chart:
  Bar chart: monthly referral conversions (last 6 months, recharts)

Empty state:
  Icon + "No referrals yet."
  "Share your referral link to start earning commissions."

Firestore query (client SDK, onSnapshot):
  referrals collection where referrerId == currentUser.uid
  ordered by referredAt descending
```

---

## FIX 5 — 404 MISSING ROUTE

**Affects:** One page in the business dashboard sidebar shows
`404 — This page could not be found`.

**Identify the missing route** by checking which of these sidebar links
produces the 404. Based on the business sidebar visible in screenshots
(Dashboard | Profile | Events | Communities | Opportunities | Offers |
Leads | Referrals | Partnerships | Member Dashboard), likely candidates:

Check and create whichever of these is missing as a Next.js page file:

### `/business/partnerships` — Partnerships & Requests

```
File: app/business/partnerships/page.tsx

Page header: "Partnerships & Requests"
Button: [+ Submit New Request] → /business/partnerships/new

Tabs: All | Pending | Under Review | Approved | Declined

Table:
  Type | Title | Submitted | Status | Admin Notes | Actions

Status badges:
  Pending → amber | Under Review → blue | Approved → green | Declined → red

Actions per row:
  Pending → View | Edit | Withdraw
  Under Review → View
  Approved → View
  Declined → View | Edit & Resubmit

Firestore query (client SDK, onSnapshot):
  partnerships collection where submittedBy == currentUser.uid

Empty state:
  Icon + "No requests submitted yet."
  "Submit a partnership, campaign, or sponsorship request."
```

### `/business/partnerships/new` — Submit Partnership Request

```
File: app/business/partnerships/new/page.tsx

Page header: "Submit a Request"
Subtitle: "Partner with Passive Blessings"

Form fields:
  Request Type (dropdown):
    Partnership | Campaign | Sponsorship | Charity Support | Event Hosting
  Title (text input, required)
  Description (rich text / textarea, required)
  Proposed Budget (text, optional — e.g. "AED 5,000–AED 10,000")
  Attachment (file upload → Firebase Storage → store URL in Firestore)
    Accept: PDF, JPG, PNG
    Storage path: partnerships/{docId}/attachment.{ext}

Action buttons: [Submit Request] [Cancel]
  Submit → write to Firestore partnerships collection:
  {
    submittedBy: uid,
    submitterName: string,
    submitterEmail: string,
    type: string,
    title: string,
    description: string,
    proposedBudget: string | null,
    attachmentURL: string | null,   // Firebase Storage URL only
    status: "pending",
    adminNotes: null,
    submittedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }
  FCM notification to admin: "New partnership request from [Business Name]"
  Redirect to /business/partnerships after submit
  Show success toast: "Request submitted successfully!"
```

---

## FIX 6 — COMPLETE THE OFFERS FORM

**Affects:** `/business/offers/new`

**Fix 1 (vertical text) is covered above. Additionally fix and extend the form.**

**Confirmed existing fields (keep exactly — do not remove):**
- Offer Title (text input)
- Type (dropdown: Product / Service / Offer)
- Category (text input)
- Description (textarea)
- Price AED (number)
- Original Price AED (number)
- Discount % (number)
- Valid Until (date picker)
- Member Benefit % (number)
- "Post Offer" button (black bg, white text ✓)
- "Cancel" button

**Add these missing fields to the existing form:**

```
After Description, add:
  Product/Service Images (multi-image upload):
    Accept: JPG, PNG, WebP
    Upload each to Firebase Storage: offers/{offerId}/images/{filename}
    Store array of download URLs in Firestore: offers/{id}.imageURLs: []
    Show thumbnail preview grid after each upload
    "Remove" button (×) on each thumbnail
    Maximum 5 images

After Member Benefit %, add:
  Member Only toggle:
    Label: "Restrict to platform members only"
    Toggle: [ ] Members Only
    Stored as offers/{id}.isMemberOnly: boolean

Add alongside "Post Offer":
  [Save as Draft] button — same styling but secondary
    On click: status = "draft" (not visible on public marketplace)
```

**Fix form submission — apply Global Fix G1 before every Firestore write:**

```ts
// All optional fields must be null (not undefined) if empty:
const offerData = sanitizeForFirestore({
  title: formData.title,
  type: formData.type,
  category: formData.category,
  description: formData.description,
  price: formData.price ?? 0,
  originalPrice: formData.originalPrice ?? null,
  discountPercent: formData.discountPercent ?? null,
  validUntil: formData.validUntil ?? null,
  memberBenefitPercent: formData.memberBenefitPercent ?? null,
  imageURLs: formData.imageURLs ?? [],
  isMemberOnly: formData.isMemberOnly ?? false,
  status: isDraft ? "draft" : "published",
  businessId: currentUser.uid,
  businessName: businessProfile.businessName,
  createdBy: currentUser.uid,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  viewCount: 0,
  purchaseCount: 0,
})
```

---

## FIX 7 — COMPLETE THE OPPORTUNITIES FORM

**Affects:** `/business/opportunities/new`

**Fix 1 (vertical text) is covered above. Additionally extend the form.**

**Confirmed existing fields (keep exactly — do not remove):**
- Opportunity Title (text input)
- Type (dropdown: Job / Internship / Gig / Volunteer / Contract)
- Category (text input)
- Description (textarea)
- Salary AED or Hourly Rate (number)
- Duration (text)
- Hours Per Week (number)
- Remote Position (checkbox)
- Requirements — one per line (textarea)
- Benefits — one per line (textarea)
- "Post Opportunity" button (black bg, white text ✓)
- "Cancel" button

**Add these missing fields after existing fields, before action buttons:**

```
Company / Organization Name (text input):
  Auto-populate from businesses/{uid}.businessName but allow editing
  Placeholder: "Your company or organization name"

Location / City (text input):
  Show only when "Remote Position" checkbox is NOT checked
  Hide/show dynamically based on Remote Position toggle
  Placeholder: "e.g. Dubai, UAE"

Role Type (radio buttons — horizontal row):
  ○ Full Time  ○ Part Time  ○ Freelance  ○ Volunteer  ○ Contract
  (maps to existing Type dropdown — replace dropdown with these radios
   OR keep dropdown and make radios a separate "Employment Type" field)

Who is this suitable for? (multi-select checkboxes — horizontal):
  ☐ Students    ☐ Graduates    ☐ Women Only    ☐ Men Only    ☐ Open to All
  Stored as: jobs/{id}.suitableFor: string[]
  If "Women Only" checked → sets genderRestriction = "female"
  If "Men Only" checked → sets genderRestriction = "male"
  Otherwise → genderRestriction = "mixed"

Application Process (radio buttons — horizontal):
  ○ CV Upload on Platform
  ○ External Link (redirect to your website)
  ○ Both
  If "External Link" or "Both" selected → show:
    Application URL (text input)
    Placeholder: "https://yourcompany.com/careers/apply"
    URL validation required

Application Deadline (date picker, optional):
  Label: "Application Deadline (optional)"
  Helper: "Leave blank for no deadline"
  Validate: date must be in the future

Your Relation to this Opportunity (radio buttons — horizontal):
  ○ Employer (I am hiring for my own business)
  ○ Connector (I am sharing an opportunity I know about)
  Stored as: jobs/{id}.posterRelation: "employer" | "connector"

Member Only toggle:
  Label: "Restrict to platform members only"
  Toggle: [ ] Members Only

Add alongside "Post Opportunity":
  [Save as Draft] button — secondary styling
```

**Firestore data model for jobs collection:**

```ts
// jobs/{jobId} — write via Firebase Admin SDK server action
{
  id: string,
  title: string,
  companyName: string,
  roleType: "full_time"|"part_time"|"freelance"|"volunteer"|"internship"|"contract",
  locationType: "onsite"|"remote"|"hybrid",
  locationCity: string | null,
  description: string,
  responsibilities: string,
  requirements: string[],
  benefits: string[],
  salary: string | null,
  duration: string | null,
  hoursPerWeek: number | null,
  suitableFor: string[],
  genderRestriction: "male"|"female"|"mixed",
  applicationProcess: "cv_upload"|"external_link"|"both",
  applicationURL: string | null,
  deadline: timestamp | null,
  posterRelation: "employer"|"connector",
  category: string,
  isMemberOnly: boolean,
  status: "draft"|"published"|"closed"|"expired",
  createdBy: string,
  businessId: string,
  businessName: string,
  businessLogoURL: string | null,
  applicationCount: 0,
  viewCount: 0,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  expiresAt: timestamp | null
}

// jobs/{jobId}/applications subcollection — write via Admin SDK
{
  applicantId: string,
  applicantName: string,
  applicantEmail: string,
  applicantGender: string,
  suitableForMatch: string[],
  cvURL: string | null,           // Firebase Storage URL ONLY — never binary
  coverLetter: string | null,
  status: "submitted"|"reviewed"|"shortlisted"|"rejected",
  appliedAt: serverTimestamp(),
  reviewedAt: null,
  notes: null
}
```

**Fix form submission:**
```ts
const jobData = sanitizeForFirestore({
  ...formData,
  locationCity: formData.locationCity ?? null,
  salary: formData.salary ?? null,
  duration: formData.duration ?? null,
  hoursPerWeek: formData.hoursPerWeek ?? null,
  applicationURL: formData.applicationURL ?? null,
  deadline: formData.deadline ?? null,
  requirements: formData.requirements ?? [],
  benefits: formData.benefits ?? [],
  suitableFor: formData.suitableFor ?? [],
  genderRestriction: formData.genderRestriction ?? "mixed",
  isMemberOnly: formData.isMemberOnly ?? false,
  businessLogoURL: businessProfile.logoURL ?? null,
  status: isDraft ? "draft" : "published",
  applicationCount: 0,
  viewCount: 0,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  expiresAt: formData.deadline ?? null,
})
```

---

## FIX 8 — PUBLIC `/opportunities` PAGE

**Wire existing UI to Firestore (do not redesign the page).**

**Confirmed from screenshot:** Page has search bar + filter tabs
(All / Job / Internship / Gig / Volunteer / Contract) + empty state.
All UI exists — it is just not connected to Firestore.

### Wire filter tabs to Firestore `jobs` collection:

```
All        → status = "published", no type filter
Job        → status = "published", roleType in ["full_time", "part_time"]
Internship → status = "published", roleType = "internship"
Gig        → status = "published", roleType = "freelance"
Volunteer  → status = "published", roleType = "volunteer"
Contract   → status = "published", roleType = "contract"
```

Real-time listener: `onSnapshot` — new jobs appear instantly.
Filter out expired: `expiresAt == null OR expiresAt >= today`.
Order: `createdAt` descending.

### Wire search bar:

Client-side filter across: `title`, `companyName`, `category`,
`locationCity`, `requirements`. Debounce 300ms.

### Job Card Design:

```
┌─────────────────────────────────────────────────────────┐
│  [Business Logo 48px circle]  [Company Name]            │
│                               [Category badge]          │
├─────────────────────────────────────────────────────────┤
│  Job Title (bold, large)                                │
│                                                         │
│  [Role Type pill]  [Location Type pill]  [City]         │
│                                                         │
│  Suitable for: [badge] [badge] [badge]                  │
│                                                         │
│  Responsibilities:                                      │
│  First 2 lines truncated with ellipsis...               │
│                                                         │
│  Requirements:                                          │
│  First 2 lines truncated with ellipsis...               │
│                                                         │
│  Salary: AED X,XXX/month  (if showSalary = true)        │
│  Deadline: [Date]  [X days remaining] badge             │
│                                                         │
│  Posted by: Employer · 2 days ago · X applied           │
├─────────────────────────────────────────────────────────┤
│  [Apply Now]                    [View Details →]        │
│  bg-black text-white            text link               │
└─────────────────────────────────────────────────────────┘
```

**Badge/pill colors:**
```
Full Time   → blue     |  Part Time  → indigo  |  Freelance → amber
Volunteer   → green    |  Internship → purple  |  Contract  → grey
Remote      → teal     |  Onsite     → slate   |  Hybrid    → cyan
Women Only  → rose     |  Men Only   → blue    |  Open      → neutral
Students    → lime     |  Graduates  → violet
```

### "Apply Now" button logic:

```
Not logged in:
  Label: "Sign in to Apply"
  On click: redirect to /sign-in?returnUrl=/opportunities

Logged in as "member":
  Enforce gates in order:
    Gate 1 — Gender:
      jobs/{id}.genderRestriction = "male" AND user.gender ≠ "male"
      → disable button, tooltip: "This opportunity is for men only"
      jobs/{id}.genderRestriction = "female" AND user.gender ≠ "female"
      → disable button, tooltip: "This opportunity is for women only"
    Gate 2 — Member gate:
      jobs/{id}.isMemberOnly = true AND user.role ≠ "member"
      → show "Members Only" badge + join prompt
    Gate 3 — All pass → open application modal:
      Fields:
        Cover letter (textarea, optional)
        CV upload (if applicationProcess = "cv_upload" or "both"):
          → Firebase Storage: applications/{jobId}/{userId}/cv.{ext}
          → Store ONLY download URL in Firestore application document
          → Show upload progress bar
        External link redirect (if applicationProcess = "external_link"):
          → Button: "Apply on Company Website →" opens applicationURL
      [Submit Application] — bg-black text-white
      On submit (server action via Admin SDK):
        Write to jobs/{jobId}/applications subcollection
        Increment jobs/{jobId}.applicationCount by 1
        FCM to business: "New application for [Job Title]"
        Toast: "Application submitted!"
        Button → "Applied ✓" (disabled state)

Logged in as "business":
  Cannot apply — show "Posted by Business" where apply button would be

Logged in as "admin":
  Show "Admin View" — no apply button
```

### Single Job Detail Page `/opportunities/[id]`:

```
Create this page if it does not exist:
app/(public)/opportunities/[id]/page.tsx

Layout:
  Company logo + name (header)
  Job title (large heading)
  All badge pills (role type, location, gender, suitable for)
  Full responsibilities (not truncated)
  Full requirements (not truncated)
  Benefits (if set)
  Salary (if showSalary = true)
  Application process details
  Deadline countdown (if set): "X days remaining" or "Deadline passed"
  Poster relation: "Posted by an Employer" or "Shared by a Connector"
  Full description (rendered)
  [Apply Now] button — same logic as card apply button
  [Share] button — copy link
  [← Back to Opportunities] link
```

---

## FIX 9 — ADMIN BUSINESSES PAGE WIRING

**Affects:** `/admin/businesses`

**Confirmed from screenshot:** Page exists, table has correct columns
(Business Name / Type / Location / Phone / Member Role / Status / Joined /
Actions) but shows "No data found" — not connected to Firestore.

**Fix — connect to Firestore `businesses` collection:**

```ts
// Server action (Admin SDK) — initial fetch
const snapshot = await adminDb.collection('businesses')
  .orderBy('createdAt', 'desc')
  .get()
const businesses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

// Client component (Client SDK) — real-time updates
const q = query(collection(db, 'businesses'), orderBy('createdAt', 'desc'))
onSnapshot(q, snapshot => {
  const businesses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  setBusinesses(businesses)
})
```

**Wire table columns to Firestore fields:**
```
Business Name  → businesses/{uid}.businessName
Type           → businesses/{uid}.category
Location       → businesses/{uid}.address
Phone          → businesses/{uid}.phone
Member Role    → businesses/{uid}.subscriptionPlan (badge: basic/standard/premium)
Status         → businesses/{uid}.subscriptionStatus
               (active = green badge | inactive = red badge)
Joined         → businesses/{uid}.createdAt (formatted: "Jan 7, 2026")
Actions        → View | Verify | Suspend | Delete
```

**Wire search bar** (already exists in screenshot):
Client-side filter across: `businessName`, `category`, `address`.

**Wire action buttons:**
```
View    → navigate to /admin/businesses/[id]
Verify  → update businesses/{uid}.isVerified = true (Admin SDK server action)
          Show "Verified" badge on the row
Suspend → update subscriptionStatus = "inactive" (Admin SDK server action)
          FCM to business owner: "Your account has been suspended"
Delete  → confirm modal → delete businesses/{uid} document (Admin SDK)
          Confirm text: "Are you sure? This cannot be undone."
```

---

## FIX 10 — ADMIN OPPORTUNITIES MONITORING

**Add "Opportunities" to admin sidebar** under COMMUNITY section.

**New page: `/admin/opportunities`**

```
Page header: "All Opportunities"
Subtitle: "Monitor all job and opportunity postings across the platform"

Stats row:
  [Total Posted]  [Published]  [Applications This Month]  [Expired]

Filter tabs:
  All | Published | Draft | Closed | Expired | Flagged

Search: "Search by title, company, or category..."

Table columns:
  Job Title    → click → /admin/opportunities/[id]
  Company      → business name
  Type         → role type badge
  Category     → badge
  Gender       → restriction badge
  Applications → count
  Posted By    → business user name
  Date Posted  → formatted
  Deadline     → date or "No deadline"
  Status       → status badge
  Actions      → View | Edit | Close | Delete | Flag

Real-time: onSnapshot on jobs collection, all documents.
Fetch via Admin SDK server action for initial load.
Client SDK onSnapshot for live updates.

Actions:
  View   → /admin/opportunities/[id]
  Edit   → admin edits any field via Admin SDK
  Close  → status = "closed", FCM to business: "Your listing has been closed"
  Delete → confirm modal → hard delete
  Flag   → isFlag = true, appears in Flagged tab
```

**New page: `/admin/opportunities/[id]` — Single job admin view:**

```
Full job detail (all fields, read-only view)
Action bar: [Edit] [Close] [Delete] [Flag]

Applications section below job detail:
  Table: Applicant | Email | Gender | Date | Status | CV | Actions
  CV: "Download CV" link (Firebase Storage URL) — link only, never binary
  Actions: Mark Reviewed | Shortlist | Reject | Add Note
  Status update → FCM notification to applicant
  Export: [Export Applications CSV] button — bg-black text-white
```

---

## ROLE ENFORCEMENT — ALL PAGES

```
ADMIN:
  Can view ALL jobs (all statuses)
  Can edit, close, delete, flag any job via /admin/opportunities
  Cannot apply to jobs
  Has access to /admin/opportunities monitoring

BUSINESS USER:
  Can post jobs via /business/opportunities/new
  Can manage own postings via /business/opportunities
  Can view applications on own jobs
  Cannot apply to jobs (businesses post — members apply)

MEMBER (general user):
  Can apply to published jobs (subject to gender + member gates)
  Can apply for volunteer roles
  CANNOT post jobs
  If member accesses /business/opportunities/new → redirect to /dashboard
  With message: "Job posting requires a business account."
```

---

## COMPLETE CHECKLIST — VERIFY EVERY ITEM AFTER IMPLEMENTATION

```
□ /business/opportunities/new  — heading renders horizontally
□ /business/opportunities/new  — subtitle renders horizontally
□ /business/opportunities/new  — all new fields added and functional
□ /business/opportunities/new  — form submits to Firestore without errors
□ /business/opportunities/new  — no undefined values in Firestore write

□ /business/offers/new         — heading renders horizontally
□ /business/offers/new         — subtitle renders horizontally
□ /business/offers/new         — image upload works (Storage URL in Firestore)
□ /business/offers/new         — form submits to Firestore without errors

□ /business/communities/new    — form renders at full width
□ /business/communities/new    — all fields readable and functional
□ /business/communities/new    — subtitle renders horizontally

□ /business/events/new         — no Firestore undefined error
□ /business/events/new         — location uses Google Places Autocomplete
□ /business/events/new         — embedded map shows on location select
□ /business/events/new         — all undefined fields default to null
□ /business/events/new         — missing fields added (banner, tags, speakers, agenda)

□ /business/leads              — page loads without crash
□ /business/leads              — data from Firestore, real-time
□ /business/leads              — empty state shows correctly

□ /business/referrals          — page loads without crash
□ /business/referrals          — referral link displays and copies
□ /business/referrals          — data from Firestore, real-time

□ /business/partnerships       — 404 resolved, page exists and loads
□ /business/partnerships/new   — form works, submits to Firestore

□ /opportunities (public)      — job cards render from Firestore
□ /opportunities (public)      — filter tabs work with real data
□ /opportunities (public)      — Apply Now button logic works end-to-end
□ /opportunities/[id]          — single job detail page exists and loads

□ /admin/businesses            — table populated from Firestore
□ /admin/businesses            — search, verify, suspend, delete all work
□ /admin/opportunities         — new page exists, all jobs visible
□ /admin/opportunities/[id]    — single job admin view works

□ All buttons                  — black background, white text
□ All forms                    — no undefined → Firestore writes
□ All pages                    — loading skeleton shown while fetching
□ All pages                    — empty state shown when no data
□ All pages                    — error state shown on Firestore failure
□ Firebase SDK split           — Admin SDK in server actions only
□ Firebase SDK split           — Client SDK in components only
□ Firebase Storage             — files stored in Storage, URLs in Firestore
```
