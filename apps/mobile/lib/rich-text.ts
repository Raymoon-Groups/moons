import { stripHtml } from '@/lib/html-text';

export function getDescriptionPlainText(content: string): string {
  if (!content) return '';
  if (!/<[a-z][\s\S]*>/i.test(content)) return content.trim();
  return stripHtml(content);
}

export function isDescriptionValid(description: string, minLength = 20): boolean {
  return getDescriptionPlainText(description).length >= minLength;
}

export function isRichTextHtml(content: string): boolean {
  return /<[a-z][\s\S]*>/i.test(content);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Convert editor draft (markdown-lite) into HTML TipTap-compatible markup. */
export function draftToHtml(draft: string): string {
  const raw = draft.replace(/\r\n/g, '\n').trim();
  if (!raw) return '';

  const lines = raw.split('\n');
  const blocks: string[] = [];
  let listType: 'ul' | 'ol' | null = null;
  let listItems: string[] = [];

  function flushList() {
    if (!listType || listItems.length === 0) {
      listType = null;
      listItems = [];
      return;
    }
    const tag = listType;
    blocks.push(`<${tag}>${listItems.map((item) => `<li>${item}</li>`).join('')}</${tag}>`);
    listType = null;
    listItems = [];
  }

  function formatInline(text: string): string {
    let out = escapeHtml(text);
    out = out.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    return out;
  }

  for (const line of lines) {
    const bullet = line.match(/^\s*[-•]\s+(.*)$/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/);
    const heading = line.match(/^#{1,3}\s+(.*)$/);
    const quote = line.match(/^>\s?(.*)$/);

    if (bullet) {
      if (listType && listType !== 'ul') flushList();
      listType = 'ul';
      listItems.push(formatInline(bullet[1]));
      continue;
    }
    if (numbered) {
      if (listType && listType !== 'ol') flushList();
      listType = 'ol';
      listItems.push(formatInline(numbered[1]));
      continue;
    }

    flushList();

    if (heading) {
      blocks.push(`<h3>${formatInline(heading[1])}</h3>`);
      continue;
    }
    if (quote) {
      blocks.push(`<blockquote><p>${formatInline(quote[1])}</p></blockquote>`);
      continue;
    }
    if (!line.trim()) continue;
    blocks.push(`<p>${formatInline(line)}</p>`);
  }

  flushList();
  return blocks.join('');
}

/** Convert stored HTML back into an editable markdown-lite draft. */
export function htmlToDraft(html: string): string {
  if (!html) return '';
  if (!isRichTextHtml(html)) return html;

  let text = html
    .replace(/\r\n/g, '\n')
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/\s*h[1-6]\s*>/gi, '\n')
    .replace(/<\s*h[1-6][^>]*>/gi, '# ')
    .replace(/<\/\s*p\s*>/gi, '\n')
    .replace(/<\s*p[^>]*>/gi, '')
    .replace(/<\s*blockquote[^>]*>/gi, '')
    .replace(/<\/\s*blockquote\s*>/gi, '\n')
    .replace(/<\s*li[^>]*>/gi, '• ')
    .replace(/<\/\s*li\s*>/gi, '\n')
    .replace(/<\/?\s*ul[^>]*>/gi, '')
    .replace(/<\/?\s*ol[^>]*>/gi, '')
    .replace(/<\s*strong[^>]*>|<\s*b[^>]*>/gi, '**')
    .replace(/<\/\s*strong\s*>|<\/\s*b\s*>/gi, '**')
    .replace(/<\s*em[^>]*>|<\s*i[^>]*>/gi, '*')
    .replace(/<\/\s*em\s*>|<\/\s*i\s*>/gi, '*')
    .replace(/<[^>]+>/g, '');

  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
