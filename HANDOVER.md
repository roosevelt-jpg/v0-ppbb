# Passive Blessings Platform — Full Handover Guide

**Repository:** https://github.com/roosevelt-jpg/v0-ppbb  
**Last updated:** July 2026  
**Production URL (documented):** https://test.myflynai.com  
**Local dev:** http://localhost:3000

This document is the **single handover entry point**. It explains what was built, how to run it, where to edit content, and what the new team must do on day one.

---

## 1. What This Platform Is

**Passive Blessings** is a faith-based community platform for:

- **Members** — events, volunteering, donations, marketplace, learning, certificates, communities, messaging
- **Businesses** — directory listings, jobs, products/offers, discounts, leads, referrals, events, communities
- **Sponsors** — sponsorship portal
- **Admins** — full CMS, user management, integrations, approvals, reporting

Almost all public copy, images, navigation, and page content is **admin-editable** via Firestore (`platformConfig`, `pages`, collections). The site is designed to avoid hard-coded marketing text.

---

## 2. Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4, shadcn/ui |
| Auth & DB | Firebase Auth + Firestore |
| Server | Firebase Admin SDK (API routes) |
| Storage | Firebase Storage |
| Payments | Stripe (donations, marketplace checkout, subscriptions) |
| Email | SendGrid (newsletters, contact) + Gmail SMTP (admin invites, certificate emails) |
| AI | Anthropic Claude (chatbot) |
| i18n | next-intl (12 languages, Arabic RTL) |
| Hosting | Node.js / standalone Next.js deployment |
| Analytics | Optional; provider not required by the app |

**Key config files:**

| File | Purpose |
|------|---------|
| `next.config.js` | Redirects, standalone build |
| `firebase.json` | Firestore rules + indexes, Storage rules |
| `firestore.rules` | Security rules (~779 lines) |
| `firestore.indexes.json` | Composite indexes |
| `vercel.json` | Deployment-specific cron configuration |

---

## 3. Getting Started (New Developer)

### Prerequisites

- Node.js 18+
- npm or pnpm
- Firebase project access
- `.env.local` with credentials (see §4)

### Install & run

```bash
git clone https://github.com/roosevelt-jpg/v0-ppbb.git
cd v0-ppbb
npm install
# Create .env.local — see ENV_SETUP.md (no .env.example in repo)
npm run dev
```

Open http://localhost:3000

### Build for production

```bash
npm run build
npm start
```

### Lint

```bash
npm run lint
```

---

## 4. Environment Variables

Create `.env.local` using **`ENV_SETUP.md`** as the template (referenced in README but file may need to be created from that doc).

### Minimum required

```bash
# Firebase (client)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin (server + seed scripts)
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=    # use \n for newlines
# OR: GCP_SERVICE_ACCOUNT=     # full JSON / base64

# Site
NEXT_PUBLIC_SITE_URL=          # e.g. https://your-domain.com
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_BASE_URL=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
```

### Email

```bash
SENDGRID_API_KEY=
SENDGRID_FROM_ADDRESS=
GMAIL_USER=              # fallback
GMAIL_APP_PASSWORD=
```

**Important:** Many integration keys can also live in **Firestore** at `/admin/integrations` (encrypted). Env vars are fallbacks. See `GMAIL_SMTP_SETUP.md` and `INTEGRATION_CONFIGURATION_GUIDE.md`.

### Other common vars

- `ANTHROPIC_API_KEY` — chatbot
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — maps/places
- Google/Microsoft calendar OAuth vars — event calendar sync
- `CRON_SECRET` — YouTube refresh cron

---

## 5. User Roles & Portals

| Role | Portal | Entry URL |
|------|--------|-----------|
| Public visitor | Marketing site | `/` |
| Member | Member dashboard | `/dashboard` |
| Business | Business portal | `/business/dashboard` |
| Sponsor | Sponsor portal | `/sponsor` |
| Admin | Admin console | `/admin` |

**Role logic:** `lib/roles.ts`, `lib/roles-server.ts`  
**Auth:** `lib/auth-context.tsx`, Firebase Auth

### First admin setup

1. Sign up at `/signup`
2. In Firebase Console → `users/{uid}` → set `role: "admin"`
3. Or use **Admin → Management** to generate access code + email invite
4. New admin completes setup at `/admin/setup`

---

## 6. Public Website — Key Pages

| URL | What it shows | Who edits content |
|-----|---------------|-------------------|
| `/` | Homepage | Admin → CMS → Homepage |
| `/about` | About | Admin → CMS → About |
| `/contact` | Contact form | Admin → CMS → Global Settings (footer/contact) + form submissions in Admin |
| `/donate` | Donations | Admin → CMS → Donations |
| `/events` | Events calendar | Admin → Events + CMS → Events Config |
| `/workshops` | Workshops | Admin → Workshops |
| `/recordings` | Recordings | Admin → Recordings |
| `/opportunities` | Jobs/gigs | Businesses post; Admin approves |
| `/marketplace` | Product grid + business directory | Admin → CMS → Marketplace; businesses post offers |
| `/shop` | Merchandise | Admin → CMS → Shop; offers with category `merchandise` |
| `/directory` | Business directory | Admin → Businesses (approve listings) |
| `/directory/[businessId]` | Business profile | Business dashboard profile |
| `/transparency` | Live stats + copy | Admin → CMS → Transparency |
| `/communities` | Community listings | Admin / Business create communities |
| `/pages/[slug]` | CMS pages (legal, footer links) | Admin → Pages |
| `/pages/privacy-policy` | Privacy | Admin → Pages |
| `/pages/terms-of-service` | Terms | Admin → Pages |
| `/pages/code-of-conduct` | Code of conduct | Admin → Pages |

**Redirects:** Old `/policies/*`, `/terms`, `/privacy` redirect to `/pages/*`.

---

## 7. Member Dashboard (`/dashboard`)

Sidebar defined in `components/member-layout.tsx`.

| Page | Purpose |
|------|---------|
| `/dashboard` | Overview, quick stats |
| `/dashboard/events` | Registered events |
| `/dashboard/donations` | Donation history |
| `/dashboard/volunteering` | Volunteer hours (`volunteerRecords` + `users.volunteeredHours`) |
| `/dashboard/charity` | Active causes |
| `/dashboard/charity-requests` | Beneficiary requests |
| `/dashboard/opportunities` | Job applications |
| `/dashboard/marketplace` | Member marketplace browse |
| `/dashboard/orders` | Purchase history |
| `/dashboard/messages` | DM inbox (`dmThreads`) |
| `/dashboard/learning` | Learning resources + spiritual development |
| `/dashboard/certificates` | Auto-issued volunteer certificates |
| `/dashboard/membership` | Membership plans |
| `/dashboard/communities` | Joined communities |
| `/dashboard/settings` | Account settings |

---

## 8. Business Portal (`/business`)

Sidebar in `app/business/layout.tsx`.

| Page | Purpose |
|------|---------|
| `/business/dashboard` | KPIs, pending group members, quick actions |
| `/business/profile` | Business profile (public directory) |
| `/business/opportunities` | Jobs & gigs |
| `/business/offers` | Products & offers (feeds marketplace) |
| `/business/discounts` | Member discount codes |
| `/business/marketplace` | **Network / Connections** — member directory + DM |
| `/business/leads` | Lead tracking |
| `/business/referrals` | Referral link & earnings |
| `/business/analytics` | Charts |
| `/business/events` | Business-hosted events |
| `/business/partnerships` | Partnership requests |
| `/business/communities` | Create communities & groups |
| `/business/payments` | Stripe subscriptions |

**Business signup:** `/business/signup` (no portal chrome until approved)

**Listing approval:** Admin → Businesses. Until `isApproved` + `isActive`, public directory is hidden but business can draft content.

---

## 9. Admin Console (`/admin`) — Where to Edit Everything

### CMS (live public copy)

| Admin path | Edits | Firestore |
|------------|-------|-----------|
| `/admin/cms/homepage` | Homepage hero, pillars, CTAs | `platformConfig/homepage` |
| `/admin/cms/about` | About page | `platformConfig/about` |
| `/admin/cms/events` | Events page config | `platformConfig/events` |
| `/admin/cms/marketplace` | Marketplace copy | `platformConfig/marketplace` |
| `/admin/cms/partners` | Partners page | `platformConfig/partners` |
| `/admin/cms/donations` | Donate page | `platformConfig/donations` |
| `/admin/cms/transparency` | Transparency labels/sections | `platformConfig/transparency` |
| `/admin/cms/shop` | Shop page | `platformConfig/shop` |
| `/admin/cms/volunteer` | Volunteer page copy | `platformConfig/volunteer` |
| `/admin/cms/learning` | Meditations, reflections, wisdom articles | `learningResources` |
| `/admin/cms/certificates` | Volunteer hour certificate templates | `certificateTemplates` |
| `/admin/cms/navigation` | Nav + footer link columns | `platformConfig/navigation` |
| `/admin/cms/global-settings` | Logo, footer blurb, social links, contact | `platformConfig/globalSettings` |
| `/admin/cms/testimonials` | Testimonials | `testimonials` |

### Content management

| Admin path | Purpose |
|------------|---------|
| `/admin/pages` | Full CMS pages (`/pages/[slug]`) — legal, footer links |
| `/admin/events` | Create/edit/publish events |
| `/admin/businesses` | Approve/suspend business listings |
| `/admin/communities` | Communities; click **Groups** to manage groups |
| `/admin/communities/[id]/groups/create` | Create group (type, gender, approval, signatures N/A) |
| `/admin/communities/approvals` | Pending business communities/groups |
| `/admin/volunteers` | Volunteer profiles & hours |
| `/admin/members` | All members |
| `/admin/integrations` | Stripe, SendGrid, Gmail SMTP, Anthropic, etc. |
| `/admin/management` | Admin access codes & invites |

### Communities & groups (admin)

1. **Admin → Community** → create community
2. Open community → **Manage Groups** or **Create Group**
3. Group features: type (discussion, prayer, support…), gender rules, join approval, icon, chat at `/communities/[id]/groups/[groupId]`
4. Edit group: `/admin/communities/[id]/groups/[groupId]/edit`

---

## 10. Major Features — How They Work

### Marketplace

- **Public:** `/marketplace` — product grid from `offers` / `businessOffers` (published)
- **Directory:** business cards with logo, owner, job/offer counts
- **Detail:** `/marketplace/[id]`
- **Seed sample data:** `npm run seed:businesses`
- **Business posts:** `/business/offers/new` → admin approval for publish

### Payments (Stripe)

- Donations, marketplace checkout, business subscriptions
- Webhook: `POST /api/webhooks/stripe`
- Setup: `STRIPE_SETUP_GUIDE.md`

### Volunteer hours & certificates

1. Hours tracked in `users.volunteeredHours` and/or `volunteerRecords`
2. Admin designs templates at **Admin → CMS → Volunteer Certificates**
   - Hour threshold (e.g. 10, 50, 100)
   - Certificate design, founder signature, other signatories
   - Email subject/body
3. **Auto-award** when threshold met:
   - Member visits `/dashboard/certificates`
   - Admin saves volunteer hours (Admin → Volunteers → Edit)
   - Admin clicks **Award pending certificates (all members)** on CMS page
4. Certificate appears on member dashboard + congratulatory email (Gmail SMTP)

### Learning / Spiritual Development

- Admin → CMS → Learning Resources
- Categories: Daily Meditations, Community Reflections, Wisdom Articles
- Members filter via buttons on `/dashboard/learning`

### Direct messages

- Member: `/dashboard/messages`
- Business networking: `/business/marketplace` (Network / Connections)
- Firestore: `dmThreads`, subcollection `messages`

### Transparency page

- Live stats from `/api/public/transparency-stats` (server-side, no client permission errors)
- Copy from Admin → CMS → Transparency

### Legal pages

- Editable at Admin → Pages
- URLs: `/pages/privacy-policy`, `/pages/terms-of-service`, `/pages/code-of-conduct`
- Signup links point to these URLs

---

## 11. Firebase — Deploy After Code Changes

Whenever `firestore.rules` or `firestore.indexes.json` change:

```bash
npm run deploy:firestore-rules
npm run deploy:firestore-indexes
firebase deploy --only storage    # storage.rules
```

Requires `firebase login` and project selected.

### Important collections

| Collection | Purpose |
|------------|---------|
| `users` | All user profiles + roles |
| `platformConfig` | CMS sections (homepage, about, etc.) |
| `pages` | Dynamic CMS pages |
| `businesses` | Directory listings |
| `offers` / `businessOffers` | Marketplace products |
| `communities` / `groups` / `members` / `messages` | Community system |
| `volunteerRecords` | Hour logs |
| `certificateTemplates` | Certificate designs |
| `certificates` | Issued member certificates |
| `learningResources` | Learning hub content |
| `discounts` | Business member discounts |
| `dmThreads` | Direct messages |
| `integrations` | Encrypted API credentials |

Full schema: **`FIRESTORE_SCHEMA.md`**

---

## 12. Seed Scripts

```bash
npm run seed:businesses   # Sample businesses + offers for /marketplace
npm run seed:shop         # Sample merch for /shop
```

Requires Firebase Admin credentials in `.env.local`.

---

## 13. Email Setup

| System | Use | Doc |
|--------|-----|-----|
| **Gmail SMTP** | Admin invites, certificate milestone emails | `GMAIL_SMTP_SETUP.md` |
| **SendGrid** | Newsletters, bulk email | `INTEGRATION_CONFIGURATION_GUIDE.md` |

Configure at **Admin → Integrations** or via env vars.

---

## 14. Deployment Checklist (Production)

### App Deployment

1. Provision the production hosting environment
2. Set all env vars (§4)
3. Build and deploy from `main`
4. Set `NEXT_PUBLIC_SITE_URL` to production domain
5. Configure Stripe webhook → `https://{domain}/api/webhooks/stripe`

### Firebase (every release that touches rules/indexes)

```bash
npm run deploy:firestore-rules
npm run deploy:firestore-indexes
```

### Post-deploy smoke test

- [ ] Homepage loads with CMS content
- [ ] Login / signup works
- [ ] `/marketplace` shows offers (run seed if empty)
- [ ] Admin login → CMS → edit homepage → change appears live
- [ ] `/transparency` — no console permission errors
- [ ] `/dashboard/messages` loads
- [ ] `/dashboard/certificates` loads
- [ ] Business portal sidebar — no duplicate key errors
- [ ] Contact form submits
- [ ] Stripe test donation (if configured)

---

## 15. Recent Work Completed (Handover Context)

This section covers fixes and features delivered in the latest development cycle (pushed to `main` on GitHub).

### UI / UX polish

- Global button styling: black background, white text (with opt-outs via `data-dashboard-control`, `data-calendar-day`)
- Footer social icons: black circles, white symbols
- Contact page social icons: same treatment
- YouTube widget: black button, right-aligned
- Event calendar: white date cells (not global black buttons)

### CMS & legal

- Legal pages moved to `/pages/{slug}` (privacy, terms, code-of-conduct)
- Footer legal links updated; old `/policies/*` redirect
- Signup checkbox links fixed
- Duplicate CMS heading strip on save/render
- Transparency page: admin-editable + server API for stats (fixes permission errors)

### Marketplace

- Ecommerce-style product grid with images, store name, prices
- Sample data: `npm run seed:businesses`
- Business name on cards and detail pages

### Business portal fixes

- Removed duplicate sidebar item (`Marketplace` vs `Network / Connections`)
- Fixed missing `Upload` icon on Post Offer page
- Error boundary resets on route change (stuck "page couldn't load")
- Member discounts: Firestore index fallback + error handling

### Communities (admin)

- **Groups** button on community list
- **Manage Groups** on community detail
- Full group create/edit with type, gender, approval, capacity, signatures N/A
- Group edit page added (was 404)

### Learning

- Spiritual Development buttons wired to CMS content
- Admin → CMS → Learning Resources

### Certificates (volunteer milestones)

- Admin template designer with preview, signatures, email copy
- Auto-issue on hour thresholds
- Member dashboard display + print/PDF
- Email on achievement

### Messaging

- Fixed `db is not defined` in `lib/dm-queries.ts`

### Infrastructure

- `firebase.json` now includes `firestore.indexes.json`
- `npm run deploy:firestore-indexes` script added

---

## 16. Known Gaps & Notes for New Team

1. **`.env.example` missing** — use `ENV_SETUP.md` to build `.env.local`
2. **`typescript.ignoreBuildErrors: true`** in `next.config.js` — builds may pass with TS errors; fix over time
3. **Integration credentials** dual-sourced: env vars AND Firestore `integrations` — clarify per environment
4. **Workshop Register buttons** on `/dashboard/learning` — link to `/workshops` (not full in-app registration)
5. **Footer copyright text** — may still be hardcoded; blurb/logo/social from Global Settings
6. **Deploy Firestore rules/indexes** after pull if not done on production Firebase project
7. **141+ markdown docs** at repo root — many are phase/audit reports; use **`DOCUMENTATION_INDEX.md`** to navigate

---

## 17. npm Scripts Reference

| Script | Command |
|--------|---------|
| Dev server | `npm run dev` |
| Production build | `npm run build` |
| Start production | `npm start` |
| Lint | `npm run lint` |
| Deploy Firestore rules | `npm run deploy:firestore-rules` |
| Deploy Firestore indexes | `npm run deploy:firestore-indexes` |
| Seed marketplace | `npm run seed:businesses` |
| Seed shop | `npm run seed:shop` |

---

## 18. Documentation Index (Existing Repo Docs)

Read in this order for deeper detail:

| Priority | File | Topic |
|----------|------|-------|
| 1 | `PROJECT_SUMMARY.md` | Full feature overview |
| 2 | `ENV_SETUP.md` | Environment variables |
| 3 | `ADMIN_SETUP.md` | Admin dashboard |
| 4 | `FIRESTORE_SCHEMA.md` | Database schema |
| 5 | `GMAIL_SMTP_SETUP.md` | Email for invites & certificates |
| 6 | `STRIPE_SETUP_GUIDE.md` | Payments |
| 7 | `TESTING_GUIDE.md` | Test scenarios |
| 8 | `DOCUMENTATION_INDEX.md` | Master index (141 files) |

---

## 19. Day-One Handover Checklist for New Team

- [ ] Clone repo and get `.env.local` from outgoing team (never commit secrets)
- [ ] Get Firebase Console access (project: `pasiveblessings` or current project ID)
- [ ] Get production hosting access
- [ ] Get Stripe dashboard access + webhook secret
- [ ] Get Gmail app password or SendGrid API key
- [ ] Run `npm install && npm run dev` locally
- [ ] Run `npm run deploy:firestore-rules` and `npm run deploy:firestore-indexes` if production is behind
- [ ] Log in as admin; verify CMS pages edit live content
- [ ] Run `npm run seed:businesses` on staging if marketplace is empty
- [ ] Create at least one certificate template (Admin → CMS → Volunteer Certificates) and set Active
- [ ] Read `firestore.rules` before changing data access patterns
- [ ] Confirm GitHub `main` is deployed to production

---

## 20. Support Contacts & Repo

| Item | Value |
|------|-------|
| GitHub | https://github.com/roosevelt-jpg/v0-ppbb |
| Branch | `main` |
| Firebase rules | `firestore.rules` |
| Admin entry | `/admin` |
| Member entry | `/dashboard` |
| Business entry | `/business/dashboard` |

---

*This handover guide supersedes scattered phase reports for onboarding purposes. For historical implementation notes, see `PHASE_*` and `*_COMPLETE.md` files in the repo root.*
