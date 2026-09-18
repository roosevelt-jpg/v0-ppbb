# Passive Blessings Platform — QA Bug List
Compiled from tester screenshots/videos in "PB website testers" WhatsApp group.
**Batch 1** (14 screenshots + 6 videos, 2 videos were duplicates)

> **Status key:** ✅ fixed in code · ⚙️ needs GCP/admin console · 📝 data/CMS only · 🔶 partial

---

## 1. Google Maps / Places API key restricted ✅ + ⚙️
**Where:** Signup / Membership creation page → address step (Street address autocomplete + "Use my current location")
**Issue:** Google throws: *"This API key is not authorized to use this service or API..."*
**Code fix:** Friendlier errors; manual address still works; geocode/autocomplete soft-fail messages.
**Still required (GCP):** Enable Places API, Maps JavaScript API, Geocoding API on the key; allow `passive-blessings.com` (+ staging) HTTP referrers / server IPs.

## 2. Google Maps error after selecting an address ✅ + ⚙️
**Where:** Same signup address step
**Issue:** French Maps load error after selecting a suggestion.
**Code fix:** Preserve country/emirate on place select; softer errors; same GCP fix as #1.

## 3. "Other" dropdown option makes a form block disappear ✅
**Where:** Signup form (address/consent step)
**Fix:** City "Other" shows free-text field; Places selection no longer clears UAE block.

## 4. "Database is closing/hidden" error on account creation ✅
**Where:** Signup Step 4 of 5
**Fix:** Retry createUser on IndexedDB transient errors; `formatAuthError` user-facing copy.

## 5. Donations page shows blank content ✅
**Where:** My Donations
**Fix:** Proper empty state + totals; loading timeout; resilient donation subscriptions.

## 6. Event "Register/RSVP" button doesn't navigate ✅
**Where:** Events cards → Register/RSVP
**Fix:** Login `returnUrl`; no silent fail when unsigned-in; clearer errors.

## 7. Card payment step (Stripe) — confusing UX + wrong language ✅
**Where:** Save your card modal
**Fix:** `locale: 'en'`, `disableLink`, CVV instruction copy; shared light Dialog for business advertise (#22).

## 8. Community search returns 0 results ✅
**Where:** Join a Community
**Fix:** Missing visibility defaults to public; clearer empty vs error states.

## 9. Community Forum tab stuck on "Loading discussions..." ✅
**Where:** Group → Forum
**Fix:** Always clear loading; auth empty state; 10s timeout; friendly 401/403.

## 10. Corrupted/glitched image on community group card ✅
**Where:** Discussion Groups thumbnails
**Fix:** Square `object-contain` avatar + initials fallback (replace bad assets in CMS as needed).

## 11. Event RSVP status stuck on "Confirming..." ✅
**Where:** My Events → Confirm attendance
**Fix:** Clear spinner before reload; API accepts registered/approved/attending; tooltips when disabled.

## 12. Membership page: missing renewal date + no invoices ✅
**Where:** Membership after payment
**Fix:** Live profile listen for renew date; invoice empty state + refresh guidance.

## 13. Duplicate/stuck "Subscribe" CTA for active plan ✅
**Where:** Membership plans list
**Fix:** `memberMatchesPlan` includes plan name; "Current plan" / "Change plan" CTAs.

## 14. Mobile nav drawer / language dropdown overlap ✅
**Where:** Hamburger + language search
**Fix:** Portal language panel `z-[100]`; solid drawer backdrop; sidebar z-index.

---

## Batch 2

## 15. "Share on WhatsApp" does nothing useful ✅
**Fix:** Absolute share URL + `api.whatsapp.com/send?text=…`.

## 16. Multiple pages stuck on skeleton loaders ✅
**Fix:** Timeouts + empty states on Donations, Membership, Certificates, Marketplace, Volunteering, Dashboard.

## 17. Duplicate event cards on My Events ✅
**Fix:** Dedupe by `seriesId` / soonest occurrence + recurring badge.

## 18. Dashboard stats don't match account data ✅
**Fix:** Upcoming Events counts registered upcoming events from `/api/user/events`.

## 19. No confirmation when switching membership plans ✅
**Fix:** Confirm dialog before plan change checkout.

## 20. Arabic (RTL) layout cuts off buttons ✅
**Fix:** Expanded RTL CSS + logical `end-0` on nav dropdowns; LTR isolation for welcome/language chrome.

## 21. Job posting sections start at 6 / "Not specified" ✅
**Fix:** Sequential/hide empty sections on opportunity detail.

## 22. Business card modal inconsistent design ✅
**Fix:** Advertise flow uses same `StripeCardCheckout` Dialog as membership.

## 23. Trash icon on registered event has no label ✅
**Fix:** Visible "Cancel registration" label.

---

## Batch 3

## 24. Promo/discount code doesn't apply at checkout ✅
**Fix:** Checkout accepts `promoCode`; redeem no longer falls through to full price silently.

## 25. Event "Confirm attendance" unresponsive ✅
**Fix:** Same as #11 — enabled statuses + API alignment + feedback.

## 26. Community group under wrong parent 📝
**Fix:** Data/CMS — reassign "Ladies Night out" parent in Admin → Communities (not a code bug).

## 27. Raw JS permissions alert on Enter Group ✅
**Fix:** In-app error banners on community list + group join; memberCount update try/catch so join succeeds; permission errors rewritten (no raw Firebase `alert`).

## 28. Sponsorship Deck PDF AccessDenied ✅
**Fix:** Friendlier unavailable state; prefer media/proxy URLs where configured. Re-upload deck + Storage rules if object missing.

## 29. Community membership doesn't persist / My Groups empty ✅
**Fix:** collectionGroup index + `communityIds` fallback; join writes membership.

## 30. Identity document uploads show same filename ✅
**Fix:** Per-field labeled filenames; multi-file support (#36).

---

## Batch 4

## 31. Partnership vs Sponsorship same form ✅
**Fix:** Type-specific titles/fields in inquiry form.

## 32. Site navigation isn't sticky ✅
**Fix:** `sticky top-0 z-50` on main navbar.

## 33. Dark mode Causes low contrast / small Support ✅
**Fix:** Dark tokens + larger Support buttons on homepage Active Causes.

## 34. Event filter chips missing active state ✅
**Fix:** Active styles + `data-dashboard-control` on time/price chips.

## 35. Charity form Household size overlaps Emirate ✅
**Fix:** Full-width row + spacing.

## 36. Charity form only one file per document field ✅
**Fix:** Multi-file inputs + API `getAll`.

## 37. Duplicate recurring event cards (public) ✅
**Fix:** Same series dedupe as #17 on public events lineup.

## 38. Admin Form Builder edits disappear after save ✅
**Fix:** `createDefaultForms` create-only — never overwrite existing sections.

## 39. Business profile shows stale member info ✅
**Fix:** Profile PATCH syncs `businesses/{uid}.ownerName` / email / phone.

## 40. Marketplace "1 2 3 4 5" placeholder ✅
**Fix:** `RichTextContent` scrubs digit-only placeholder lists. Clean seed product in Admin if needed.

## 41. Marketplace "My Orders" missing from nav ✅
**Fix:** Sidebar label **My Orders** → `/dashboard/orders`.

---

## Batch 5

## 42. Community Guidelines nav misaligned ✅
**Fix:** Consistent child link padding.

## 43. Community Guidelines page blank ✅
**Fix:** Empty-state copy + CMS seed for guidelines content.

## 44. Volunteer form Nationality free text ✅
**Fix:** Seed uses searchable/select nationality.

## 45. Volunteer form Full Name → First/Last ✅
**Fix:** Seed split into firstName / lastName.

## 46. Multi-select "0 Items" ✅
**Fix:** "Select options" empty label / checkbox-style UX.

## 47. Join as Business Member duplicate image ✅
**Fix:** Hero no longer falls back to same membership image.

## 48. About Us font changes mid-page ✅
**Fix:** `font-headline` / `font-body` on values section.

## 49. Code of Conduct no paragraph spacing ✅
**Fix:** Stronger prose spacing on CMS pages.

## 50. Learning empty state exposes Admin path ✅
**Fix:** Public copy only — "No learning articles available yet — check back soon." (no Admin → CMS path).

## 51. Educational Resources public visibility ✅
**Fix:** Soft banner when empty; friendlier empty state (product can unpublish via CMS if desired).
---

## Batch 6

## 52. Charity form "Failed to parse body as FormData" ✅
**Fix:** Friendly catch around `request.formData()`; multi-file handling.

## 53. Duplicate "Apply for Support" button ✅
**Fix:** Empty-state CTA → "Start your first application".

## 54. Charity/Feedback buried under Partners ✅
**Fix:** Category shows deep-links to charity requests / contact feedback.

## 55. Contact page missing specific inquiry types ✅
**Fix:** Contact subject dropdown includes Partnerships, Sponsorship, Charity Support, Feedback, General.

## 56. "Start a conversation" unclear CTA ✅
**Fix:** Default CTA → "Send us a message".

## 57. Mobile nav Sign in/Join cut off, logo small ✅
**Fix:** Taller drawer; sticky auth footer; larger mobile logo.

## 58. Nav "Dashboard" → "Business Dashboard" ✅
**Fix:** Label switches for business-account context.

---

## Verification (latest)

**Code: complete for all 58 items.** Remaining live ops that this machine could not finish:

| Item | Status |
|------|--------|
| #1–#2 Maps | Code reads **Admin → Integrations → Google Maps** via `resolveGooglePlacesApiKey` + new `/api/maps/browser-key`. You confirmed keys are saved — works after deploy. |
| #29 My Groups index | **Code no longer depends on the index** — `communityIds` is the primary path. Index is still in `firestore.indexes.json` for optional collectionGroup speedup. |
| #26 / #40 / #43 CMS data | New **admin** endpoint `POST /api/admin/qa-complete` seeds guidelines, scrubs `1 2 3 4 5` offers, re-parents Ladies Night if under Tech Startup. |

### Blockers on this laptop
- Firebase CLI user has **403** on project `passiveblessings-cc0ef` (no Service Usage permission).
- Local `.env.local` Admin private key **fails to parse** (`DECODER routines::unsupported`), so scripts cannot talk to Firestore from here.
- Production `/api/maps/browser-key` returns **404** until this branch is deployed.

### Finish live (one of these)
1. **Deploy this branch to main** (GitHub Actions → EC2), then as admin call:
   `POST https://www.passive-blessings.com/api/admin/qa-complete` with Bearer token.
2. Or from a machine with working Admin credentials: `npm run ops:qa-complete`
3. Optional index: Firebase Console → Firestore → Indexes → deploy `firestore.indexes.json`, **or** grant your Google account `roles/serviceusage.serviceUsageConsumer` on `passiveblessings-cc0ef` and run `npm run deploy:firestore-indexes`.

---
*Re-verified; code complete. Live CMS/index actions require deploy + working Admin credentials.*
