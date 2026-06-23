'use client';

import { useEffect, type ReactNode } from 'react';
import Placeholder from '@tiptap/extension-placeholder';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import type { Editor } from '@tiptap/react';
import { getDescriptionPlainText } from '@/lib/rich-text';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minLength?: number;
}

function ToolbarButton({
  active,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`rounded-md px-2 py-1 text-xs font-semibold transition ${
        active
          ? 'bg-moons-blue/15 text-moons-blue'
          : 'text-moons-muted hover:bg-surface hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );
}

function EditorToolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border/60 bg-surface/60 px-2 py-1.5">
      <ToolbarButton
        title="Bold"
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        B
      </ToolbarButton>
      <ToolbarButton
        title="Italic"
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <span className="italic">I</span>
      </ToolbarButton>
      <ToolbarButton
        title="Heading"
        active={editor.isActive('heading', { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        H
      </ToolbarButton>
      <span className="mx-1 h-4 w-px bg-border" aria-hidden />
      <ToolbarButton
        title="Bullet list"
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        • List
      </ToolbarButton>
      <ToolbarButton
        title="Numbered list"
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1. List
      </ToolbarButton>
      <ToolbarButton
        title="Quote"
        active={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        “
      </ToolbarButton>
    </div>
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start writing…',
  minLength = 20,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor: current }) => {
      onChange(current.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          'tiptap-editor min-h-[200px] px-3 py-2.5 text-sm text-foreground focus:outline-none',
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const editorHtml = editor.getHTML();
    const incoming = value || '';
    if (incoming === editorHtml) return;
    if (!incoming && editor.isEmpty) return;
    editor.commands.setContent(incoming, { emitUpdate: false });
  }, [editor, value]);

  const plainLength = getDescriptionPlainText(value).length;
  const tooShort = plainLength > 0 && plainLength < minLength;

  return (
    <div className="overflow-hidden rounded-md border border-border bg-surface-elevated focus-within:border-moons-blue focus-within:ring-1 focus-within:ring-moons-blue/30">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
      <div className="flex items-center justify-between border-t border-border/50 px-3 py-1.5 text-xs text-moons-muted">
        <span>Use the toolbar to format your description.</span>
        <span className={tooShort ? 'text-amber-600' : ''}>
          {plainLength}/{minLength} min chars
        </span>
      </div>
    </div>
  );
}
