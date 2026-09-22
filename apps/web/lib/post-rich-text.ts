import {
  editableToStored,
  storedToEditable,
  type MentionRef,
} from '@moons/shared';
import { getDescriptionPlainText, isRichTextHtml } from '@/lib/rich-text';

function walkTextNodes(root: Node, visit: (node: Text) => void) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let current = walker.nextNode();
  while (current) {
    nodes.push(current as Text);
    current = walker.nextNode();
  }
  nodes.forEach(visit);
}

/** Convert editable HTML (`@Name`) + mention refs → stored HTML (`@[Name](id)`). */
export function htmlEditableToStored(html: string, mentions: MentionRef[]): string {
  if (!html.trim()) return '';
  if (typeof document === 'undefined') {
    return editableToStored(getDescriptionPlainText(html), mentions);
  }
  if (!mentions.length) return html;

  const root = document.createElement('div');
  root.innerHTML = html;
  walkTextNodes(root, (node) => {
    if (node.textContent) {
      node.textContent = editableToStored(node.textContent, mentions);
    }
  });
  return root.innerHTML;
}

/** Convert stored HTML/plain body → editable HTML + mention refs. */
export function htmlStoredToEditable(stored: string): {
  html: string;
  mentions: MentionRef[];
} {
  if (!stored.trim()) return { html: '', mentions: [] };

  if (!isRichTextHtml(stored)) {
    const editable = storedToEditable(stored);
    const escaped = editable.text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const paragraphs = escaped
      .split(/\n{2,}/)
      .map((block) => `<p>${block.replace(/\n/g, '<br>')}</p>`)
      .join('');
    return { html: paragraphs || '<p></p>', mentions: editable.mentions };
  }

  if (typeof document === 'undefined') {
    const editable = storedToEditable(getDescriptionPlainText(stored));
    return { html: stored, mentions: editable.mentions };
  }

  const mentions: MentionRef[] = [];
  const root = document.createElement('div');
  root.innerHTML = stored;
  walkTextNodes(root, (node) => {
    if (!node.textContent) return;
    const editable = storedToEditable(node.textContent);
    node.textContent = editable.text;
    for (const m of editable.mentions) {
      if (!mentions.some((x) => x.userId === m.userId)) mentions.push(m);
    }
  });
  return { html: root.innerHTML, mentions };
}

/** Turn stored mention tokens inside HTML into safe anchor tags for display. */
export function storedHtmlWithMentionLinks(html: string): string {
  return html.replace(
    /@\[([^\]]+)\]\(([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\)/gi,
    (_full, name: string, id: string) => {
      const safeName = String(name)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
      return `<a href="/network/${id}" class="mention-link" data-mention-id="${id}">@${safeName}</a>`;
    },
  );
}

export function postBodyPlainText(content: string): string {
  return getDescriptionPlainText(content);
}

export function isPostBodyEmpty(content: string): boolean {
  return postBodyPlainText(content).length === 0;
}
