import { useMemo } from 'react';
import { Linking, StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';
import { router } from 'expo-router';
import { decodeHtmlEntities } from '@/lib/html-text';
import { isRichTextHtml } from '@/lib/rich-text';
import { MentionText } from '@/components/mentions/mention-text';
import { useTheme } from '@/lib/theme-context';

type InlineNode =
  | { type: 'text'; text: string; bold?: boolean; italic?: boolean; underline?: boolean }
  | { type: 'a'; href: string; children: InlineNode[] }
  | { type: 'br' };

type Block =
  | { type: 'p'; children: InlineNode[] }
  | { type: 'ul' | 'ol'; items: InlineNode[][] };

function parseAttrs(tag: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(tag))) {
    attrs[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? '';
  }
  return attrs;
}

function marksFromStack(stack: Array<{ tag: string }>) {
  return {
    bold: stack.some((s) => s.tag === 'strong' || s.tag === 'b'),
    italic: stack.some((s) => s.tag === 'em' || s.tag === 'i'),
    underline: stack.some((s) => s.tag === 'u'),
  };
}

function parseInlines(html: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  const re = /<\/?(?:strong|b|em|i|u|a|br|span)\b[^>]*\/?>/gi;
  let last = 0;
  let m: RegExpExecArray | null;
  const stack: Array<{ tag: string; href?: string }> = [];
  // Buffer for nodes collected inside an <a>
  const linkBuffers: InlineNode[][] = [];

  const pushNode = (node: InlineNode) => {
    const buf = linkBuffers[linkBuffers.length - 1];
    if (buf) buf.push(node);
    else nodes.push(node);
  };

  const flushText = (raw: string) => {
    const text = decodeHtmlEntities(raw);
    if (!text) return;
    pushNode({ type: 'text', text, ...marksFromStack(stack) });
  };

  while ((m = re.exec(html))) {
    if (m.index > last) flushText(html.slice(last, m.index));
    const tag = m[0];
    const name = tag.replace(/^<\/?/, '').replace(/[\s/>].*$/, '').toLowerCase();
    const closing = tag.startsWith('</');
    const selfClosing = /\/>$/.test(tag) || name === 'br';

    if (name === 'br' || (selfClosing && name === 'br')) {
      pushNode({ type: 'br' });
    } else if (name === 'span') {
      // ignore mention/other spans — text still flows
      if (!closing) stack.push({ tag: 'span' });
      else {
        const idx = [...stack].reverse().findIndex((s) => s.tag === 'span');
        if (idx >= 0) stack.splice(stack.length - 1 - idx, 1);
      }
    } else if (closing) {
      if (name === 'a') {
        const children = linkBuffers.pop() ?? [];
        const idx = [...stack].reverse().findIndex((s) => s.tag === 'a');
        const open = idx >= 0 ? stack.splice(stack.length - 1 - idx, 1)[0] : undefined;
        pushNode({ type: 'a', href: open?.href ?? '', children });
      } else {
        const idx = [...stack].reverse().findIndex((s) => s.tag === name);
        if (idx >= 0) stack.splice(stack.length - 1 - idx, 1);
      }
    } else if (name === 'a') {
      const href = parseAttrs(tag).href ?? '';
      stack.push({ tag: 'a', href });
      linkBuffers.push([]);
    } else {
      stack.push({ tag: name });
    }
    last = m.index + tag.length;
  }
  if (last < html.length) flushText(html.slice(last));

  // Close any unclosed link buffers
  while (linkBuffers.length) {
    const children = linkBuffers.pop()!;
    const open = stack.pop();
    nodes.push({ type: 'a', href: open?.href ?? '', children });
  }

  return nodes;
}

function parseBlocks(html: string): Block[] {
  const trimmed = html.trim();
  if (!trimmed) return [];

  const blocks: Block[] = [];
  const blockRe = /<(p|ul|ol|h[1-6]|blockquote|pre|div)(\s[^>]*)?>[\s\S]*?<\/\1>/gi;
  let last = 0;
  let m: RegExpExecArray | null;
  let matched = false;

  const pushPlain = (slice: string) => {
    const plain = decodeHtmlEntities(slice.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
    if (plain) blocks.push({ type: 'p', children: [{ type: 'text', text: plain }] });
  };

  while ((m = blockRe.exec(trimmed))) {
    matched = true;
    if (m.index > last) pushPlain(trimmed.slice(last, m.index));
    const full = m[0];
    const tag = m[1].toLowerCase();
    const inner = full.replace(/^<[^>]+>/, '').replace(/<\/[^>]+>$/, '');

    if (tag === 'ul' || tag === 'ol') {
      const items: InlineNode[][] = [];
      const liRe = /<li(\s[^>]*)?>[\s\S]*?<\/li>/gi;
      let li: RegExpExecArray | null;
      while ((li = liRe.exec(inner))) {
        const liInner = li[0].replace(/^<[^>]+>/, '').replace(/<\/li>$/i, '');
        items.push(parseInlines(liInner));
      }
      if (items.length) blocks.push({ type: tag, items });
    } else {
      blocks.push({ type: 'p', children: parseInlines(inner) });
    }
    last = m.index + full.length;
  }

  if (!matched) {
    blocks.push({ type: 'p', children: parseInlines(trimmed) });
  } else if (last < trimmed.length) {
    pushPlain(trimmed.slice(last));
  }

  return blocks;
}

function openHref(href: string) {
  if (!href) return;
  const network = href.match(/^\/network\/([^/?#]+)/i);
  if (network) {
    router.push(`/network/${network[1]}` as never);
    return;
  }
  const absolute = href.startsWith('http') ? href : href.startsWith('/') ? undefined : href;
  if (absolute) void Linking.openURL(absolute);
}

function renderInlines(
  nodes: InlineNode[],
  keyPrefix: string,
  linkColor: string,
  onDark?: boolean,
) {
  return nodes.map((n, i) => {
    const key = `${keyPrefix}-${i}`;
    if (n.type === 'br') return '\n';
    if (n.type === 'a') {
      return (
        <Text
          key={key}
          style={[styles.link, { color: onDark ? '#93c5fd' : linkColor }]}
          onPress={() => openHref(n.href)}
        >
          {renderInlines(n.children, key, linkColor, onDark)}
        </Text>
      );
    }
    return (
      <Text
        key={key}
        style={[
          n.bold && styles.bold,
          n.italic && styles.italic,
          n.underline && styles.underline,
        ]}
      >
        {n.text}
      </Text>
    );
  });
}

type Props = {
  value: string;
  numberOfLines?: number;
  style?: StyleProp<TextStyle>;
  onDark?: boolean;
};

/** Renders TipTap / feed HTML as React Native Text (web uses dangerouslySetInnerHTML). */
export function PostBody({ value, numberOfLines, style, onDark }: Props) {
  const { colors } = useTheme();
  const blocks = useMemo(() => (isRichTextHtml(value) ? parseBlocks(value) : null), [value]);

  if (!value.trim()) return null;

  if (!blocks) {
    return (
      <MentionText
        value={value}
        style={[styles.base, { color: onDark ? 'rgba(255,255,255,0.92)' : colors.foreground }, style]}
      />
    );
  }

  return (
    <Text
      numberOfLines={numberOfLines}
      style={[styles.base, { color: onDark ? 'rgba(255,255,255,0.92)' : colors.foreground }, style]}
    >
      {blocks.map((block, bi) => {
        if (block.type === 'ul' || block.type === 'ol') {
          return block.items.map((item, ii) => (
            <Text key={`b-${bi}-${ii}`}>
              {bi > 0 || ii > 0 ? '\n' : ''}
              {block.type === 'ol' ? `${ii + 1}. ` : '• '}
              {renderInlines(item, `b-${bi}-${ii}`, colors.blue, onDark)}
            </Text>
          ));
        }
        return (
          <Text key={`b-${bi}`}>
            {bi > 0 ? '\n\n' : ''}
            {renderInlines(block.children, `b-${bi}`, colors.blue, onDark)}
          </Text>
        );
      })}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontSize: 15,
    lineHeight: 22,
  },
  bold: {
    fontWeight: '700',
  },
  italic: {
    fontStyle: 'italic',
  },
  underline: {
    textDecorationLine: 'underline',
  },
  link: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
