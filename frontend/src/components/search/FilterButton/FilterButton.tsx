"use client";

import { cx } from "@/lib/cx";
import styles from "./FilterButton.module.css";

/** Opens the filter sheet on small screens (hidden on desktop, where the sidebar shows). Badge = active filters. */
export function FilterButton({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <button className={cx(styles.button, count > 0 && styles.buttonOn)} onClick={onClick} aria-haspopup="dialog">
      <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
        <path d="M3 5h9M15 5h2M3 10h3M9 10h8M3 15h7M13 15h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <circle cx="13.5" cy="5" r="1.8" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="7.5" cy="10" r="1.8" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="11.5" cy="15" r="1.8" fill="none" stroke="currentColor" strokeWidth="1.6" />
      </svg>
      Filter &amp; sort
      {count > 0 && <span className={styles.badge}>{count}</span>}
    </button>
  );
}
