# Stripe Setup Guide for Passive Blessings Recurring Donations

## Quick Start

This guide walks you through setting up Stripe to enable monthly recurring donations.

---

## Step 1: Create Stripe Account

1. Visit [stripe.com](https://stripe.com)
2. Click "Start now" or "Sign up"
3. Enter email and create account
4. Choose business type: "Charity/Nonprofit"
5. Verify email
6. Complete account information

---

## Step 2: Get API Keys

### For Development (Testing)

1. Log into Stripe Dashboard
2. Click "Developers" in left sidebar
3. Click "API keys"
4. You'll see two tabs: "Standard keys" and "Restricted keys"
5. Under "Standard keys", you'll find:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`)

6. Copy both keys:
   ```bash
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   ```

### For Production

Once you go live, repeat the above but switch to "Live mode":
1. Click toggle in top right of API keys page
2. Switch from "Test mode" to "Live mode"
3. Get live keys:
   - Publishable: `pk_live_...`
   - Secret: `sk_live_...`

---

## Step 3: Set Up Webhook

Webhooks allow Stripe to notify your app when payments succeed, fail, or subscriptions change.

### Create Webhook Endpoint

1. In Stripe Dashboard, go **Developers** → **Webhooks**
2. Click "Add endpoint"
3. Webhook URL: 
   ```
   https://yourdomain.com/api/webhooks/stripe
   ```
   (Use your hosting platform deployment URL)

4. Select events to listen for:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

5. Click "Add endpoint"

6. Click the created endpoint
7. Scroll down to "Signing secret"
8. Click "Reveal" to see signing secret
9. Copy signing secret:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### Local Testing with Stripe CLI

To test webhooks locally during development:

1. Download [Stripe CLI](https://stripe.com/docs/stripe-cli)
2. Install it
3. Run:
   ```bash
   stripe login
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
4. Copy the webhook signing secret from CLI output:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

---

## Step 4: Add Environment Variables

### In hosting platform

1. Go to [hosting.com](https://hosting.com)
2. Open your project
3. Settings → Environment Variables
4. Add three variables:
   ```
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```
5. Save and redeploy

### Locally (.env.local)

Create `.env.local` in project root:
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Note: `NEXT_PUBLIC_` prefix makes it available in browser code.

---

## Step 5: Test Monthly Donations

### Using Stripe Test Cards

Use these test card numbers in the donation flow:

**Success:**
- Card: `4242 4242 4242 4242`
- Exp: Any future date (e.g., 12/25)
- CVC: Any 3 digits (e.g., 123)

**Requires Authentication:**
- Card: `4000 0025 0000 3155`

**Declined:**
- Card: `4000 0000 0000 0002`

### Test Flow

1. Visit `/donate?recurring=true`
2. Select cause and amount
3. Click "Set Up Monthly Donation"
4. Enter test card: `4242 4242 4242 4242`
5. Complete checkout
6. Check `/dashboard/recurring-donations`
7. Subscription should appear

### Test Webhook Locally

While running Stripe CLI listener:
1. Create test subscription (steps above)
2. Check your terminal - you should see webhook events
3. Monitor Firestore - subscription collection should update

---

## Step 6: Configure Stripe Dashboard

### Product Setup

1. Go to **Products** in Stripe Dashboard
2. Create product: "Passive Blessings Monthly Donation"
3. This will be used for all recurring donations

### Email Receipts (Optional)

1. Settings → **Email settings**
2. Enable automated emails:
   - Subscription created
   - Payment failed
   - Upcoming renewal

---

## Troubleshooting

### Webhook Not Firing

**Problem:** Donations created but not appearing in Firestore

**Solutions:**
1. Check webhook endpoint is public (not localhost)
2. Verify webhook signing secret is correct
3. Check Stripe Dashboard → Webhooks → Events for failures
4. Check app logs for errors in `/api/webhooks/stripe`

### Payment Fails During Testing

**Problem:** Card declined or checkout fails

**Solutions:**
1. Use test card: `4242 4242 4242 4242`
2. Check browser console for errors
3. Use Stripe test mode (not live)
4. Verify STRIPE_SECRET_KEY is set correctly

### Subscriptions Not Appearing in Dashboard

**Problem:** User creates subscription but dashboard empty

**Solutions:**
1. Check Firestore `subscriptions` collection
2. Verify Firestore listener is running
3. Check app console for errors
4. Verify user is authenticated
5. Clear browser cache and reload

### PDF Receipts Not Generating

**Problem:** Admin verifies but no receipt URL appears

**Solutions:**
1. Check Firebase Storage permissions
2. Verify jsPDF is installed: `pnpm list jspdf`
3. Check app console for PDF generation errors
4. Verify API endpoint `/api/donations/generate-receipt` responds

---

## Environment Variables Summary

```bash
# Required for recurring donations
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Existing Firebase vars (unchanged)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
PRIVATE_KEY=...
FIREBASE_ADMIN_PRIVATE_KEY=...
FIREBASE_ADMIN_CLIENT_EMAIL=...
```

---

## Going Live

### Before Production

1. Switch Stripe account to live mode
2. Complete identity verification in Stripe
3. Enable live API keys
4. Update `.env` with live keys
5. Create webhook endpoint with production URL
6. Test donation flow end-to-end
7. Monitor Stripe dashboard for transactions

### Post-Launch

1. Monitor Stripe Dashboard daily
2. Check webhook delivery (Webhooks → Events)
3. Monitor failed payments
4. Respond to failed payment notifications
5. Keep API keys secure (never commit to GitHub)

---

## Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe CLI Guide](https://stripe.com/docs/stripe-cli)
- [Webhook Best Practices](https://stripe.com/docs/webhooks)
- [Testing Guide](https://stripe.com/docs/testing)

---

## Support

For issues:

1. **Stripe Support:** Check Stripe Dashboard → Help
2. **App Logs:** Check hosting platform deployment logs
3. **Firebase:** Check Firestore for data
4. **Webhooks:** Check Stripe Dashboard → Webhooks → Events

---

That's it! Your recurring donation system is ready to go.
