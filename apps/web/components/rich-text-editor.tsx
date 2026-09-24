'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  type ReactNode,
} from 'react';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { getActiveMention } from '@moons/shared';
import { getDescriptionPlainText } from '@/lib/rich-text';

export type RichTextEditorHandle = {
  focus: () => void;
  getPlainText: () => string;
  /** Replace in-progress @query before caret with `@DisplayName ` */
  insertMention: (displayName: string) => boolean;
  clear: () => void;
};

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  /** Fired with plain text + caret index in plain text (approx for mention detection). */
  onPlainTextChange?: (plainText: string, caret: number) => void;
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  disabled?: boolean;
  /** Compact feed composer; blog = full admin toolbar */
  variant?: 'default' | 'compact' | 'blog';
  footerHint?: string;
  showFooter?: boolean;
}

function ToolbarButton({
  active,
  onClick,
  title,
  children,
  disabled,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-md px-2 py-1 text-xs font-semibold transition disabled:opacity-50 ${
        active
          ? 'bg-moons-blue/15 text-moons-blue'
          : 'text-moons-muted hover:bg-surface hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );
}

function currentBlockLabel(editor: Editor): string {
  if (editor.isActive('heading', { level: 1 })) return 'Heading 1';
  if (editor.isActive('heading', { level: 2 })) return 'Heading 2';
  if (editor.isActive('heading', { level: 3 })) return 'Heading 3';
  return 'Normal';
}

function setBlockStyle(editor: Editor, style: string) {
  const chain = editor.chain().focus();
  if (style === 'h1') {
    chain.setHeading({ level: 1 }).run();
    return;
  }
  if (style === 'h2') {
    chain.setHeading({ level: 2 }).run();
    return;
  }
  if (style === 'h3') {
    chain.setHeading({ level: 3 }).run();
    return;
  }
  chain.setParagraph().run();
}

function promptForLink(editor: Editor) {
  const previous = editor.getAttributes('link').href as string | undefined;
  const url = window.prompt('Enter URL', previous || 'https://');
  if (url === null) return;
  const trimmed = url.trim();
  if (!trimmed) {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    return;
  }
  const href = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
}

function BlogToolbar({
  editor,
  disabled,
}: {
  editor: Editor | null;
  disabled?: boolean;
}) {
  if (!editor) return null;

  const blockValue = editor.isActive('heading', { level: 1 })
    ? 'h1'
    : editor.isActive('heading', { level: 2 })
      ? 'h2'
      : editor.isActive('heading', { level: 3 })
        ? 'h3'
        : 'p';

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border/60 bg-surface/60 px-2 py-1.5">
      <label className="relative mr-1 inline-flex items-center">
        <span className="sr-only">Text style</span>
        <select
          disabled={disabled}
          value={blockValue}
          aria-label="Text style"
          title={currentBlockLabel(editor)}
          onChange={(e) => setBlockStyle(editor, e.target.value)}
          className="appearance-none rounded-md bg-transparent py-1 pl-2 pr-7 text-xs font-semibold text-moons-blue outline-none transition hover:bg-surface disabled:opacity-50"
        >
          <option value="p">Normal</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>
        <span className="pointer-events-none absolute right-1.5 text-[10px] leading-none text-moons-blue">
          ↕
        </span>
      </label>

      <ToolbarButton
        title="Bold"
        disabled={disabled}
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        B
      </ToolbarButton>
      <ToolbarButton
        title="Italic"
        disabled={disabled}
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <span className="italic">I</span>
      </ToolbarButton>
      <ToolbarButton
        title="Underline"
        disabled={disabled}
        active={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <span className="underline">U</span>
      </ToolbarButton>

      <span className="mx-1 h-4 w-px bg-border" aria-hidden />

      <ToolbarButton
        title="Numbered list"
        disabled={disabled}
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <span aria-hidden className="inline-flex flex-col gap-0.5 text-[9px] leading-none">
          <span>1.</span>
          <span>2.</span>
          <span>3.</span>
        </span>
      </ToolbarButton>
      <ToolbarButton
        title="Bullet list"
        disabled={disabled}
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <span aria-hidden className="inline-flex flex-col gap-0.5 text-[10px] leading-none">
          <span>• ―</span>
          <span>• ―</span>
          <span>• ―</span>
        </span>
      </ToolbarButton>

      <span className="mx-1 h-4 w-px bg-border" aria-hidden />

      <ToolbarButton
        title="Link"
        disabled={disabled}
        active={editor.isActive('link')}
        onClick={() => promptForLink(editor)}
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
          <path
            d="M10 13a5 5 0 007.54.54l1.92-1.92a5 5 0 00-7.07-7.07L10.8 6.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M14 11a5 5 0 00-7.54-.54L4.54 12.38a5 5 0 007.07 7.07L13.2 17.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </ToolbarButton>
      <ToolbarButton
        title="Clear formatting"
        disabled={disabled}
        onClick={() =>
          editor.chain().focus().unsetAllMarks().clearNodes().setParagraph().run()
        }
      >
        <span className="inline-flex items-baseline gap-0.5">
          T<sub className="text-[9px]">x</sub>
        </span>
      </ToolbarButton>
    </div>
  );
}

function EditorToolbar({
  editor,
  disabled,
  compact,
}: {
  editor: Editor | null;
  disabled?: boolean;
  compact?: boolean;
}) {
  if (!editor) return null;

  return (
    <div
      className={`flex flex-wrap items-center gap-0.5 border-b border-border/60 bg-surface/60 ${
        compact ? 'px-2 py-1' : 'px-2 py-1.5'
      }`}
    >
      <ToolbarButton
        title="Bold"
        disabled={disabled}
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        B
      </ToolbarButton>
      <ToolbarButton
        title="Italic"
        disabled={disabled}
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <span className="italic">I</span>
      </ToolbarButton>
      {!compact ? (
        <ToolbarButton
          title="Heading"
          disabled={disabled}
          active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          H
        </ToolbarButton>
      ) : null}
      <span className="mx-1 h-4 w-px bg-border" aria-hidden />
      <ToolbarButton
        title="Bullet list"
        disabled={disabled}
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        • List
      </ToolbarButton>
      <ToolbarButton
        title="Numbered list"
        disabled={disabled}
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1. List
      </ToolbarButton>
      {!compact ? (
        <ToolbarButton
          title="Quote"
          disabled={disabled}
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          “
        </ToolbarButton>
      ) : null}
    </div>
  );
}

function plainTextCaretFromEditor(editor: Editor): { text: string; caret: number } {
  const text = editor.getText({ blockSeparator: '\n' });
  const { from } = editor.state.selection;
  const before = editor.state.doc.textBetween(0, from, '\n', '\n');
  return { text, caret: before.length };
}

export const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(
  function RichTextEditor(
    {
      value,
      onChange,
      onPlainTextChange,
      placeholder = 'Start writing…',
      minLength = 20,
      maxLength,
      disabled = false,
      variant = 'default',
      footerHint = 'Use the toolbar to format your description.',
      showFooter = true,
    },
    ref,
  ) {
    const compact = variant === 'compact';
    const blog = variant === 'blog';

    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: compact ? false : { levels: blog ? [1, 2, 3] : [2, 3] },
        }),
        Underline,
        Link.configure({
          openOnClick: false,
          autolink: true,
          defaultProtocol: 'https',
          HTMLAttributes: {
            class: 'rich-text-link',
            rel: 'noopener noreferrer',
            target: '_blank',
          },
        }),
        Placeholder.configure({ placeholder }),
      ],
      content: value,
      editable: !disabled,
      immediatelyRender: false,
      onUpdate: ({ editor: current }) => {
        const html = current.getHTML();
        onChange(html);
        if (onPlainTextChange) {
          const { text, caret } = plainTextCaretFromEditor(current);
          onPlainTextChange(text, caret);
        }
      },
      onSelectionUpdate: ({ editor: current }) => {
        if (!onPlainTextChange) return;
        const { text, caret } = plainTextCaretFromEditor(current);
        onPlainTextChange(text, caret);
      },
      editorProps: {
        attributes: {
          class: compact
            ? 'tiptap-editor min-h-[88px] max-h-[220px] overflow-y-auto px-3 py-2.5 text-sm leading-6 text-heading focus:outline-none'
            : blog
              ? 'tiptap-editor min-h-[280px] px-3 py-3 text-[15px] leading-7 text-foreground focus:outline-none'
              : 'tiptap-editor min-h-[200px] px-3 py-2.5 text-sm text-foreground focus:outline-none',
        },
      },
    });

    useEffect(() => {
      if (!editor) return;
      editor.setEditable(!disabled);
    }, [editor, disabled]);

    useEffect(() => {
      if (!editor) return;
      const editorHtml = editor.getHTML();
      const incoming = value || '';
      if (incoming === editorHtml) return;
      if (!incoming && editor.isEmpty) return;
      editor.commands.setContent(incoming || '', { emitUpdate: false });
    }, [editor, value]);

    useImperativeHandle(
      ref,
      () => ({
        focus: () => {
          editor?.commands.focus('end');
        },
        getPlainText: () => editor?.getText({ blockSeparator: '\n' }) ?? '',
        clear: () => {
          editor?.commands.clearContent(true);
        },
        insertMention: (displayName: string) => {
          if (!editor) return false;
          const { from } = editor.state.selection;
          const $from = editor.state.selection.$from;
          const parentText = $from.parent.textBetween(0, $from.parentOffset, undefined, '\ufffc');
          const active = getActiveMention(parentText, parentText.length);
          if (!active) return false;
          const startPos = $from.start() + active.start;
          const safeName = displayName.replace(/[[\]]/g, '').trim() || 'Member';
          editor
            .chain()
            .focus()
            .deleteRange({ from: startPos, to: from })
            .insertContent(`@${safeName} `)
            .run();
          return true;
        },
      }),
      [editor],
    );

    const plainLength = getDescriptionPlainText(value).length;
    const tooShort = minLength > 0 && plainLength > 0 && plainLength < minLength;
    const overMax = typeof maxLength === 'number' && plainLength > maxLength;

    return (
      <div
        className={`overflow-hidden border border-border bg-surface focus-within:border-moons-blue/40 focus-within:ring-1 focus-within:ring-moons-blue/20 ${
          compact ? 'rounded-xl' : 'rounded-md bg-surface-elevated focus-within:ring-moons-blue/30'
        } ${disabled ? 'opacity-70' : ''}`}
      >
        {blog ? (
          <BlogToolbar editor={editor} disabled={disabled} />
        ) : (
          <EditorToolbar editor={editor} disabled={disabled} compact={compact} />
        )}
        <EditorContent editor={editor} />
        {showFooter ? (
          <div className="flex items-center justify-between border-t border-border/50 px-3 py-1.5 text-xs text-moons-muted">
            <span>{footerHint}</span>
            <span className={tooShort || overMax ? 'text-amber-600' : ''}>
              {typeof maxLength === 'number'
                ? `${plainLength}/${maxLength}`
                : minLength > 0
                  ? `${plainLength}/${minLength} min chars`
                  : `${plainLength} chars`}
            </span>
          </div>
        ) : null}
      </div>
    );
  },
);
