/* Live data source: calls the FastAPI backend (/api/search) and adapts its SearchResponse
   to the view the UI renders. Fields the API doesn't send yet get safe defaults. */
import { api, ApiError } from "@/lib/api/client";
import type { Method, ResultOut } from "@/lib/api/types";
import { capitalize } from "@/lib/format";
import { stemWord } from "./text";
import type { ResultView, SearchError, SearchView } from "./types";


function toView(r: ResultOut): ResultView {
  return {
    ...r,
    snippet: r.description,
    reasons: Object.entries(r.matched ?? {})
      .filter(([, v]) => v.length)
      .map(([k, v]) => ({ label: capitalize(k), text: v.join(", ") })),
    topics: [],
    methodScores: null,
    methodRanks: null,
    related: [],
  };
}

export async function liveSearch(q: string, method: Method): Promise<SearchView> {
  const t0 = performance.now();
  const res = await api.search(q, { method, k: 50, popularity: true });
  const words = (res.parsed?.functionality || q).split(/\s+/).map(stemWord).filter((w) => w.length > 2);
  return {
    source: "live",
    query: res.query,
    method: res.method,
    parsed: res.parsed,
    results: res.results.map(toView),
    excluded: [],
    highlight: [...new Set(words)],
    tookMs: Math.round(performance.now() - t0),
  };
}

export function toSearchError(e: unknown): SearchError {
  if (e instanceof ApiError && e.notImplemented)
    return { kind: "not-implemented", message: "The search API is up, but ranking isn't implemented yet (HTTP 501)." };
  if (e instanceof ApiError && e.status >= 500 && e.status !== 501)
    return { kind: "offline", message: "Couldn't reach the search API. Is the backend running?" };
  if (e instanceof ApiError) return { kind: "failed", message: `The search API answered HTTP ${e.status}.` };
  return { kind: "offline", message: "Couldn't reach the search API. Is the backend running?" };
}
