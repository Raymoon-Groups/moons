'use client';

import { useRef } from 'react';
import { MentionSuggestions } from '@/components/mentions/mention-suggestions';
import { useMentionComposer } from '@/lib/use-mention-composer';

type CommonProps = {
  value: string;
  onChange: (value: string) => void;
  onStoredChange?: (stored: string) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
  rows?: number;
  onFocus?: () => void;
  onBlur?: () => void;
};

/** Textarea with @mention suggestions for network connections. */
export function MentionTextarea({
  value,
  onChange,
  onStoredChange,
  placeholder,
  maxLength,
  className,
  rows = 2,
  onFocus,
  onBlur,
}: CommonProps) {
  const mention = useMentionComposer();
  const ref = useRef<HTMLTextAreaElement>(null);
  const suggestions = mention.suggestionsFor(value);

  function syncStored(next: string) {
    onStoredChange?.(mention.toStored(next));
  }

  return (
    <div className="relative w-full">
      <textarea
        ref={ref}
        value={value}
        rows={rows}
        maxLength={maxLength}
        placeholder={placeholder}
        className={className}
        onFocus={onFocus}
        onBlur={onBlur}
        onChange={(e) => {
          const next = e.target.value;
          onChange(next);
          mention.setCaret(e.target.selectionStart ?? next.length);
          mention.syncMentionsFromText(next);
          mention.ensureLoaded();
          syncStored(next);
        }}
        onSelect={(e) => {
          const target = e.target as HTMLTextAreaElement;
          mention.setCaret(target.selectionStart ?? value.length);
        }}
        onKeyUp={(e) => {
          const target = e.target as HTMLTextAreaElement;
          mention.setCaret(target.selectionStart ?? value.length);
        }}
      />
      <MentionSuggestions
        people={suggestions}
        onSelect={(person) => {
          const result = mention.pickMention(value, person);
          onChange(result.text);
          syncStored(result.text);
          requestAnimationFrame(() => {
            const el = ref.current;
            if (!el) return;
            el.focus();
            el.setSelectionRange(result.caret, result.caret);
            mention.setCaret(result.caret);
          });
        }}
      />
    </div>
  );
}

/** Single-line input with @mention suggestions. */
export function MentionInput({
  value,
  onChange,
  onStoredChange,
  placeholder,
  maxLength,
  className,
  onFocus,
  onBlur,
}: Omit<CommonProps, 'rows'>) {
  const mention = useMentionComposer();
  const ref = useRef<HTMLInputElement>(null);
  const suggestions = mention.suggestionsFor(value);

  function syncStored(next: string) {
    onStoredChange?.(mention.toStored(next));
  }

  return (
    <div className="relative w-full">
      <input
        ref={ref}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        className={className}
        onFocus={onFocus}
        onBlur={onBlur}
        onChange={(e) => {
          const next = e.target.value;
          onChange(next);
          mention.setCaret(e.target.selectionStart ?? next.length);
          mention.syncMentionsFromText(next);
          mention.ensureLoaded();
          syncStored(next);
        }}
        onSelect={(e) => {
          const target = e.target as HTMLInputElement;
          mention.setCaret(target.selectionStart ?? value.length);
        }}
        onKeyUp={(e) => {
          const target = e.target as HTMLInputElement;
          mention.setCaret(target.selectionStart ?? value.length);
        }}
      />
      <div className="absolute left-0 right-0 top-full z-30">
        <MentionSuggestions
          people={suggestions}
          onSelect={(person) => {
            const result = mention.pickMention(value, person);
            onChange(result.text);
            syncStored(result.text);
            requestAnimationFrame(() => {
              const el = ref.current;
              if (!el) return;
              el.focus();
              el.setSelectionRange(result.caret, result.caret);
              mention.setCaret(result.caret);
            });
          }}
        />
      </div>
    </div>
  );
}

export function useMentionSubmit(value: string) {
  const mention = useMentionComposer();
  return {
    toStored: () => mention.toStored(value),
    mention,
  };
}
