export type EmailTemplateId =
  | 'job_complete'
  | 'usage_threshold'
  | 'member_added'
  | 'workflow_message'
  | 'secure_alert';

export type RenderedEmail = {
  id: EmailTemplateId;
  subject: string;
  text: string;
  html: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function layout(input: {
  preheader: string;
  title: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaHref?: string;
  footerNote?: string;
}): string {
  const cta =
    input.ctaLabel && input.ctaHref
      ? `<p style="margin:24px 0 0">
          <a href="${escapeHtml(input.ctaHref)}"
             style="display:inline-block;background:#0B3D2E;color:#F7F3E8;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:600">
            ${escapeHtml(input.ctaLabel)}
          </a>
        </p>`
      : '';
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#F4F1EA;font-family:Georgia,'Times New Roman',serif;color:#1A1A1A">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(input.preheader)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F4F1EA;padding:24px 12px">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #E4DDD0">
            <tr>
              <td style="background:linear-gradient(135deg,#0B3D2E,#1F6F54);padding:20px 28px;color:#F7F3E8">
                <div style="font-size:13px;letter-spacing:0.08em;text-transform:uppercase;opacity:0.85">VerbaLab</div>
                <div style="font-size:22px;font-weight:700;margin-top:6px">${escapeHtml(input.title)}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;font-size:16px;line-height:1.55">
                ${input.bodyHtml}
                ${cta}
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 24px;font-size:12px;color:#6B6458;line-height:1.45">
                ${escapeHtml(input.footerNote ?? 'Africa-resident language infrastructure · verbalab.ai')}
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
    bodyHtml: `
      <p style="margin:0 0 12px">Your VerbaLab async job finished.</p>
      <table role="presentation" style="width:100%;font-size:14px;border-collapse:collapse">
        <tr><td style="padding:6px 0;color:#6B6458">Job</td><td style="padding:6px 0"><code>${escapeHtml(input.jobId)}</code></td></tr>
        <tr><td style="padding:6px 0;color:#6B6458">Type</td><td style="padding:6px 0">${escapeHtml(input.type)}</td></tr>
        <tr><td style="padding:6px 0;color:#6B6458">Status</td><td style="padding:6px 0">${escapeHtml(input.status)}</td></tr>
        ${
          input.error
            ? `<tr><td style="padding:6px 0;color:#6B6458">Error</td><td style="padding:6px 0">${escapeHtml(input.error)}</td></tr>`
            : ''
        }
      </table>`,
    ctaLabel: 'Open console',
    ctaHref: input.consoleUrl ?? 'https://app.verbalab.ai',
  });
  return { id: 'job_complete', subject, text, html };
}

export function renderUsageThresholdEmail(input: {
  organizationName: string;
  characters: number;
  quota: number;
  pct: number;
  consoleUrl?: string;
}): RenderedEmail {
  const subject = `VerbaLab usage at ${input.pct}% — ${input.organizationName}`;
  const text = `Your organization "${input.organizationName}" has used ${input.characters.toLocaleString()} of ${input.quota.toLocaleString()} monthly characters (${input.pct}% threshold).`;
  const html = layout({
    preheader: text,
    title: `Usage at ${input.pct}%`,
    bodyHtml: `
      <p style="margin:0 0 12px"><strong>${escapeHtml(input.organizationName)}</strong> is approaching its monthly character quota.</p>
      <p style="margin:0;font-size:28px;font-weight:700;color:#0B3D2E">${input.pct}%</p>
      <p style="margin:8px 0 0;color:#6B6458">${input.characters.toLocaleString()} / ${input.quota.toLocaleString()} characters</p>`,
    ctaLabel: 'Review usage',
    ctaHref: input.consoleUrl ?? 'https://app.verbalab.ai/usage',
  });
  return { id: 'usage_threshold', subject, text, html };
}

export function renderMemberAddedEmail(input: {
  organizationName: string;
  role: string;
  consoleUrl?: string;
}): RenderedEmail {
  const subject = `You've been added to ${input.organizationName} on VerbaLab`;
  const text = `You now have ${input.role} access to "${input.organizationName}" on VerbaLab. Sign in with the same email to open the console. (Invites are managed in Clerk; this message confirms membership sync.)`;
  const html = layout({
    preheader: text,
    title: 'Welcome to the workspace',
    bodyHtml: `
      <p style="margin:0 0 12px">You now have <strong>${escapeHtml(input.role)}</strong> access to <strong>${escapeHtml(input.organizationName)}</strong>.</p>
      <p style="margin:0;color:#6B6458">Sign in with this email. Invites remain managed in Clerk — this message confirms membership sync.</p>`,
    ctaLabel: 'Open VerbaLab',
    ctaHref: input.consoleUrl ?? 'https://app.verbalab.ai',
  });
  return { id: 'member_added', subject, text, html };
}

export function renderWorkflowMessageEmail(input: {
  subject: string;
  message: string;
  jobId?: string;
  consoleUrl?: string;
}): RenderedEmail {
  const text = input.message;
  const html = layout({
    preheader: text.slice(0, 120),
    title: input.subject,
    bodyHtml: `
      <p style="margin:0;white-space:pre-wrap">${escapeHtml(input.message)}</p>
      ${
        input.jobId
          ? `<p style="margin:16px 0 0;color:#6B6458;font-size:13px">Workflow job <code>${escapeHtml(input.jobId)}</code></p>`
          : ''
      }`,
    ctaLabel: 'Open console',
    ctaHref: input.consoleUrl ?? 'https://app.verbalab.ai',
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
    bodyHtml: `
      <p style="margin:0 0 12px">A consented VerbaLab security protocol delivered this transcript summary.</p>
      <table role="presentation" style="width:100%;font-size:14px;border-collapse:collapse;margin-bottom:16px">
        <tr><td style="padding:6px 0;color:#6B6458">Protocol</td><td style="padding:6px 0">${escapeHtml(input.protocol)}</td></tr>
        ${
          input.trustedName
            ? `<tr><td style="padding:6px 0;color:#6B6458">For</td><td style="padding:6px 0">${escapeHtml(input.trustedName)}</td></tr>`
            : ''
        }
        <tr><td style="padding:6px 0;color:#6B6458">Language</td><td style="padding:6px 0">${escapeHtml(input.language ?? 'auto')}</td></tr>
        <tr><td style="padding:6px 0;color:#6B6458">Receipt</td><td style="padding:6px 0"><code>${escapeHtml(input.receiptToken)}</code></td></tr>
      </table>
      <div style="background:#F7F3E8;border-radius:12px;padding:16px;white-space:pre-wrap">${escapeHtml(input.summary)}</div>`,
    ctaLabel: 'Verify receipt',
    ctaHref: input.consoleUrl ?? 'https://app.verbalab.ai/secure-transcript-alerts',
    footerNote: 'Sent only with an explicit consent token. Africa-resident by default.',
  });
  return { id: 'secure_alert', subject, text, html };
}

export function previewEmailTemplate(id: EmailTemplateId): RenderedEmail {
  switch (id) {
    case 'job_complete':
      return renderJobCompleteEmail({
        jobId: 'job_demo_123',
        type: 'batch_translate',
        status: 'succeeded',
      });
    case 'usage_threshold':
      return renderUsageThresholdEmail({
        organizationName: 'Demo Org',
        characters: 40000,
        quota: 50000,
        pct: 80,
      });
    case 'member_added':
      return renderMemberAddedEmail({
        organizationName: 'Demo Org',
        role: 'member',
      });
    case 'workflow_message':
      return renderWorkflowMessageEmail({
        subject: 'Workflow notify',
        message: 'Translation batch finished for Swahili market copy.',
        jobId: 'job_demo_456',
      });
    case 'secure_alert':
      return renderSecureAlertEmail({
        protocol: 'trusted-contact',
        trustedName: 'Amina',
        language: 'sw',
        receiptToken: 'vsta.demo.receipt',
        summary: 'Habari — I need help. Please call me.',
      });
    default:
      return renderWorkflowMessageEmail({
        subject: 'VerbaLab',
        message: 'Unknown template',
      });
  }
}
