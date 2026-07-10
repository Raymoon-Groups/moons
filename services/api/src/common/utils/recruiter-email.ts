export const RECRUITER_COMPANY_EMAIL_MESSAGE = "Register with your company's id only";

const PERSONAL_EMAIL_DOMAINS = new Set([
  'aol.com',
  'gmail.com',
  'googlemail.com',
  'gmx.com',
  'gmx.net',
  'hotmail.co.in',
  'hotmail.com',
  'icloud.com',
  'inbox.com',
  'indiatimes.com',
  'live.com',
  'live.in',
  'mac.com',
  'mail.com',
  'me.com',
  'msn.com',
  'outlook.com',
  'outlook.in',
  'pm.me',
  'proton.me',
  'protonmail.com',
  'rediffmail.com',
  'sify.com',
  'tuta.io',
  'tutanota.com',
  'yahoo.co.in',
  'yahoo.co.uk',
  'yahoo.com',
  'yahoo.in',
  'yandex.com',
  'yandex.ru',
  'zoho.com',
]);

export function extractEmailDomain(email: string): string | null {
  const normalized = email.trim().toLowerCase();
  const at = normalized.lastIndexOf('@');
  if (at <= 0 || at === normalized.length - 1) {
    return null;
  }

  return normalized.slice(at + 1);
}

export function isPersonalEmailDomain(domain: string): boolean {
  const normalized = domain.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  if (PERSONAL_EMAIL_DOMAINS.has(normalized)) {
    return true;
  }

  for (const blocked of PERSONAL_EMAIL_DOMAINS) {
    if (normalized === blocked || normalized.endsWith(`.${blocked}`)) {
      return true;
    }
  }

  return false;
}

export function isRecruiterCompanyEmail(email: string): boolean {
  const domain = extractEmailDomain(email);
  if (!domain || !domain.includes('.')) {
    return false;
  }

  return !isPersonalEmailDomain(domain);
}
