"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cx } from "@/lib/cx";
import styles from "./Select.module.css";

export interface SelectOption<T extends string> {
  value: T;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface SelectProps<T extends string> {
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  /** Accessible name, e.g. "Sort results". */
  label: string;
  /** Shown before the value inside the trigger, e.g. "Sort". */
  prefix?: ReactNode;
  variant?: "field" | "quiet";
  className?: string;
}

type Pos = { left: number; width: number; top?: number; bottom?: number };

/**
 * Dropdown with a listbox popup (keyboard: arrows, Home/End, Enter/Space, Escape).
 * The popup is portalled to <body> with fixed positioning, so it isn't clipped by
 * scrolling containers such as the bottom sheet, and it opens upwards near the bottom.
 */
export function Select<T extends string>({ value, options, onChange, label, prefix, variant = "field", className }: SelectProps<T>) {
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState<Pos | null>(null);
  const current = options.find((o) => o.value === value) ?? options[0];

  const place = useCallback(() => {
    const r = trigger.current?.getBoundingClientRect();
    if (!r) return;
    const width = Math.min(Math.max(r.width, 240), window.innerWidth - 16);
    const left = Math.min(Math.max(8, r.right - width), window.innerWidth - width - 8);
    const below = window.innerHeight - r.bottom;
    const needed = Math.min(340, options.length * 56 + 16);
    setPos(below < needed && r.top > below ? { left, width, bottom: window.innerHeight - r.top + 6 } : { left, width, top: r.bottom + 6 });
  }, [options.length]);

  const show = () => {
    place();
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  };
  const hide = (refocus = true) => {
    setOpen(false);
    if (refocus) trigger.current?.focus();
  };
  const choose = (i: number) => {
    const o = options[i];
    if (!o || o.disabled) return;
    onChange(o.value);
    hide();
  };
  const step = (from: number, dir: 1 | -1) => {
    for (let k = 1; k <= options.length; k++) {
      const i = (from + dir * k + options.length) % options.length;
      if (!options[i].disabled) return i;
    }
    return from;
  };

  useEffect(() => {
    if (!open) return;
    list.current?.focus();
    const outside = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!trigger.current?.contains(t) && !list.current?.contains(t)) hide(false);
    };
    document.addEventListener("pointerdown", outside);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      document.removeEventListener("pointerdown", outside);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, place]);

  const onTriggerKey = (e: KeyboardEvent) => {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
      e.preventDefault();
      show();
    }
  };
  const onListKey = (e: KeyboardEvent) => {
    const keys: Record<string, () => void> = {
      ArrowDown: () => setActive((a) => step(a, 1)),
      ArrowUp: () => setActive((a) => step(a, -1)),
      Home: () => setActive(step(-1, 1)),
      End: () => setActive(step(options.length, -1)),
      Enter: () => choose(active),
      " ": () => choose(active),
      Escape: () => hide(),
      Tab: () => hide(false),
    };
    if (!keys[e.key]) return;
    if (e.key !== "Tab") e.preventDefault();
    e.stopPropagation(); // Escape here shouldn't also close a surrounding sheet
    keys[e.key]();
  };

  return (
    <>
      <button
        ref={trigger}
        type="button"
        className={cx(styles.trigger, variant === "quiet" && styles.quiet, className)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${id}-list` : undefined}
        aria-label={`${label}: ${current.label}`}
        onClick={() => (open ? hide(false) : show())}
        onKeyDown={onTriggerKey}
      >
        {prefix && <span className={styles.prefix}>{prefix}</span>}
        <span className={styles.value}>{current.label}</span>
        <svg className={cx(styles.chev, open && styles.chevOpen)} viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
          <path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && pos && (
              <motion.ul
                ref={list}
                id={`${id}-list`}
                role="listbox"
                tabIndex={-1}
                aria-label={label}
                aria-activedescendant={`${id}-${active}`}
                className={styles.list}
                style={{ left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom }}
                initial={{ opacity: 0, y: pos.top !== undefined ? -6 : 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.12 } }}
                transition={{ duration: 0.18 }}
                onKeyDown={onListKey}
              >
                {options.map((o, i) => (
                  <li
                    key={o.value}
                    id={`${id}-${i}`}
                    role="option"
                    aria-selected={o.value === value}
                    aria-disabled={o.disabled || undefined}
                    className={cx(styles.option, i === active && styles.active, o.disabled && styles.disabled)}
                    onPointerMove={() => !o.disabled && setActive(i)}
                    onClick={() => choose(i)}
                  >
                    <span className={styles.check} aria-hidden="true">
                      {o.value === value ? "✓" : ""}
                    </span>
                    <span className={styles.optText}>
                      <span>{o.label}</span>
                      {o.description && <span className={styles.desc}>{o.description}</span>}
                    </span>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
