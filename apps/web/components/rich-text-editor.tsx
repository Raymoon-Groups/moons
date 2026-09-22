'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  type ReactNode,
} from 'react';
import Placeholder from '@tiptap/extension-placeholder';
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
  /** Compact feed composer style */
  variant?: 'default' | 'compact';
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

    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: compact ? false : { levels: [2, 3] },
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
        <EditorToolbar editor={editor} disabled={disabled} compact={compact} />
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
