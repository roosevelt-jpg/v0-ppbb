# AWS Deployment Handoff — Passive Blessings

**Audience:** Developer finishing production deployment on AWS  
**Owner contact:** Roosevelt / Passive Blessings team  
**Last updated:** 2026-08-19  
**Repo:** https://github.com/roosevelt-jpg/v0-ppbb (`main`)

This document picks up where the initial AWS setup stopped. Use it as the single source of truth to connect to the existing EC2 instance, deploy the app, and complete HTTPS + DNS.

For app architecture and env variable details, also read:
- `HANDOVER.md` — platform overview
- `ENV_SETUP.md` — full environment variable list

---

## 1. Current status (as of handoff)

### Done

| Item | Status |
|------|--------|
| AWS account created | Yes — **Passive Blessings (921810471203)** |
| Region | **eu-north-1** (Stockholm) |
| EC2 instance launched | Yes — name **Passive-Blessings** |
| EC2 public IP | **13.53.51.245** |
| EC2 private IP | **172.31.25.56** |
| SSH key pair | **passiveblessings-ec2-prod.pem** (with project owner) |
| GitHub repo cloned on EC2 | Yes — `/home/ec2-user/v0-ppbb` |
| GitHub SSH deploy key on EC2 | Yes — `~/.ssh/ec2-github` + `~/.ssh/config` for `github.com` |
| Latest code pulled | Yes — includes commit `e224e17` (Lucide icon build fix + `pnpm-lock.yaml`) |
| Swap file created | Yes — 4 GiB (may need re-check after reboot) |
| `pnpm install` | Completed (~1040 packages) |
| Firebase project updated locally | New credentials in owner's `.env.local` (project: **passiveblessings-cc0ef**) |

### Not done / blocked

| Item | Status |
|------|--------|
| `pnpm build` on EC2 | **Failed** — Node OOM / `SIGABRT` during `next build` |
| PM2 app running | **No** — `.next/standalone/server.js` never generated |
| `.env.production.local` on EC2 | **Verify** — may be missing or incomplete |
| Application Load Balancer (ALB) | Not created |
| ACM SSL certificate | Not created |
| DNS pointing to AWS | Not updated |
| Security group hardening (3000 only from ALB) | Not finalized |
| Optional AWS S3 for event assets | Not configured (Firebase is default) |
| Stripe webhooks for production domain | Not updated |

---

## 2. What the owner must give you (Day 0 access)

Request these before starting:

1. **AWS Console** — IAM user or role with EC2, VPC, ELB, ACM, Route 53 (if used), S3 access
2. **EC2 SSH private key** — `passiveblessings-ec2-prod.pem`
3. **GitHub** — read access to `roosevelt-jpg/v0-ppbb` (or confirm EC2 deploy key still works)
4. **Production `.env.local`** — full secrets file from owner (never commit to git)
5. **Domain registrar access** — GoDaddy / Vercel DNS / Route 53 (wherever `passiveblessings.com` DNS lives)
6. **Firebase Console** — project **passiveblessings-cc0ef**
7. **Stripe dashboard** — main + hosting Stripe keys for production webhooks

---

## 3. App stack (deployment-relevant)

| Item | Value |
|------|-------|
| Framework | Next.js 16 (App Router), React 19 |
| Package manager | **pnpm** (lockfile committed) |
| Build output | **`output: 'standalone'`** in `next.config.js` |
| Build command | `pnpm build` → runs `next build --webpack` |
| Runtime entry | `.next/standalone/server.js` |
| Default port | `3000` |
| Process manager | PM2 (recommended) |
| Primary storage | Firebase Storage (GCS bucket) |
| Optional event assets | AWS S3 via Admin → Integrations (not required for launch) |

---

## 4. Connect to the existing EC2 instance

### 4.1 SSH from Windows (PowerShell)

Fix PEM permissions once:

```powershell
$pem = "C:\Users\pc\Downloads\passiveblessings-ec2-prod.pem"
icacls $pem /inheritance:r
icacls $pem /grant:r "$($env:USERNAME):(R)"
```

Connect:

```powershell
ssh -i $pem ec2-user@13.53.51.245
```

### 4.2 If SSH fails

Check in AWS Console → EC2 → Instances → **Passive-Blessings**:

- Instance state = **running**
- Public IPv4 = **13.53.51.245** (may change after stop/start — use Elastic IP if production)
- Security group allows **inbound TCP 22** from your IP

### 4.3 AWS Session Manager (fallback)

If SSH key is lost, use **EC2 Instance Connect** or **SSM Session Manager** from the AWS Console (browser terminal).

---

## 5. Recommended deployment approach

The EC2 instance is likely **too small to build reliably** (install succeeded with swap; build still OOM'd).

Pick **one** approach:

### Option A — Recommended: build locally or in CI, ship artifact to EC2

Avoids OOM on small instances.

**On a machine with 8 GB+ RAM (developer laptop or GitHub Actions):**

```bash
git clone git@github.com:roosevelt-jpg/v0-ppbb.git
cd v0-ppbb
git checkout main
pnpm install --frozen-lockfile
export NODE_OPTIONS="--max-old-space-size=4096"
pnpm build

# Prepare standalone bundle
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public
tar -czf passive-blessings-standalone.tgz .next/standalone
```

Copy to EC2:

```powershell
scp -i $pem passive-blessings-standalone.tgz ec2-user@13.53.51.245:/home/ec2-user/
scp -i $pem .env.local ec2-user@13.53.51.245:/home/ec2-user/app/.env.production.local
```

On EC2:

```bash
mkdir -p ~/app && cd ~/app
tar -xzf ~/passive-blessings-standalone.tgz
mv .next/standalone/* . 2>/dev/null || true
# If tarball extracted to .next/standalone:
# cd .next/standalone

export NODE_ENV=production
export PORT=3000
pm2 delete passive-blessings || true
pm2 start server.js --name passive-blessings
pm2 save
pm2 startup
```

### Option B — Build on EC2 (only if instance is upgraded)

**Minimum recommended:** `t3.medium` (4 GB RAM) or larger.

```bash
cd ~/v0-ppbb
git pull origin main

# Re-enable swap after reboot if needed
sudo swapon --show || {
  sudo fallocate -l 4G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=4096
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
}

sudo corepack enable
corepack prepare pnpm@11.22.0 --activate

rm -rf node_modules .next
pnpm install --frozen-lockfile

export NODE_OPTIONS="--max-old-space-size=3072"
export NEXT_DISABLE_ESLINT=1
pnpm build

# Required for standalone runtime
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public

pm2 delete passive-blessings || true
pm2 start .next/standalone/server.js --name passive-blessings --cwd /home/ec2-user/v0-ppbb/.next/standalone
pm2 save
pm2 startup
```

---

## 6. Environment file on EC2

Place production secrets at:

```text
/home/ec2-user/v0-ppbb/.env.production.local
```

(or next to `server.js` if using Option A artifact deploy)

Copy from owner's machine:

```powershell
scp -i $pem "C:\path\to\.env.local" ec2-user@13.53.51.245:/home/ec2-user/v0-ppbb/.env.production.local
```

### Minimum required variables

See `ENV_SETUP.md`. At minimum for launch:

```bash
# Firebase client
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET_NAME=

# Firebase admin
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
FIREBASE_STORAGE_BUCKET=

# Site URLs (set to final production domain BEFORE go-live)
NEXT_PUBLIC_SITE_URL=https://www.passiveblessings.com
NEXT_PUBLIC_APP_URL=https://www.passiveblessings.com
NEXT_PUBLIC_BASE_URL=https://www.passiveblessings.com
NODE_ENV=production

# Stripe (main + hosting if /admin/hosting is used)
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_HOSTING_SECRET_KEY=
NEXT_PUBLIC_STRIPE_HOSTING_PUBLISHABLE_KEY=
```

**Important:** If env vars change after build, restart PM2 — but `NEXT_PUBLIC_*` values are baked in at **build time**. Rebuild if those change.

---

## 7. Verify app is running (before ALB)

On EC2:

```bash
curl -I http://127.0.0.1:3000
pm2 status
pm2 logs passive-blessings --lines 50
```

From your machine (temporary — lock down later):

```bash
curl -I http://13.53.51.245:3000
```

Security group must allow **TCP 3000** temporarily for this test, or use SSH tunnel:

```powershell
ssh -i $pem -L 3000:127.0.0.1:3000 ec2-user@13.53.51.245
# then open http://localhost:3000
```

---

## 8. HTTPS + load balancer (remaining AWS work)

### 8.1 Elastic IP (recommended)

Assign an Elastic IP to the EC2 instance so the public IP does not change on reboot.

### 8.2 Application Load Balancer

1. EC2 → **Load Balancers** → Create **Application Load Balancer**
2. Scheme: **internet-facing**
3. IP type: **IPv4**
4. VPC: same as EC2
5. Subnets: at least 2 AZs in **eu-north-1**
6. Security group: allow **80, 443** from `0.0.0.0/0`

### 8.3 Target group

1. Target type: **Instances**
2. Protocol: **HTTP**, port **3000**
3. Health check path: `/` (or `/api/health` if added)
4. Register EC2 instance **Passive-Blessings**

### 8.4 Listeners

| Listener | Action |
|----------|--------|
| HTTP :80 | Redirect to HTTPS :443 |
| HTTPS :443 | Forward to target group (attach ACM cert) |

### 8.5 ACM certificate

1. AWS Certificate Manager → **Request public certificate**
2. Domain: `passiveblessings.com` and `www.passiveblessings.com`
3. Validation: **DNS** (add CNAME records at domain registrar)
4. Attach cert to ALB HTTPS listener

### 8.6 DNS

Point production domain to ALB (not directly to EC2 IP):

| Type | Name | Value |
|------|------|-------|
| CNAME or ALIAS | `www` | ALB DNS name |
| ALIAS | `@` (apex) | ALB (Route 53) or use registrar ALIAS if supported |

After DNS propagates, update env URLs and **rebuild** if `NEXT_PUBLIC_*` URLs changed.

### 8.7 Security group hardening (post-launch)

- EC2 security group: allow **3000** only from ALB security group
- Remove public **3000** access
- Keep **22** restricted to known admin IPs

---

## 9. Firebase post-deploy (required once)

From a machine with Firebase CLI logged in:

```bash
cd v0-ppbb
firebase use passiveblessings-cc0ef   # confirm project ID with owner
pnpm run deploy:storage-rules
pnpm run deploy:firestore-rules
pnpm run deploy:firestore-indexes
```

Storage rules fix public CMS image reads and proxy behavior for legacy GCS URLs.

---

## 10. Stripe webhooks (production)

After domain is live, configure in Stripe Dashboard:

| Endpoint | URL |
|----------|-----|
| Main Stripe | `https://www.passiveblessings.com/api/webhooks/stripe` |
| Hosting Stripe (if separate account) | confirm with `/admin/hosting` integration |

Copy webhook signing secrets into production env / Admin → Integrations.

---

## 11. Optional: AWS S3 for event assets

Default storage is **Firebase**. S3 is optional and configured in **Admin → Integrations**:

- Integration: **Cloud Storage (S3)**
- Fields: `accessKeyId`, `secretAccessKey`, `bucketName`, `region`, optional `publicBaseUrl`
- Integration: **Event Assets Storage** → set provider to `aws_s3`

Code reference: `lib/resolve-asset-storage.ts`

---

## 12. PM2 persistence across reboot

```bash
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ec2-user --hp /home/ec2-user
# run the command PM2 prints, then:
pm2 save
```

---

## 13. Production smoke test checklist

- [ ] `https://www.passiveblessings.com` loads homepage
- [ ] Images load (Firebase / `/api/media` proxy — no broken CMS images)
- [ ] Login / signup works
- [ ] `/admin` accessible for admin user
- [ ] `/marketplace` and `/directory` load
- [ ] File upload works (admin CMS image)
- [ ] Donation / checkout test (Stripe test mode first)
- [ ] PM2 survives `sudo reboot` (app comes back)
- [ ] ALB health check = healthy
- [ ] No secrets in git / public repos

---

## 14. Troubleshooting

### `Permission denied (publickey)` on git clone

EC2 SSH config must point to deploy key:

```bash
cat ~/.ssh/config
# Should contain:
# Host github.com
#   HostName github.com
#   User git
#   IdentityFile ~/.ssh/ec2-github
#   IdentitiesOnly yes
```

Test: `ssh -T git@github.com`

### `pnpm install` or `pnpm build` → `Killed`

Out of memory. Fix: enable swap (§5 Option B) or use Option A (build elsewhere).

### `next: command not found`

Dependencies not installed. Run `pnpm install` in repo root.

### `Script not found: .next/standalone/server.js`

Build did not finish. Complete `pnpm build` first.

### App starts but no CSS / 404 on static files

Missing standalone copy step:

```bash
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public
```

### `EACCES` from `corepack enable`

Run: `sudo corepack enable`

### Images 403 / corrupted

1. Confirm `pnpm run deploy:storage-rules` deployed to **passiveblessings-cc0ef**
2. Confirm `FIREBASE_STORAGE_BUCKET` matches Firebase project bucket
3. Check `/api/media?...` proxy works

### Cannot SSH to instance

Use AWS Console → EC2 → Connect → **EC2 Instance Connect** (browser shell).

---

## 15. Quick reference

| Resource | Value |
|----------|-------|
| AWS account | Passive Blessings (921810471203) |
| Region | eu-north-1 |
| EC2 name | Passive-Blessings |
| EC2 public IP | 13.53.51.245 |
| SSH user | ec2-user |
| SSH key | passiveblessings-ec2-prod.pem |
| App path on EC2 | /home/ec2-user/v0-ppbb |
| Git remote | git@github.com:roosevelt-jpg/v0-ppbb.git |
| Branch | main |
| Latest known good commit | e224e17 |
| Firebase project | passiveblessings-cc0ef |
| Build output | .next/standalone/server.js |
| App port | 3000 |

---

## 16. Suggested finish order (developer)

1. Get SSH + `.env.local` from owner  
2. Confirm EC2 is running; SSH in  
3. Deploy using **Option A** (build off-box) unless instance is upgraded  
4. Confirm `curl localhost:3000` + PM2 healthy  
5. Create ALB + target group + ACM cert  
6. Update DNS to ALB  
7. Deploy Firebase storage/rules  
8. Update Stripe webhooks + rebuild if `NEXT_PUBLIC_*` URLs changed  
9. Run smoke test checklist  
10. Lock down security groups  

---

## 17. Alternative: stay on Vercel

If AWS timeline is not critical, the app already supports Vercel deployment (`HANDOVER.md` §14):

1. Connect GitHub repo to Vercel  
2. Add env vars  
3. Deploy `main`  

AWS migration (hosting checkout / ALB) can be completed later without blocking the live site.

---

*Questions about app features → `HANDOVER.md`. Questions about env vars → `ENV_SETUP.md`.*
