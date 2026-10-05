export type EmailTemplateId =
  | 'job_complete'
  | 'usage_threshold'
  | 'member_added'
  | 'welcome'
  | 'workflow_message'
  | 'secure_alert';

export type RenderedEmail = {
  id: EmailTemplateId;
  subject: string;
  text: string;
  html: string;
};

const DEFAULT_APP_URL = 'https://app.verbalab.ai';

const SOCIAL_LINKS = [
  { id: 'x', label: 'X', href: 'https://x.com', file: 'social-x.png' },
  { id: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com', file: 'social-linkedin.png' },
  { id: 'github', label: 'GitHub', href: 'https://github.com/roosevelt-jpg/verbalab', file: 'social-github.png' },
  { id: 'youtube', label: 'YouTube', href: 'https://www.youtube.com', file: 'social-youtube.png' },
  { id: 'instagram', label: 'Instagram', href: 'https://www.instagram.com', file: 'social-instagram.png' },
  { id: 'facebook', label: 'Facebook', href: 'https://www.facebook.com', file: 'social-facebook.png' },
] as const;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Absolute base for hosted email images (`/email/*` on the web app). */
export function emailAssetBaseUrl(): string {
  const raw =
    process.env.EMAIL_ASSET_BASE_URL ??
    process.env.WEB_APP_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    DEFAULT_APP_URL;
  return raw.replace(/\/$/, '');
}

function assetUrl(file: string): string {
  return `${emailAssetBaseUrl()}/email/${file}`;
}

function socialFooterHtml(): string {
  const icons = SOCIAL_LINKS.map(
    (s) => `
      <a href="${escapeHtml(s.href)}" style="display:inline-block;margin:0 6px;text-decoration:none" aria-label="${escapeHtml(s.label)}">
        <img src="${escapeHtml(assetUrl(s.file))}" width="28" height="28" alt="${escapeHtml(s.label)}" style="display:block;border:0;outline:none" />
      </a>`,
  ).join('');
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto">
      <tr>
        <td align="center" style="padding:0">
          ${icons}
        </td>
      </tr>
    </table>`;
}

export type EmailBrandOptions = {
  brandName?: string;
  logoUrl?: string;
  copyrightText?: string;
};

export function defaultCopyrightText(brandName = 'VerbaLab'): string {
  return `© ${new Date().getFullYear()} ${brandName}. All rights reserved.`;
}

function layout(input: {
  preheader: string;
  title: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaHref?: string;
  footerNote?: string;
  brand?: EmailBrandOptions;
}): string {
  const brandName = input.brand?.brandName?.trim() || 'VerbaLab';
  const logoSrc = input.brand?.logoUrl?.trim() || assetUrl('verbalab-logo.png');
  const copyright = escapeHtml(
    input.brand?.copyrightText?.trim() || defaultCopyrightText(brandName),
  );
  const cta =
    input.ctaLabel && input.ctaHref
      ? `<p style="margin:28px 0 0">
          <a href="${escapeHtml(input.ctaHref)}"
             style="display:inline-block;background:#0B3D2E;color:#F4F7F5;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;font-size:15px;letter-spacing:0.01em">
            ${escapeHtml(input.ctaLabel)}
          </a>
        </p>`
      : '';
  const footerNote = escapeHtml(
    input.footerNote ?? 'Africa-resident language infrastructure · verbalab.ai',
  );

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <title>${escapeHtml(input.title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#E8F0EC;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;color:#14201C;-webkit-font-smoothing:antialiased">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all">${escapeHtml(input.preheader)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#E8F0EC;padding:32px 12px">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="max-width:560px;width:100%;background:#FFFFFF;border-radius:12px;overflow:hidden;border:1px solid #D5E3DB">
            <!-- Brand header -->
            <tr>
              <td align="center" style="background:#0B3D2E;padding:22px 28px">
                <a href="${escapeHtml(emailAssetBaseUrl())}" style="text-decoration:none;display:inline-block" aria-label="${escapeHtml(brandName)}">
                  <img src="${escapeHtml(logoSrc)}" width="180" height="36" alt="${escapeHtml(brandName)}" style="display:block;border:0;outline:none;height:auto;max-width:180px" />
                </a>
              </td>
            </tr>
            <!-- Title band -->
            <tr>
              <td style="padding:28px 28px 0;background:#FFFFFF">
                <h1 style="margin:0;font-size:22px;line-height:1.3;font-weight:700;color:#0B3D2E;letter-spacing:-0.01em">${escapeHtml(input.title)}</h1>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding:16px 28px 32px;font-size:16px;line-height:1.6;color:#14201C;background:#FFFFFF">
                ${input.bodyHtml}
                ${cta}
              </td>
            </tr>
            <!-- Social footer -->
            <tr>
              <td align="center" style="background:#F3F8F5;border-top:1px solid #D5E3DB;padding:22px 28px 12px">
                ${socialFooterHtml()}
              </td>
            </tr>
            <tr>
              <td align="center" style="background:#F3F8F5;padding:4px 28px 10px;font-size:12px;line-height:1.5;color:#5A6E66">
                <p style="margin:0 0 6px">${footerNote}</p>
                <p style="margin:0">
                  <a href="${escapeHtml(emailAssetBaseUrl())}" style="color:#0B3D2E;text-decoration:none;font-weight:600">verbalab.ai</a>
                </p>
              </td>
            </tr>
            <!-- Copyright bar -->
            <tr>
              <td align="center" style="background:#0B3D2E;padding:14px 28px;font-size:11px;line-height:1.45;color:#C5D9CF;letter-spacing:0.02em">
                ${copyright}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export const EMAIL_TEMPLATE_CATALOG: Array<{
  id: EmailTemplateId;
  name: string;
  trigger: string;
  resendReady: true;
}> = [
  {
    id: 'job_complete',
    name: 'Job complete',
    trigger: 'Async BullMQ / inline job succeeded or failed',
    resendReady: true,
  },
  {
    id: 'usage_threshold',
    name: 'Usage threshold',
    trigger: 'Translate usage hits 80% or 100% of monthly quota',
    resendReady: true,
  },
  {
    id: 'member_added',
    name: 'Member added',
    trigger: 'Clerk membership sync adds a user to an org',
    resendReady: true,
  },
  {
    id: 'welcome',
    name: 'Welcome / org bootstrap',
    trigger: 'Clerk webhook or first org bootstrap mints Free credits + test API key',
    resendReady: true,
  },
  {
    id: 'workflow_message',
    name: 'Workflow notify',
    trigger: 'Workflow / connector notify step',
    resendReady: true,
  },
  {
    id: 'secure_alert',
    name: 'Secure transcript alert',
    trigger: 'Secure Transcript Alerts protect/notify',
    resendReady: true,
  },
];

export function renderJobCompleteEmail(input: {
  jobId: string;
  type: string;
  status: 'succeeded' | 'failed';
  error?: string;
  consoleUrl?: string;
  brand?: EmailBrandOptions;
}): RenderedEmail {
  const ok = input.status === 'succeeded';
  const subject = ok
    ? `VerbaLab job succeeded (${input.type})`
    : `VerbaLab job failed (${input.type})`;
  const text = ok
    ? `Job ${input.jobId} (${input.type}) completed successfully.`
    : `Job ${input.jobId} (${input.type}) failed: ${input.error ?? 'unknown error'}`;
  const html = layout({
    preheader: text,
    title: ok ? 'Job succeeded' : 'Job failed',
    brand: input.brand,
    bodyHtml: `
      <p style="margin:0 0 12px">Your VerbaLab async job finished.</p>
      <table role="presentation" style="width:100%;font-size:14px;border-collapse:collapse">
        <tr><td style="padding:6px 0;color:#5A6E66;width:96px">Job</td><td style="padding:6px 0"><code style="font-size:13px">${escapeHtml(input.jobId)}</code></td></tr>
        <tr><td style="padding:6px 0;color:#5A6E66">Type</td><td style="padding:6px 0">${escapeHtml(input.type)}</td></tr>
        <tr><td style="padding:6px 0;color:#5A6E66">Status</td><td style="padding:6px 0">${escapeHtml(input.status)}</td></tr>
        ${
          input.error
            ? `<tr><td style="padding:6px 0;color:#5A6E66">Error</td><td style="padding:6px 0">${escapeHtml(input.error)}</td></tr>`
            : ''
        }
      </table>`,
    ctaLabel: 'Open console',
    ctaHref: input.consoleUrl ?? DEFAULT_APP_URL,
  });
  return { id: 'job_complete', subject, text, html };
}

export function renderUsageThresholdEmail(input: {
  organizationName: string;
  characters: number;
  quota: number;
  pct: number;
  consoleUrl?: string;
  brand?: EmailBrandOptions;
}): RenderedEmail {
  const subject = `VerbaLab usage at ${input.pct}% — ${input.organizationName}`;
  const text = `Your organization "${input.organizationName}" has used ${input.characters.toLocaleString()} of ${input.quota.toLocaleString()} monthly characters (${input.pct}% threshold).`;
  const html = layout({
    preheader: text,
    title: `Usage at ${input.pct}%`,
    brand: input.brand,
    bodyHtml: `
      <p style="margin:0 0 12px"><strong>${escapeHtml(input.organizationName)}</strong> is approaching its monthly character quota.</p>
      <p style="margin:0;font-size:28px;font-weight:700;color:#0B3D2E">${input.pct}%</p>
      <p style="margin:8px 0 0;color:#5A6E66">${input.characters.toLocaleString()} / ${input.quota.toLocaleString()} characters</p>`,
    ctaLabel: 'Review usage',
    ctaHref: input.consoleUrl ?? `${DEFAULT_APP_URL}/usage`,
  });
  return { id: 'usage_threshold', subject, text, html };
}

export function renderMemberAddedEmail(input: {
  organizationName: string;
  role: string;
  consoleUrl?: string;
  brand?: EmailBrandOptions;
}): RenderedEmail {
  const subject = `You've been added to ${input.organizationName} on VerbaLab`;
  const text = `You now have ${input.role} access to "${input.organizationName}" on VerbaLab. Sign in with the same email to open the console. (Invites are managed in Clerk; this message confirms membership sync.)`;
  const html = layout({
    preheader: text,
    title: 'Welcome to the workspace',
    brand: input.brand,
    bodyHtml: `
      <p style="margin:0 0 12px">You now have <strong>${escapeHtml(input.role)}</strong> access to <strong>${escapeHtml(input.organizationName)}</strong>.</p>
      <p style="margin:0;color:#5A6E66">Sign in with this email. Invites remain managed in Clerk — this message confirms membership sync.</p>`,
    ctaLabel: 'Open VerbaLab',
    ctaHref: input.consoleUrl ?? DEFAULT_APP_URL,
  });
  return { id: 'member_added', subject, text, html };
}

export function renderWelcomeEmail(input: {
  organizationName: string;
  name?: string;
  monthlyCredits: number;
  apiKeyPrefix?: string;
  apiKeySecret?: string;
  consoleUrl?: string;
  docsUrl?: string;
  brand?: EmailBrandOptions;
}): RenderedEmail {
  const subject = `Welcome to VerbaLab — ${input.organizationName}`;
  const greet = input.name ? `Hi ${input.name},` : 'Welcome,';
  const keyLine = input.apiKeySecret
    ? `Your first test API key (${input.apiKeyPrefix ?? 'vl_test_…'}): ${input.apiKeySecret}. Store it now — it is only shown once.`
    : input.apiKeyPrefix
      ? `A test API key (${input.apiKeyPrefix}) is ready in the console under API keys.`
      : 'Create an API key in the console under API keys.';
  const text = `${greet} Your Free workspace "${input.organizationName}" is ready with ${input.monthlyCredits.toLocaleString()} monthly credits. ${keyLine} Docs: ${input.docsUrl ?? `${DEFAULT_APP_URL}/docs/quickstart`}`;
  const html = layout({
    preheader: text.slice(0, 140),
    title: 'Your VerbaLab workspace is ready',
    brand: input.brand,
    bodyHtml: `
      <p style="margin:0 0 12px">${escapeHtml(greet)}</p>
      <p style="margin:0 0 12px">Workspace <strong>${escapeHtml(input.organizationName)}</strong> is on Free with <strong>${escapeHtml(String(input.monthlyCredits.toLocaleString()))}</strong> monthly credits.</p>
      <p style="margin:0 0 12px;color:#5A6E66">${escapeHtml(keyLine)}</p>
      <p style="margin:0;color:#5A6E66">Start with translate or TTS in under a minute — see the quickstart.</p>`,
    ctaLabel: 'Open quickstart',
    ctaHref: input.docsUrl ?? `${input.consoleUrl ?? DEFAULT_APP_URL}/docs/quickstart`,
  });
  return { id: 'welcome', subject, text, html };
}

export function renderWorkflowMessageEmail(input: {
  subject: string;
  message: string;
  jobId?: string;
  consoleUrl?: string;
  brand?: EmailBrandOptions;
}): RenderedEmail {
  const text = input.message;
  const html = layout({
    preheader: text.slice(0, 120),
    title: input.subject,
    brand: input.brand,
    bodyHtml: `
      <p style="margin:0;white-space:pre-wrap">${escapeHtml(input.message)}</p>
      ${
        input.jobId
          ? `<p style="margin:16px 0 0;color:#5A6E66;font-size:13px">Workflow job <code style="font-size:12px">${escapeHtml(input.jobId)}</code></p>`
          : ''
      }`,
    ctaLabel: 'Open console',
    ctaHref: input.consoleUrl ?? DEFAULT_APP_URL,
  });
  return { id: 'workflow_message', subject: input.subject, text, html };
}

export function renderSecureAlertEmail(input: {
  protocol: string;
  trustedName?: string;
  language?: string;
  receiptToken: string;
  summary: string;
  consoleUrl?: string;
  brand?: EmailBrandOptions;
}): RenderedEmail {
  const subject = `VerbaLab secure transcript alert (${input.protocol})`;
  const text = [
    'VerbaLab secure alert',
    `Protocol: ${input.protocol}`,
    input.trustedName ? `For: ${input.trustedName}` : null,
    `Language: ${input.language ?? 'auto'}`,
    `Receipt: ${input.receiptToken}`,
    '',
    'Transcript summary:',
    input.summary,
  ]
    .filter(Boolean)
    .join('\n');
  const html = layout({
    preheader: `Secure alert · ${input.protocol}`,
    title: 'Secure transcript alert',
    brand: input.brand,
    bodyHtml: `
      <p style="margin:0 0 12px">A consented VerbaLab security protocol delivered this transcript summary.</p>
      <table role="presentation" style="width:100%;font-size:14px;border-collapse:collapse;margin-bottom:16px">
        <tr><td style="padding:6px 0;color:#5A6E66;width:96px">Protocol</td><td style="padding:6px 0">${escapeHtml(input.protocol)}</td></tr>
        ${
          input.trustedName
            ? `<tr><td style="padding:6px 0;color:#5A6E66">For</td><td style="padding:6px 0">${escapeHtml(input.trustedName)}</td></tr>`
            : ''
        }
        <tr><td style="padding:6px 0;color:#5A6E66">Language</td><td style="padding:6px 0">${escapeHtml(input.language ?? 'auto')}</td></tr>
        <tr><td style="padding:6px 0;color:#5A6E66">Receipt</td><td style="padding:6px 0"><code style="font-size:13px">${escapeHtml(input.receiptToken)}</code></td></tr>
      </table>
      <div style="background:#F3F8F5;border:1px solid #D5E3DB;border-radius:10px;padding:16px;white-space:pre-wrap">${escapeHtml(input.summary)}</div>`,
    ctaLabel: 'Verify receipt',
    ctaHref: input.consoleUrl ?? `${DEFAULT_APP_URL}/secure-transcript-alerts`,
    footerNote: 'Sent only with an explicit consent token. Africa-resident by default.',
  });
  return { id: 'secure_alert', subject, text, html };
}

export function previewEmailTemplate(id: EmailTemplateId, brand?: EmailBrandOptions): RenderedEmail {
  switch (id) {
    case 'job_complete':
      return renderJobCompleteEmail({
        jobId: 'job_demo_123',
        type: 'batch_translate',
        status: 'succeeded',
        brand,
      });
    case 'usage_threshold':
      return renderUsageThresholdEmail({
        organizationName: 'Demo Org',
        characters: 40000,
        quota: 50000,
        pct: 80,
        brand,
      });
    case 'member_added':
      return renderMemberAddedEmail({
        organizationName: 'Demo Org',
        role: 'member',
        brand,
      });
    case 'welcome':
      return renderWelcomeEmail({
        organizationName: 'Demo Org',
        name: 'Amina',
        monthlyCredits: 10_000,
        apiKeyPrefix: 'vl_test_demo',
        brand,
      });
    case 'workflow_message':
      return renderWorkflowMessageEmail({
        subject: 'Workflow notify',
        message: 'Translation batch finished for Swahili market copy.',
        jobId: 'job_demo_456',
        brand,
      });
    case 'secure_alert':
      return renderSecureAlertEmail({
        protocol: 'trusted-contact',
        trustedName: 'Amina',
        language: 'sw',
        receiptToken: 'vsta.demo.receipt',
        summary: 'Habari — I need help. Please call me.',
        brand,
      });
    default:
      return renderWorkflowMessageEmail({
        subject: 'VerbaLab',
        message: 'Unknown template',
        brand,
      });
  }
}
