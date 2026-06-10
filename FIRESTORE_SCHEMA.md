# Firestore Database Schema

## Collections Overview

### 1. **users**
Stores user profiles for all roles (member, volunteer, business, admin)
- `id`: User UID from Firebase Auth
- `email`: User email
- `firstName`, `lastName`: Name
- `role`: 'member' | 'volunteer' | 'business' | 'admin'
- `phone`, `nationality`: Contact info
- `location`: { city, emirate, country, area }
- `skills[]`: Array of skill tags
- `volunteeredHours`, `totalDonated`: Aggregate stats
- `active`: Boolean status
- `createdAt`, `updatedAt`: Timestamps

### 2. **apiConfigs**
Stores encrypted API credentials for external services
- `id`: Service name (stripe, sendgrid, etc.)
- `serviceName`: Name of the service
- `apiKey`: Encrypted API key
- `apiSecret`: Encrypted secret (optional)
- `endpoint`: Service endpoint URL (optional)
- `status`: 'active' | 'inactive'
- `lastChecked`: Last health check timestamp
- `isHealthy`: Boolean health status
- `errorMessage`: Error details if unhealthy
- `createdAt`, `updatedAt`: Timestamps

### 3. **siteSettings**
Global site configuration (single document)
- `id`: 'default'
- `siteName`: Site name
- `siteDescription`: Short description
- `logoUrl`: White logo URL
- `logoUrlDark`: Dark logo URL
- `faviconUrl`: Favicon URL
- `primaryColor`, `secondaryColor`, `accentColor`: Brand colors
- `email`, `phone`, `address`: Contact info
- `socialLinks`: { facebook, twitter, instagram, linkedin }
- `footerText`: Footer content
- `maintenanceMode`: Boolean
- `createdAt`, `updatedAt`: Timestamps

### 4. **pages**
CMS pages with SEO metadata
- `id`: Unique page ID
- `slug`: URL-friendly slug
- `title`: Page title
- `description`: Page description
- `content`: HTML/Markdown content
- `seoTitle`, `seoDescription`: SEO meta tags
- `keywords[]`: Array of keywords
- `imageUrl`: Featured image
- `status`: 'draft' | 'published'
- `order`: Display order
- `createdAt`, `updatedAt`: Timestamps

### 5. **events**
Community events and fundraisers
- `id`: Unique event ID
- `slug`: URL-friendly slug
- `title`: Event name
- `description`: Full description
- `imageUrl`: Event image
- `location`: Event location
- `date`, `time`, `endTime`: Schedule
- `capacity`, `registered`: Capacity tracking
- `eventType`: 'community' | 'fundraiser' | 'workshop' | 'charity'
- `category`: Event category
- `organizerId`: User ID of organizer
- `status`: 'draft' | 'published' | 'active' | 'completed' | 'cancelled'
- `attendees[]`: Array of attendee user IDs
- `createdAt`, `updatedAt`: Timestamps

### 6. **opportunities**
Volunteer and job opportunities
- `id`: Unique opportunity ID
- `slug`: URL-friendly slug
- `title`: Opportunity title
- `description`: Full description
- `type`: 'volunteer' | 'job' | 'gig'
- `category`: Opportunity category
- `businessId`: Business user ID
- `applications`, `accepted`: Application counts
- `duration`, `hoursPerMonth`: Time commitment
- `applicants[]`: Array of applicant user IDs
- `status`: 'open' | 'closed' | 'filled'
- `createdAt`, `updatedAt`: Timestamps

**Subcollection: opportunities/{opportunityId}/applications**
- `id`: Application ID
- `applicantId`: User ID of applicant
- `businessId`: Business user ID
- `status`: 'pending' | 'accepted' | 'rejected'
- `createdAt`, `updatedAt`: Timestamps

### 7. **donations**
Donation records
- `id`: Unique donation ID
- `donorId`: User ID of donor
- `campaignId`: Campaign ID
- `amount`: Donation amount
- `currency`: Currency code (AED, USD, etc.)
- `paymentMethod`: 'card' | 'bank_transfer'
- `status`: 'pending' | 'completed' | 'failed'
- `stripeTransactionId`: Stripe transaction ID
- `isAnonymous`: Boolean
- `notes`: Optional notes
- `createdAt`, `updatedAt`: Timestamps

### 8. **campaigns**
Fundraising campaigns
- `id`: Unique campaign ID
- `title`: Campaign name
- `description`: Full description
- `goal`: Target amount
- `raised`: Current amount raised
- `currency`: Currency code
- `status`: 'active' | 'completed' | 'paused'
- `imageUrl`: Campaign image
- `createdAt`, `endsAt`, `updatedAt`: Timestamps

### 9. **newsletters**
Newsletter subscriptions
- `id`: Email address (or unique ID)
- `email`: Subscriber email
- `subscribedAt`: Subscription timestamp
- `unsubscribedAt`: Unsubscription timestamp (optional)
- `isActive`: Boolean subscription status

### 10. **auditLogs**
Admin action audit trail
- `id`: Unique log ID
- `adminId`: Admin user ID
- `action`: Description of action
- `target`: Type of resource affected
- `targetId`: ID of affected resource
- `changes`: Object tracking what changed
- `timestamp`: When action occurred
- `ipAddress`: IP address of admin

### 11. **systemHealth**
Service health status monitoring
- `id`: Service name
- `serviceName`: Name of service
- `status`: 'healthy' | 'degraded' | 'down'
- `lastChecked`: Last health check timestamp
- `responseTime`: API response time in ms
- `errorMessage`: Error details if applicable
- `metadata`: Additional service-specific data

## Security Model

### Role-Based Access Control (RBAC)
1. **Admin**: Full read/write access to all data
2. **Business**: Read own profile, write opportunities, read donations to own business
3. **Member/Volunteer**: Read public data, write own profile, read own donations
4. **Unauthenticated**: Read public pages, site settings, campaigns

### Data Privacy
- Sensitive API keys are encrypted before storage
- User private data stored in subcollection with restricted access
- Audit logs track all admin actions
- Donation records limited to donor and admin

### Cross-Region Compliance
- Support for UAE (AED currency, Arabic RTL)
- GDPR-compliant data handling
- Encrypted sensitive information
