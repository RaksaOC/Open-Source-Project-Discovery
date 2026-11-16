"use client";

import { motion } from "motion/react";
import { cx } from "@/lib/cx";
import { useTicker } from "@/lib/useTicker";
import s from "./scenes.module.css";

type Part = { text: string; kind?: "func" | "tech" | "level"; at?: number };
const PARTS: Part[] = [
  { text: "Find a " },
  { text: "beginner-friendly", kind: "level", at: 3 },
  { text: " " },
  { text: "inventory management system", kind: "func", at: 1 },
  { text: " using " },
  { text: "NestJS", kind: "tech", at: 2 },
  { text: " and " },
  { text: "PostgreSQL", kind: "tech", at: 2 },
];
const KIND = { func: s.segFunc, tech: s.segTech, level: s.segLevel };

/* 0 plain · 1 functionality · 2 technologies · 3 level · 4 parsed · 5 filter/rank · 6–7 hold */
export function QueryScene() {
  const phase = useTicker(1100, 9);

  return (
    <div className={s.scene}>
      <div className={s.panel} style={{ padding: "20px 18px" }}>
        <div className={s.sentence}>
          {PARTS.map((p, i) =>
            p.kind ? (
              <motion.span key={i} className={cx(s.seg, phase >= p.at! && KIND[p.kind])} animate={{ opacity: 1 }}>
                {p.text}
              </motion.span>
            ) : (
              <span key={i} style={{ color: "var(--muted)" }}>
                {p.text}
              </span>
            ),
          )}
        </div>
        <div className={s.chips} style={{ marginTop: 12 }}>
          <span className={cx(s.chip, s.chipAccent)}>functionality</span>
          <span className={cx(s.chip, s.chipOk)}>technologies</span>
          <span className={s.chip} style={{ background: "var(--card)" }}>
            complexity
          </span>
        </div>
      </div>

      <motion.pre className={s.codeBlock} animate={{ opacity: phase >= 4 ? 1 : 0.2 }} style={{ margin: 0 }}>
        <span className={s.codeKey}>ParsedQuery</span>(
        {"\n  "}
        <span className={s.codeKey}>functionality</span>=<span className={s.codeStr}>&quot;inventory management system&quot;</span>,
        {"\n  "}
        <span className={s.codeKey}>technologies</span>=[<span className={s.codeStr}>&quot;nestjs&quot;</span>, <span className={s.codeStr}>&quot;postgresql&quot;</span>],
        {"\n  "}
        <span className={s.codeKey}>complexity</span>=<span className={s.codeStr}>&quot;beginner&quot;</span>,{"\n"})
      </motion.pre>

      <motion.div className={s.flow} animate={{ opacity: phase >= 5 ? 1 : 0.2, y: phase >= 5 ? 0 : 6 }}>
        <div className={s.panel}>
          <div className={s.panelTitle}>Filter</div>
          <div style={{ fontSize: "0.84rem", color: "var(--ink)" }}>
            tech + level narrow <b className={s.mono}>10,000</b> → <b className={s.mono}>~300</b> candidates
          </div>
        </div>
        <span className={s.arrow}>→</span>
        <div className={s.panel}>
          <div className={s.panelTitle}>Rank</div>
          <div style={{ fontSize: "0.84rem", color: "var(--ink)" }}>functionality is the text the ranker scores</div>
        </div>
      </motion.div>
    </div>
  );
}
