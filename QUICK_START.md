# Quick Start: Complete Donation Features

## What You Got

✅ **One-time donations** with auto PDF receipts
✅ **Monthly recurring donations** via Stripe  
✅ **Member dashboard** for subscription management
✅ **Admin verification** workflow
✅ **Real-time Firestore** sync
✅ **Production-ready** code

---

## 3-Minute Setup

### 1. Get Stripe Keys (2 min)
1. Go to [stripe.com](https://stripe.com) → Sign up
2. Developers → API Keys
3. Copy: `sk_test_...` and `whsec_...`

### 2. Add Environment Variables (1 min)
Vercel Dashboard → Project Settings → Environment Variables:
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3. Deploy
That's it! Push to GitHub → Vercel redeploys automatically

---

## Test It

### One-Time with Receipt
1. Go to `/donate`
2. Upload payment proof
3. Go to `/admin/donation-verification`
4. Click verify → PDF generates
5. Member downloads from `/dashboard/donations`

### Monthly Subscription
1. Go to `/donate?recurring=true`
2. Card: `4242 4242 4242 4242`
3. Check `/dashboard/recurring-donations`
4. Test pause/resume/cancel

---

## Key Pages

| Page | Purpose |
|------|---------|
| `/donate` | One-time donations |
| `/donate?recurring=true` | Monthly donations |
| `/dashboard/donations` | View all donations |
| `/dashboard/recurring-donations` | Manage subscriptions |
| `/admin/donation-verification` | Verify & approve |

---

## Files Created

| File | Purpose |
|------|---------|
| `lib/pdf-receipt-generator.ts` | PDF generation |
| `lib/stripe-utils.ts` | Stripe wrapper |
| `app/api/donations/generate-receipt/route.ts` | Receipt API |
| `app/api/subscriptions/*` | Subscription APIs |
| `app/dashboard/recurring-donations/page.tsx` | Subscription dashboard |

---

## Documentation

- **IMPLEMENTATION_SUMMARY.md** - Full overview
- **COMPLETE_DONATION_FEATURES.md** - Detailed docs
- **STRIPE_SETUP_GUIDE.md** - Setup instructions
- **QUICK_START.md** - This file

---

## Troubleshooting

**Webhook not firing?**
- Check Stripe webhook endpoint in Dashboard
- Use Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

**Receipt not generating?**
- Check Firebase Storage permissions
- Check app logs in Vercel

**Subscription not appearing?**
- Check Firestore `subscriptions` collection
- Clear browser cache
- Check browser console for errors

See **STRIPE_SETUP_GUIDE.md** for full troubleshooting.

---

## Environment Variables Checklist

```bash
# NEW (for donation features)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# EXISTING (Firebase - don't touch)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
# ... all other Firebase vars
```

---

## What's Stored Where

**Firestore collections:**
- `donationSubmissions` - One-time donations (with receiptUrl)
- `subscriptions` - Monthly subscriptions
- `subscriptions/{id}/charges` - Charge history

**Firebase Storage:**
- `receipts/donation_{id}_{timestamp}.pdf` - Receipt PDFs

**Stripe:**
- Handles all card data (PCI-compliant)
- Stores subscription info
- Processes monthly charges

---

## Real-Time Features

- Dashboard auto-refreshes when subscription status changes
- Member sees subscription immediately after checkout
- Admin sees donations in real-time
- Charges logged automatically
- Payment failures recorded

---

## Next Steps

1. ✅ Set Stripe environment variables
2. ✅ Deploy to Vercel
3. ✅ Test one-time donation flow
4. ✅ Test recurring donation flow
5. ✅ Monitor Stripe dashboard for real transactions
6. ✅ Switch to Stripe production mode
7. ✅ Update environment variables with live keys

---

## Support

- **Stripe Docs:** https://stripe.com/docs
- **Firebase Docs:** https://firebase.google.com/docs
- **Vercel Docs:** https://vercel.com/docs

---

## Summary

You have a production-ready donation system with:
- PDF receipts
- Monthly subscriptions
- Full member control
- Real-time updates
- Secure payment handling

Just add Stripe keys and deploy!
