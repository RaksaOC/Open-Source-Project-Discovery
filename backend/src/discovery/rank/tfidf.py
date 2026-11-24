"""Phase 8 · TF-IDF + cosine (Member 2). Notebook: notebooks/08-tfidf.ipynb · branch dev-tfidf.

Our own implementation (numpy + scipy.sparse), checked against scikit-learn's TfidfVectorizer:
sublinear tf, smooth idf, rows scaled to unit length so cosine = dot product.
"""

from __future__ import annotations

import pandas as pd

from discovery.rank.base import Hit, SearchMethod


class TfidfRanker(SearchMethod):
    name = "tfidf"

    def __init__(self, sublinear_tf: bool = True, min_df: int = 1, field_weights: dict | None = None):
        self.sublinear_tf, self.min_df, self.field_weights = sublinear_tf, min_df, field_weights

    def fit(self, corpus: pd.DataFrame) -> TfidfRanker:
        raise NotImplementedError("Phase 8: vocabulary, tf, idf, unit-length rows (08-tfidf.ipynb, step 2)")

    def search(self, query: str, k: int = 10) -> list[Hit]:
        raise NotImplementedError("Phase 8: query vector, cosine with every row, top k (step 3)")

    def params(self) -> dict:
        return {"tf": "sublinear" if self.sublinear_tf else "raw", "idf": "smooth", "min_df": self.min_df,
                "field_weights": self.field_weights}
