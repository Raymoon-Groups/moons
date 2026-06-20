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
      className={`picker-menu suggestions-scroll min-w-0 overflow-x-hidden overflow-y-auto overscroll-y-contain ${className}`}
      style={{ maxHeight: EXPERIENCE_MENU_MAX_HEIGHT, ...style }}
    >
      <ul className="m-0 list-none p-0">
        {emptyOption && (
          <li className="border-b border-border">
            <button
              type="button"
              role="option"
              aria-selected={!value}
              onClick={() => onSelect('')}
              className={`picker-item ${!value ? 'picker-item-active' : ''}`}
            >
              {emptyOption.label}
            </button>
          </li>
        )}
        {EXPERIENCE_SEARCH_OPTIONS.map((opt, index) => {
          const selected = value === opt.value;
          const isLast = index === EXPERIENCE_SEARCH_OPTIONS.length - 1;
          return (
            <li key={opt.value} className={!isLast ? 'border-b border-border' : undefined}>
              <button
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => onSelect(opt.value)}
                className={`picker-item ${selected ? 'picker-item-active' : ''}`}
              >
                {opt.hint ? (
                  <>
                    <span>{opt.label}</span>
                    <span className="text-[13px] text-moons-muted"> {opt.hint}</span>
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
