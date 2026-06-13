'use client';

import { EXPERIENCE_SEARCH_OPTIONS } from '@/lib/experience-options';
import type { CSSProperties, RefObject } from 'react';

/** ~6 visible rows before scrolling (Naukri-style) */
export const EXPERIENCE_MENU_MAX_HEIGHT = '15.75rem';

export function ExperiencePickerDropdown({
  value,
  onSelect,
  className = '',
  style,
  menuRef,
  emptyOption,
}: {
  value: string;
  onSelect: (value: string) => void;
  className?: string;
  style?: CSSProperties;
  menuRef?: RefObject<HTMLDivElement | null>;
  emptyOption?: { label: string };
}) {
  return (
    <div
      ref={menuRef}
      role="listbox"
      className={`suggestions-scroll min-w-0 overflow-x-hidden overflow-y-auto overscroll-y-contain rounded-lg border border-[#e8e8e8] bg-white py-1 shadow-[0_4px_24px_rgba(0,0,0,0.12)] ${className}`}
      style={{ maxHeight: EXPERIENCE_MENU_MAX_HEIGHT, ...style }}
    >
      <ul className="m-0 list-none p-0">
        {emptyOption && (
          <li className="border-b border-[#f0f0f0]">
            <button
              type="button"
              role="option"
              aria-selected={!value}
              onClick={() => onSelect('')}
              className={`block w-full px-4 py-2 text-left text-[15px] leading-snug transition ${
                !value
                  ? 'bg-[#eef6ff] text-[#757575]'
                  : 'text-[#757575] hover:bg-[#eef6ff]'
              }`}
            >
              {emptyOption.label}
            </button>
          </li>
        )}
        {EXPERIENCE_SEARCH_OPTIONS.map((opt, index) => {
          const selected = value === opt.value;
          const isLast = index === EXPERIENCE_SEARCH_OPTIONS.length - 1;
          return (
            <li key={opt.value} className={!isLast ? 'border-b border-[#f0f0f0]' : undefined}>
              <button
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => onSelect(opt.value)}
                className={`block w-full px-4 py-2 text-left text-[15px] leading-snug transition ${
                  selected
                    ? 'bg-[#eef6ff] text-[#1a1a1a]'
                    : 'text-[#1a1a1a] hover:bg-[#eef6ff]'
                }`}
              >
                {opt.hint ? (
                  <>
                    <span>{opt.label}</span>
                    <span className="text-[13px] text-[#757575]"> {opt.hint}</span>
                  </>
                ) : (
                  opt.label
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
