export function getDescriptionPlainText(content: string): string {
  if (!content) return '';
  if (!/<[a-z][\s\S]*>/i.test(content)) return content.trim();

  if (typeof document !== 'undefined') {
    const div = document.createElement('div');
    div.innerHTML = content;
    return (div.textContent || '').replace(/\s+/g, ' ').trim();
  }

  return content
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isDescriptionValid(description: string, minLength = 20): boolean {
  return getDescriptionPlainText(description).length >= minLength;
}

export function isRichTextHtml(content: string): boolean {
  return /<[a-z][\s\S]*>/i.test(content);
}
