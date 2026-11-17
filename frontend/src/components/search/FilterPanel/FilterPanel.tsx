"use client";

import type { ReactNode } from "react";
import { Segmented } from "@/components/ui/Segmented";
import { Select } from "@/components/ui/Select";
import { ToggleChip } from "@/components/ui/ToggleChip";
import ui from "@/components/ui/primitives/primitives.module.css";
import { capitalize } from "@/lib/format";
import { LEVELS, SORT_OPTIONS, STAR_OPTIONS, type ResultFilters } from "@/lib/search/filters";
import { techLabel } from "@/lib/search/labels";
import styles from "./FilterPanel.module.css";

/** The sort and filter controls. Shown in the sidebar on desktop and in the bottom sheet on small screens. */
export function FilterPanel({ f }: { f: ResultFilters }) {
  const { filters, facets } = f;
  const levelCount = (l: string) => facets.levels.find(([k]) => k === l)?.[1] ?? 0;
  return (
    <>
      <Section title="Sort by">
        <Select value={f.sort} options={SORT_OPTIONS} onChange={f.setSort} label="Sort results" className={styles.sort} />
      </Section>
      <Section title="Level">
        {LEVELS.map((l) => (
          <ToggleChip key={l} label={capitalize(l)} count={levelCount(l)} on={filters.levels.includes(l)} disabled={!levelCount(l) && !filters.levels.includes(l)} onToggle={() => f.toggle("levels", l)} />
        ))}
      </Section>
      <Section title="Technologies">
        {facets.techs.map(([t, n]) => (
          <ToggleChip key={t} label={techLabel(t)} count={n} on={filters.techs.includes(t)} onToggle={() => f.toggle("techs", t)} />
        ))}
      </Section>
      {facets.langs.length > 0 && (
        <Section title="Language">
          {facets.langs.map(([t, n]) => (
            <ToggleChip key={t} label={t} count={n} on={filters.langs.includes(t)} onToggle={() => f.toggle("langs", t)} />
          ))}
        </Section>
      )}
      <Section title="Stars">
        <Segmented label="Minimum stars" value={String(filters.minStars)} options={STAR_OPTIONS} onChange={(v) => f.setFilters((x) => ({ ...x, minStars: +v }))} />
      </Section>
    </>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={styles.section}>
      <h3 className={ui.label}>{title}</h3>
      <div className={styles.options}>{children}</div>
    </section>
  );
}
