"use client";

import { motion } from "motion/react";
import { useTicker } from "@/lib/useTicker";
import s from "./scenes.module.css";

const METHOD_TOPS: [string, string[]][] = [
  ["Boolean", ["A", "C", "E", "F", "G"]],
  ["TF-IDF", ["C", "A", "E", "H", "D"]],
  ["BM25", ["A", "C", "E", "D", "H"]],
  ["Embed", ["B", "A", "E", "C", "I"]],
  ["Hybrid", ["A", "C", "E", "B", "D"]],
];
const POOL = [...new Set(METHOD_TOPS.flatMap(([, ids]) => ids))].sort();
const GRADES: Record<string, 0 | 1 | 2> = { A: 2, B: 2, C: 1, D: 0, E: 1, F: 0, G: 0, H: 1, I: 0 };
const GRADE_STYLE = [
  { background: "var(--faint)", color: "var(--muted)" },
  { background: "var(--accent-soft)", color: "var(--accent-text)" },
  { background: "var(--accent)", color: "var(--accent-ink)" },
];
const METRICS = ["Precision", "Recall", "F1", "MAP", "NDCG"];

/* 0 per-method top-k · 1 pool · 2 labels · 3 metrics · 4–5 hold */
export function EvaluationScene() {
  const phase = useTicker(1500, 7);

  return (
    <div className={s.scene}>
      <div className={s.panel}>
        <div className={s.panelTitle}>Query q01 · top results from each method (top 5 of 10 shown)</div>
        <div className={s.evalCols}>
          {METHOD_TOPS.map(([name, ids]) => (
            <div key={name} className={s.evalCol}>
              <span className={s.label}>{name}</span>
              {ids.map((id, k) => (
                <motion.span key={id} className={s.sq} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: k * 0.05 }}>
                  {id}
                </motion.span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <motion.div className={s.panel} animate={{ opacity: phase >= 1 ? 1 : 0.2 }}>
        <div className={s.panelTitle}>
          Pool · {POOL.length} unique repos from {METHOD_TOPS.length * 5} results · labelled blind by two people
        </div>
        <div className={s.pool}>
          {POOL.map((id, k) => (
            <motion.div key={id} className={s.poolItem} initial={false} animate={{ scale: phase === 1 ? [1, 1.08, 1] : 1 }} transition={{ delay: k * 0.04 }}>
              {id}
              <motion.span className={s.grade} animate={phase >= 2 ? GRADE_STYLE[GRADES[id]] : { background: "var(--card)", color: "var(--muted)" }} transition={{ delay: phase >= 2 ? k * 0.08 : 0 }}>
                {phase >= 2 ? GRADES[id] : "?"}
              </motion.span>
            </motion.div>
          ))}
        </div>
        <div className={s.chips} style={{ justifyContent: "flex-start", marginTop: 10 }}>
          <span className={s.chip} style={{ background: "var(--card)" }}>0 not relevant</span>
          <span className={s.chip} style={GRADE_STYLE[1]}>1 partly</span>
          <span className={s.chip} style={GRADE_STYLE[2]}>2 relevant</span>
        </div>
      </motion.div>

      <motion.div className={s.chips} animate={{ opacity: phase >= 3 ? 1 : 0.2 }}>
        {METRICS.map((m, i) => (
          <motion.span key={m} className={s.chip} animate={phase >= 3 ? { scale: [0.9, 1] } : {}} transition={{ delay: i * 0.08 }} style={phase >= 3 ? { background: "var(--btn-bg)", color: "var(--btn-ink)" } : undefined}>
            {m}
          </motion.span>
        ))}
      </motion.div>
      <p className={s.caption}>Repeated for 25 queries, each method with and without popularity re-ranking.</p>
    </div>
  );
}
