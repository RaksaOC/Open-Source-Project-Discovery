"""Phase 9 · BM25 (Member 3). Notebook: notebooks/09-bm25.ipynb · branch dev-bm25.

Robertson & Zaragoza. Our own implementation, checked against rank-bm25 (BM25Okapi).
idf = log((N - n + 0.5) / (n + 0.5) + 1), never negative. Our default method.
"""

from __future__ import annotations

import pandas as pd

from discovery.rank.base import Hit, SearchMethod


class BM25Ranker(SearchMethod):
    name = "bm25"

    def __init__(self, k1: float = 1.5, b: float = 0.75):
        self.k1, self.b = k1, b

    def fit(self, corpus: pd.DataFrame) -> BM25Ranker:
        raise NotImplementedError("Phase 9: term frequencies, document lengths, idf (09-bm25.ipynb, step 2)")

    def search(self, query: str, k: int = 10) -> list[Hit]:
        raise NotImplementedError("Phase 9: sum of idf x saturated tf over the query words (step 3)")

    def scores(self, query: str):
        """BM25 score of every repository (numpy array, corpus order). The hybrid (10.2) uses it."""
        raise NotImplementedError

    def params(self) -> dict:
        return {"k1": self.k1, "b": self.b}
