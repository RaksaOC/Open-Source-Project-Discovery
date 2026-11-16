"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Method } from "@/lib/api/types";
import { fakeSearch } from "@/lib/preview/fakeSearch";
import { METHOD_INFO } from "./labels";
import { liveSearch, toSearchError } from "./live";
import type { DataSource, SearchError, SearchView } from "./types";

const SOURCE_KEY = "ir-source";

function readUrl() {
  const u = new URLSearchParams(window.location.search);
  const m = u.get("m");
  return { q: u.get("q") ?? "", method: (m && m in METHOD_INFO ? m : "bm25") as Method };
}

function writeUrl(q: string, method: Method, replace: boolean) {
  const u = new URLSearchParams();
  if (q) u.set("q", q);
  if (q && method !== "bm25") u.set("m", method);
  const url = q ? `/?${u}` : "/";
  if (replace) history.replaceState(null, "", url);
  else history.pushState(null, "", url);
}

function readSource(): DataSource {
  try {
    return localStorage.getItem(SOURCE_KEY) === "live" ? "live" : "preview";
  } catch {
    return "preview";
  }
}

/**
 * Everything the search page needs: the text in the box, the submitted query, the ranking
 * method, the data source and the latest response. The query and method live in the URL
 * (?q=…&m=…), so links and back/forward work.
 */
export function useSearch() {
  const [ready, setReady] = useState(false);
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [method, setMethodState] = useState<Method>("bm25");
  const [source, setSourceState] = useState<DataSource>("preview");
  const [res, setRes] = useState<SearchView | null>(null);
  const [error, setError] = useState<SearchError | null>(null);
  const [loading, setLoading] = useState(false);
  const request = useRef(0);

  const run = useCallback(async (q: string, m: Method, src: DataSource) => {
    const id = ++request.current;
    setLoading(true);
    setError(null);
    try {
      const r = src === "live" ? await liveSearch(q, m) : await fakeSearch(q, m);
      if (id === request.current) setRes(r);
    } catch (e) {
      if (id !== request.current) return;
      setRes(null);
      setError(toSearchError(e));
    } finally {
      if (id === request.current) setLoading(false);
    }
  }, []);

  // first load and back/forward: take the query from the URL
  useEffect(() => {
    const src = readSource();
    setSourceState(src);
    const apply = () => {
      const u = readUrl();
      setInput(u.q);
      setQuery(u.q);
      setMethodState(u.method);
      if (u.q) run(u.q, u.method, readSource());
      else {
        request.current++;
        setRes(null);
        setError(null);
        setLoading(false);
      }
    };
    apply();
    setReady(true);
    window.addEventListener("popstate", apply);
    return () => window.removeEventListener("popstate", apply);
  }, [run]);

  const submit = (q: string) => {
    const t = q.trim();
    if (!t) return;
    setInput(t);
    setQuery(t);
    setRes(null);
    writeUrl(t, method, false);
    run(t, method, source);
    window.scrollTo({ top: 0 });
  };

  const setMethod = (m: Method) => {
    setMethodState(m);
    if (!query) return;
    writeUrl(query, m, true);
    run(query, m, source);
  };

  const setSource = (src: DataSource) => {
    setSourceState(src);
    try {
      localStorage.setItem(SOURCE_KEY, src);
    } catch {}
    if (query) {
      setRes(null);
      run(query, method, src);
    }
  };

  const reset = () => {
    request.current++;
    setInput("");
    setQuery("");
    setRes(null);
    setError(null);
    setLoading(false);
    writeUrl("", method, false);
  };

  return { ready, input, setInput, query, method, setMethod, source, setSource, res, error, loading, submit, reset };
}

export type SearchState = ReturnType<typeof useSearch>;
