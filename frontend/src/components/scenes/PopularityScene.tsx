"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { REPOS } from "@/content/demo";
import s from "./scenes.module.css";

type Edge = { a: number; b: number; kind: "contrib" | "topic" | "fork" | "link" };
const NODES = [
  { x: 120, y: 95, pr: 1.0, label: "erp-suite" },
  { x: 250, y: 58, pr: 0.8, label: "inventory-mgmt-pg" },
  { x: 62, y: 178, pr: 0.45, label: "inv-starter" },
  { x: 200, y: 170, pr: 0.5 },
  { x: 300, y: 145, pr: 0.35 },
  { x: 40, y: 60, pr: 0.3 },
  { x: 320, y: 225, pr: 0.25 },
  { x: 150, y: 245, pr: 0.2, label: "stockr-api" },
  { x: 270, y: 255, pr: 0.2 },
];
const EDGES: Edge[] = [
  { a: 0, b: 1, kind: "contrib" },
  { a: 0, b: 2, kind: "topic" },
  { a: 0, b: 3, kind: "link" },
  { a: 1, b: 4, kind: "fork" },
  { a: 5, b: 0, kind: "fork" },
  { a: 3, b: 4, kind: "topic" },
  { a: 2, b: 7, kind: "topic" },
  { a: 4, b: 6, kind: "contrib" },
  { a: 3, b: 8, kind: "link" },
  { a: 1, b: 3, kind: "contrib" },
];
const DASH = { contrib: undefined, topic: "4 4", fork: "1 0", link: "1.5 4" };

const ROWS = [
  { id: "starter", rel: 0.86, pop: 0.35 },
  { id: "stuffed", rel: 0.73, pop: 0.9 },
  { id: "erp", rel: 0.66, pop: 0.95 },
  { id: "stockr", rel: 0.52, pop: 0.1 },
];

export function PopularityScene() {
  const [on, setOn] = useState(false);
  const [pinned, setPinned] = useState(false);
  useEffect(() => {
    if (pinned) return;
    const id = window.setInterval(() => setOn((v) => !v), 3800);
    return () => window.clearInterval(id);
  }, [pinned]);

  const scored = ROWS.map((r) => ({ ...r, final: on ? 0.8 * r.rel + 0.2 * r.pop : r.rel })).sort((a, b) => b.final - a.final);

  return (
    <div className={s.scene}>
      <div className={s.popGrid}>
        <div className={s.panel}>
          <div className={s.panelTitle}>Repository graph · size = PageRank</div>
          <svg viewBox="0 0 360 290" className={s.svg} role="img" aria-label="Repository graph with PageRank-sized nodes">
            {EDGES.map((e, i) => {
              const A = NODES[e.a];
              const B = NODES[e.b];
              return (
                <g key={i}>
                  <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="var(--ctl)" strokeWidth={1.3} strokeDasharray={DASH[e.kind]} />
                  <motion.circle r={2.6} fill="var(--accent)" initial={{ cx: A.x, cy: A.y, opacity: 0 }} animate={{ cx: [A.x, B.x], cy: [A.y, B.y], opacity: [0, 1, 0] }} transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.35, repeatDelay: 1.2 }} />
                </g>
              );
            })}
            {NODES.map((n, i) => (
              <g key={i}>
                <motion.circle cx={n.x} cy={n.y} fill="var(--accent)" fillOpacity={0.2 + n.pr * 0.6} stroke="var(--accent)" initial={{ r: 4 }} animate={{ r: 7 + n.pr * 16 }} transition={{ delay: 0.1 + i * 0.06, type: "spring", stiffness: 140, damping: 14 }} />
                {n.label && (
                  <text x={n.x} y={n.y + 9 + 7 + n.pr * 16} textAnchor="middle" fontSize={12} fontWeight={500} fill="var(--ink)">
                    {n.label}
                  </text>
                )}
              </g>
            ))}
          </svg>
          <div className={s.legend}>
            <span>— contributor</span>
            <span>- - topic</span>
            <span>━ fork</span>
            <span>··· README link</span>
          </div>
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          <div className={s.controlRow} style={{ justifyContent: "flex-start" }}>
            <button
              className={s.switch}
              role="switch"
              aria-checked={on}
              onClick={() => {
                setPinned(true);
                setOn((v) => !v);
              }}
            >
              <span className={s.switchTrack} data-on={on}>
                <motion.span layout className={s.switchKnob} />
              </span>
              Popularity {on ? "on" : "off"}
            </button>
          </div>
          <div className={s.formula}>{on ? "0.8 × relevance + 0.2 × popularity" : "relevance only"}</div>
          {scored.map((r, i) => (
            <motion.div key={r.id} layout className={s.rankRow} style={{ gridTemplateColumns: "20px minmax(0,1fr) 44px" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
              <span className={s.rankPos}>{i + 1}</span>
              <span className={s.rankName}>
                {REPOS[r.id].name}
                <small>
                  rel {r.rel.toFixed(2)} · pop {r.pop.toFixed(2)} · ★ {REPOS[r.id].stars}
                </small>
              </span>
              <span className={s.score}>{r.final.toFixed(2)}</span>
            </motion.div>
          ))}
          <p className={s.caption} style={{ textAlign: "left" }}>
            The popular repo edges past the starter, but the small beginner projects stay in the list. Popularity only gets 20% of the weight.
          </p>
        </div>
      </div>
    </div>
  );
}
