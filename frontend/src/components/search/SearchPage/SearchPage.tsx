"use client";

import { AnimatePresence, MotionConfig } from "motion/react";
import { useEffect, useState } from "react";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { previewRepo } from "@/lib/preview/fakeSearch";
import { EASE } from "@/lib/motion";
import { useSearch } from "@/lib/search/useSearch";
import { Landing } from "../Landing";
import { RepoDrawer } from "../RepoDrawer";
import { Results } from "../Results";
import styles from "./SearchPage.module.css";

/** The search page: the start screen until there's a query, then the results. */
export function SearchPage() {
  const search = useSearch();
  const [openName, setOpenName] = useState<string | null>(null);

  useEffect(() => setOpenName(null), [search.query, search.source]);

  if (!search.ready) return <div className={styles.shell} />;

  const repo = openName ? (search.res?.results.find((r) => r.full_name === openName) ?? (search.source === "preview" ? previewRepo(openName) : undefined)) : undefined;

  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.4, ease: EASE }}>
      <div className={styles.shell}>
        <SiteHeader onBrand={search.reset} />
        {search.query ? (
          <Results key={`${search.query}|${search.source}`} search={search} onOpenRepo={setOpenName} />
        ) : (
          <Landing input={search.input} onInput={search.setInput} onSubmit={search.submit} />
        )}
        <SiteFooter source={search.source} onSource={search.setSource} />
        <AnimatePresence>{repo && search.res && <RepoDrawer key="drawer" repo={repo} view={search.res} onClose={() => setOpenName(null)} onOpen={setOpenName} />}</AnimatePresence>
      </div>
    </MotionConfig>
  );
}
