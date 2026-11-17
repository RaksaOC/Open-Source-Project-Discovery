"use client";

import { motion } from "motion/react";
import type { Method } from "@/lib/api/types";
import { cx } from "@/lib/cx";
import { METHOD_INFO, METHOD_ORDER } from "@/lib/search/labels";
import styles from "./MethodTabs.module.css";

/** The ranking-method switch, centred above the results. */
export function MethodTabs({ value, onChange }: { value: Method; onChange: (m: Method) => void }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.tabs} role="radiogroup" aria-label="Ranking method">
        {METHOD_ORDER.map((m) => (
          <button key={m} role="radio" aria-checked={value === m} title={METHOD_INFO[m].blurb} className={cx(styles.tab, value === m && styles.on)} onClick={() => onChange(m)}>
            {value === m && <motion.span layoutId="method-pill" className={styles.pill} />}
            <span className={styles.text}>{METHOD_INFO[m].label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
