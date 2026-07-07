# Passive Blessings — Complete CMS Platform Fix & Upgrade Prompt

---

> ## ⚠ CRITICAL RULES — READ BEFORE TOUCHING ANY CODE
>
> **This is an UPDATE, RECONCILE, and WIRE task — NOT a rebuild.**
> Every page, block, component, and collection mentioned below already
> partially exists. Your job is to:
> 1. Find what exists → extend and fix it
> 2. Wire every UI element to Firestore/Firebase
> 3. Make every piece of content editable by admin (CMS)
> 4. Sync changes instantly across public site, member dashboard, business dashboard
> 5. Never duplicate a page, component, or collection that already exists
>
> **FIREBASE GOLDEN RULE — ENFORCE EVERYWHERE:**
> ```
> Firestore  = structured data only (text, numbers, arrays, objects, timestamps, URLs)
> Firebase Storage = ALL files (images, videos, PDFs, logos, documents)
> Flow: Upload file → Storage → get URL → store URL string in Firestore
> NEVER store binary/blob/base64 in Firestore. NEVER.
> ```
>
> **FIREBASE SDK SPLIT:**
> ```
> Admin SDK  → server actions and API routes ONLY
> Client SDK → React components and frontend ONLY
> Never mix. Never use Admin SDK in client components.
> ```
>
> **CMS RULE — ENFORCE ON EVERY SINGLE BLOCK:**
> ```
> Every piece of text, image, label, number, link, toggle, and config
> must be stored in Firestore and editable from /admin/cms/*
> Nothing is hardcoded in any component.
> Admin edits → Firestore updates → page reflects instantly (onSnapshot).
> ```
>
> **DESIGN RULES:**
> ```
> Fonts:
>   Eyebrow / small labels → Inter, UPPERCASE
>   Headlines / huge text  → Cormorant Garamond
>   Body copy              → Inter
>   Buttons                → Inter
>   Image captions         → Inter + Cormorant Garamond mixed
>
> Buttons:
>   Primary   → bg-black text-white
>   Secondary → bg-white text-black border border-gray-300
>   Danger    → bg-red-600 text-white
>   ALL buttons across entire platform — no exceptions
>
> All text renders horizontally — no vertical text anywhere
> All form containers → full readable width
> All loading states  → skeleton loaders (never blank screens)
> All empty states    → icon + message + CTA
> ```

---

## FIRESTORE CMS ARCHITECTURE

All CMS content lives in these Firestore collections.
Admin edits these. Components read from these. Nothing is hardcoded.

```
platformConfig/
  homepage        → hero, stats, mission, pillars, events section, donation banner, testimonials
  about           → hero, story, values, team
  events          → categories, tags, commission %, labels, calendar config
  marketplace     → page text, membership pricing, benefits
  partners        → page text, tracks, inquiry block, sponsorship deck URL
  donations       → page text, charity partner links, Beit Al Khair URL
  shop            → page text, donate-via-purchase banner
  volunteer       → page text, form link, pillar options
  navigation      → navbar links, footer links, social links
  fonts           → font selections (already defined above — store for CMS override)
  globalSettings  → WhatsApp link, platform name, contact email, address, phone

partners/           → partner/sponsor logos and names (marquee)
testimonials/       → video or text testimonials (up to 10)
teamMembers/        → team member profiles (name, title, photo, bio)
charityCases/       → admin-created donation causes
donations/          → donation records
beneficiaryRequests/ → charity support applications
jobs/               → all job/opportunity listings
businesses/         → business profiles
events/             → all events
offers/             → marketplace listings
communities/        → communities and groups
```

---

## PART 1: GLOBAL PLATFORM FIXES

### 1A — FONT SYSTEM (apply platform-wide)

Find and update the global CSS / Tailwind config to use these fonts.
Load both from Google Fonts. Do not use local files.

```css
/* globals.css or layout.tsx */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&display=swap');

/* Apply globally: */
--font-headline: 'Cormorant Garamond', serif;
--font-body:     'Inter', sans-serif;

/* Tailwind custom classes to create: */
.font-headline { font-family: var(--font-headline); }
.font-body     { font-family: var(--font-body); }
.eyebrow       { font-family: var(--font-body); font-size: 0.75rem;
                 letter-spacing: 0.15em; text-transform: uppercase; }
```

Apply across every page:
- All `<h1>`, `<h2>` → Cormorant Garamond
- All eyebrow labels → Inter uppercase
- All body text, buttons, captions → Inter
- Image captions → Inter + Cormorant Garamond italic mixed

### 1B — AUTH FIX: Return to Public Pages After Sign-in

After signing in, users are trapped in the dashboard and cannot return
to public pages. Fix this:

```tsx
// After successful login:
// 1. Check if returnUrl exists in query params → redirect there
// 2. Otherwise redirect based on role:
//    admin   → /admin
//    business → /business/dashboard
//    member  → /dashboard
//    (no role) → /

// Navbar must show:
// Not logged in: Sign in | Join now
// Logged in:     Dashboard link + Sign out
// Public pages (/events, /marketplace, /opportunities etc.)
// must remain accessible when logged in — never force-redirect to dashboard
```

### 1C — NAVIGATION CMS

All navbar links must come from Firestore `platformConfig/navigation`.
Admin can reorder, rename, add, remove links from `/admin/cms/navigation`.

```
Current public navbar links:
  About us | Impact | Events | Marketplace | Opportunities | Contact

Required changes:
  Rename "Contact" → "Partners"
  Ensure all links are working and route correctly

Navbar CMS fields (platformConfig/navigation):
  links: [{ label, href, order, isVisible }]
  ctaButton: { label: "Join now", href: "/join" }
  signInLabel: "Sign in"
  whatsappLink: string  // WhatsApp channel URL
```

### 1D — WHATSAPP FLOATING BUTTON

Add a WhatsApp icon button that appears on every public page.
Position: fixed bottom-right (above any chat widget).
Link: `platformConfig/globalSettings.whatsappLink`
Admin sets the WhatsApp channel URL from `/admin/cms/global-settings`.

```tsx
// WhatsAppButton component
// renders: circular green button, WhatsApp icon, fixed bottom-right
// href: opens whatsappLink in new tab
// Show on: all public pages (homepage, events, marketplace, etc.)
// Hide on: dashboard pages and admin pages
```

---

## PART 2: HOMEPAGE — FULL CMS WIRING

All homepage content lives in `platformConfig/homepage` Firestore document.
Every section below is editable from `/admin/cms/homepage`.
Changes appear instantly on the public homepage via `onSnapshot`.

### 2A — HERO SECTION (Block 1)

**Layout:** Two-column — text left, image right (match reference design in PDF).

**CMS fields (platformConfig/homepage.hero):**
```js
{
  eyebrow: "ESTD 2025 — A MOVEMENT, NOT JUST A CHARITY",
  headline: "Building a purpose-driven community.",
  body: "Through charity, growth and connection, Passive Blessings is UAE's leading impact led community who want to do more than donate. We act, build and rise together.",
  imageURL: string,          // Firebase Storage URL
  imageCaption: "COMMUNITY LED since day one.",
  buttons: [
    { label: "Join the community ↗", href: "/join", style: "primary" },
    { label: "Donate", href: "/donate", style: "secondary" },
    { label: "See events →", href: "/events", style: "text" }
  ]
}
```

**"Join the Community" button** → links to `/join` (member signup page).
**Image** → uploaded from admin CMS, stored in Firebase Storage, URL in Firestore.
**Caption** → Inter uppercase + Cormorant Garamond italic for "since day one."

### 2B — STATS BAR (Block 2)

**Layout:** Horizontal row of 4 large numbers with small uppercase labels.
Match the reference design — no boxes or borders, just numbers and labels.

**CMS fields (platformConfig/homepage.stats):**
```js
{
  displayMode: "static",    // "static" = show override numbers | "live" = show Firestore counts
  items: [
    { number: "156,000+", label: "MEALS SERVED" },
    { number: "3,000+",   label: "COMMUNITY MEMBERS" },
    { number: "50+",      label: "EVENTS HOSTED" },
    { number: "1M AED",   label: "FUND RAISED" }
  ]
}
```

Admin toggles `displayMode`:
- `"static"` → show the override numbers above (display until real data matches)
- `"live"` → show real counts from Firestore (members count, events count, donations sum)

Animated count-up on scroll into view.

### 2C — PARTNERS MARQUEE (Block 3 — NEW)

**Horizontal scrolling logo marquee** showing partner/sponsor logos.
Loops continuously right-to-left. Smooth CSS animation, no JS library required.

**Firestore collection: `partners/`**
```js
// partners/{partnerId}
{
  id: string,
  name: string,
  logoURL: string,         // Firebase Storage URL — logo image
  websiteURL: string | null,
  type: "sponsor" | "partner" | "charity" | "government" | "corporate" | "grassroots",
  isActive: boolean,       // show/hide in marquee
  order: number,           // sort order in marquee
  createdAt: timestamp,
  addedBy: string          // admin UID
}
```

**Admin page: `/admin/partners`**
- Table: Logo preview | Name | Type | Active toggle | Order | Actions
- "Add Partner" button → upload logo (Firebase Storage), fill name, type, URL, order
- Edit / Delete per row
- Active toggle → instantly shows/hides in marquee
- Logo upload: accepts PNG, SVG, WebP — stores in Firebase Storage, URL in Firestore
- Drag-to-reorder for marquee sequence

**Public marquee component:**
```tsx
// Fetch partners where isActive = true, ordered by order asc
// onSnapshot for real-time — new logos appear without page refresh
// CSS marquee: duplicate the list for seamless loop
// Each logo: <img src={partner.logoURL} alt={partner.name} />
// Clicking a logo → opens partner.websiteURL in new tab (if set)
// Speed and gap configurable from CMS: platformConfig/homepage.marquee.speed
// Show on: Homepage (after hero or after stats bar), Partners page

// Default partners to seed (from PDF):
// Beit Al Khair, PRO.PT, 1416 Fourteen Sixteen, BCMK Law, Barnies,
// Blade Barbers, COCO, Collective365, Condo City, Creative Word,
// Delargy, Dream Fade, DWS Marketing, Eatro, Emirfx, KAYANA,
// Legal Cover, One Investment, OTR Autos, W.O.T, XSEED,
// SMK Holy Smokd, TOP Challenger, SBK Real Estate, Pangea,
// Public Cook, Nishe, L Dubai
// (Add these as text-only cards until logos are uploaded by admin)
```

### 2D — MISSION BLOCK (Block 4)

**CMS fields (platformConfig/homepage.mission):**
```js
{
  eyebrow: "OUR MISSION",
  headline: "We are not a charity that simply collects. We are a community that builds.",
  headlineItalicWord: "community",   // this word renders in Cormorant Garamond italic
  body: "Passive Blessings exists to turn intention into action. Six interconnected pillars — community, charity, enterprise, spirituality, partnerships and merchandise — make giving and growing a way of life, not an annual gesture.",
  imageURL: string | null   // community image block
}
```

### 2E — SIX PILLARS BLOCK (Block 5)

**CMS fields (platformConfig/homepage.pillars):**
```js
{
  eyebrow: "SIX PILLARS",
  headline: "How we move.",
  items: [
    {
      number: "01",
      title: "Events & Community",
      description: "Sisters, brothers, mixed and family gatherings — every week.",
      imageURL: string,      // Firebase Storage URL
      ctaLabel: "EXPLORE ↗",
      ctaHref: "/events"
    },
    {
      number: "02",
      title: "Charity & Welfare",
      description: "2,000 weekly meals, Umrah sponsorship, orphan support and more.",
      imageURL: string,
      ctaLabel: "EXPLORE ↗",
      ctaHref: "/donate"
    },
    {
      number: "03",
      title: "Enterprise & Marketplace",
      description: "A directory and marketplace for member-owned businesses.",
      imageURL: string,
      ctaLabel: "EXPLORE ↗",
      ctaHref: "/marketplace"
    },
    {
      number: "04",
      title: "Spiritual & Personal Growth",
      description: "Weekly sessions, revert support, articles and recordings.",
      imageURL: string,
      ctaLabel: "EXPLORE ↗",
      ctaHref: "/events?category=spiritual_workshop"
    },
    {
      number: "05",
      title: "Partnerships",
      description: "Government, corporate and grassroots collaborations.",
      imageURL: string,
      ctaLabel: "EXPLORE ↗",
      ctaHref: "/partners"
    },
    {
      number: "06",
      title: "Merchandise",
      description: "Purpose-driven products. Every purchase fuels a cause.",
      imageURL: string,
      ctaLabel: "EXPLORE ↗",
      ctaHref: "/shop"
    }
  ]
}
```

Admin can edit every field, reorder pillars, update images, change CTAs.
Images uploaded to Firebase Storage → URL stored in Firestore.
Layout: 3-column grid desktop, 1-column mobile.

### 2F — UPCOMING EVENTS BLOCK (Block 6)

**Fix the broken events block — wire to Firestore:**

```tsx
// Fetch from events collection:
//   status = "published"
//   startDate >= now()
//   limit: 3-6 (configurable from CMS)
//   ordered by startDate ascending
// onSnapshot for real-time

// Event card shows:
//   Banner image (16:9, object-fit cover, from Firebase Storage URL)
//   Category badge (colour-coded)
//   Gender restriction badge (♂/♀/⚥)
//   Event name (Cormorant Garamond)
//   Date + Time
//   Location name
//   Tag pills
//   [Register] button (bg-black text-white)

// CMS fields (platformConfig/homepage.eventsSection):
{
  heading: "Upcoming Events",
  subheading: "Join our community and participate in meaningful events",
  maxEventsToShow: 6,
  ctaLabel: "View All Events →",
  ctaHref: "/events"
}

// Empty state (no published events):
//   Show the heading and a message: "Events coming soon. Check back shortly."
//   Never show a broken empty block — always render the section
```

### 2G — DONATION + VOLUNTEER BANNER (Block 7)

**CMS fields (platformConfig/homepage.donationBanner):**
```js
{
  eyebrow: "GET INVOLVED",
  headline: "Charity is the door. Community is the home.",
  body: "Whether you donate, volunteer or simply show up — every blessing compounds. Pick how you want to begin.",
  backgroundColor: "#1a1a1a",   // dark background
  textColor: "#ffffff",
  buttons: [
    { label: "Volunteer", href: "/volunteer", style: "primary" },
    { label: "Donate", href: "/donate", style: "secondary" },
    { label: "Contact us →", href: "/partners", style: "text" }
  ]
}
```

### 2H — SOCIAL BLOCKS (Block 8 — YouTube + Instagram)

Add placeholder blocks for YouTube and Instagram feeds.
Show a "Coming soon — social feeds will appear here" state.
Admin will provide API credentials on a live call.
Build the component shell with a CMS toggle to enable/disable each feed.

```js
// platformConfig/homepage.socialFeeds
{
  youtube: {
    isEnabled: false,
    channelId: null,
    apiKey: null,
    maxVideos: 6,
    heading: "Watch Our Story"
  },
  instagram: {
    isEnabled: false,
    accessToken: null,
    maxPosts: 9,
    heading: "Follow Along"
  }
}
```

### 2I — TESTIMONIALS BLOCK (Block 9)

**Firestore collection: `testimonials/`**
```js
// testimonials/{id}
{
  id: string,
  type: "video" | "text",
  name: string,
  role: string | null,         // e.g. "Community Member"
  quote: string,               // text testimonial content
  videoURL: string | null,     // Firebase Storage URL for video upload
  avatarURL: string | null,    // Firebase Storage URL
  isActive: boolean,
  order: number,
  createdAt: timestamp
}
```

**Admin page: `/admin/cms/testimonials`**
- Add up to 10 testimonials (enforce max 10 limit)
- For each: choose Text or Video type
- Video: upload to Firebase Storage → store URL
- Text: name, role, quote
- Active toggle, drag-to-reorder

**Public display:**
- Carousel/slider (max 10 items)
- Video testimonials: embedded player
- Text testimonials: blockquote with name and role
- CMS heading from `platformConfig/homepage.testimonials.heading`

---

## PART 3: ABOUT PAGE — FULL CMS WIRING

All about page content lives in `platformConfig/about`.
Admin edits from `/admin/cms/about`.

### 3A — HERO SECTION

```js
// platformConfig/about.hero
{
  eyebrow: "ABOUT",
  headline: "A movement built on intention, action and one another.",
  body: "Passive Blessings began with a simple idea: that quiet, consistent good done together compounds into something extraordinary."
}
```

### 3B — STORY BLOCK

```js
// platformConfig/about.story
{
  eyebrow: "OUR STORY",
  founderImageURL: string,    // Firebase Storage URL — image of Yusef
  founderImageAlt: "Yusef Bouattoura, Founder",
  paragraphs: [
    "Founded in 2025 by Yusef Bouattoura, Passive Blessings was born from a frustration and a vision. The frustration: charity that begins and ends with a transaction. The vision: a community where giving, growing and gathering are inseparable.",
    "What started as weekly meal distributions has grown into a six-pillar ecosystem touching thousands of lives. Sisters meet for halaqa. Brothers mentor one another. Entrepreneurs find their first customers. Reverts find their first family."
  ],
  pullQuote: "We are not building an organisation. We are building a way of life. Another day Another Blessing"
}
```

### 3C — VALUES BLOCK

```js
// platformConfig/about.values
{
  eyebrow: "WHAT MAKES US DIFFERENT",
  headline: "Not just charity. A community engine.",
  differentiators: [
    {
      number: "01",
      title: "Community-led",
      description: "Decisions and direction emerge from the people we serve — not from a boardroom."
    },
    {
      number: "02",
      title: "Action-based",
      description: "We measure success in meals served, members supported and lives moved — not pledges."
    },
    {
      number: "03",
      title: "Six pillars, one mission",
      description: "Charity is the gateway. Brotherhood, sisterhood, enterprise and spirituality are the home."
    }
  ],
  valuesHeading: "Our Values",
  values: [
    { title: "Community First", description: "Building strong, inclusive communities where every voice matters" },
    { title: "Integrity", description: "Operating with transparency, honesty, and accountability" },
    { title: "Impact", description: "Creating measurable positive change in society" },
    { title: "Collaboration", description: "Working together across differences to achieve shared goals" },
    { title: "Empowerment", description: "Enabling individuals and businesses to reach their potential" },
    { title: "Sustainability", description: "Building long-term solutions for community challenges" }
  ]
}
```

### 3D — TEAM BLOCK

**Firestore collection: `teamMembers/`**
```js
// teamMembers/{id}
{
  id: string,
  name: string,
  title: string,
  photoURL: string | null,    // Firebase Storage URL — from Drive link in PDF
  bio: string | null,
  order: number,
  isActive: boolean,
  createdAt: timestamp
}
```

**Seed these 7 team members:**
```
Yusef Bouattoura    — Founder & Chief Executive Officer
Dontai Anton        — Chief Operating Officer
Maimuna Rashid      — Director of Strategy & Partnerships
Arwa Abboud         — Director of Community Programs (Sisters)
Rhys Marshall       — Director of Community Programs (Brothers)
Abbey Potts         — Director of Spiritual Growth & Personal Development
Dounia H            — Director of Admin, Finance & Compliance
```

**Admin page: `/admin/cms/team`**
- Add/edit/delete/reorder team members
- Photo upload → Firebase Storage → URL in Firestore
- Fallback: initials avatar (first letter of first + last name)

**Public display:**
- Eyebrow: "LEADERSHIP"
- Headline: "The team."
- 3-column grid (desktop), 1-column (mobile)
- Each card: photo (or initials), name (bold), title (uppercase small)

---

## PART 4: EVENTS PAGE — RECONCILE AND FIX

### 4A — PAGE TEXT (CMS)

```js
// platformConfig/events.pageConfig
{
  eyebrow: "COMMUNITY EVENTS & WORKSHOPS",
  headline: "Where the community comes alive.",
  body: "Every week, we gather. Charity days, sisters circles, brothers nights, family days and mixed events — there is always a space for you.",
  whatsappButtonLabel: "Join our WhatsApp Channel",
  whatsappLink: string   // links to globalSettings.whatsappLink
}
```

### 4B — CALENDAR + LINEUP VIEW

The existing events page already has calendar and lineup.
Fix the following (do not rebuild):

```
1. Wire calendar event dots to Firestore — colour by category from platformConfig/events.categories
2. Wire event lineup cards to Firestore events collection (status = "published")
3. Both views must show real events — not empty states when events exist
4. Filter tabs (ALL / SISTERS / BROTHERS / MIXED / FAMILY) must filter Firestore query
5. "APRIL LINEUP / X events this month" must be dynamic — month from calendar state, count from Firestore
6. All text on this page (headings, labels) must come from platformConfig/events.pageConfig
7. Event cards must show all required fields: image, name, date, time, location, category, gender badge, tags, pricing, Register button, Details link
```

### 4C — ADMIN EVENTS BACKEND FIXES

```
Critical fixes (do not rebuild — fix existing):

1. PUBLISH FIX:
   Events created in admin with status = "published" are NOT appearing
   on the live frontend. Fix the Firestore query in the public events page
   to correctly fetch published events. Check: is it querying the right
   collection? Is status field being set correctly on save?

2. EYE ICON FIX:
   The preview (eye) icon on event rows does nothing.
   Fix: clicking eye → navigate to /admin/events/[id]/preview
   Preview renders the full public event page layout in preview mode.

3. APPROVAL QUEUE:
   When business users submit events, they appear with status = "pending_approval"
   in the admin events list under the "Pending Approval" tab.
   Admin can: Preview | Edit | Approve & Publish | Request Changes | Reject
   Approving sets status = "published" and event appears on frontend instantly.

4. STATS COLOUR FIX:
   Community Management stats (Community Members, Published Events, etc.)
   have text colour that is invisible against the dark background.
   Fix: set all stat numbers and labels to text-white on dark backgrounds.

5. GROUPS SECTION:
   "+Create Group" button currently throws an error — fix it.
   Group cards must show: group image, name, member count, join button.
   If admin approval required: join button shows "Pending Approval" after clicking.
   Remove the "Activities" tab — it is empty and not needed.
   Add a "Chat / Messages" section where admin can see group conversations.

6. GROUP INSIDE EXPERIENCE:
   Inside a group → show a chat/forum interface:
   Members can post messages, reply to others, share images.
   Admin can pin posts, delete posts, remove members.
   Business owners can approve/reject members for groups they created.
```

### 4D — MEMBER PERMISSIONS FIX (Events)

```
WHO CAN CREATE EVENTS:
  Admin          → Yes, publishes immediately
  Business User  → Yes, goes to pending_approval queue
  Basic Member   → NO — remove event creation from member dashboard

WHO CAN JOIN GROUPS:
  All members → Yes (subject to gender restriction)
  Joining shows "Join Chat" button once inside group

WHO CAN APPROVE GROUP MEMBERS:
  Admin → Yes (all groups)
  Business Owner → Yes (only for groups they created)
  Basic Member → NO — remove approval features from basic member dashboard
```

---

## PART 5: MARKETPLACE PAGE — RECONCILE AND FIX

### 5A — PAGE TEXT (CMS)

```js
// platformConfig/marketplace.pageConfig
{
  eyebrow: "ENTERPRISE & MARKETPLACE",
  headline: "Where halal business and community meet.",
  body: "Our marketplace and directory exist to help member-owned businesses find customers, mentors and opportunity inside their own community.",
  membershipEyebrow: "MEMBERSHIP",
  membershipHeadline: "AED 300 / month.",
  membershipBody: "Our membership unlocks the full enterprise pillar — directory listing, booth priority, networking events, discounts and direct support from our team.",
  membershipCTA: "Become a member",
  membershipCTAHref: "/join?type=business",
  benefitsEyebrow: "BENEFITS",
  benefitsHeadline: "Built for builders.",
  benefits: [
    { title: "Discounts", description: "Member-only pricing across the directory of community-owned businesses." },
    { title: "Exposure", description: "Featured placement, social spotlights and event booth opportunities." },
    { title: "Networking", description: "Monthly business circles, mentorship and curated introductions." }
  ],
  membershipImageURL: string   // Firebase Storage URL — market/bazaar image
}
```

### 5B — MARKETPLACE AS BUSINESS DIRECTORY

Fix the public marketplace to display **business directory cards** (not just product listings):

```
Business directory card shows:
  Business logo (circular, from businesses/{id}.logoURL)
  Business Name (bold)
  One-line description
  Member/owner name
  Services offered (tags)
  Active jobs count (if any)
  Active sales/offers count (if any)
  PB member discount badge (if isMemberDiscount offers exist)
  [Learn More / Support] button → /directory/[businessId]

Single business profile page (/directory/[businessId]):
  Banner + logo
  Business name, description, category
  Products/services images (from Firebase Storage URLs)
  Call / Book button (if sales listing)
  Apply button (if job listing)
  Member discount section (visible to logged-in members)
  All listings from this business

Wire to Firestore:
  businesses collection where isApproved = true, isActive = true
  Filter tabs: All | Services | Products | Coaching | Consulting | Education | Merchandise | Discounts
  onSnapshot for real-time
```

### 5C — ADMIN MARKETPLACE BACKEND FIX

```
Admin must be able to APPROVE businesses before they appear in marketplace:
  /admin/businesses table → Add "Approve" action
  businesses/{id}.isApproved = false (default)
  On approve: isApproved = true → business appears in public directory instantly

Admin can: Verify | Suspend | Feature | Delete any business listing
```

### 5D — MEMBER BACKEND: BUSINESS LISTING UPGRADE FLOW

```
Basic member wants to list a business:
  1. They see "Upgrade to Business Account" prompt
  2. Clicking → /join?type=business (business membership signup)
  3. On upgrade: role changes to "business"
  4. They fill out business listing form:
       Business name (required)
       Trade licence upload → Firebase Storage → URL in Firestore
       How they benefit PB community (textarea)
       Services list (multi-input)
       Product images (multi-upload → Firebase Storage → URLs in Firestore)
  5. Submitted → admin reviews and approves
  6. Once approved → appears in public marketplace directory

Under their business, they can post:
  Sales/offers → separate form → admin approval required
  Jobs → separate form → admin approval required
  Each posting: admin reviews before it goes live
  Each sale: can add a member discount
```

---

## PART 6: PARTNERS PAGE (was: Contact)

### 6A — RENAME + UPDATE

```
Rename "Contact" → "Partners" everywhere:
  Navbar link label
  Page title
  Page meta title
  Any internal links pointing to /contact → update to /partners
  Route: keep /contact as a redirect to /partners (or update the route file)
```

### 6B — PAGE CONTENT (CMS)

```js
// platformConfig/partners.pageConfig
{
  eyebrow: "PILLAR 05 — PARTNERSHIPS & COLLABORATIONS",
  headline: "Build alongside us.",
  body: "From governmental programmes to corporate sponsorships to grassroots collaborations — every partnership multiplies what we can do.",

  sponsorshipDeckEyebrow: "SPONSORSHIP DECK",
  sponsorshipDeckHeadline: "For brands ready to do more.",
  sponsorshipDeckBody: "Our sponsorship deck details every tier — from event sponsorships to year-long ecosystem partnerships. Download to share with your team.",
  sponsorshipDeckCTA: "Request the deck",
  sponsorshipDeckPDFUrl: string,   // Firebase Storage URL — admin uploads the PDF

  tracksEyebrow: "THREE TRACKS",
  tracksHeadline: "How we work together.",
  tracks: [
    { title: "Government", description: "Aligned programmes with public sector bodies, civic initiatives and humanitarian channels." },
    { title: "Corporate", description: "CSR, employee volunteering, event sponsorship and brand-aligned partnerships." },
    { title: "Grassroots", description: "Community-to-community collaborations with mosques, schools and local non-profits." }
  ],

  inquiryEyebrow: "INQUIRY",
  inquiryHeadline: "Tell us what you have in mind.",
  inquiryBody: "Brief us on your vision and our partnerships team will respond within 48 hours.",
  inquiryCTA: "Start a conversation",

  trustedByLabel: "TRUSTED BY",
  trustedBySubLabel: "Previous sponsors & partners.",
  trustedByDescription: "A selection of organisations that have supported, sponsored or collaborated with Passive Blessings."
}
```

### 6C — PARTNERS LOGOS ON THIS PAGE

Same `partners/` Firestore collection used for homepage marquee.
On the Partners page, display as a **grid** (not marquee) showing logo + name.
Admin manages logos from `/admin/partners`.

### 6D — INQUIRY FORM

```
Three inquiry categories — each routes to the correct external form:
  Partnerships    → https://tinyurl.com/partnerpb26
  Sponsorship     → https://tinyurl.com/partnerpb26
  Seeking Charity Support → https://tinyurl.com/pbcharitysupport

Add a category selector to the inquiry block.
On "Start a conversation" → open the relevant URL in a new tab based on selected category.

Also keep the existing "Get In Touch" contact form at the bottom.
Update Subject dropdown options to: Partnerships | Sponsorship | Seeking Charity Support | Community Feedback | General Enquiry

Store form form submissions in Firestore:
  contactSubmissions/{id}: { name, email, phone, subject, message, submittedAt }
Admin sees these in /admin/contact-submissions.
```

---

## PART 7: DONATION PAGE — RECONCILE AND FIX

### 7A — PUBLIC PAGE FIX

```
The "Choose a Cause" section shows no causes because:
  The charityCases Firestore collection is empty OR
  The query is broken OR
  The component is not connected to Firestore

Fix: wire to charityCases collection where status = "active"
onSnapshot — causes appear in real-time when admin creates them

Cause card shows:
  Banner image (from Firebase Storage URL)
  Cause title
  Category (Zakat / Sadaqah / Orphan / Umrah / etc.)
  Description (truncated)
  Progress bar: amountRaised / targetAmount
  [Donate Now] button → opens donation flow

Donation flow:
  1. User clicks "Donate Now" on a cause
  2. Modal or page shows: cause name + description
  3. Enter amount (AED)
  4. Select payment method (or show message about redirect)
  5. Redirect to Beit Al Khair payment link (from platformConfig/donations.beitAlKhairURL)
  6. User returns to site
  7. Upload payment proof:
       Screenshot (image → Firebase Storage → URL in Firestore)
       Reference number (text)
       Amount donated (number)
       Cause selected (auto-filled)
  8. PB admin verifies → donation logged in CRM

Important legal text (CMS-controlled):
  "In partnership with approved charitable entities"
  "Passive Blessings acts as a community mobilizer and awareness partner.
   Funds are collected through official charitable partners including Beit Al Khair,
   ensuring transparency and direct impact."
```

### 7B — ADMIN DONATION BACKEND FIX

```
Fix these existing tabs (they exist but are broken/empty):

Charity Cases tab:
  Admin can CREATE a cause:
    Title, category, description, target amount (AED), banner image upload
    (banner → Firebase Storage → URL in Firestore)
    Status: draft | active | completed
  On publish: cause appears instantly on public donation page
  Admin can edit/archive/delete causes

Donation Verification tab:
  Shows all pending donation proof submissions
  Table: Donor name | Cause | Amount | Reference | Proof image | Date | Actions
  Actions: Verify (mark as confirmed) | Reject | Request more info
  Verified donations increment the cause's amountRaised field

Beneficiary Requests tab:
  Shows submissions from charity support form (https://forms.gle/Bs5ipjsgauGy7CTF6)
  Table: Name | Email | Emergency Level | Date | Status | Actions
  Actions: Review | Accept | Reject
  Sensitive documents (Emirates ID, salary cert, bank statement):
    Stored encrypted in Firebase Storage
    Visible ONLY to users where adminRole = "welfare" | "founder" | "coordinator"
    Non-downloadable for standard admins

Charity Partners tab:
  Admin can add/edit partner charities:
    Name, logo, payment link URL, description, isActive toggle
  Payment link shown to users in the donation flow for their selected cause
```

### 7C — BENEFICIARY REQUEST FORM (Member-Facing)

```
Members access from: /dashboard/charity-requests → "Apply for Support"
Or from public page: /donate → "Request Charity Support"

Form fields (match https://forms.gle/Bs5ipjsgauGy7CTF6):
  Full Name *
  Phone Number *
  Email Address *
  Emirates ID Upload * → Firebase Storage (encrypted) → URL in Firestore
  Passport Copy Upload * → Firebase Storage (encrypted) → URL in Firestore
  Visa Copy Upload * → Firebase Storage (encrypted) → URL in Firestore
  Salary Certificate * → Firebase Storage → URL in Firestore
  Bank Statement (optional) → Firebase Storage → URL in Firestore
  Supporting Documents (optional, multi-upload) → Firebase Storage → URLs array
  Reason for Request * (textarea)
  Emergency Level * (dropdown: Low | Medium | High | Critical)
  Referral Source (text — who referred you)
  Consent Checkbox: "I consent to Passive Blessings collecting and storing this data
    in accordance with UAE data protection laws and the platform's privacy policy." *

On submit:
  Write to beneficiaryRequests/{id} in Firestore (Admin SDK server action)
  Sensitive files stored in Firebase Storage under encrypted path
  Status = "pending"
  Admin sees in /admin/charity/beneficiary-requests
  FCM notification to admin: "New beneficiary request submitted"
```

---

## PART 8: SHOP / MERCH PAGE

### 8A — CREATE OR FIX MERCH PAGE

Check if `/shop` or `/merch` route exists. If yes — fix it. If no — create it.

```js
// platformConfig/shop.pageConfig
{
  headline: "Merch & Products",
  body: "Purpose-driven products. Every purchase fuels a cause.",
  donateBannerEyebrow: "DONATE VIA PURCHASE",
  donateBannerHeadline: "A portion of every sale funds the meal programme.",
  donateBannerCTA: "See impact",
  donateBannerCTAHref: "/impact"
}
```

**Product display:**
Wire to `offers` collection where `category = "merchandise"` and `status = "published"`.
Grid layout: image, product name, variant (colour/size), price (AED).
Admin adds merch products via the existing offer creation form (category = Merchandise).

**Seed products (add as sample data):**
```
Estd 2025 Hoodie   — CREAM / BRONZE — AED 320
Six Pillars Cap    — BLACK / GOLD   — AED 120
Sadaqah Tee        — CREAM          — AED 180
Limited Ramadan Crew — DROP 01      — AED 380
```

---

## PART 9: VOLUNTEER PAGE — RECONCILE AND FIX

### 9A — PAGE CONTENT (CMS)

```js
// platformConfig/volunteer.pageConfig
{
  eyebrow: "APPLICATION",
  headline: "Apply to volunteer.",
  body: "While you can join and signup as a member (free or paid), you can also apply to volunteer with the PB Management team and request a role based on your skill and department.",
  formLink: "https://tinyurl.com/volunteerpb26",
  imageURL: string,    // Firebase Storage URL — volunteer team image
  pillarOptions: [     // admin-editable dropdown options for form
    "Community Programs",
    "Charity & Welfare",
    "Enterprise & Marketplace",
    "Spiritual & Personal Growth",
    "Partnerships",
    "Media & Content",
    "Admin & Finance"
  ],
  trackingNote: "Volunteer hours are tracked every time you attend a Thursday charity event."
}
```

**Volunteer application form (embedded on page):**
```
Fields:
  Full Name *
  Email *
  Choose a Pillar (dropdown — from platformConfig/volunteer.pillarOptions) *
  Skills & Availability (textarea) *
  [Submit Application] button (bg-black text-white)

On submit:
  Write to volunteerApplications/{id} in Firestore (Admin SDK)
  Status = "pending"
  Admin sees in /admin/volunteers tab
  FCM to admin: "New volunteer application from [Name]"
```

**Admin volunteer management:**
- Table: Name | Email | Pillar | Skills | Applied Date | Status | Actions
- Actions: Accept (assign role tag) | Reject | Request more info
- Track volunteer hours: admin can log hours per volunteer per event
- Volunteer profile shows: total hours, events attended, pillar assigned

---

## PART 10: MEMBER DASHBOARD — ROLE PERMISSIONS ENFORCEMENT

This is a critical security and UX fix. Audit every sidebar link and page
in the member dashboard and enforce these rules:

### 10A — WHAT BASIC MEMBERS SEE (role = "member")

**Member sidebar must contain ONLY:**
```
Dashboard
My Events
My Donations
Volunteering
Charity Requests
Opportunities      ← browse and APPLY only (cannot post)
Marketplace        ← browse and BUY only
Orders
Messages
Learning
Certificates
Membership
Settings
```

**Remove from basic member sidebar and pages:**
```
Security Center        → ADMIN ONLY
Audit Logs             → ADMIN ONLY
Admin Management       → ADMIN ONLY
Member approval features (volunteer/business/sponsor approvals) → ADMIN + BUSINESS ONLY
Community management   → ADMIN ONLY
Communication management → ADMIN ONLY
Content management     → ADMIN ONLY
Asset management       → ADMIN ONLY
Configuration panels   → ADMIN ONLY
Recordings tab         → REMOVE from member dashboard
```

**Under Charity section, basic members see:**
```
Active Causes (Firestore charityCases where status = "active")
  → Each cause has [Donate Now] button → redirects to Beit Al Khair
Charity Requests → [Apply for Support] → beneficiary request form
```

### 10B — WHAT BUSINESS MEMBERS SEE (role = "business")

Business members have their own dashboard at `/business/dashboard`.
They should NOT see admin-level security/management panels.
Business members CAN:
- Create events (pending admin approval)
- Post jobs (published after admin approval)
- Post offers (published after admin approval)
- Approve/reject members for groups THEY created
- View analytics for their own listings

### 10C — UPGRADE PROMPT

When a basic member tries to access a business feature:
```tsx
// Show upgrade modal:
"This feature is available for Business Members."
"Upgrade your account to list your business, post jobs, and connect with the community."
[Upgrade to Business Account] → bg-black text-white → /join?type=business
[Maybe Later] → close modal
```

---

## PART 11: ADMIN CMS DASHBOARD — COMPLETE PANEL

Add a **CMS** section to the admin sidebar with these pages:

```
ADMIN SIDEBAR — CMS SECTION:
  📄 Homepage
  📄 About Page
  📄 Events Config
  📄 Marketplace Config
  📄 Partners Page
  📄 Donations Config
  📄 Shop Config
  📄 Volunteer Config
  📄 Navigation
  📄 Global Settings
  🖼 Team Members
  🖼 Testimonials
  🏢 Partners & Logos   ← NEW — for marquee management
```

Each CMS page:
- Displays all editable fields for that section
- Text fields → inline edit inputs
- Image fields → file upload (Firebase Storage) with preview
- Save button → writes to platformConfig/{section} document (Admin SDK)
- Changes reflect on live site instantly via onSnapshot on client side
- No page reload needed

### 11A — ADMIN PARTNERS & LOGOS PAGE (`/admin/partners`)

```
Page header: "Partners & Logos"
Subtitle: "Manage logos that appear in the homepage marquee and Partners page"

[+ Add Partner] button (bg-black text-white)

Table columns:
  Logo (thumbnail 48px) | Name | Type | Website | Active | Order | Actions

[Add Partner] form / modal:
  Partner Name *
  Logo upload * → Firebase Storage: partners/{id}/logo.{ext} → URL in Firestore
  Partner type (dropdown): Sponsor | Partner | Charity | Government | Corporate | Grassroots
  Website URL (optional)
  Active toggle (shows/hides in marquee)
  Order (number — for marquee sequence)

Actions per row:
  Edit | Delete | Toggle active

Real-time: table updates via onSnapshot
Drag-to-reorder rows → saves new order to Firestore
```

---

## PART 12: ADMIN JOBS MONITORING — ADD MISSING TAB

Add **"Opportunities"** to the admin sidebar under COMMUNITY section.
This page was identified as completely missing from the admin panel.

```
Page: /admin/opportunities

Header: "All Opportunities"
Subtitle: "Monitor all job and opportunity postings across the platform"

Stats row:
  [Total Posted] [Published] [Applications This Month] [Expired]

Filter tabs: All | Published | Pending Approval | Draft | Closed | Expired | Flagged

Search: "Search by title, company, or category..."

Table: Title | Company | Type | Category | Gender | Applications | Posted By | Date | Deadline | Status | Actions

Actions: View | Edit | Close | Delete | Flag

On approve (for business-submitted jobs):
  status = "published"
  FCM to business: "Your listing [Title] is now live."

Wire to jobs collection — onSnapshot for real-time
```

---

## PART 13: DONATION TRACKING & SPONSOR CRM

### 13A — DONATION TRACKING (Admin)

```
/admin/finance/donations

Track per donation:
  Full name, Email, Phone, Cause donated to, Amount (AED), Date,
  Campaign, Proof upload (screenshot URL from Firebase Storage),
  Payment reference, Verification status, Repeat donor flag

Stats:
  [Total Donations] [Verified] [Pending Verification] [Total AED Raised]

Table: Donor | Cause | Amount | Reference | Proof | Date | Status | Actions
Actions: Verify | Reject | Request Resubmission
```

### 13B — SPONSOR CRM (Admin)

```
/admin/sponsors

Admin can:
  Add sponsors manually (name, logo, type, contribution, campaign)
  Edit sponsor profiles
  Tag sponsor type: Gold Sponsor | Community Partner | Charity Sponsor |
    Event Partner | Vendor | Volunteer Sponsor | Strategic Partner
  Upload logos → Firebase Storage → URL in Firestore
  Assign campaigns/events
  Track recurring sponsors
  Add external/off-platform sponsors
  Export sponsor report (CSV)

Table: Business/Sponsor Name | Type | Logo | Contribution | Campaign | Status | Actions

Wire: reads from both businesses collection (platform sponsors) and
      a separate sponsors collection (manually added external sponsors)
```

### 13C — BUSINESS REFERRAL TRACKING (Admin)

```
/admin/finance/referrals

Platform-wide view:
  All businesses and their referral contribution %
  Number of conversions, revenue generated, amount contributed to PB
  Top contributing businesses (leaderboard)
  Pending payouts / contributions

Charts (recharts):
  Monthly referral revenue trend
  Top 5 businesses by contribution
```

---

## VERIFICATION CHECKLIST

Run through every item after implementation:

```
FONTS:
□ Cormorant Garamond applied to all h1, h2 headings across entire platform
□ Inter applied to all body text, buttons, labels, eyebrows
□ Eyebrow text is uppercase everywhere
□ No font is hardcoded in any component — all configurable

AUTH:
□ After sign-in, user can navigate back to public pages (/events, /marketplace, etc.)
□ Navbar shows correct state (signed in vs signed out)
□ Role-based redirect works correctly

HOMEPAGE:
□ Hero: two-column layout (text left, image right), correct fonts, 3 buttons working
□ Stats bar: shows override numbers in new layout (no boxes)
□ Partners marquee: scrolls right-to-left, loads from Firestore partners collection
□ Mission block: renders with correct text, italic word in Cormorant Garamond
□ Six Pillars: 6 cards with images, all EXPLORE links working to correct pages
□ Upcoming Events: shows real events from Firestore, cards have all required fields
□ Donation banner: dark background, 3 buttons linking to correct pages
□ WhatsApp button: fixed position, opens correct link
□ Testimonials: carousel renders text/video testimonials from Firestore
□ Social blocks: placeholder shown with CMS toggle

ABOUT PAGE:
□ Hero text updated to correct copy
□ Story block with founder image (or placeholder if not uploaded yet)
□ Pull quote renders in Cormorant Garamond italic
□ Values and differentiators show correct content
□ Team grid shows 7 members with photos (or initials fallback)

EVENTS PAGE:
□ Calendar dots colour-coded by category from Firestore config
□ Event lineup shows real published events
□ Filter tabs wire to correct Firestore queries
□ WhatsApp channel button visible on page
□ Admin: published events appear on frontend instantly
□ Admin: eye icon opens preview correctly
□ Admin: pending events show in approval queue
□ Admin: stats text is white on dark backgrounds
□ Groups: cards show image, name, member count, join button
□ Groups: Activities tab removed
□ Inside group: chat/forum interface functional
□ Basic members: cannot create events or approve members

MARKETPLACE:
□ Public page shows business directory cards (not just products)
□ Business cards: logo, name, description, services, offers count, jobs count
□ Admin: can approve/reject businesses before they appear
□ Member upgrade flow: prompt shows for basic members trying business features
□ Business listing form: all fields including trade licence upload

PARTNERS PAGE:
□ Navbar link renamed from "Contact" to "Partners"
□ Page uses correct copy from CMS
□ Sponsorship deck CTA downloads PDF from Firebase Storage URL
□ Partners logos grid shows correctly
□ Three Tracks block renders with correct content
□ Inquiry block: category selector routes to correct external form
□ All partner names from PDF are seeded (text-only until logos uploaded)

DONATIONS PAGE:
□ Cause cards load from Firestore charityCases collection
□ Donate flow: amount entry → Beit Al Khair redirect → proof upload
□ Admin: can create/publish/archive causes
□ Admin: donation verification tab works — can verify uploaded proofs
□ Admin: beneficiary requests tab shows form submissions
□ Sensitive docs: only visible to welfare admins / founder / coordinators
□ Legal text displays correctly: "In partnership with approved charitable entities"

SHOP PAGE:
□ Merch products display from offers collection (category = merchandise)
□ Donate via purchase banner shows correctly
□ 4 sample products seeded

VOLUNTEER PAGE:
□ Form submits to Firestore volunteerApplications collection
□ Admin sees submissions in /admin/volunteers
□ Volunteer hours can be logged by admin
□ Recordings tab removed from member dashboard

MEMBER DASHBOARD:
□ Basic members: only see allowed sidebar items
□ Security/Admin/Approval features: completely hidden from basic members
□ Under Charity: only see active causes and apply for support option
□ Upgrade prompt: shows when basic member tries business features
□ Dashboard main page loads without crash
□ Events page loads with correct tabs
□ Volunteering page loads without crash
□ Donations page loads without crash

ADMIN CMS:
□ /admin/cms/homepage — all sections editable
□ /admin/cms/about — all sections editable
□ /admin/cms/team — add/edit/delete/reorder team members
□ /admin/cms/testimonials — up to 10 testimonials
□ /admin/partners — add/edit/delete/reorder partner logos for marquee
□ /admin/opportunities — jobs monitoring tab exists and works
□ /admin/sponsors — sponsor CRM functional
□ /admin/finance/donations — donation tracking works
□ All CMS changes reflect on live site without page reload

FIREBASE RULES:
□ All Firestore writes use sanitizeForFirestore (no undefined values)
□ All file uploads go to Firebase Storage — URLs stored in Firestore
□ Admin SDK used only in server actions and API routes
□ Client SDK used only in React components
□ onSnapshot used for all real-time UI (events, marketplace, causes, partners)
□ ignoreUndefinedProperties: true set on Admin Firestore instance
□ Error boundaries on all dashboard layouts

DESIGN:
□ ALL primary buttons: bg-black text-white — no exceptions, entire platform
□ ALL secondary buttons: bg-white text-black border
□ ALL headings: Cormorant Garamond
□ ALL eyebrows: Inter uppercase
□ ALL body text: Inter
□ No vertical text rendering anywhere on the platform
□ All forms: full-width containers, horizontal layout
□ Skeleton loaders on all data-fetching pages
□ WhatsApp floating button on all public pages
```
