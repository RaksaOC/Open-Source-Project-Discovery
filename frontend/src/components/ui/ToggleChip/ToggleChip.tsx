"use client";

import { cx } from "@/lib/cx";
import styles from "./ToggleChip.module.css";

/** A pill that toggles on and off, with an optional count. */
export function ToggleChip({ label, count, on, onToggle, disabled }: { label: string; count?: number; on: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <button type="button" className={cx(styles.toggle, on && styles.toggleOn)} aria-pressed={on} onClick={onToggle} disabled={disabled}>
      {on && <span aria-hidden="true">✓</span>}
      {label}
      {count !== undefined && <span className={styles.count}>{count}</span>}
    </button>
  );
}
