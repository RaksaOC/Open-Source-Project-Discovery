"""Phase 7 · Boolean search (Member 1). Notebook: notebooks/07-boolean.ipynb · branch dev-boolean.

A repository either matches or it doesn't: AND, OR, NOT over an inverted index (term -> rows).
A free-text query is AND of its words; if that finds nothing, OR. Hits are ordered by how many query
words they contain (Boolean has no real score), then corpus order. The index can live in
index/inverted_index.py so the other methods can reuse it.
"""

from __future__ import annotations

import pandas as pd

from discovery.rank.base import Hit, SearchMethod


class BooleanSearch(SearchMethod):
    name = "boolean"

    def fit(self, corpus: pd.DataFrame) -> BooleanSearch:
        raise NotImplementedError("Phase 7: build the inverted index (07-boolean.ipynb, step 2)")

    def search(self, query: str, k: int = 10) -> list[Hit]:
        raise NotImplementedError("Phase 7: AND, then OR if AND finds nothing (step 3)")

    def boolean(self, query: str) -> set[int]:
        """'inventory AND (nestjs OR express) AND NOT tutorial' -> the matching row numbers."""
        raise NotImplementedError("Phase 7: parser for AND, OR, NOT and brackets (step 3)")

    def params(self) -> dict:
        return {"operator": "AND, then OR"}
