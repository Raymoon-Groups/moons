const BRAND = {
  navy: '#1a2744',
  blue: '#4a7fd4',
  blueDark: '#3568b8',
  text: '#1e293b',
  muted: '#64748b',
  border: '#e2e8f0',
  surface: '#f8fafc',
  pageBg: '#eef3f9',
  success: '#16a34a',
  warning: '#d97706',
  danger: '#dc2626',
} as const;

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function getWebAppUrl(): string {
  const explicit = process.env.WEB_APP_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, '');

  const cors = process.env.CORS_ORIGIN?.split(',')[0]?.trim();
  if (cors) return cors.replace(/\/$/, '');

  return 'https://moonsjob.com';
}

function bannerImageUrl(): string {
  return `${getWebAppUrl()}/email_banner.png`;
}

function emailHeaderBanner(): string {
  return `
    <tr>
      <td style="padding:0;line-height:0;font-size:0;background:${BRAND.surface};">
        <img
          src="${bannerImageUrl()}"
          alt="MoonsJob — Find the right job. Build your future."
          width="600"
          style="display:block;width:100%;max-width:600px;height:auto;border:0;margin:0;"
        />
      </td>
    </tr>`;
}

function formatStatusLabel(status: string): string {
  return status
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

interface LayoutOptions {
  preheader: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
}

function buildEmailLayout({ preheader, body, ctaLabel, ctaUrl }: LayoutOptions): string {
  const safePreheader = escapeHtml(preheader);
  const ctaBlock =
    ctaLabel && ctaUrl
      ? `
        <tr>
          <td style="padding:4px 32px 32px;text-align:center;">
            <a href="${ctaUrl}" style="display:inline-block;background:${BRAND.blue};color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:13px 28px;border-radius:10px;box-shadow:0 4px 14px rgba(74,127,212,0.28);">
              ${escapeHtml(ctaLabel)}
            </a>
          </td>
        </tr>`
      : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>MoonsJob</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.pageBg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${safePreheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.pageBg};padding:36px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid ${BRAND.border};border-radius:16px;overflow:hidden;box-shadow:0 10px 40px rgba(26,39,68,0.08);">
          ${emailHeaderBanner()}
          ${body}
          ${ctaBlock}
          <tr>
            <td style="padding:22px 32px 26px;background:${BRAND.surface};border-top:1px solid ${BRAND.border};text-align:center;">
              <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:${BRAND.muted};">
                You received this email because you have a MoonsJob account.
              </p>
              <p style="margin:0;font-size:12px;line-height:1.5;color:#94a3b8;">
                <a href="${getWebAppUrl()}" style="color:${BRAND.blue};text-decoration:none;font-weight:600;">moonsjob.com</a>
                &nbsp;·&nbsp; Hiring made simple
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function statusBadge(label: string, accent: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
      <tr>
        <td style="vertical-align:middle;padding-right:10px;">
          <span style="display:inline-block;width:22px;height:22px;border-radius:999px;background:${accent};color:#ffffff;font-size:13px;line-height:22px;text-align:center;font-weight:700;">✓</span>
        </td>
        <td style="vertical-align:middle;font-size:14px;font-weight:600;color:${BRAND.text};">${escapeHtml(label)}</td>
      </tr>
    </table>`;
}

function jobSummaryCard(
  jobTitle: string,
  secondaryLine: string,
  statusLabel: string,
  accent: string,
): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px;border-radius:12px;border:1px solid ${BRAND.border};background:${BRAND.surface};overflow:hidden;">
      <tr>
        <td style="padding:16px 18px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="vertical-align:top;">
                <p style="margin:0;font-size:18px;line-height:1.35;font-weight:700;color:${BRAND.text};">${jobTitle}</p>
                <p style="margin:6px 0 0;font-size:15px;line-height:1.5;color:${BRAND.muted};">${secondaryLine}</p>
              </td>
              <td style="vertical-align:top;text-align:right;padding-left:14px;">
                <span style="display:inline-block;padding:6px 12px;border-radius:999px;background:${accent}14;color:${accent};font-size:12px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;white-space:nowrap;">
                  ${statusLabel}
                </span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
}

function nextStepsSection(items: string[]): string {
  const rows = items
    .map((item, index) => {
      const padTop = index === 0 ? '0' : '12px';
      return `
        <tr>
          <td style="padding:${padTop} 0 0;width:30px;vertical-align:top;">
            <span style="display:inline-block;width:22px;height:22px;border-radius:999px;background:${BRAND.blue}14;color:${BRAND.blue};font-size:12px;font-weight:700;line-height:22px;text-align:center;">
              ${index + 1}
            </span>
          </td>
          <td style="padding:${index === 0 ? '1px' : '13px'} 0 0 10px;vertical-align:top;">
            <p style="margin:0;font-size:14px;line-height:1.6;color:${BRAND.muted};">${escapeHtml(item)}</p>
          </td>
        </tr>`;
    })
    .join('');

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-radius:12px;border:1px solid ${BRAND.border};background:#ffffff;">
      <tr>
        <td style="padding:18px 20px;">
          <p style="margin:0 0 14px;font-size:15px;font-weight:700;color:${BRAND.text};">Next steps</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
        </td>
      </tr>
    </table>`;
}

function statusTone(status: string): {
  accent: string;
  badge: string;
  headline: string;
  message: string;
} {
  const normalized = status.toUpperCase();

  if (normalized === 'SHORTLISTED') {
    return {
      accent: BRAND.success,
      badge: 'You have been shortlisted',
      headline: 'Great news — you made the shortlist',
      message:
        'The employer liked your profile and moved you forward in their hiring process. Keep an eye on your inbox for interview updates.',
    };
  }

  if (normalized === 'REJECTED') {
    return {
      accent: BRAND.danger,
      badge: 'Application update',
      headline: 'Update on your application',
      message:
        'Thank you for applying. The employer has decided not to move forward with your application at this time. New roles are posted on MoonsJob every day — keep exploring.',
    };
  }

  if (normalized === 'VIEWED') {
    return {
      accent: BRAND.blue,
      badge: 'Application viewed',
      headline: 'A recruiter viewed your application',
      message:
        'Your profile and application materials were opened by the hiring team. This is a good sign — stay ready for follow-up.',
    };
  }

  if (normalized === 'SUBMITTED') {
    return {
      accent: BRAND.blue,
      badge: 'Application submitted',
      headline: 'Your application was sent',
      message:
        'Your profile and application have been delivered to the employer. Good luck — we are rooting for you.',
    };
  }

  return {
    accent: BRAND.blue,
    badge: 'Application status updated',
    headline: 'Your application status changed',
    message: `Your application is now ${formatStatusLabel(status)}. Sign in to MoonsJob for the latest updates.`,
  };
}

export function buildApplicationStatusEmail(
  jobTitle: string,
  companyName: string,
  status: string,
): { html: string; text: string } {
  const tone = statusTone(status);
  const safeJob = escapeHtml(jobTitle);
  const safeCompany = escapeHtml(companyName);
  const statusLabel = escapeHtml(formatStatusLabel(status));
  const applicationsUrl = `${getWebAppUrl()}/applications`;

  const body = `
    <tr>
      <td style="padding:28px 32px 24px;">
        ${statusBadge(tone.badge, tone.accent)}
        <h1 style="margin:0 0 22px;font-size:26px;line-height:1.25;font-weight:700;color:${BRAND.navy};">${escapeHtml(tone.headline)}</h1>
        ${jobSummaryCard(safeJob, safeCompany, statusLabel, tone.accent)}
        <p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:${BRAND.muted};">
          Your application for <strong style="color:${BRAND.text};">${safeJob}</strong> at
          <strong style="color:${BRAND.text};">${safeCompany}</strong> is now
          <strong style="color:${tone.accent};">${statusLabel}</strong>.
        </p>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.65;color:${BRAND.muted};">${escapeHtml(tone.message)}</p>
        ${nextStepsSection([
          'Track all your applications from your MoonsJob dashboard.',
          'The employer may contact you directly about interviews or follow-up questions.',
          'Keep your profile and resume up to date for the best results.',
        ])}
      </td>
    </tr>`;

  const text = `${tone.headline}\n\n${jobTitle} at ${companyName}\nStatus: ${formatStatusLabel(status)}\n\n${tone.message}\n\nView applications: ${applicationsUrl}`;

  return {
    html: buildEmailLayout({
      preheader: `${formatStatusLabel(status)} — ${jobTitle} at ${companyName}`,
      body,
      ctaLabel: 'View my applications',
      ctaUrl: applicationsUrl,
    }),
    text,
  };
}

export function buildApplicationReceivedEmail(
  jobTitle: string,
  candidateName: string,
): { html: string; text: string } {
  const safeJob = escapeHtml(jobTitle);
  const safeCandidate = escapeHtml(candidateName);
  const jobsUrl = `${getWebAppUrl()}/recruiter/jobs`;

  const body = `
    <tr>
      <td style="padding:28px 32px 24px;">
        ${statusBadge('New application received', BRAND.blue)}
        <h1 style="margin:0 0 22px;font-size:26px;line-height:1.25;font-weight:700;color:${BRAND.navy};">Someone applied to your job</h1>
        ${jobSummaryCard(
          safeJob,
          `Candidate: <strong style="color:${BRAND.text};">${safeCandidate}</strong>`,
          'Received',
          BRAND.blue,
        )}
        <p style="margin:0 0 24px;font-size:15px;line-height:1.65;color:${BRAND.muted};">
          <strong style="color:${BRAND.text};">${safeCandidate}</strong> just applied to
          <strong style="color:${BRAND.text};">${safeJob}</strong>. Review their profile, resume, and experience to decide your next move.
        </p>
        ${nextStepsSection([
          'Open the applicants list to review the candidate profile.',
          'Shortlist strong matches or update status to keep candidates informed.',
          'Respond quickly — top talent often receives multiple offers.',
        ])}
      </td>
    </tr>`;

  const text = `New application for ${jobTitle}\n\n${candidateName} applied to your job posting.\n\nReview applicants: ${jobsUrl}`;

  return {
    html: buildEmailLayout({
      preheader: `${candidateName} applied to ${jobTitle}`,
      body,
      ctaLabel: 'Review applicants',
      ctaUrl: jobsUrl,
    }),
    text,
  };
}

export function buildOtpEmail(otp: string): { html: string; text: string } {
  const safeOtp = escapeHtml(otp);

  const body = `
    <tr>
      <td style="padding:32px 32px 24px;text-align:center;">
        ${statusBadge('Verify your email', BRAND.blue)}
        <h1 style="margin:0 0 12px;font-size:26px;line-height:1.25;font-weight:700;color:${BRAND.navy};">Confirm your MoonsJob account</h1>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.65;color:${BRAND.muted};">
          Enter this verification code to complete your registration. It expires in 10 minutes.
        </p>
        <div style="display:inline-block;padding:18px 28px;border-radius:14px;background:linear-gradient(135deg,${BRAND.blue}12 0%,${BRAND.surface} 100%);border:1px solid ${BRAND.border};">
          <span style="font-size:34px;font-weight:700;letter-spacing:10px;color:${BRAND.navy};">${safeOtp}</span>
        </div>
        <p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:${BRAND.muted};text-align:left;">
          If you did not create a MoonsJob account, you can safely ignore this email.
        </p>
      </td>
    </tr>`;

  return {
    html: buildEmailLayout({
      preheader: `Your MoonsJob verification code is ${otp}`,
      body,
    }),
    text: `Your MoonsJob verification code is ${otp}. It expires in 10 minutes.`,
  };
}

export function buildPasswordResetEmail(otp: string): { html: string; text: string } {
  const safeOtp = escapeHtml(otp);
  const resetUrl = `${getWebAppUrl()}/forgot-password`;

  const body = `
    <tr>
      <td style="padding:32px 32px 24px;text-align:center;">
        ${statusBadge('Password reset requested', BRAND.warning)}
        <h1 style="margin:0 0 12px;font-size:26px;line-height:1.25;font-weight:700;color:${BRAND.navy};">Reset your password</h1>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.65;color:${BRAND.muted};">
          Use the code below on the reset page. It expires in 15 minutes.
        </p>
        <div style="display:inline-block;padding:18px 28px;border-radius:14px;background:linear-gradient(135deg,${BRAND.blue}12 0%,${BRAND.surface} 100%);border:1px solid ${BRAND.border};">
          <span style="font-size:34px;font-weight:700;letter-spacing:10px;color:${BRAND.navy};">${safeOtp}</span>
        </div>
        <p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:${BRAND.muted};text-align:left;">
          If you did not request a password reset, you can ignore this email. Your password will stay the same.
        </p>
      </td>
    </tr>`;

  return {
    html: buildEmailLayout({
      preheader: `Your MoonsJob password reset code is ${otp}`,
      body,
      ctaLabel: 'Go to reset page',
      ctaUrl: resetUrl,
    }),
    text: `Your password reset code is ${otp}. It expires in 15 minutes.\n\nReset page: ${resetUrl}`,
  };
}
