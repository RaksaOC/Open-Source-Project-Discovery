"use client";

import { motion } from "motion/react";
import type { Method } from "@/lib/api/types";
import { cx } from "@/lib/cx";
import { compact, monthYear } from "@/lib/format";
import { techLabel } from "@/lib/search/labels";
import type { ResultView } from "@/lib/search/types";
import ui from "@/components/ui/primitives/primitives.module.css";
import { Highlight } from "../Highlight";
import styles from "./ResultCard.module.css";

interface ResultCardProps {
  r: ResultView;
  rank: number;
  method: Method;
  stems: Set<string>;
  wantTech: string[];
  wantLevel: string | null;
  onOpen: () => void;
}

/** One search result. The repo name button covers the whole card, so a click anywhere opens it. */
export function ResultCard({ r, rank, method, stems, wantTech, wantLevel, onOpen }: ResultCardProps) {
  const [owner, name] = r.full_name.split("/");
  const levelHit = wantLevel === r.complexity;
  return (
    <article className={styles.card}>
      <div className={styles.top}>
        <span className={styles.rank}>{rank}</span>
        <div className={styles.title}>
          <button className={styles.name} onClick={onOpen}>
            <span className={styles.owner}>{owner} /</span> <span className={styles.repo}>{name}</span>
          </button>
          <p className={styles.desc}>{r.description}</p>
        </div>
        {method !== "boolean" && <ScoreRing value={r.score} />}
      </div>
      {r.snippet !== r.description && (
        <p className={styles.snippet}>
          <Highlight text={r.snippet} stems={stems} />
        </p>
      )}
      <div className={ui.chips}>
        <span className={cx(ui.chip, ui.chipOutline, levelHit && ui.chipHit)}>
          {levelHit && "✓ "}
          {r.complexity}
        </span>
        {r.technologies.map((t) => (
          <span key={t} className={cx(ui.chip, wantTech.includes(t) && ui.chipHit)}>
            {wantTech.includes(t) && "✓ "}
            {techLabel(t)}
          </span>
        ))}
      </div>
      <div className={styles.meta}>
        {r.language && (
          <span>
            <span className={styles.lang} data-lang={r.language} /> {r.language}
          </span>
        )}
        <span>★ {compact(r.stars)}</span>
        <span>⑂ {compact(r.forks)}</span>
        {r.updated && <span>Updated {monthYear(r.updated)}</span>}
        {r.license && <span className={styles.wide}>{r.license}</span>}
      </div>
    </article>
  );
}

function ScoreRing({ value }: { value: number }) {
  const c = 2 * Math.PI * 16;
  return (
    <span className={styles.ring} title={`Final score ${value.toFixed(2)} (relevance and popularity)`}>
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <circle cx="20" cy="20" r="16" fill="none" stroke="var(--faint)" strokeWidth="4" />
        <motion.circle
          cx="20"
          cy="20"
          r="16"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="4"
          strokeLinecap="round"
          transform="rotate(-90 20 20)"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - value) }}
        />
      </svg>
      <b>{Math.round(value * 100)}</b>
    </span>
  );
}
