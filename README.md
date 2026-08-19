# PPBB Platform - Passive Blessings Community

A comprehensive full-stack community platform built with Next.js 16, Firestore, Firebase Auth, Stripe, and SendGrid. Everything is configured to pull live data from Firestore—no hard-coded values.

## Features

### Public Website
- Dynamic homepage with live site settings from Firestore
- CMS-managed pages with SEO metadata
- Dark/light mode switcher throughout
- Arabic/English internationalization (RTL support)
- Responsive design

### Member Dashboard
- User authentication and profile management
- Event registration and tracking
- Volunteer hours logging
- Donation history
- Community marketplace access
- Real-time stats pulling from Firestore

### Business Portal
- Create and manage volunteer opportunities
- Track applications and conversions
- Performance analytics
- Referral system
- Community engagement metrics

### Admin Dashboard
- Complete platform overview
- Member and business management
- CMS content management with full CRUD
- API configuration (Stripe, SendGrid) with encryption
- System health monitoring for all services
- Audit logging for all admin actions
- Site branding and settings (colors, logo, favicon)
- Environment variable management

### Payment Processing
- Stripe integration for donations
- Real-time payment status tracking
- Webhook handling for payment events
- Donation recording to Firestore

### Email Integration
- SendGrid for transactional emails
- Newsletter management
- Email template support

## Quick Start

### 1. Prerequisites
```
Node.js 18+
npm/pnpm
Firebase account
Stripe account
SendGrid account
```

### 2. Installation
```bash
pnpm install
```

### 3. Environment Setup
```bash
# Copy environment template
cp .env.example .env.local
```

Configure in `.env.local`:
```
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Stripe
STRIPE_SECRET_KEY=sk_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

See [ENV_SETUP.md](./ENV_SETUP.md) for complete configuration guide.

### 4. Firebase Configuration

Deploy Firestore Security Rules:
```bash
firebase deploy --only firestore:rules
```

### 5. Create Admin Account

1. Sign up via `/signup`
2. In Firebase Console: users collection → your user doc → change `role` to `"admin"`
3. Navigate to `/admin`

### 6. Configure Platform

1. Visit `/admin/settings`
2. Add Stripe API key
3. Add SendGrid API key
4. Customize branding (colors, logo, site name)

### 7. Run Development Server
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Architecture

### Frontend Routes
```
/                    Public homepage (live data from Firestore)
/pages/[slug]       Dynamic CMS pages
/login              Authentication
/signup             User registration
/dashboard          Member dashboard
/business           Business portal
/admin              Admin dashboard
```

### Collections & Data
- **users**: Members, volunteers, businesses, admins
- **siteSettings**: Global configuration (no hardcoding)
- **pages**: CMS content with SEO
- **events**: Community events
- **opportunities**: Volunteer/job postings
- **donations**: Payment records
- **campaigns**: Fundraising campaigns
- **newsletters**: Email subscriptions
- **apiConfigs**: Encrypted API keys
- **auditLogs**: Admin action history
- **systemHealth**: Service status monitoring

### Key Technologies
- **Next.js 16**: React framework with App Router
- **Firebase**: Authentication and Firestore database
- **Firestore**: Real-time NoSQL database
- **next-themes**: Dark/light mode
- **next-intl**: Internationalization (English/Arabic)
- **Stripe**: Payment processing
- **SendGrid**: Email delivery
- **Tailwind CSS**: Styling

## Security

✅ **Firebase Security Rules** - Role-based access control
✅ **Encrypted Storage** - API keys encrypted before Firestore storage
✅ **Audit Logging** - All admin actions logged
✅ **Auth Middleware** - Protected routes by user role
✅ **Input Validation** - Server-side validation on all APIs
✅ **CORS Protection** - API endpoints protected

## Admin Features

### Settings Page (`/admin/settings`)
- Site branding (name, description, colors)
- Logo and favicon management
- Contact information
- API key configuration (Stripe, SendGrid)
- Maintenance mode toggle

### CMS Pages (`/admin/pages`)
- Create, edit, delete pages
- SEO metadata (title, description, keywords)
- Publish/draft status
- Accessible at `/pages/{slug}`

### System Health (`/admin/health`)
- Real-time service status checks
- Stripe API health
- SendGrid API health
- Firebase connectivity
- Response time monitoring

### Members, Events, Businesses
- View and manage users
- Monitor events and registrations
- Track business activity

## Deployment

### Deploy
```bash
git push origin main
# Trigger your deployment pipeline
# Configure env vars in your hosting environment
```

### Self-Hosted
```bash
pnpm build
pnpm start
```

## Live Data Flow

Everything pulls from Firestore:

1. **Homepage**: Fetches `siteSettings` document for branding
2. **Pages**: Dynamic routes query `pages` collection by slug
3. **Dashboards**: User stats aggregated from Firestore collections
4. **Admin Settings**: API keys stored encrypted in `apiConfigs`
5. **Health Checks**: Service health queried in real-time

No environment variables needed for content—all configurable in admin panel.

## Important Notes

- **NO hard-coded content**: All frontend text, colors, logos, etc. pulled from Firestore
- **Admin controls everything**: Branding, pages, API keys all manageable from admin panel
- **Encrypted secrets**: Stripe/SendGrid keys encrypted before storage
- **RTL support**: Arabic language with proper direction handling
- **Dark mode**: Automatic light/dark logo switching based on theme

## Troubleshooting

### Login issues
- Check Firebase auth is enabled
- Verify user role in Firestore

### API services down
- Visit `/admin/health` to check status
- Verify API keys in `/admin/settings`
- Check service status pages

### Content not loading
- Confirm CMS pages are published
- Check Firestore Rules aren't blocking access

## Documentation

- [Environment Setup](./ENV_SETUP.md)
- [Firestore Schema](./FIRESTORE_SCHEMA.md)
- [Next.js Docs](https://nextjs.org/docs)
- [Firebase Docs](https://firebase.google.com/docs)
- [Stripe Docs](https://stripe.com/docs)

## License

Passive Blessings © 2025
