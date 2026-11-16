"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { METHODS, REPOS, SCORES, type Method } from "@/content/demo";
import s from "./scenes.module.css";

export function RankScene() {
  const [m, setM] = useState<Method>("boolean");
  const [pinned, setPinned] = useState(false);
  useEffect(() => {
    if (pinned) return;
    const id = window.setInterval(() => setM((cur) => METHODS[(METHODS.findIndex((x) => x.id === cur) + 1) % METHODS.length].id), 3600);
    return () => window.clearInterval(id);
  }, [pinned]);

  const scores = SCORES[m];
  const ranked = Object.entries(scores).sort((a, b) => (b[1] ?? -1) - (a[1] ?? -1));
  const method = METHODS.find((x) => x.id === m)!;

  return (
    <div className={s.scene}>
      <div className={s.controlRow} style={{ overflowX: "auto" }}>
        <div className={s.segmented} role="group" aria-label="Ranking method">
          {METHODS.map((x) => (
            <button
              key={x.id}
              aria-pressed={x.id === m}
              onClick={() => {
                setPinned(true);
                setM(x.id);
              }}
            >
              {x.id === m && <motion.span layoutId="ir-method" className={s.segPill} />}
              <span>{x.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        {ranked.map(([id, score], i) => {
          const r = REPOS[id];
          const missing = score === null;
          return (
            <motion.div key={id} layout className={s.rankRow} animate={{ opacity: missing ? 0.35 : 1 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
              <span className={s.rankPos}>{missing ? "–" : m === "boolean" ? "·" : i + 1}</span>
              <span className={s.rankName}>
                {r.name}
                <small>{r.desc}</small>
              </span>
              <span style={{ height: 6, borderRadius: 99, background: "var(--faint)", overflow: "hidden" }}>
                <motion.span style={{ display: "block", height: "100%", background: id === "stockr" ? "var(--ok)" : "var(--accent)", borderRadius: 99 }} animate={{ width: `${(score ?? 0) * 100}%` }} transition={{ type: "spring", stiffness: 120, damping: 18 }} />
              </span>
              <span className={s.score}>{missing ? "—" : m === "boolean" ? "match" : score!.toFixed(2)}</span>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.p key={m} className={s.methodNote} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
          {method.note}
        </motion.p>
      </AnimatePresence>
      <p className={s.caption}>Illustrative scores. stockr-api (green) is the relevant repository with the “wrong” words.</p>
    </div>
  );
}
