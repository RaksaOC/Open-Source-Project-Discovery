"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import type { Method } from "@/lib/api/types";
import { cx } from "@/lib/cx";
import { SAMPLE_SIZE } from "@/lib/preview/fakeSearch";
import { METHOD_INFO } from "@/lib/search/labels";
import type { DataSource } from "@/lib/search/types";
import styles from "./SearchProgress.module.css";

/** Shown while a new search runs: pipeline steps tick off over shimmering placeholder cards. */
export function SearchProgress({ method, source }: { method: Method; source: DataSource }) {
  const what = source === "preview" ? `${SAMPLE_SIZE} sample repositories` : "the index";
  const steps = ["Reading your query", `Ranking ${what} with ${METHOD_INFO[method].label}`, "Boosting popular projects", "Explaining each match"];
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setStep((s) => Math.min(s + 1, steps.length - 1)), 220);
    return () => window.clearInterval(id);
  }, [steps.length]);

  return (
    <div role="status" aria-live="polite">
      <ul className={styles.steps}>
        {steps.map((t, i) => (
          <motion.li key={t} initial={{ opacity: 0, x: -8 }} animate={{ opacity: i <= step ? 1 : 0.35, x: 0 }} transition={{ delay: i * 0.08 }}>
            <span className={cx(styles.icon, i < step && styles.done)} aria-hidden="true">
              {i < step ? "✓" : i === step ? <span className={styles.spin} /> : null}
            </span>
            {t}
          </motion.li>
        ))}
      </ul>
      <ol className={styles.cards} aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <motion.li key={i} className={styles.card} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.08 }}>
            <span style={{ width: "38%", height: 16 }} />
            <span style={{ width: "82%" }} />
            <span style={{ width: "64%" }} />
            <span className={styles.chips}>
              <i />
              <i />
              <i />
            </span>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}
