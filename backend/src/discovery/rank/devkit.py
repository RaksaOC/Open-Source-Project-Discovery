"""Shared helpers for the five method notebooks (Phases 7–10), so every member loads, looks and
measures the same way. Import it, don't copy it; ask before changing it (it changes all five results).

    from discovery.rank.devkit import DEV, load_corpus, show_top, measure, save_results
    corpus = load_corpus()
    method = BM25Ranker().fit(corpus)
    show_top(method, corpus, DEV)                    # read the top 10 of each development query
    speed = measure(lambda: BM25Ranker().fit(corpus), DEV)
    save_results(method, speed)                      # -> eval/results/bm25.json (metrics after Phase 13)
"""

from __future__ import annotations

import json
import pickle
import statistics
import time
from collections.abc import Callable
from pathlib import Path

import pandas as pd

from discovery.config import PATHS
from discovery.rank.base import SearchMethod, check_hits

# Placeholder development queries until Phase 13 writes the real 5 (dev) + 20 (test) split.
# Tune on these only. The 20 test queries are never used for tuning.
DEV: list[str] = [
    "beginner inventory management system nestjs postgresql",
    "point of sale app with react",
    "school management system laravel",
    "hotel booking system spring boot",
    "simple chat application flutter firebase",
]

RESULTS_DIR = PATHS["eval"] / "results"


def load_corpus() -> pd.DataFrame:
    """data/processed/corpus.parquet (Phase 4): one row per repository, doc_id = full_name."""
    path = PATHS["processed"] / "corpus.parquet"
    if not path.exists():
        raise FileNotFoundError(f"{path} is missing: unzip the processed data into backend/data/ "
                                "(see docs/handoff-methods.md)")
    corpus = pd.read_parquet(path)
    corpus["languages"] = corpus["languages"].map(json.loads)
    return corpus


def show_top(method: SearchMethod, corpus: pd.DataFrame, queries: list[str], k: int = 10) -> None:
    """Print the top k (score, repository, stars, description) for each query, after checking the contract."""
    rows = corpus.set_index("full_name")
    for q in queries:
        hits = method.search(q, k)
        check_hits(hits, k)
        print(f"\n# {q}   ({len(hits)} hits)")
        for h in hits:
            r = rows.loc[h["doc_id"]]
            print(f"{h['score']:9.3f}  {h['doc_id'][:44]:44s} ★{r.stars:<6} {str(r.description)[:60]}")


def measure(build: Callable[[], SearchMethod], queries: list[str], k: int = 10, repeat: int = 3) -> dict:
    """Build time, median query time and size of the fitted method, for the speed rows of the sheet.
    `build` is a function that fits and returns a method, e.g. lambda: BM25Ranker().fit(corpus)."""
    t = time.perf_counter()
    method = build()
    build_s = time.perf_counter() - t
    times = []
    for _ in range(repeat):
        for q in queries:
            t = time.perf_counter()
            method.search(q, k)
            times.append((time.perf_counter() - t) * 1000)
    try:
        size_mb = len(pickle.dumps(method)) / 1e6
    except (TypeError, pickle.PicklingError, AttributeError):   # e.g. a FAISS index: give its file size
        size_mb = None
    return {"build_s": round(build_s, 2), "query_ms_median": round(statistics.median(times), 2),
            "index_mb": None if size_mb is None else round(size_mb, 1)}


def save_results(method: SearchMethod, speed: dict, metrics: dict | None = None,
                 groups: dict | None = None, per_query: list | None = None, out: Path | None = None) -> Path:
    """Write eval/results/<name>.json in the format the Results sheet imports. Metrics stay null until
    Phase 13 (labels) and Phase 14 (evaluate_method) fill them in."""
    keys = ["P@5", "P@10", "R@10", "F1@10", "MAP", "NDCG@10"]
    res = {"method": method.name, "params": method.params(),
           "metrics": {m: (metrics or {}).get(m) for m in keys},
           "groups": groups or {"paraphrased": {"NDCG@10": None}, "technology": {"NDCG@10": None}},
           "speed": speed, "per_query": per_query or []}
    out = out or RESULTS_DIR / f"{method.name}.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(res, indent=2))
    return out
