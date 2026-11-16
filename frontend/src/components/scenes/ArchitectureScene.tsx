"use client";

import { motion } from "motion/react";
import { Fragment } from "react";
import s from "./scenes.module.css";

type Node = { name: string; path: string; owner: string; out?: string };
const OFFLINE: Node[] = [
  { name: "Collect", path: "collect/", owner: "Rith", out: "data/raw" },
  { name: "Preprocess", path: "preprocess/", owner: "Chey", out: "data/processed" },
  { name: "Index", path: "index/ · rank/ · graph/", owner: "Chey · Man · Keo · Rith", out: "data/index" },
];
const ONLINE: Node[] = [
  { name: "Parse", path: "query/parser.py", owner: "Keo" },
  { name: "Filter", path: "search.py · api/", owner: "Ory" },
  { name: "Rank", path: "rank/bm25 · tfidf · hybrid", owner: "Man · Keo" },
  { name: "Re-rank", path: "rank/popularity.py", owner: "Man · Rith" },
  { name: "Results", path: "frontend/", owner: "Ory" },
];

function Pipe({ nodes, delay }: { nodes: Node[]; delay: number }) {
  return (
    <div className={s.pipe}>
      {nodes.map((n, i) => (
        <Fragment key={n.name}>
          {i > 0 && (
            <motion.span className={s.pipeArrow} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.25 }}>
              →
            </motion.span>
          )}
          <motion.div className={s.node} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: delay + i * 0.08 }}>
            <strong>{n.name}</strong>
            <code>{n.path}</code>
            {n.out && <code>→ {n.out}</code>}
            <span className={s.owner}>{n.owner}</span>
          </motion.div>
        </Fragment>
      ))}
    </div>
  );
}

export function ArchitectureScene() {
  return (
    <div className={s.scene}>
      <div className={s.band}>
        <div className={s.label}>Offline · python -m discovery collect | preprocess | index</div>
        <Pipe nodes={OFFLINE} delay={0.1} />
      </div>
      <div className={s.band}>
        <div className={s.label}>Online · GET /api/search → SearchEngine.search(query, method)</div>
        <Pipe nodes={ONLINE} delay={0.4} />
      </div>
      <motion.div className={s.band} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>
        <div className={s.label}>Evaluation · Sao</div>
        <div style={{ fontSize: "0.84rem", color: "var(--ink)" }}>
          <code className={s.mono}>evaluation/</code> runs every ranker through the same interface, <code className={s.mono}>fit(docs)</code> and{" "}
          <code className={s.mono}>search(query, k)</code>, on <code className={s.mono}>eval/queries.json</code> and <code className={s.mono}>qrels.csv</code>.
        </div>
      </motion.div>
      <div className={s.chips}>
        <span className={s.chip}>Phase 1–2: Boolean, TF-IDF, BM25 first</span>
        <span className={s.chip}>Phase 3–4: embeddings, hybrid, graph</span>
        <span className={s.chip}>Phase 5: labelling + metrics</span>
      </div>
    </div>
  );
}
