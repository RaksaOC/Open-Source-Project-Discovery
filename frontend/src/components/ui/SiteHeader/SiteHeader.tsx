"use client";

import Link from "next/link";
import { ThemeToggle } from "../ThemeToggle";
import styles from "./SiteHeader.module.css";

/** Top bar shared by the search page and the tour: brand and theme switch only. */
export function SiteHeader({ onBrand }: { onBrand?: () => void }) {
  return (
    <header className={styles.header}>
      <Link
        className={styles.brand}
        href="/"
        onClick={(e) => {
          if (onBrand) {
            e.preventDefault();
            onBrand();
          }
        }}
      >
        <BrandMark />
        <span>Discovery Engine</span>
      </Link>
      <ThemeToggle />
    </header>
  );
}

export function BrandMark() {
  return (
    <svg viewBox="0 0 28 28" width="26" height="26" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="var(--accent)" strokeWidth="2" />
      <path d="m18.2 18.2 6.3 6.3" stroke="var(--accent)" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M8.2 10.2h7.6M8.2 13.8h5" stroke="var(--ink)" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
