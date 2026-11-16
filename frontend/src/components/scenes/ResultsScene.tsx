"use client";

import { motion } from "motion/react";
import { REPOS } from "@/content/demo";
import { cx } from "@/lib/cx";
import s from "./scenes.module.css";

const r = REPOS.starter;
const fade = (i: number) => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.15 + i * 0.12 } });

export function ResultsScene() {
  return (
    <div className={s.scene}>
      <motion.div className={s.bigCard} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
        <div className={s.bigHead}>
          <span className={s.bigName}>1. {r.name}</span>
          <span className={s.cardMeta}>
            ★ {r.stars} · ⑂ {r.forks} · MIT
          </span>
        </div>
        <motion.p {...fade(0)} style={{ fontSize: "0.92rem", color: "var(--ink)" }}>
          Beginner <mark className={s.mark}>inventory management</mark> API: products, <mark className={s.mark}>stock</mark> levels and suppliers, built with{" "}
          <mark className={s.mark}>NestJS</mark> and <mark className={s.mark}>PostgreSQL</mark>.
        </motion.p>
        <motion.div {...fade(1)} className={s.tags} style={{ marginTop: 0 }}>
          {r.tech.map((t) => (
            <span key={t} className={cx(s.tag, t !== "typeorm" && s.tagHit)}>
              {t !== "typeorm" && "✓ "}
              {t}
            </span>
          ))}
          <span className={cx(s.tag, s.tagHit)}>✓ beginner</span>
        </motion.div>

        <div className={s.why}>
          <div className={s.label}>Why it matched</div>
          {[
            ["Text", "README: inventory ×6, stock ×3, management ×2"],
            ["Tech", "nestjs, postgresql: both requested"],
            ["Level", "beginner: README says “starter” and “tutorial”"],
            ["Score", "BM25 0.88 · embedding 0.84 · popularity 0.35"],
          ].map(([k, v], i) => (
            <motion.div key={k} className={s.whyRow} {...fade(2 + i)}>
              <span className={s.label}>{k}</span>
              <span>{v}</span>
            </motion.div>
          ))}
        </div>

        <motion.div {...fade(6)} className={s.why}>
          <div className={s.label}>Related projects (from the graph)</div>
          <div className={s.tags} style={{ marginTop: 0 }}>
            <span className={s.tag}>stockr-api</span>
            <span className={s.tag}>nest-erp-suite</span>
            <span className={s.tag}>pos-nest</span>
          </div>
        </motion.div>
        <motion.span {...fade(7)} className={s.ghLink}>
          Open on GitHub ↗
        </motion.span>
      </motion.div>
      <p className={s.caption}>Mock-up of one result card. Repository and numbers are examples.</p>
    </div>
  );
}
