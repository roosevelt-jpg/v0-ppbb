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

## Google Maps API (for Geolocation)
```
# Required for location detection during signup
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
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

## How to Get These Keys

### Firebase
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or select existing one
3. Go to Project Settings → Service Accounts
4. Copy your config values

### Google Maps API
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable Maps JavaScript API, Geocoding API, and Places API
4. Go to Credentials → Create API Key
5. Restrict API key to your domain(s)
6. Copy the API key to `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

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
- For production, configure these in your hosting platform's environment variables
- The Admin Dashboard allows runtime configuration of Stripe and SendGrid keys encrypted in Firestore
- Images uploaded during signup are stored as Base64 in Firestore (no external storage required)
- Location data is captured automatically when user allows geolocation permission
- Date/time fields are populated with current values automatically

## Production Deployment

In your hosting environment, add at minimum:

### Firebase client (public)
```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=pasiveblessings
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

### Firebase Admin (server — required for API routes & build)
Either paste the full service account JSON as one variable:
```
GCP_SERVICE_ACCOUNT={"type":"service_account","project_id":"...",...}
```

Or use separate fields:
```
FIREBASE_ADMIN_PROJECT_ID=pasiveblessings
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-...@pasiveblessings.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=pasiveblessings-media
```

Optional but recommended:
```
INTEGRATION_ENCRYPTION_KEY=your-32-char-secret
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

Redeploy after saving variables. Without Admin credentials, the build and API routes will fail.

## Production Deployment

When deploying to production:

1. **Managed hosting**: use the environment variable section in your project settings
2. **Self-hosted**: create `.env.production.local` with production keys
3. **All platforms**: ensure webhook endpoints are accessible and correctly configured

## Verifying Setup

After configuration:
1. Admin panel at `/admin` (requires authentication)
2. Visit `/admin/health` to check service status
3. Check `/admin/settings` to verify API configuration is saved
4. Test signup flow to verify geolocation and image upload work
5. Test by making a donation to verify Stripe integration

