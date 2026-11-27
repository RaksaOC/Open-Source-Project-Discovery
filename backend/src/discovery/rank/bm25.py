"""Phase 9 · BM25 (Member 3). Notebook: notebooks/09-bm25.ipynb · branch dev-bm25.

Robertson & Zaragoza. Our own implementation, checked against rank-bm25 (BM25Okapi).

    score(d, q) = sum over query words w of  idf(w) * tf * (k1 + 1) / (tf + k1 * (1 - b + b * |d| / avgdl))
    idf(w)      = log((N - n_w + 0.5) / (n_w + 0.5) + 1)          never negative

tf = how often w occurs in d, |d| = length of d in tokens, avgdl = average length, N = repositories,
n_w = repositories that contain w. A query word that appears twice counts twice (as in rank-bm25).

The index is a sparse term-frequency matrix (one column per word), so a query only touches the
columns of its own words. k1 and b are only used at search time: `with_params` gives a ranker with
other settings that shares the same index, which is what the k1 x b grid in the notebook uses.
"""

from __future__ import annotations

import copy
from collections import Counter

import numpy as np
import pandas as pd
from scipy import sparse

from discovery.preprocess.text import doc_text, tokenize
from discovery.rank.base import Hit, SearchMethod


class BM25Ranker(SearchMethod):
    name = "bm25"

    def __init__(self, k1: float = 1.5, b: float = 0.75):
        self.k1, self.b = k1, b

    def fit(self, corpus: pd.DataFrame, docs: list[list[str]] | None = None) -> BM25Ranker:
        """Count everything BM25 needs once. `docs` lets a notebook pass tokens it already has."""
        docs = docs if docs is not None else [tokenize(t) for t in doc_text(corpus)]
        self.ids = corpus["full_name"].tolist()
        vocab: dict[str, int] = {}
        rows, cols, vals = [], [], []
        for i, d in enumerate(docs):
            for w, f in Counter(d).items():
                rows.append(i)
                cols.append(vocab.setdefault(w, len(vocab)))
                vals.append(f)
        self.vocab = vocab
        self.tf = sparse.csc_matrix((np.array(vals, dtype=np.float32), (rows, cols)),
                                    shape=(len(docs), len(vocab)))       # column w = the posting list of w
        self.dl = np.array([len(d) for d in docs], dtype=np.float32)
        self.avgdl = float(self.dl.mean())
        n = np.diff(self.tf.indptr)                                       # repositories containing each word
        self.idf = np.log((len(docs) - n + 0.5) / (n + 0.5) + 1)
        return self

    def with_params(self, k1: float | None = None, b: float | None = None) -> BM25Ranker:
        """The same index with other k1 / b (no re-tokenizing)."""
        other = copy.copy(self)
        other.k1 = self.k1 if k1 is None else k1
        other.b = self.b if b is None else b
        return other

    def scores(self, query: str) -> np.ndarray:
        """BM25 score of every repository (numpy array, corpus order). The hybrid (10.2) uses it."""
        s = np.zeros(len(self.ids))
        norm = self.k1 * (1 - self.b + self.b * self.dl / self.avgdl)    # length correction per repository
        for w in tokenize(query):
            j = self.vocab.get(w)
            if j is None:
                continue
            lo, hi = self.tf.indptr[j], self.tf.indptr[j + 1]
            rows, f = self.tf.indices[lo:hi], self.tf.data[lo:hi]
            s[rows] += self.idf[j] * f * (self.k1 + 1) / (f + norm[rows])
        return s

    def search(self, query: str, k: int = 10) -> list[Hit]:
        s = self.scores(query)
        hit = np.flatnonzero(s > 0)                                       # only repositories with a query word
        top = hit[np.lexsort((hit, -s[hit]))][:k]                         # score descending, ties in corpus order
        return [{"doc_id": self.ids[i], "score": float(s[i])} for i in top]

    def explain(self, query: str, doc_id: str) -> pd.DataFrame:
        """Each query word's part of one repository's score: the hand calculation, as a table."""
        i = self.ids.index(doc_id)
        rows = []
        for w in tokenize(query):
            j = self.vocab.get(w)
            f = float(self.tf[i, j]) if j is not None else 0.0
            idf = float(self.idf[j]) if j is not None else 0.0
            part = idf * f * (self.k1 + 1) / (f + self.k1 * (1 - self.b + self.b * self.dl[i] / self.avgdl))
            rows.append({"word": w, "tf": f, "idf": round(idf, 3), "score": round(part, 3)})
        return pd.DataFrame(rows)

    def params(self) -> dict:
        return {"k1": self.k1, "b": self.b}
