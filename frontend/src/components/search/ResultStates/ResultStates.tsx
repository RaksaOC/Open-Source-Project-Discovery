import type { Method } from "@/lib/api/types";
import type { SearchError } from "@/lib/search/types";
import ui from "@/components/ui/primitives/primitives.module.css";
import styles from "./ResultStates.module.css";

export function EmptyState({ hasFilters, method, excluded, onClear, onHybrid }: { hasFilters: boolean; method: Method; excluded: string[]; onClear: () => void; onHybrid: () => void }) {
  const exact = method === "boolean" || method === "bm25" || method === "tfidf";
  return (
    <div className={styles.box}>
      <b>No repositories matched.</b>
      <p>
        {hasFilters
          ? "Your filters hide every result."
          : method === "boolean"
            ? "Boolean search needs every word to appear exactly. Hybrid search also finds repositories that describe the same thing in other words."
            : "Try fewer words, or describe what the project does rather than its name."}
        {excluded.length > 0 && ` You excluded ${excluded.join(", ")}.`}
      </p>
      <div className={styles.actions}>
        {hasFilters && (
          <button className={`${ui.btn} ${ui.ghost}`} onClick={onClear}>
            Clear filters
          </button>
        )}
        {exact && (
          <button className={`${ui.btn} ${ui.ghost}`} onClick={onHybrid}>
            Try Hybrid search
          </button>
        )}
      </div>
    </div>
  );
}

export function ErrorState({ error, onPreview, onRetry }: { error: SearchError; onPreview: () => void; onRetry: () => void }) {
  return (
    <div className={styles.box} role="alert">
      <b>{error.kind === "not-implemented" ? "Live search isn't ready yet." : "Search failed."}</b>
      <p>{error.message}</p>
      <div className={styles.actions}>
        <button className={`${ui.btn} ${ui.primary}`} onClick={onPreview}>
          Use preview data
        </button>
        <button className={`${ui.btn} ${ui.ghost}`} onClick={onRetry}>
          Try again
        </button>
      </div>
    </div>
  );
}
