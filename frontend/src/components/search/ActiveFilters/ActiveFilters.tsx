"use client";

import { AnimatePresence, motion } from "motion/react";
import ui from "@/components/ui/primitives/primitives.module.css";
import { capitalize } from "@/lib/format";
import { SORT_OPTIONS, STAR_OPTIONS, type ResultFilters } from "@/lib/search/filters";
import { techLabel } from "@/lib/search/labels";
import styles from "./ActiveFilters.module.css";

/** Removable chips for whatever is filtered or sorted right now. */
export function ActiveFilters({ f }: { f: ResultFilters }) {
  const { filters, sort } = f;
  const chips = [
    ...(sort !== "best" ? [{ key: "sort", text: SORT_OPTIONS.find((o) => o.value === sort)!.label, remove: () => f.setSort("best") }] : []),
    ...filters.levels.map((v) => ({ key: `l-${v}`, text: capitalize(v), remove: () => f.toggle("levels", v) })),
    ...filters.techs.map((v) => ({ key: `t-${v}`, text: techLabel(v), remove: () => f.toggle("techs", v) })),
    ...filters.langs.map((v) => ({ key: `g-${v}`, text: v, remove: () => f.toggle("langs", v) })),
    ...(filters.minStars ? [{ key: "stars", text: `${STAR_OPTIONS.find((o) => +o.value === filters.minStars)!.label} stars`, remove: () => f.setFilters((x) => ({ ...x, minStars: 0 })) }] : []),
  ];
  return (
    <AnimatePresence initial={false}>
      {chips.length > 0 && (
        <motion.div className={styles.active} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
          <div className={styles.activeInner}>
            {chips.map((c) => (
              <button key={c.key} className={styles.activeChip} onClick={c.remove} aria-label={`Remove ${c.text}`}>
                {c.text} <span aria-hidden="true">×</span>
              </button>
            ))}
            <button className={ui.textBtn} onClick={f.clear}>
              Clear all
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
