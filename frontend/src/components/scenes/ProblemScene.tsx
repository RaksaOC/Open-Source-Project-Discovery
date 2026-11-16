"use client";

import { motion } from "motion/react";
import { EXAMPLE_QUERY } from "@/content/steps";
import { cx } from "@/lib/cx";
import { useTicker } from "@/lib/useTicker";
import s from "./scenes.module.css";

const TOP_BY_STARS = [
  ["inventory-management-nest-pg", "1.8k"],
  ["nest-erp-suite", "3.1k"],
  ["…136 more", ""],
];

/* 0 idle · 1 sentence searched · 2 keywords searched · 3 the missed repo · 4–6 hold */
export function ProblemScene() {
  const phase = useTicker(1300, 8);
  const show = (p: number) => ({ opacity: phase >= p ? 1 : 0.15, y: phase >= p ? 0 : 6 });

  return (
    <div className={s.scene}>
      <div className={s.ghGrid}>
        <motion.div className={s.panel} animate={show(1)}>
          <div className={s.panelTitle}>GitHub search · full sentence</div>
          <div className={s.ghQuery}>{EXAMPLE_QUERY}</div>
          <div className={s.ghCount} style={{ color: "var(--bad)" }}>
            0
          </div>
          <div className={s.label}>repository results</div>
        </motion.div>
        <motion.div className={s.panel} animate={show(2)}>
          <div className={s.panelTitle}>GitHub search · keywords</div>
          <div className={s.ghQuery}>inventory management nestjs postgresql</div>
          <div className={s.ghCount}>138</div>
          <div className={s.label} style={{ marginBottom: 6 }}>
            results · sorted by stars
          </div>
          {TOP_BY_STARS.map(([n, st]) => (
            <div key={n} className={s.ghRow}>
              <span>{n}</span>
              <span>{st && `★ ${st}`}</span>
            </div>
          ))}
        </motion.div>
      </div>

      <motion.div className={cx(s.card, s.missed)} animate={show(3)}>
        <span className={s.cardName}>stockr-api</span>
        <span className={cx(s.chip, s.chipAccent)}>never found</span>
        <span className={s.cardDesc}>
          “Warehouse stock tracker for small shops.” Exactly what the user wants, but the name and description never say <i>inventory</i>, and NestJS only appears in the README.
        </span>
      </motion.div>
    </div>
  );
}
