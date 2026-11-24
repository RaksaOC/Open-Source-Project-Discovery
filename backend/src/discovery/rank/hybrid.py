"""Phase 10.2 · Hybrid search (Member 5). Notebook: notebooks/10-2-hybrid.ipynb · branch dev-hybrid.

Combines BM25 (Member 3) and semantic search (Member 4), two ways:
  weighted:  alpha * minmax(bm25) + (1 - alpha) * minmax(cosine)
  rrf:       sum over both lists of 1 / (c + rank)      (reciprocal rank fusion)
Until the other two classes are ready, use stand-ins with the same interface
(rank_bm25.BM25Okapi and a plain sentence-transformers model); swap them in when they land on main.
"""

from __future__ import annotations

import pandas as pd

from discovery.rank.base import Hit, SearchMethod


class HybridRanker(SearchMethod):
    name = "hybrid"

    def __init__(self, lexical: SearchMethod | None = None, semantic: SearchMethod | None = None,
                 mode: str = "rrf", alpha: float = 0.5, c: int = 60, depth: int = 100):
        self.lexical, self.semantic = lexical, semantic
        self.mode, self.alpha, self.c, self.depth = mode, alpha, c, depth

    def fit(self, corpus: pd.DataFrame) -> HybridRanker:
        raise NotImplementedError("Phase 10.2: fit (or reuse) both component methods (step 2)")

    def search(self, query: str, k: int = 10) -> list[Hit]:
        raise NotImplementedError("Phase 10.2: fuse the two rankings, weighted or RRF (step 3)")

    def params(self) -> dict:
        return {"mode": self.mode, "alpha": self.alpha, "c": self.c, "depth": self.depth}
