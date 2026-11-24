"""Phase 10.1 · Semantic search (Member 4). Notebook: notebooks/10-1-semantic.ipynb · branch dev-semantic.

Sentence embeddings (MiniLM) + FAISS. Finds repositories that describe the same functionality in
different words ("stock tracker" for "inventory management"). Vectors are normalised, so the
inner product is the cosine.
"""

from __future__ import annotations

import pandas as pd

from discovery.rank.base import Hit, SearchMethod

MODEL = "sentence-transformers/all-MiniLM-L6-v2"


class EmbeddingRanker(SearchMethod):
    name = "semantic"

    def __init__(self, model_name: str = MODEL, max_chars: int = 2000):
        self.model_name, self.max_chars = model_name, max_chars

    def fit(self, corpus: pd.DataFrame) -> EmbeddingRanker:
        raise NotImplementedError("Phase 10.1: embed every repository, build the FAISS index (step 2)")

    def search(self, query: str, k: int = 10) -> list[Hit]:
        raise NotImplementedError("Phase 10.1: embed the query, nearest neighbours (step 3)")

    def scores(self, query: str):
        """Cosine with every repository (numpy array, corpus order). The hybrid (10.2) uses it."""
        raise NotImplementedError

    def params(self) -> dict:
        return {"model": self.model_name, "text": f"name + description + topics + README[:{self.max_chars}]"}
