"use client";

import { AnimatePresence, motion } from "motion/react";
import { EXAMPLE_QUERY } from "@/content/steps";
import { REPOS } from "@/content/demo";
import { cx } from "@/lib/cx";
import { useTicker } from "@/lib/useTicker";
import { SearchIcon } from "./SearchIcon";
import s from "./scenes.module.css";

const TYPE_TICKS = Math.ceil(EXAMPLE_QUERY.length / 2);
const CYCLE = TYPE_TICKS + 70;
const RESULTS = [REPOS.starter, REPOS.stockr, REPOS.erp];
const WANTED = ["nestjs", "postgresql"];

export function IntroScene() {
  const t = useTicker(65) % CYCLE;
  const typed = EXAMPLE_QUERY.slice(0, Math.min(EXAMPLE_QUERY.length, t * 2));
  const done = t >= TYPE_TICKS + 4;
  const shown = done ? Math.min(3, Math.floor((t - TYPE_TICKS - 4) / 6) + 1) : 0;

  return (
    <div className={s.scene}>
      <div className={s.searchBox}>
        <span className={s.searchIcon}>
          <SearchIcon />
        </span>
        <span>
          {typed}
          {!done && <span className={s.caret} />}
        </span>
      </div>

      <div className={s.chips} style={{ minHeight: 26 }}>
        <AnimatePresence>
          {done &&
            [
              { k: "functionality", v: "inventory management", c: s.chipAccent },
              { k: "tech", v: "nestjs · postgresql", c: s.chipOk },
              { k: "level", v: "beginner", c: "" },
            ].map((chip, i) => (
              <motion.span key={chip.k} className={cx(s.chip, chip.c)} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.08 }}>
                {chip.k}: {chip.v}
              </motion.span>
            ))}
        </AnimatePresence>
      </div>

      <div className={s.cards} style={{ minHeight: 282 }}>
        <AnimatePresence>
          {RESULTS.slice(0, shown).map((r, i) => (
            <motion.div key={r.id} className={s.card} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.15 } }} transition={{ type: "spring", stiffness: 260, damping: 26 }}>
              <span className={s.cardName}>
                {i + 1}. {r.name}
              </span>
              <span className={s.cardMeta}>★ {r.stars}</span>
              <span className={s.cardDesc}>{r.desc}</span>
              <span className={s.tags}>
                {r.tech.map((tech) => (
                  <span key={tech} className={cx(s.tag, WANTED.includes(tech) && s.tagHit)}>
                    {tech}
                  </span>
                ))}
                <span className={cx(s.tag, r.level === "beginner" && s.tagHit)}>{r.level}</span>
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <p className={s.caption}>Example results, for illustration</p>
    </div>
  );
}
