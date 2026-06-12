# Pricing System - Complete Workflow

## How Pricing Plans Work End-to-End

### 1. ADMIN PRICING MANAGEMENT
**Location:** `/admin/pricing`
**Sidebar:** "Pricing Plans" (newly added)

Admin flow:
- Click "Create Plan" button
- Fill form: Name, Price, Currency, Features, Benefits, Icon, Color, Display Order, Active/Inactive toggle
- Click "Save Plan"
- Plan stored in Firestore `pricingPlans` collection with real-time sync enabled

### 2. INSTANT SYNC TO USER DASHBOARDS
When admin saves a plan with `active: true`:

```
pricingPlans collection updated 
  ↓
Real-time Firestore listener triggered
  ↓
/dashboard/membership page fetches plans instantly
  ↓
Users see new plan immediately (no page refresh needed)
```

**Plans appear on:**
- ✅ `/dashboard/membership` (Members dashboard)
- ✅ `/dashboard/membership` (Sponsors dashboard - same route)
- ✅ `/dashboard/membership` (Businesses dashboard - same route)
- ✅ Public pricing if added to homepage

### 3. USER SUBSCRIPTION FLOW
User's action on any dashboard:
1. User sees plan cards with "Subscribe Now" button
2. Clicks button
3. Checkout API called (`/api/checkout`)
4. Redirected to Stripe/PayPal/Ziina payment gateway
5. Payment processed
6. Subscription recorded in Firestore `userSubscriptions` collection
7. User's dashboard shows "Current Plan" (not Subscribe button)

### 4. ADMIN MEMBERSHIP MANAGEMENT
**Location:** `/admin/membership`
**Used for:** Managing members, viewing tiers, bulk upgrades/downgrades

Admin can:
- See all members with their current membership tier
- Manually upgrade/downgrade individual members
- Bulk edit multiple members at once
- Export membership data as CSV

### 5. DATA FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────┐
│             FIRESTORE COLLECTIONS                        │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  pricingPlans/                                           │
│  ├── plan_1: {name, price, currency, features, active}  │
│  ├── plan_2: {name, price, currency, features, active}  │
│  └── plan_3: {name, price, currency, features, active}  │
│                                                           │
│  users/{userId}/                                         │
│  ├── membershipTier: "Standard"                          │
│  ├── subscriptionStatus: "active"                        │
│  └── subscriptionExpiry: 2026-12-12                      │
│                                                           │
│  checkoutSessions/                                       │
│  └── {payment tracking & status}                         │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### 6. ADMIN SIDEBAR NAVIGATION

The following pages are interconnected:
- **Membership** `/admin/membership` - Manage members & their tiers
- **Pricing Plans** `/admin/pricing` - Create/edit subscription plans
- **Integrations** `/admin/integrations` - Configure Stripe/PayPal/Ziina

### 7. FEATURES INCLUDED IN EACH PLAN

Each plan can have:
- **Features:** Core plan benefits (e.g., "Event Access", "Email Support")
- **Benefits:** Additional perks per plan
- **Standard Benefits:** Automatically included in ALL plans (shown at bottom of page)

### 8. REAL-TIME SYNC VERIFICATION

Confirm real-time sync is working:
1. Open `/admin/pricing` in one browser tab
2. Open `/dashboard/membership` in another tab
3. Create a new plan and mark it "Active"
4. Watch it appear in `/dashboard/membership` within seconds
5. No page refresh needed on user side

### 9. PAYMENT GATEWAY SUPPORT

Plans support pricing in:
- AED (UAE Dirham)
- USD (US Dollar)
- GBP (British Pound)
- EUR (Euro)

Payment processed via:
- Stripe (global)
- PayPal (global)
- Ziina (MENA region)

### 10. STATUS LEGEND

**Plan Status:**
- `active: true` → Shows on all user dashboards
- `active: false` → Hidden from users, not available for purchase

**Subscription Status:**
- `active` → User has paid, subscription valid
- `cancelled` → User cancelled subscription
- `expired` → Subscription renewal period passed
