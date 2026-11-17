"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { cx } from "@/lib/cx";
import { BOX_LAYOUT, EASE } from "@/lib/motion";
import { useResultFilters } from "@/lib/search/filters";
import type { SearchState } from "@/lib/search/useSearch";
import ui from "@/components/ui/primitives/primitives.module.css";
import { ActiveFilters } from "../ActiveFilters";
import { FilterButton } from "../FilterButton";
import { FilterSheet } from "../FilterSheet";
import { FilterSidebar } from "../FilterSidebar";
import { MethodTabs } from "../MethodTabs";
import { QueryChips } from "../QueryChips";
import { ResultCard } from "../ResultCard";
import { EmptyState, ErrorState } from "../ResultStates";
import { SearchBox } from "../SearchBox";
import { SearchProgress } from "../SearchProgress";
import styles from "./Results.module.css";

/** Results page for one query. Remounted per query, so filters reset on a new search. */
export function Results({ search, onOpenRepo }: { search: SearchState; onOpenRepo: (name: string) => void }) {
  const { res, error, loading, method } = search;
  const f = useResultFilters(res?.results ?? []);
  const [sheet, setSheet] = useState(false);
  const stems = useMemo(() => new Set(res?.highlight ?? []), [res]);

  return (
    <main className={styles.page}>
      <div className={styles.topbar}>
        <motion.div className={styles.box} layoutId="search-box" transition={BOX_LAYOUT}>
          <SearchBox value={search.input} onChange={search.setInput} onSubmit={search.submit} />
        </motion.div>
        <div className={styles.chips}>{res && <QueryChips view={res} />}</div>
        <AnimatePresence>
          {loading && (
            <motion.span
              key="progress"
              className={styles.progress}
              initial={{ scaleX: 0 }}
              animate={{
                scaleX: 0.85,
                transition: { duration: 1.1, ease: [0.1, 0.7, 0.3, 1] },
              }}
              exit={{
                scaleX: 1,
                opacity: 0,
                transition: {
                  scaleX: { duration: 0.2 },
                  opacity: { duration: 0.3, delay: 0.15 },
                },
              }}
            />
          )}
        </AnimatePresence>
      </div>

      <div className={styles.content}>
        <FilterSidebar f={f} busy={!res} />
        <section className={styles.main}>
          <MethodTabs value={method} onChange={search.setMethod} />

          <div className={styles.summary}>
            <p className={styles.count} aria-live="polite">
              {res ? (
                <>
                  <b>{f.shown.length}</b> {f.shown.length === 1 ? "repository" : "repositories"}
                  {f.active > 0 && ` of ${res.results.length}`} <span className={ui.muted}>· {(res.tookMs / 1000).toFixed(3)} s</span>
                </>
              ) : error ? (
                <span className={ui.muted}>No results</span>
              ) : (
                <span className={ui.muted}>Searching…</span>
              )}
            </p>
            {res && res.results.length > 0 && <FilterButton count={f.active + (f.sort !== "best" ? 1 : 0)} onClick={() => setSheet(true)} />}
          </div>
          <ActiveFilters f={f} />

          {error ? (
            <ErrorState error={error} onPreview={() => search.setSource("preview")} onRetry={() => search.submit(search.query)} />
          ) : !res ? (
            <SearchProgress method={method} source={search.source} />
          ) : f.shown.length ? (
            <ol className={cx(styles.list, loading && styles.stale)}>
              <AnimatePresence initial={false} mode="popLayout">
                {f.shown.map((r, i) => (
                  <motion.li
                    key={r.full_name}
                    layout
                    initial={{ opacity: 0, y: 22, scale: 0.985 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                      transition: {
                        duration: 0.45,
                        ease: EASE,
                        delay: Math.min(i, 8) * 0.07,
                      },
                    }}
                    exit={{ opacity: 0, transition: { duration: 0.15 } }}
                  >
                    <ResultCard
                      r={r}
                      rank={i + 1}
                      method={res.method}
                      stems={stems}
                      wantTech={res.parsed?.technologies ?? []}
                      wantLevel={res.parsed?.complexity ?? null}
                      onOpen={() => onOpenRepo(r.full_name)}
                    />
                  </motion.li>
                ))}
              </AnimatePresence>
            </ol>
          ) : (
            <EmptyState hasFilters={f.active > 0} method={method} excluded={res.excluded} onClear={f.clear} onHybrid={() => search.setMethod("hybrid")} />
          )}
        </section>
      </div>

      <FilterSheet open={sheet} onClose={() => setSheet(false)} f={f} />
    </main>
  );
}
