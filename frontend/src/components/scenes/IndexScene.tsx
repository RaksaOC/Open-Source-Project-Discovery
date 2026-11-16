"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { cx } from "@/lib/cx";
import s from "./scenes.module.css";

const POSTINGS: Record<string, number[]> = {
  inventory: [2, 5, 7, 9, 12, 15],
  nestjs: [3, 5, 9, 11, 12],
  tutorial: [5, 8, 15],
};

type Op = "AND" | "OR" | "NOT";
const OPS: { op: Op; query: string; result: number[]; terms: string[] }[] = [
  { op: "AND", query: "inventory AND nestjs", terms: ["inventory", "nestjs"], result: [5, 9, 12] },
  { op: "OR", query: "inventory OR nestjs", terms: ["inventory", "nestjs"], result: [2, 3, 5, 7, 9, 11, 12, 15] },
  { op: "NOT", query: "inventory AND nestjs NOT tutorial", terms: ["inventory", "nestjs", "tutorial"], result: [9, 12] },
];

export function IndexScene() {
  const [i, setI] = useState(0);
  const [pinned, setPinned] = useState(false);
  useEffect(() => {
    if (pinned) return;
    const id = window.setInterval(() => setI((v) => (v + 1) % OPS.length), 3200);
    return () => window.clearInterval(id);
  }, [pinned]);
  const cur = OPS[i];

  return (
    <div className={s.scene}>
      <div className={s.controlRow}>
        <div className={s.segmented} role="group" aria-label="Boolean operator">
          {OPS.map((o, k) => (
            <button
              key={o.op}
              aria-pressed={k === i}
              onClick={() => {
                setPinned(true);
                setI(k);
              }}
            >
              {k === i && <motion.span layoutId="ir-op" className={s.segPill} />}
              <span>{o.op}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={s.panel} style={{ textAlign: "center" }}>
        <div className={s.panelTitle}>Query</div>
        <motion.div key={cur.query} className={s.mono} style={{ fontSize: "1rem", color: "var(--ink)" }} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
          {cur.query}
        </motion.div>
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        <div className={s.label}>Inverted index · term → posting list (repo ids)</div>
        {Object.entries(POSTINGS).map(([term, docs]) => {
          const used = cur.terms.includes(term);
          const negated = term === "tutorial";
          return (
            <motion.div key={term} className={s.posting} animate={{ opacity: used ? 1 : 0.4 }}>
              <span className={s.postingTerm}>
                {negated && used ? "NOT " : ""}
                {term}
              </span>
              <span className={s.docs}>
                {docs.map((d) => {
                  const hit = used && !negated && cur.result.includes(d);
                  const struck = used && negated && POSTINGS.inventory.includes(d) && POSTINGS.nestjs.includes(d);
                  return (
                    <motion.span
                      key={d}
                      className={cx(s.doc, hit && s.docHit)}
                      animate={{ scale: hit ? 1.06 : 1, textDecoration: struck ? "line-through" : "none" }}
                      style={struck ? { background: "var(--bad-soft)", color: "var(--bad)" } : undefined}
                    >
                      {d}
                    </motion.span>
                  );
                })}
              </span>
            </motion.div>
          );
        })}
      </div>

      <div className={s.panel}>
        <div className={s.panelTitle}>Result · {cur.result.length} repositories, unranked</div>
        <div className={s.docs}>
          {cur.result.map((d) => (
            <motion.span key={`${cur.op}-${d}`} layout className={cx(s.doc, s.docHit)} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}>
              {d}
            </motion.span>
          ))}
        </div>
      </div>
    </div>
  );
}
