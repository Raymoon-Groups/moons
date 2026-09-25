export type TextOrLinkSegment =
  | { type: 'text'; value: string }
  | { type: 'link'; value: string; href: string };

/** Match http(s) and www. URLs; trailing punctuation is peeled off below. */
const URL_RE = /\b(?:https?:\/\/|www\.)[^\s<>\[\]{}|\\^`"']+/gi;

function splitTrailingPunctuation(raw: string): { core: string; trailing: string } {
  let core = raw;
  let trailing = '';
  // Keep path `/` and query chars; peel common sentence punctuation.
  while (core.length > 1 && /[.,;:!?)\]]$/.test(core)) {
    // Don't strip a closing paren that looks balanced inside the URL
    if (core.endsWith(')') && (core.match(/\(/g)?.length ?? 0) > (core.match(/\)/g)?.length ?? 0) - 1) {
      break;
    }
    trailing = core.slice(-1) + trailing;
    core = core.slice(0, -1);
  }
  return { core, trailing };
}

function toHref(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

/** Split plain text into text + link segments for clickable URLs. */
export function splitTextWithUrls(text: string): TextOrLinkSegment[] {
  if (!text) return [];
  const segments: TextOrLinkSegment[] = [];
  const re = new RegExp(URL_RE.source, 'gi');
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      segments.push({ type: 'text', value: text.slice(last, match.index) });
    }
    const { core, trailing } = splitTrailingPunctuation(match[0]);
    if (core) {
      segments.push({ type: 'link', value: core, href: toHref(core) });
    }
    if (trailing) {
      segments.push({ type: 'text', value: trailing });
    }
    last = match.index + match[0].length;
  }

  if (last < text.length) {
    segments.push({ type: 'text', value: text.slice(last) });
  }

  return segments.length ? segments : [{ type: 'text', value: text }];
}
