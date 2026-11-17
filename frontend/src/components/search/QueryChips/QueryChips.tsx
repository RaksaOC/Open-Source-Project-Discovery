"use client";

import { motion } from "motion/react";
import { cx } from "@/lib/cx";
import { techLabel } from "@/lib/search/labels";
import type { SearchView } from "@/lib/search/types";
import ui from "@/components/ui/primitives/primitives.module.css";
import styles from "./QueryChips.module.css";

/** "Understood as": what the query parser pulled out of the sentence. */
export function QueryChips({ view }: { view: SearchView }) {
  const p = view.parsed;
  if (!p) return null;
  const chips = [
    ...(p.functionality ? [{ key: "fn", cls: styles.fn, tag: "does", text: p.functionality, title: "What it does: matched against READMEs and descriptions" }] : []),
    ...p.technologies.map((t) => ({ key: `t-${t}`, cls: styles.tech, tag: "uses", text: techLabel(t), title: "Technology: compared with each repository's stack" })),
    ...(p.complexity ? [{ key: "lvl", cls: styles.level, tag: "level", text: p.complexity, title: "Level: compared with each repository's estimated complexity" }] : []),
    ...view.excluded.map((x) => ({ key: `x-${x}`, cls: styles.not, tag: "not", text: x, title: "Excluded with a minus" })),
  ];
  return (
    <motion.div className={styles.row} initial="hide" animate="show" variants={{ show: { transition: { staggerChildren: 0.06 } } }}>
      <motion.span className={ui.label} variants={{ hide: { opacity: 0 }, show: { opacity: 1 } }}>
        Understood as
      </motion.span>
      {chips.map((c) => (
        <motion.span key={c.key} className={cx(styles.chip, c.cls)} title={c.title} variants={{ hide: { opacity: 0, y: 6, scale: 0.9 }, show: { opacity: 1, y: 0, scale: 1 } }}>
          <i>{c.tag}</i> {c.text}
        </motion.span>
      ))}
    </motion.div>
  );
}
