"use client";

import { motion } from "motion/react";
import { cx } from "@/lib/cx";
import { useTicker } from "@/lib/useTicker";
import s from "./scenes.module.css";

const RAW: { text: string; drop?: boolean }[] = [
  { text: "[![build](https://img.shields.io/…)]", drop: true },
  { text: "# Nest Inventory Starter" },
  { text: "![screenshot](docs/ui.png)", drop: true },
  { text: "A starter tutorial for an inventory API" },
  { text: "built with Nest.js and Postgres." },
  { text: "```bash\nnpm install && npm run start\n```", drop: true },
  { text: "## Features: products, stock, suppliers" },
];

const TOKENS: { t: string; tech?: boolean; from?: string }[] = [
  { t: "nest" },
  { t: "inventory" },
  { t: "starter" },
  { t: "tutorial" },
  { t: "inventory" },
  { t: "api" },
  { t: "build" },
  { t: "nestjs", tech: true, from: "Nest.js" },
  { t: "postgresql", tech: true, from: "Postgres" },
  { t: "feature" },
  { t: "product" },
  { t: "stock" },
  { t: "supplier" },
];

/* 0 raw · 1 strip noise · 2 tokens · 3 labels · 4–5 hold */
export function PreprocessScene() {
  const phase = useTicker(1400, 7);

  return (
    <div className={s.scene}>
      <div className={s.three}>
        <div className={s.panel}>
          <div className={s.panelTitle}>1 · Raw README</div>
          <div className={s.code}>
            {RAW.map((line) => (
              <motion.span
                key={line.text}
                className={cx(s.codeLine, line.drop && phase >= 1 && s.removed)}
                animate={{ opacity: line.drop && phase >= 1 ? 0.45 : 1 }}
              >
                {line.text}
              </motion.span>
            ))}
          </div>
        </div>

        <motion.div className={s.panel} animate={{ opacity: phase >= 1 ? 1 : 0.25 }}>
          <div className={s.panelTitle}>2 · Clean text</div>
          <div className={s.code} style={{ fontFamily: "var(--f-body)", fontSize: "0.78rem" }}>
            Nest Inventory Starter. A starter tutorial for an inventory API built with Nest.js and Postgres. Features: products, stock, suppliers.
          </div>
        </motion.div>

        <motion.div className={s.panel} animate={{ opacity: phase >= 2 ? 1 : 0.25 }}>
          <div className={s.panelTitle}>3 · Tokens</div>
          <div className={s.tokens}>
            {TOKENS.map((tok, i) => (
              <motion.span
                key={i}
                className={cx(s.token, tok.tech && s.tokenTech)}
                initial={false}
                animate={{ opacity: phase >= 2 ? 1 : 0, scale: phase >= 2 ? 1 : 0.7 }}
                transition={{ delay: phase >= 2 ? i * 0.04 : 0 }}
                title={tok.from ? `${tok.from} → ${tok.t}` : undefined}
              >
                {tok.t}
              </motion.span>
            ))}
          </div>
          <div className={s.label} style={{ marginTop: 10 }}>
            stop words out · lemmatised · tech kept whole
          </div>
        </motion.div>
      </div>

      <motion.div className={s.chips} animate={{ opacity: phase >= 3 ? 1 : 0, y: phase >= 3 ? 0 : 8 }}>
        <span className={cx(s.chip, s.chipAccent)}>Nest.js → nestjs</span>
        <span className={cx(s.chip, s.chipAccent)}>Postgres → postgresql</span>
        <span className={cx(s.chip, s.chipOk)}>level: beginner (“starter”, “tutorial”)</span>
      </motion.div>
    </div>
  );
}
