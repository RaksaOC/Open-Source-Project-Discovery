"""Phase 10.2 · Hybrid search (Member 5). Notebook: notebooks/10-2-hybrid.ipynb · branch dev-hybrid.

Combines BM25 (Member 3) and semantic search (Member 4), two ways, over each method's top `depth`:
  weighted:  alpha * minmax(bm25) + (1 - alpha) * minmax(cosine)      a repository missing from a list gets 0 there
  rrf:       sum over the lists of 1 / (c + rank)                     (reciprocal rank fusion, Cormack et al. 2009)

Weighted fusion has to rescale first: BM25 scores run 0..~30, cosines -1..1, so adding them raw lets
BM25 decide everything. RRF only looks at ranks, so it needs no rescaling.

The components are any SearchMethod, used only through search(). `extra` adds more lists to RRF
(e.g. TF-IDF for the three-way experiment). Fitting the semantic model is slow, so for tuning:
fit once, then `with_params(mode=..., alpha=..., c=..., depth=...)` gives a ranker that shares the
fitted components, and `fit(corpus, refit=False)` wraps components that are already fitted.

Defaults = the best setting of the notebook's step 7 grid (5 dev queries, silver labels):
weighted, alpha 0.4, depth 50 → mean NDCG@10 0.913, vs semantic alone 0.879, BM25 alone 0.801,
best RRF 0.882. Re-check when the real development labels land (Phase 13).
"""

from __future__ import annotations

from collections import defaultdict

import pandas as pd

from discovery.rank.base import Hit, SearchMethod

MODES = ("rrf", "weighted")


def minmax(hits: list[Hit]) -> dict[str, float]:
    """Rescale one list's scores to 0..1 (best = 1). A list whose scores are all equal maps to 1.0."""
    if not hits:
        return {}
    s = [h["score"] for h in hits]
    lo, hi = min(s), max(s)
    return {h["doc_id"]: (h["score"] - lo) / (hi - lo) if hi > lo else 1.0 for h in hits}


class HybridRanker(SearchMethod):
    name = "hybrid"

    def __init__(self, lexical: SearchMethod | None = None, semantic: SearchMethod | None = None,
                 mode: str = "weighted", alpha: float = 0.4, c: int = 60, depth: int = 50,
                 extra: list[SearchMethod] | None = None):
        if mode not in MODES:
            raise ValueError(f"mode must be one of {MODES}, got {mode!r}")
        if not 0 <= alpha <= 1:
            raise ValueError("alpha must be in [0, 1]")
        if c < 0 or depth < 1:
            raise ValueError("c must be >= 0 and depth >= 1")
        if extra and mode != "rrf":
            raise ValueError("extra lists are only fused with RRF (weighted fusion has one alpha for two lists)")
        self.lexical, self.semantic, self.extra = lexical, semantic, list(extra or [])
        self.mode, self.alpha, self.c, self.depth = mode, alpha, c, depth
        self._pos: dict[str, int] = {}

    def components(self) -> list[SearchMethod]:
        return [m for m in (self.lexical, self.semantic, *self.extra) if m is not None]

    def fit(self, corpus: pd.DataFrame, refit: bool = True) -> HybridRanker:
        """Fit both components (BM25Ranker and EmbeddingRanker unless others were given).
        refit=False keeps components that were fitted outside, e.g. in the notebook."""
        if self.lexical is None:
            from discovery.rank.bm25 import BM25Ranker
            self.lexical = BM25Ranker()
        if self.semantic is None:
            from discovery.rank.embeddings import EmbeddingRanker
            self.semantic = EmbeddingRanker()
        if refit:
            for m in self.components():
                m.fit(corpus)
        self._pos = {d: i for i, d in enumerate(corpus["full_name"])}      # ties break in corpus order
        return self

    def with_params(self, **kw) -> HybridRanker:
        """Same fitted components, other fusion settings (mode, alpha, c, depth, extra). No refitting."""
        settings = {"mode": self.mode, "alpha": self.alpha, "c": self.c, "depth": self.depth,
                    "extra": self.extra, **kw}
        other = HybridRanker(self.lexical, self.semantic, **settings)
        other._pos = self._pos
        return other

    def lists(self, query: str) -> list[list[Hit]]:
        """Each component's top `depth` for the query, in component order."""
        if self.lexical is None or self.semantic is None:
            raise RuntimeError("fit the ranker before searching")
        return [m.search(query, self.depth) for m in self.components()]

    def fuse(self, lists: list[list[Hit]]) -> dict[str, float]:
        """Fused score per repository, from the component lists (best first each)."""
        if self.mode == "weighted":
            a, b = minmax(lists[0]), minmax(lists[1])
            return {d: self.alpha * a.get(d, 0.0) + (1 - self.alpha) * b.get(d, 0.0) for d in a.keys() | b.keys()}
        s: dict[str, float] = defaultdict(float)
        for hits in lists:
            for rank, h in enumerate(hits, start=1):
                s[h["doc_id"]] += 1 / (self.c + rank)
        return s

    def search(self, query: str, k: int = 10) -> list[Hit]:
        if k <= 0:
            return []
        s = self.fuse(self.lists(query))
        end = len(self._pos)
        best = sorted(s, key=lambda d: (-s[d], self._pos.get(d, end), d))[:k]
        return [{"doc_id": d, "score": float(s[d])} for d in best]

    def params(self) -> dict:
        p = {"mode": self.mode, "depth": self.depth}
        p.update({"alpha": self.alpha} if self.mode == "weighted" else {"c": self.c})
        for role, m in (("lexical", self.lexical), ("semantic", self.semantic)):
            if m is not None:
                p[role] = {"method": m.name, **m.params()}
        if self.extra:
            p["extra"] = [{"method": m.name, **m.params()} for m in self.extra]
        return p
