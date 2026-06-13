'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { ExperiencePickerDropdown } from '@/components/jobs/experience-picker-dropdown';
import {
  getExperienceSearchLabel,
  normalizeExperienceValue,
} from '@/lib/experience-options';

const inputClass =
  'mt-1 flex w-full items-center justify-between gap-2 rounded-md border border-border bg-surface-elevated px-3 py-2 text-left text-sm outline-none transition focus:border-moons-blue focus:ring-1 focus:ring-moons-blue/30';

export function ExperienceRequiredPicker({
  value,
  onChange,
  placeholder = 'Not specified',
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
}) {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});

  const normalizedValue = value ? normalizeExperienceValue(value) : '';
  const displayLabel = normalizedValue ? getExperienceSearchLabel(normalizedValue) : '';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (menuRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      setOpen(false);
    }

    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  useEffect(() => {
    if (!open || !anchorRef.current) return;

    const menuMaxHeightPx = 252;
    const gap = 8;

    function updateMenuPosition() {
      const anchor = anchorRef.current;
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom - gap;
      const spaceAbove = rect.top - gap;
      const openUp = spaceBelow < menuMaxHeightPx && spaceAbove > spaceBelow;

      setMenuStyle(
        openUp
          ? {
              position: 'fixed',
              left: rect.left,
              width: rect.width,
              bottom: window.innerHeight - rect.top + gap,
              zIndex: 9999,
            }
          : {
              position: 'fixed',
              left: rect.left,
              width: rect.width,
              top: rect.bottom + gap,
              zIndex: 9999,
            },
      );
    }

    updateMenuPosition();
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);

    return () => {
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [open]);

  function handleSelect(next: string) {
    onChange(next);
    setOpen(false);
  }

  return (
    <>
      <button
        ref={anchorRef}
        id={id}
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`${inputClass} ${displayLabel ? 'text-foreground' : 'text-moons-muted'}`}
      >
        <span className="truncate">{displayLabel || placeholder}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-moons-muted transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {mounted &&
        open &&
        createPortal(
          <div ref={menuRef}>
            <ExperiencePickerDropdown
              value={normalizedValue}
              onSelect={handleSelect}
              style={menuStyle}
              emptyOption={{ label: placeholder }}
            />
          </div>,
          document.body,
        )}
    </>
  );
}

function ChevronDown({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}
