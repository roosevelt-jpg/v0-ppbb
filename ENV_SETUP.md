# Environment Variables Configuration

Copy the following environment variables to your `.env.local` file:

## Firebase Configuration
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Stripe Configuration
```
# Stripe API Keys
STRIPE_SECRET_KEY=sk_live_... or sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... or pk_test_...

# Webhook Secret (for receiving Stripe events)
STRIPE_WEBHOOK_SECRET=whsec_...
```

## SendGrid Configuration
```
# SendGrid API Key (set via Admin Dashboard, but configure here for backend)
SENDGRID_API_KEY=SG.....
```

## Optional: Analytics & Monitoring
```
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your_vercel_analytics_id
```

## How to Get These Keys

### Firebase
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or select existing one
3. Go to Project Settings → Service Accounts
4. Copy your config values

### Stripe
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to Developers → API Keys
3. Copy your publishable and secret keys
4. Create a webhook endpoint pointing to `/api/webhooks/stripe`
5. Copy the webhook signing secret

### SendGrid
1. Go to [SendGrid](https://sendgrid.com)
2. Navigate to Settings → API Keys
3. Create a new API key
4. Can also be configured in Admin Dashboard (/admin/settings)

## Important Notes

- **NEVER commit `.env.local` to git** - it contains sensitive credentials
- Public keys (prefixed with `NEXT_PUBLIC_`) are safe to be in the codebase
- Secret keys must be kept private and configured in your deployment platform
- For production, configure these in your hosting platform's environment variables (Vercel, etc.)
- The Admin Dashboard allows runtime configuration of Stripe and SendGrid keys encrypted in Firestore

## Production Deployment

When deploying to production:

1. **Vercel**: Use the Environment Variables section in your project settings
2. **Self-hosted**: Create `.env.production.local` with production keys
3. **All platforms**: Ensure webhook endpoints are accessible and correctly configured

## Verifying Setup

After configuration:
1. Admin panel at `/admin` (requires authentication)
2. Visit `/admin/health` to check service status
3. Check `/admin/settings` to verify API configuration is saved
4. Test by making a donation to verify Stripe integration
