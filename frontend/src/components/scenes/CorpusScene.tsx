"use client";

import { motion } from "motion/react";
import { useTicker } from "@/lib/useTicker";
import s from "./scenes.module.css";

const DOMAINS = ["inventory", "point of sale", "e-commerce", "blog", "chat", "todo", "school", "hospital", "library", "booking", "crm", "portfolio"];
const STACKS = ["nestjs", "express", "django", "flask", "fastapi", "laravel", "spring-boot", "rails", "react", "vue", "nextjs", "flutter"];
const TOTAL = 144;
const TARGET = 10_000;

export function CorpusScene() {
  const t = useTicker(80) % (TOTAL + 30);
  const filled = Math.min(t, TOTAL);
  const current = Math.min(filled, TOTAL - 1);
  const count = Math.round((filled / TOTAL) * TARGET);
  const requests = Math.round(filled * 2.6);

  return (
    <div className={s.scene}>
      <div className={s.corpusSide}>
        <div className={s.panel}>
          <div className={s.panelTitle}>Slices: domain × stack</div>
          <div className={s.grid12}>
            {Array.from({ length: TOTAL }, (_, i) => (
              <motion.span
                key={i}
                className={s.cell}
                initial={false}
                animate={{
                  backgroundColor: i < filled ? (i === current && filled < TOTAL ? "var(--accent)" : "var(--accent-mid)") : "var(--faint)",
                  scale: i === current && filled < TOTAL ? 1.25 : 1,
                }}
                transition={{ duration: 0.2 }}
              />
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gap: 14 }}>
          <div>
            <div className={s.label}>Repositories collected</div>
            <div className={s.counter}>{count.toLocaleString("en-US")}</div>
          </div>
          <div className={s.meter}>
            <motion.div className={s.meterFill} animate={{ width: `${(filled / TOTAL) * 100}%` }} transition={{ duration: 0.2 }} />
          </div>
          <div className={s.panel} style={{ padding: "10px 12px" }}>
            <div className={s.label}>Now crawling</div>
            <div className={s.mono} style={{ fontSize: "0.8rem", color: "var(--ink)", marginTop: 4 }}>
              {filled < TOTAL ? `"${DOMAINS[Math.floor(current / 12)]}" + ${STACKS[current % 12]}` : "done · de-duplicated by full name"}
            </div>
          </div>
          <div className={s.chips} style={{ justifyContent: "flex-start" }}>
            <span className={s.chip}>{requests} API calls</span>
            <span className={s.chip}>≤ 1,000 per query</span>
            <span className={s.chip}>30 searches / min</span>
          </div>
        </div>
      </div>
      <p className={s.caption}>Slices that still hit the 1,000 cap are split again by star range. Every response is cached on disk.</p>
    </div>
  );
}
