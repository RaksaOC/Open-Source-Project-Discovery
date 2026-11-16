import { useMemo, useState } from "react";
import type { ResultView } from "./types";

export type Sort = "best" | "stars" | "updated";
export type FilterKey = "levels" | "techs" | "langs";

export interface Filters {
  levels: string[];
  techs: string[];
  langs: string[];
  minStars: number;
}

export const NO_FILTERS: Filters = { levels: [], techs: [], langs: [], minStars: 0 };
export const LEVELS = ["beginner", "intermediate", "advanced"] as const;

export const SORT_OPTIONS: { value: Sort; label: string }[] = [
  { value: "best", label: "Best match" },
  { value: "stars", label: "Most stars" },
  { value: "updated", label: "Recently updated" },
];

export const STAR_OPTIONS = [
  { value: "0", label: "Any" },
  { value: "100", label: "100+" },
  { value: "1000", label: "1k+" },
];

type Facet = [value: string, count: number][];

function count(results: ResultView[], pick: (r: ResultView) => string[]): Facet {
  const m = new Map<string, number>();
  results.forEach((r) => pick(r).forEach((k) => m.set(k, (m.get(k) ?? 0) + 1)));
  return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

/** Filter + sort state for one result list, with the counts the filter sheet shows. */
export function useResultFilters(results: ResultView[]) {
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [sort, setSort] = useState<Sort>("best");

  const shown = useMemo(() => {
    const out = results.filter(
      (r) =>
        (!filters.levels.length || filters.levels.includes(r.complexity)) &&
        (!filters.techs.length || filters.techs.every((t) => r.technologies.includes(t))) &&
        (!filters.langs.length || (r.language && filters.langs.includes(r.language))) &&
        r.stars >= filters.minStars,
    );
    if (sort === "stars") out.sort((a, b) => b.stars - a.stars);
    if (sort === "updated") out.sort((a, b) => (b.updated ?? "").localeCompare(a.updated ?? ""));
    return out;
  }, [results, filters, sort]);

  const facets = useMemo(
    () => ({
      levels: count(results, (r) => [r.complexity]),
      techs: count(results, (r) => r.technologies).slice(0, 16),
      langs: count(results, (r) => (r.language ? [r.language] : [])),
    }),
    [results],
  );

  const toggle = (key: FilterKey, value: string) =>
    setFilters((f) => ({ ...f, [key]: f[key].includes(value) ? f[key].filter((x) => x !== value) : [...f[key], value] }));

  const active = filters.levels.length + filters.techs.length + filters.langs.length + (filters.minStars ? 1 : 0);
  const clear = () => {
    setFilters(NO_FILTERS);
    setSort("best");
  };

  return { filters, setFilters, sort, setSort, shown, facets, toggle, active, clear };
}

export type ResultFilters = ReturnType<typeof useResultFilters>;
