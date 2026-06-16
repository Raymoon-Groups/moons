/**
 * Full-fledged client-side resume parser.
 *
 * Strategy:
 *  1. Extract text from PDF using pdfjs-dist with position-aware line grouping
 *     (items on the same Y coordinate are merged into one logical line).
 *  2. Apply layered heuristics to extract every field.
 *  3. Everything runs in the browser — no backend call.
 */

// ─── Public types ─────────────────────────────────────────────────────────────

export interface ParsedResume {
  fullName:    string | null;
  email:       string | null;
  phone:       string | null;
  location:    string | null;
  headline:    string | null;
  summary:     string | null;
  skills:      string[];
  workExperiences: ParsedWork[];
  educations:      ParsedEducation[];
}

export interface ParsedWork {
  company:     string;
  designation: string;
  startDate:   string;   // "YYYY-MM" or "YYYY"
  endDate:     string | null;
  isCurrent:   boolean;
  description: string;
}

export interface ParsedEducation {
  degree:       string;
  institute:    string;
  fieldOfStudy: string;
  year:         string;
}

// ─── PDF text extraction (position-aware) ────────────────────────────────────

interface TextItem { str: string; x: number; y: number; h: number; }

async function extractLinesFromPdf(file: File): Promise<string[]> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

  const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
  const allLines: string[] = [];

  for (let p = 1; p <= pdf.numPages; p++) {
    const page   = await pdf.getPage(p);
    const vp     = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();

    // Collect positioned items
    const items: TextItem[] = [];
    for (const it of content.items) {
      if (!('str' in it) || !it.str.trim()) continue;
      const tx = it.transform;
      items.push({
        str: it.str,
        x:   tx[4],
        y:   Math.round(vp.height - tx[5]),  // flip so y increases downward
        h:   Math.abs(tx[3]) || 10,
      });
    }

    // Group into lines by Y proximity (within half a line-height)
    items.sort((a, b) => a.y - b.y || a.x - b.x);
    const lineGroups: TextItem[][] = [];
    for (const item of items) {
      const last = lineGroups[lineGroups.length - 1];
      if (last && Math.abs(item.y - last[0].y) <= last[0].h * 0.6) {
        last.push(item);
      } else {
        lineGroups.push([item]);
      }
    }

    for (const group of lineGroups) {
      group.sort((a, b) => a.x - b.x);
      // Join with a space only when there's an actual gap between items
      let line = '';
      for (let i = 0; i < group.length; i++) {
        if (i === 0) {
          line = group[i].str;
        } else {
          // Add space if the previous token doesn't already end with one
          const prev = group[i - 1];
          const gap  = group[i].x - (prev.x + prev.str.length * prev.h * 0.5);
          line += (gap > prev.h * 0.3 ? ' ' : '') + group[i].str;
        }
      }
      const trimmed = line.trim();
      if (trimmed) allLines.push(trimmed);
    }
  }

  return allLines;
}

async function extractLinesFromWord(file: File): Promise<string[]> {
  // Read the raw ArrayBuffer and pull UTF-16LE text runs from DOCX XML
  const buf  = await file.arrayBuffer();
  const text = new TextDecoder('utf-16le', { ignoreBOM: true }).decode(buf);
  // Strip XML tags, collapse whitespace
  const plain = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  return plain.split(/[.!?]\s+/).map(s => s.trim()).filter(Boolean);
}

async function getLines(file: File): Promise<string[]> {
  if (file.type === 'application/pdf') return extractLinesFromPdf(file);
  return extractLinesFromWord(file);
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function toTitleCase(s: string): string {
  return s.toLowerCase().replace(/\b[a-z]/g, c => c.toUpperCase());
}

function joinLines(lines: string[]): string {
  return lines.join('\n');
}

// ─── Section splitter ─────────────────────────────────────────────────────────

const SECTION_RE =
  /^(summary|objective|profile|about me|about|professional summary|career objective|work experience|experience|employment|work history|education|academic|qualification|skills?|technical skills?|core competencies|key skills?|certifications?|achievements?|projects?|awards?|languages?|interests?|references?|hobbies?)[\s:]*$/i;

function splitSections(lines: string[]): Map<string, string[]> {
  const map   = new Map<string, string[]>();
  let current = 'header';
  map.set(current, []);

  for (const line of lines) {
    if (SECTION_RE.test(line.trim()) && line.length < 60) {
      current = line.trim().toLowerCase().replace(/[\s:]+/g, '_');
      if (!map.has(current)) map.set(current, []);
    } else {
      map.get(current)!.push(line);
    }
  }
  return map;
}

function sectionLines(map: Map<string, string[]>, keys: string[]): string[] {
  const out: string[] = [];
  for (const [k, v] of map) {
    if (keys.some(kw => k.includes(kw))) out.push(...v);
  }
  return out;
}

// ─── Email ────────────────────────────────────────────────────────────────────

function extractEmail(text: string): string | null {
  const m = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  return m ? m[0].toLowerCase() : null;
}

// ─── Phone ────────────────────────────────────────────────────────────────────

function extractPhone(text: string): string | null {
  // Matches: +91 98765 43210, (123) 456-7890, 9876543210, +1-800-555-0100
  const m = text.match(
    /(?:\+?\d{1,3}[\s\-.]?)?(?:\(?\d{3,5}\)?[\s\-.]?)?\d{3}[\s\-.]?\d{4,6}/,
  );
  if (!m) return null;
  const cleaned = m[0].replace(/[^\d+]/g, '');
  // Must be at least 7 digits to be a phone
  return cleaned.replace(/\D/g, '').length >= 7 ? m[0].trim() : null;
}

// ─── Name ─────────────────────────────────────────────────────────────────────

function extractName(lines: string[], email: string | null): string | null {
  const headerLines = lines.slice(0, 15);

  for (const raw of headerLines) {
    const line = raw.trim();
    if (!line || line.length > 70) continue;
    // Skip lines with email, URLs, digits (phone), or special chars
    if (email && line.toLowerCase().includes(email.split('@')[0].toLowerCase())) continue;
    if (/[\\/@<>{}[\]|]/.test(line)) continue;
    if (/\d{4,}/.test(line)) continue;  // long digit run = phone/year

    const words = line.split(/\s+/).filter(Boolean);
    if (words.length < 2 || words.length > 6) continue;

    // All CAPS name → convert
    if (/^[A-Z\s.]+$/.test(line) && words.length >= 2) return toTitleCase(line);

    // Title Case
    if (/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,4}$/.test(line)) return line;

    // Mixed case (e.g. "Vansh Kaushik", "vansh kaushik")
    if (/^[A-Za-z][a-zA-Z]*(?:\s+[A-Za-z][a-zA-Z]*){1,4}$/.test(line)) {
      // Make sure it doesn't look like a title/section heading
      if (!SECTION_RE.test(line)) return toTitleCase(line);
    }
  }

  // Last resort: first short clean line in header
  for (const raw of headerLines) {
    const line = raw.trim();
    if (!line || line.length > 50) continue;
    if (/[\d@+]/.test(line)) continue;
    const words = line.split(/\s+/);
    if (words.length >= 2 && words.length <= 5) return toTitleCase(line);
  }
  return null;
}

// ─── Location ─────────────────────────────────────────────────────────────────

const KNOWN_CITIES = [
  'New Delhi','Delhi NCR','Delhi','Mumbai','Bangalore','Bengaluru','Hyderabad','Chennai',
  'Kolkata','Pune','Ahmedabad','Jaipur','Noida','Gurugram','Gurgaon','Chandigarh','Lucknow',
  'Indore','Bhopal','Coimbatore','Kochi','Surat','Vadodara','Nagpur','Patna','Bhubaneswar',
  'Visakhapatnam','Mysuru','Mysore','Ranchi','Dehradun','Mohali','Faridabad','Meerut',
  'New York','San Francisco','Los Angeles','Chicago','Seattle','Austin','Boston','London',
  'Dubai','Abu Dhabi','Singapore','Toronto','Sydney','Berlin','Amsterdam',
];

function extractLocation(text: string): string | null {
  // 1. Keyword prefix
  const kw = text.match(
    /(?:location|address|city|based in|residing in|from)[:\s]+([A-Za-z][\w ,\-]{2,50})/i,
  );
  if (kw) return kw[1].trim().split('\n')[0].trim();

  // 2. City, Country/State  e.g. "Gurugram, Haryana" / "New Delhi, India"
  const cityCountry = text.match(
    /\b([A-Z][a-zA-Z\s]{1,25}),\s*(?:India|USA|US|UK|Canada|Australia|UAE|Germany|France|Singapore|[A-Z][a-z]{2,})\b/,
  );
  if (cityCountry) return cityCountry[0].trim();

  // 3. "City, XX" where XX is a 2-letter state/country code
  const stateCode = text.match(/\b([A-Z][a-zA-Z\s]{2,20}),\s*([A-Z]{2})\b/);
  if (stateCode) return stateCode[0].trim();

  // 4. Known city list
  for (const city of KNOWN_CITIES) {
    const re = new RegExp(`\\b${city}\\b`, 'i');
    if (re.test(text)) return city;
  }
  return null;
}

// ─── Headline / designation ───────────────────────────────────────────────────

const HEADLINE_WORDS =
  /\b(engineer|developer|manager|analyst|designer|consultant|architect|lead|specialist|director|officer|intern|executive|scientist|administrator|coordinator|strategist|researcher|writer|editor|marketer|product|ui\/ux|ui|ux|frontend|backend|full.?stack|data|devops|sre|qa|tester|programmer|coder|technologist|associate|professional|advisor|trainer|recruiter|hr|human resources|accountant|finance|sales|business|operations|support)\b/i;

function extractHeadline(lines: string[], name: string | null): string | null {
  let pastName = false;

  for (const line of lines.slice(0, 20)) {
    const t = line.trim();
    if (!t || t.length > 120) continue;

    if (!pastName && name && t.toLowerCase().includes(name.split(' ')[0].toLowerCase())) {
      pastName = true;
      continue;
    }

    if (HEADLINE_WORDS.test(t) && t.length < 100) return t;

    // After the name: short alpha-only lines are likely titles even without keywords
    if (pastName && /^[A-Za-z\s|\/&,\-()]+$/.test(t) && t.length < 80 && t.split(/\s+/).length >= 2) {
      return t;
    }
  }

  // Fallback: any headline line anywhere in first 25
  for (const line of lines.slice(0, 25)) {
    const t = line.trim();
    if (HEADLINE_WORDS.test(t) && t.length < 100) return t;
  }
  return null;
}

// ─── Summary ──────────────────────────────────────────────────────────────────

function extractSummary(sections: Map<string, string[]>): string | null {
  const lines = sectionLines(sections, ['summary', 'objective', 'profile', 'about']);
  const text  = lines.filter(Boolean).join(' ').trim();
  return text.length > 30 ? text.slice(0, 1200) : null;
}

// ─── Skills ──────────────────────────────────────────────────────────────────

const SKILL_SEED = [
  // Languages
  'JavaScript','TypeScript','Python','Java','C++','C#','C','Go','Golang','Rust','Ruby','PHP',
  'Swift','Kotlin','Dart','Scala','R','MATLAB','Perl','Shell','Bash','PowerShell',
  // Frontend
  'React','Angular','Vue','Vue.js','Next.js','Nuxt','Svelte','jQuery','HTML','HTML5',
  'CSS','CSS3','Tailwind','Bootstrap','SCSS','Sass','Less','Webpack','Vite','Parcel',
  // Backend
  'Node.js','Express','NestJS','Django','Flask','FastAPI','Spring','Spring Boot',
  'Laravel','Rails','Ruby on Rails','ASP.NET','.NET','Gin','Echo','Fiber',
  // Mobile
  'React Native','Flutter','Android','iOS','Xamarin','Ionic',
  // Databases
  'SQL','PostgreSQL','MySQL','MariaDB','MongoDB','Redis','Elasticsearch','DynamoDB',
  'SQLite','Oracle','Cassandra','Neo4j','Firebase','Supabase','Prisma','Sequelize',
  // Cloud / DevOps
  'AWS','Azure','GCP','Google Cloud','Docker','Kubernetes','Terraform','Ansible',
  'Jenkins','GitHub Actions','GitLab CI','CI/CD','Linux','Nginx','Apache',
  // APIs / Architecture
  'REST','GraphQL','gRPC','WebSocket','Microservices','Kafka','RabbitMQ','MQTT',
  // Tools
  'Git','GitHub','GitLab','Bitbucket','Jira','Confluence','Notion','Slack','VS Code',
  'IntelliJ','Eclipse','Postman','Swagger','SonarQube',
  // AI / Data
  'Machine Learning','Deep Learning','TensorFlow','PyTorch','Keras','scikit-learn',
  'NLP','Computer Vision','OpenCV','Pandas','NumPy','Matplotlib','Spark','Hadoop',
  'Tableau','Power BI','Excel','Data Analysis','Data Science',
  // Design
  'Figma','Sketch','Adobe XD','Photoshop','Illustrator','InDesign','Canva',
  'UI Design','UX Design','Wireframing','Prototyping','User Research',
  // Methodologies
  'Agile','Scrum','Kanban','TDD','BDD','OOP','SOLID','Design Patterns',
  // Other common
  'Android Studio','Xcode','Firebase','Stripe','Twilio','SendGrid','Auth0',
];

function extractSkills(text: string, sections: Map<string, string[]>): string[] {
  const found = new Set<string>();

  // 1. Match from seed list in full text
  for (const kw of SKILL_SEED) {
    const esc = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`\\b${esc}\\b`, 'i').test(text)) found.add(kw);
  }

  // 2. Parse skills section items
  const skillLines = sectionLines(sections, ['skill', 'competenc', 'technolog']);
  for (const line of skillLines) {
    for (const chunk of line.split(/[,•·|\/\n\t]+/)) {
      const t = chunk.trim().replace(/^[-–•]\s*/, '');
      if (t.length >= 2 && t.length <= 50 && /[a-zA-Z]/.test(t) && !/^\d+$/.test(t)) {
        found.add(t);
      }
    }
  }

  return [...found].slice(0, 25);
}

// ─── Work Experience ─────────────────────────────────────────────────────────

const MONTHS: Record<string, string> = {
  jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',
  jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12',
};

function parseDate(token: string): string {
  // "Jan 2020", "January 2020"
  const m1 = token.match(/([A-Za-z]{3,9})\s*['']?\s*(\d{4})/);
  if (m1) {
    const mo = MONTHS[m1[1].toLowerCase().slice(0, 3)];
    return mo ? `${m1[2]}-${mo}` : m1[2];
  }
  // "2020-01"
  const m2 = token.match(/(\d{4})[\/\-](\d{2})/);
  if (m2) return `${m2[1]}-${m2[2]}`;
  // bare year
  const m3 = token.match(/\b(\d{4})\b/);
  return m3 ? m3[1] : '';
}

const DATE_RANGE_RE =
  /([A-Za-z]{3,9}[\s.]*\d{4}|\d{4})\s*(?:[-–—to]+)\s*(present|current|till date|[A-Za-z]{3,9}[\s.]*\d{4}|\d{4})/i;

function extractWorkExperiences(sections: Map<string, string[]>): ParsedWork[] {
  const lines = sectionLines(sections, ['experience','employment','work_history','work experience']);
  if (!lines.length) return [];

  const works: ParsedWork[] = [];
  let cur: Partial<ParsedWork> | null = null;
  const desc: string[] = [];

  const flush = () => {
    if (cur && (cur.company || cur.designation)) {
      works.push({
        company:     cur.company     || '',
        designation: cur.designation || '',
        startDate:   cur.startDate   || '',
        endDate:     cur.endDate     ?? null,
        isCurrent:   cur.isCurrent   ?? false,
        description: desc.join(' ').trim().slice(0, 500),
      });
      desc.length = 0;
    }
  };

  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;

    const dateMatch = t.match(DATE_RANGE_RE);
    if (dateMatch) {
      flush();
      const isCurrent = /present|current|till date/i.test(dateMatch[2]);
      cur = {
        startDate: parseDate(dateMatch[1]),
        endDate:   isCurrent ? null : parseDate(dateMatch[2]),
        isCurrent,
        company:     '',
        designation: '',
      };
    } else if (cur) {
      if (!cur.designation && t.length < 120) {
        cur.designation = t;
      } else if (!cur.company && t.length < 120) {
        cur.company = t;
      } else {
        desc.push(t);
      }
    }
  }
  flush();
  return works.slice(0, 8);
}

// ─── Education ───────────────────────────────────────────────────────────────

const DEGREE_RE =
  /\b(b\.?\s*tech|m\.?\s*tech|b\.?\s*e\.?|m\.?\s*e\.?|b\.?\s*sc|m\.?\s*sc|b\.?\s*com|m\.?\s*com|mba|bba|bca|mca|ph\.?\s*d|bachelor|master|diploma|associate|b\.?\s*a\.?|m\.?\s*a\.?|b\.?\s*ed|m\.?\s*ed|high school|higher secondary|secondary|ssc|hsc|10th|12th|intermediate)\b/i;

function extractEducations(sections: Map<string, string[]>): ParsedEducation[] {
  const lines = sectionLines(sections, ['education','academic','qualification']);
  if (!lines.length) return [];

  const list: ParsedEducation[] = [];
  let cur: Partial<ParsedEducation> | null = null;

  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;

    const yearMatch  = t.match(/\b(19|20)\d{2}\b/);
    const degreeMatch = t.match(DEGREE_RE);

    if (degreeMatch) {
      if (cur?.degree) list.push(cur as ParsedEducation);
      cur = {
        degree:       t.slice(0, 120),
        institute:    '',
        fieldOfStudy: '',
        year:         yearMatch ? yearMatch[0] : '',
      };
    } else if (cur) {
      if (!cur.institute && t.length < 150) {
        cur.institute = t;
      } else if (!cur.year && yearMatch) {
        cur.year = yearMatch[0];
      } else if (!cur.fieldOfStudy && t.length < 80) {
        cur.fieldOfStudy = t;
      }
    }
  }
  if (cur?.degree) list.push(cur as ParsedEducation);
  return list.slice(0, 5);
}

// ─── Main export ─────────────────────────────────────────────────────────────

export async function parseResume(file: File): Promise<ParsedResume> {
  const lines    = await getLines(file);
  const fullText = joinLines(lines);
  const sections = splitSections(lines);

  const email = extractEmail(fullText);
  const name  = extractName(lines, email);

  return {
    fullName:        name,
    email,
    phone:           extractPhone(fullText),
    location:        extractLocation(fullText),
    headline:        extractHeadline(lines, name),
    summary:         extractSummary(sections),
    skills:          extractSkills(fullText, sections),
    workExperiences: extractWorkExperiences(sections),
    educations:      extractEducations(sections),
  };
}
