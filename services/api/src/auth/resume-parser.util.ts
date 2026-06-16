import { BadRequestException } from '@nestjs/common';

export interface ParsedResume {
  fullName: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  headline: string | null;
  summary: string | null;
  skills: string[];
  workExperiences: ParsedWorkExperience[];
  educations: ParsedEducation[];
}

export interface ParsedWorkExperience {
  company: string;
  designation: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  description: string;
}

export interface ParsedEducation {
  degree: string;
  institute: string;
  fieldOfStudy: string;
  year: string;
}

const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

/** Extract raw text from a PDF or Word file buffer */
async function extractText(buffer: Buffer, mimetype: string): Promise<string> {
  if (!ALLOWED_MIME.has(mimetype)) {
    throw new BadRequestException('Resume must be a PDF or Word document');
  }

  if (mimetype === 'application/pdf') {
    // pdf-parse v1 — CJS, works natively in NestJS/CommonJS
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse: (buf: Buffer) => Promise<{ text: string }> = require('pdf-parse');
    const result = await pdfParse(buffer);
    return result.text ?? '';
  }

  // Word documents (.doc / .docx) — mammoth ships CJS, safe to require()
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mammoth = require('mammoth') as {
    extractRawText: (opts: { buffer: Buffer }) => Promise<{ value: string }>;
  };
  const result = await mammoth.extractRawText({ buffer });
  return result.value ?? '';
}

/** Normalise whitespace while preserving line breaks */
function clean(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ─── Field extractors ─────────────────────────────────────────────────────────

function extractEmail(text: string): string | null {
  const m = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  return m ? m[0].toLowerCase() : null;
}

function extractPhone(text: string): string | null {
  const m = text.match(
    /(?:\+?\d{1,3}[\s\-.]?)?\(?\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{4,6}/,
  );
  return m ? m[0].trim() : null;
}

/**
 * Heuristic: the candidate's name is usually on one of the first 3 non-empty
 * lines, before the email/phone appear, and looks like 2-4 title-cased words.
 */
function extractName(text: string): string | null {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 8);

  const email = extractEmail(text);
  const nameLike = /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}$/;

  for (const line of lines) {
    if (email && line.toLowerCase().includes(email.toLowerCase())) continue;
    if (/\d/.test(line)) continue;
    if (line.length > 60) continue;
    if (nameLike.test(line)) return line;
  }

  // Looser fallback: first short line before email
  for (const line of lines) {
    if (email && line.toLowerCase().includes(email.toLowerCase())) continue;
    if (/[@\d]/.test(line)) continue;
    if (line.split(' ').length >= 2 && line.length < 50) return line;
  }
  return null;
}

function extractLocation(text: string): string | null {
  const patterns = [
    /(?:location|address|city|based in|residing in)[:\s]+([A-Za-z ,\-]{3,40})/i,
    /\b([A-Z][a-z]+(?: [A-Z][a-z]+)?),\s*(?:India|USA|UK|US|Canada|Australia|[A-Z]{2,})\b/,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) return m[1].trim();
  }
  return null;
}

function extractHeadline(text: string, name: string | null): string | null {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const headlineLike =
    /(?:engineer|developer|manager|analyst|designer|consultant|architect|lead|specialist|director|officer|intern|executive|scientist|administrator|coordinator|strategist)/i;

  let foundName = false;
  for (const line of lines) {
    if (!foundName && name && line.toLowerCase().includes(name.toLowerCase())) {
      foundName = true;
      continue;
    }
    if (foundName && line.length < 80 && headlineLike.test(line)) return line;
  }

  for (const line of lines.slice(0, 10)) {
    if (headlineLike.test(line) && line.length < 80) return line;
  }
  return null;
}

const SECTION_HEADINGS = [
  'summary', 'objective', 'profile', 'about',
  'experience', 'work experience', 'employment', 'work history',
  'education', 'academic', 'qualification',
  'skills', 'technical skills', 'core competencies', 'key skills',
  'certifications', 'achievements', 'projects',
  'languages', 'hobbies', 'interests', 'references',
];

function splitSections(text: string): Map<string, string[]> {
  const lines = text.split('\n').map((l) => l.trim());
  const sections = new Map<string, string[]>();
  let currentSection = 'header';
  sections.set(currentSection, []);

  for (const line of lines) {
    const lower = line.toLowerCase().replace(/[^a-z ]/g, '').trim();
    const match = SECTION_HEADINGS.find(
      (h) => lower === h || lower.startsWith(h + ' ') || lower.endsWith(h),
    );
    if (match && line.length < 50) {
      currentSection = match;
      if (!sections.has(currentSection)) sections.set(currentSection, []);
    } else {
      sections.get(currentSection)?.push(line);
    }
  }
  return sections;
}

function getSectionLines(sections: Map<string, string[]>, keywords: string[]): string[] {
  const lines: string[] = [];
  for (const [key, value] of sections.entries()) {
    if (keywords.some((k) => key.includes(k))) lines.push(...value);
  }
  return lines;
}

// ─── Skills ──────────────────────────────────────────────────────────────────

const TECH_KEYWORDS = [
  'JavaScript','TypeScript','Python','Java','C++','C#','Go','Rust','Ruby','PHP','Swift','Kotlin',
  'React','Angular','Vue','Next.js','Nuxt','Svelte','Node.js','Express','NestJS','Django','Flask',
  'Spring','Laravel','Rails',
  'HTML','CSS','Tailwind','Bootstrap','SCSS',
  'SQL','PostgreSQL','MySQL','MongoDB','Redis','Elasticsearch','DynamoDB','SQLite',
  'AWS','Azure','GCP','Docker','Kubernetes','Terraform','CI/CD','GitHub Actions','Jenkins',
  'REST','GraphQL','gRPC','WebSocket',
  'Git','Linux','Bash','PowerShell',
  'Machine Learning','Deep Learning','TensorFlow','PyTorch','NLP','Computer Vision',
  'Figma','Sketch','Adobe XD',
  'Agile','Scrum','Kanban','JIRA',
  'Excel','Power BI','Tableau',
];

function extractSkills(text: string, sections: Map<string, string[]>): string[] {
  const skillLines = getSectionLines(sections, ['skill', 'competenc', 'technolog']);
  const skillText = skillLines.length > 0 ? skillLines.join(' ') : text;
  const found = new Set<string>();

  for (const kw of TECH_KEYWORDS) {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`\\b${escaped}\\b`, 'i').test(skillText)) found.add(kw);
  }

  for (const line of skillLines) {
    for (const item of line.split(/[,•|·\/]+/)) {
      const trimmed = item.trim();
      if (trimmed.length >= 2 && trimmed.length <= 40 && /[a-zA-Z]/.test(trimmed)) {
        found.add(trimmed);
      }
    }
  }

  return Array.from(found).slice(0, 20);
}

function extractSummary(sections: Map<string, string[]>): string | null {
  const lines = getSectionLines(sections, ['summary', 'objective', 'profile', 'about']);
  const text = lines.filter(Boolean).join(' ').trim();
  return text.length > 20 ? text.slice(0, 1000) : null;
}

// ─── Work experience ─────────────────────────────────────────────────────────

const MONTH_MAP: Record<string, string> = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
};

function parseMonthYear(token: string): string {
  const m1 = token.match(/([a-zA-Z]{3,9})\s+(\d{4})/);
  if (m1) {
    const mo = MONTH_MAP[m1[1].toLowerCase().slice(0, 3)];
    return mo ? `${m1[2]}-${mo}` : m1[2];
  }
  const m2 = token.match(/(\d{4})-(\d{2})/);
  if (m2) return `${m2[1]}-${m2[2]}`;
  const m3 = token.match(/(\d{2})\/(\d{4})/);
  if (m3) return `${m3[2]}-${m3[1]}`;
  const m4 = token.match(/\d{4}/);
  if (m4) return m4[0];
  return '';
}

function extractWorkExperiences(sections: Map<string, string[]>): ParsedWorkExperience[] {
  const lines = getSectionLines(sections, ['experience', 'employment', 'work history']);
  if (lines.length === 0) return [];

  const experiences: ParsedWorkExperience[] = [];
  let current: Partial<ParsedWorkExperience> | null = null;
  const descLines: string[] = [];

  const dateRange =
    /([A-Za-z]{3,9}\s+\d{4}|\d{4}(?:-\d{2})?)\s*[–\-—to]+\s*(present|current|[A-Za-z]{3,9}\s+\d{4}|\d{4}(?:-\d{2})?)/i;

  for (const line of lines) {
    if (!line) continue;
    const dMatch = line.match(dateRange);
    if (dMatch) {
      if (current?.company || current?.designation) {
        current.description = descLines.join(' ').trim().slice(0, 500);
        experiences.push(current as ParsedWorkExperience);
        descLines.length = 0;
      }
      const isCurrent = /present|current/i.test(dMatch[2]);
      current = {
        company: '',
        designation: '',
        startDate: parseMonthYear(dMatch[1]),
        endDate: isCurrent ? null : parseMonthYear(dMatch[2]),
        isCurrent,
        description: '',
      };
    } else if (current) {
      if (!current.designation) current.designation = line.slice(0, 100);
      else if (!current.company) current.company = line.slice(0, 100);
      else descLines.push(line);
    }
  }

  if (current?.company || current?.designation) {
    current.description = descLines.join(' ').trim().slice(0, 500);
    experiences.push(current as ParsedWorkExperience);
  }

  return experiences.slice(0, 8);
}

// ─── Education ───────────────────────────────────────────────────────────────

const DEGREE_KEYWORDS =
  /\b(b\.?tech|m\.?tech|b\.?e|m\.?e|bsc|msc|b\.?sc|m\.?sc|b\.?com|m\.?com|mba|bba|bca|mca|phd|ph\.?d|bachelor|master|diploma|associate|b\.?a|m\.?a|b\.?ed|m\.?ed)\b/i;

function extractEducations(sections: Map<string, string[]>): ParsedEducation[] {
  const lines = getSectionLines(sections, ['education', 'academic', 'qualification']);
  if (lines.length === 0) return [];

  const educations: ParsedEducation[] = [];
  let current: Partial<ParsedEducation> | null = null;

  for (const line of lines) {
    if (!line) continue;
    const yearMatch = line.match(/\b(19|20)\d{2}\b/);
    const degreeMatch = line.match(DEGREE_KEYWORDS);

    if (degreeMatch) {
      if (current?.degree) educations.push(current as ParsedEducation);
      current = {
        degree: line.slice(0, 100),
        institute: '',
        fieldOfStudy: '',
        year: yearMatch ? yearMatch[0] : '',
      };
    } else if (current) {
      if (!current.institute) current.institute = line.slice(0, 100);
      else if (!current.year && yearMatch) current.year = yearMatch[0];
    }
  }

  if (current?.degree) educations.push(current as ParsedEducation);
  return educations.slice(0, 5);
}

// ─── Main export ─────────────────────────────────────────────────────────────

export async function parseResume(buffer: Buffer, mimetype: string): Promise<ParsedResume> {
  const rawText = await extractText(buffer, mimetype);
  const text = clean(rawText);
  const sections = splitSections(text);
  const name = extractName(text);

  return {
    fullName: name,
    email: extractEmail(text),
    phone: extractPhone(text),
    location: extractLocation(text),
    headline: extractHeadline(text, name),
    summary: extractSummary(sections),
    skills: extractSkills(text, sections),
    workExperiences: extractWorkExperiences(sections),
    educations: extractEducations(sections),
  };
}
