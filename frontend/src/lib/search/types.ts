/* What the search UI renders. Both data sources produce these: the random preview
   (lib/preview/fakeSearch.ts) directly, the live API through lib/search/live.ts. */
import type { Method, ResultOut } from "@/lib/api/types";

export type DataSource = "preview" | "live";

export interface Reason {
  label: string;
  text: string;
}

export interface RelatedRepo {
  full_name: string;
  description: string;
  stars: number;
  complexity: string;
}

export interface ResultView extends ResultOut {
  snippet: string; // README sentence shown under the description
  reasons: Reason[];
  topics: string[];
  language?: string;
  updated?: string; // ISO date
  license?: string;
  readme?: string;
  /** Text score and rank under every method, when the source can tell us. */
  methodScores: Record<Method, number | null> | null;
  methodRanks: Record<Method, number | null> | null;
  related: RelatedRepo[];
}

export interface SearchView {
  source: DataSource;
  query: string;
  method: Method;
  parsed: { functionality: string; technologies: string[]; complexity: string | null } | null;
  results: ResultView[];
  excluded: string[];
  highlight: string[]; // word stems to highlight
  tookMs: number;
}

export interface SearchError {
  kind: "offline" | "not-implemented" | "failed";
  message: string;
}
