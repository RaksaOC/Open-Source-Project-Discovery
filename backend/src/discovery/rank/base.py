"""The one interface every retrieval method follows (Phases 7–10).

Five people build five methods in parallel; this file is what lets the search engine (Phase 11),
the pool (Phase 13) and the evaluation (Phase 14) use any of them the same way.

    method = BM25Ranker(k1=1.5, b=0.75)
    method.fit(corpus)                       # corpus: the DataFrame from data/processed/corpus.parquet
    hits = method.search("inventory nestjs postgresql", k=10)
    # [{"doc_id": "owner/repo", "score": 12.31}, {"doc_id": "owner/other", "score": 11.02}, ...]

Rules:
- `doc_id` is the repository's `full_name` ("owner/name"): the same id as in qrels.csv, pool.csv and
  the graph, so results from any method can be compared and fused without a lookup table.
- `search` returns at most k hits, best first, scores descending. Ties keep corpus order.
- Higher score = more relevant. Scores are only comparable within one method (BM25 ≠ cosine).
- Every method tokenizes with the shared `preprocess.text.tokenize()`: never a private tokenizer.
- Boolean retrieval has no scores: it returns its matches with score 1.0, in corpus order.
- A method with nothing to return gives [], never None.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import TypedDict

import pandas as pd


class Hit(TypedDict):
    doc_id: str          # full_name, "owner/name"
    score: float


class SearchMethod(ABC):
    """Base class for Boolean, TF-IDF, BM25, Semantic and Hybrid search."""

    name: str = "method"                     # short id used in results.json and the UI: "bm25", "tfidf", …

    @abstractmethod
    def fit(self, corpus: pd.DataFrame) -> SearchMethod:
        """Build whatever the method needs from the corpus (index, vectors, embeddings). Returns self."""

    @abstractmethod
    def search(self, query: str, k: int = 10) -> list[Hit]:
        """The top-k repositories for a free-text query, best first."""

    def params(self) -> dict:
        """Settings that change results (k1, b, alpha, model name …), written into results.json."""
        return {}


def check_hits(hits: list[Hit], k: int) -> None:
    """The contract, as a check each member can run in their own tests."""
    assert isinstance(hits, list), "search() must return a list"
    assert len(hits) <= k, f"more than k={k} hits"
    for h in hits:
        assert set(h) == {"doc_id", "score"}, f"each hit is exactly {{doc_id, score}}, got {set(h)}"
        assert isinstance(h["doc_id"], str) and "/" in h["doc_id"], "doc_id is full_name, 'owner/name'"
    scores = [h["score"] for h in hits]
    assert scores == sorted(scores, reverse=True), "hits must be sorted best first"
    assert len({h["doc_id"] for h in hits}) == len(hits), "no repository twice"
