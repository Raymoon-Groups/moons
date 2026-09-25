/** Shared job search relevance — used by API ranking and mobile client re-rank. */

export type JobSearchable = {
  title: string;
  companyName?: string | null;
  description?: string | null;
  createdAt?: string | Date;
};

const SEARCH_SYNONYMS: Record<string, string[]> = {
  hr: [
    'human resources',
    'human resource',
    'people operations',
    'people ops',
    'talent acquisition',
    'talent partner',
    'hr executive',
    'hr manager',
    'hr recruiter',
    'hrbp',
    'recruiter',
  ],
  'human resources': ['hr', 'hr recruiter', 'talent acquisition'],
  se: ['software engineer', 'software engineering'],
  sde: ['software development engineer', 'software engineer'],
  qa: ['quality assurance', 'quality analyst', 'test engineer'],
  ui: ['ui designer', 'user interface'],
  ux: ['ux designer', 'user experience'],
  pm: ['product manager', 'project manager', 'product management'],
  ba: ['business analyst'],
  bde: ['business development'],
  fresher: ['entry level', 'graduate', 'trainee', 'internship'],
  remote: ['work from home', 'wfh', 'work-from-home'],
  wfh: ['work from home', 'remote'],
  recruiter: ['hr recruiter', 'talent acquisition', 'recruitment'],
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function plainText(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Whole-word / token match — avoids "hr" inside "through" or "hours". */
export function hasWordMatch(text: string, term: string): boolean {
  if (!text || !term) return false;
  const pattern = new RegExp(
    `(^|[^a-z0-9])${escapeRegExp(term)}([^a-z0-9]|$)`,
    'i',
  );
  return pattern.test(text);
}

export function expandSearchTerms(raw: string): string[] {
  const q = raw.trim();
  if (!q) return [];
  const key = q.toLowerCase();
  const extra = SEARCH_SYNONYMS[key] ?? [];
  const terms = [q, ...extra];
  const seen = new Set<string>();
  return terms.filter((term) => {
    const k = term.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export function scoreJobMatch(
  job: JobSearchable,
  rawQuery: string,
  terms: string[] = expandSearchTerms(rawQuery),
): number {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return 0;

  const title = (job.title || '').toLowerCase();
  const company = (job.companyName || '').toLowerCase();
  const description = plainText(job.description || '').toLowerCase();
  let score = 0;

  if (title === q) score += 120;
  if (
    title.startsWith(`${q} `) ||
    title.startsWith(`${q}-`) ||
    title.startsWith(`${q}/`) ||
    title.startsWith(`${q}–`) ||
    title.startsWith(`${q}—`)
  ) {
    score += 100;
  }
  if (hasWordMatch(title, q)) score += 90;
  else if (q.length >= 4 && title.includes(q)) score += 55;

  for (const term of terms) {
    const t = term.toLowerCase();
    if (t === q) continue;
    if (hasWordMatch(title, t) || title.includes(t)) score += 80;
    if (hasWordMatch(company, t) || company.includes(t)) score += 30;
    if (t.length >= 4 && (hasWordMatch(description, t) || description.includes(t))) {
      score += 28;
    } else if (t.length >= 3 && hasWordMatch(description, t)) {
      score += 18;
    }
  }

  if (hasWordMatch(company, q) || (q.length >= 3 && company.includes(q))) {
    score += 40;
  }

  // Description: short queries only count as whole words (not substrings).
  if (q.length <= 3) {
    if (hasWordMatch(description, q)) score += 12;
  } else if (hasWordMatch(description, q)) {
    score += 22;
  } else if (description.includes(q)) {
    score += 10;
  }

  return score;
}

/** Filter + sort jobs so the most relevant matches come first. */
export function rankJobsForQuery<T extends JobSearchable>(
  jobs: T[],
  rawQuery: string,
): T[] {
  const q = rawQuery.trim();
  if (!q) return jobs;

  const terms = expandSearchTerms(q);
  const short = q.length <= 3;

  return jobs
    .map((job) => ({ job, score: scoreJobMatch(job, q, terms) }))
    .filter((row) => {
      if (row.score <= 0) return false;
      if (!short) return true;
      // Short acronyms must hit the title (or a synonym in the title) —
      // description-only hits like "contact our recruiter" are too weak.
      const title = (row.job.title || '').toLowerCase();
      const key = q.toLowerCase();
      if (hasWordMatch(title, key) || title.startsWith(`${key} `) || title.startsWith(key)) {
        return true;
      }
      return terms.some((term) => {
        const t = term.toLowerCase();
        if (t === key) return false;
        return hasWordMatch(title, t) || title.includes(t);
      });
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const da = a.job.createdAt ? new Date(a.job.createdAt).getTime() : 0;
      const db = b.job.createdAt ? new Date(b.job.createdAt).getTime() : 0;
      return db - da;
    })
    .map((row) => row.job);
}
