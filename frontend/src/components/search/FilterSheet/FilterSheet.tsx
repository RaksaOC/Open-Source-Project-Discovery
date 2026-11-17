"use client";

import { BottomSheet } from "@/components/ui/BottomSheet";
import ui from "@/components/ui/primitives/primitives.module.css";
import { cx } from "@/lib/cx";
import type { ResultFilters } from "@/lib/search/filters";
import { FilterPanel } from "../FilterPanel";

/** Small screens: the panel in a bottom sheet, opened by FilterButton. */
export function FilterSheet({ open, onClose, f }: { open: boolean; onClose: () => void; f: ResultFilters }) {
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Filter & sort"
      footer={
        <>
          <button className={ui.textBtn} onClick={f.clear} disabled={!f.active && f.sort === "best"}>
            Reset
          </button>
          <button className={cx(ui.btn, ui.primary)} onClick={onClose}>
            Show {f.shown.length} {f.shown.length === 1 ? "repository" : "repositories"}
          </button>
        </>
      }
    >
      <FilterPanel f={f} />
    </BottomSheet>
  );
}
