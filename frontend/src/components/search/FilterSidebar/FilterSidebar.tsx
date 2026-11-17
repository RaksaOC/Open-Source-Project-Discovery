"use client";

import ui from "@/components/ui/primitives/primitives.module.css";
import { cx } from "@/lib/cx";
import type { ResultFilters } from "@/lib/search/filters";
import { FilterPanel } from "../FilterPanel";
import styles from "./FilterSidebar.module.css";

/** Desktop: the panel as a sticky sidebar. Hidden on small screens by CSS. */
export function FilterSidebar({ f, busy }: { f: ResultFilters; busy: boolean }) {
  return (
    <aside className={cx(styles.sidebar, busy && styles.busy)} aria-label="Filter and sort">
      <div className={styles.sidebarHead}>
        <b>Filter &amp; sort</b>
        {(f.active > 0 || f.sort !== "best") && (
          <button className={ui.textBtn} onClick={f.clear}>
            Reset
          </button>
        )}
      </div>
      <FilterPanel f={f} />
    </aside>
  );
}
