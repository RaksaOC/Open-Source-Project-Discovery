"use client";

import { useEffect } from "react";
import { cx } from "@/lib/cx";
import { useTypewriter } from "@/lib/useTypewriter";
import styles from "./SearchBox.module.css";

/* Queries the large search box types out as its placeholder. */
const TYPED = [
  "a beginner inventory system with NestJS and PostgreSQL",
  "real-time chat app with Socket.IO for my first project",
  "e-commerce backend with Stripe payments in Django",
  "hospital appointment booking system in Laravel",
  "Next.js blog starter with Markdown posts",
  "REST API boilerplate with JWT login in FastAPI",
  "library management system for a Java student project",
];

interface SearchBoxProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (q: string) => void;
  size?: "md" | "lg";
}

export function SearchBox({ value, onChange, onSubmit, size = "md" }: SearchBoxProps) {
  const large = size === "lg";
  const typed = useTypewriter(TYPED, large && !value);

  // "/" jumps to the search box from anywhere on the page
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || (e.target instanceof HTMLElement && e.target.closest("input, textarea, select, [contenteditable]"))) return;
      e.preventDefault();
      document.getElementById("q")?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <form
      className={cx(styles.box, large && styles.large)}
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(value);
      }}
    >
      <input
        id="q"
        className={styles.input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={large ? typed : "Describe what you want to build"}
        aria-label="Describe the project you want to build"
        autoComplete="off"
        spellCheck={false}
        autoFocus={large}
      />
      {value && (
        <button type="button" className={styles.clear} onClick={() => (onChange(""), document.getElementById("q")?.focus())} aria-label="Clear">
          ×
        </button>
      )}
      <button className={styles.submit} type="submit" aria-label="Search" title="Search">
        <svg viewBox="0 0 24 24" width={large ? 22 : 18} height={large ? 22 : 18} aria-hidden="true">
          <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
          <path d="m15.5 15.5 5 5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      </button>
    </form>
  );
}
