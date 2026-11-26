"""Phase 8 · TF-IDF + cosine (Member 2). Notebook: notebooks/08-tfidf.ipynb · branch dev-tfidf.

Our own implementation (numpy + scipy.sparse), checked against scikit-learn's TfidfVectorizer
(same matrix to 1e-15, raw and sublinear tf): smooth idf, rows scaled to unit length so cosine = dot product.

    weight(w, d) = tf(w, d) * idf(w)
    tf(w, d)     = count   (raw, default)   or   1 + log(count)   (sublinear)
    idf(w)       = log((1 + N) / (1 + n_w)) + 1             never below 1
    score(d, q)  = cos(d, q) = sum over query words w of  d_w * q_w,   d and q scaled to length 1

count = how often w occurs in d, N = repositories, n_w = repositories that contain w. The query is
weighted the same way, with its own counts. Each repository row is divided by its length once, at
build time, so a query only touches the columns of its own words.

Why raw tf: tuned in the notebook (step 7) on the 5 development queries with silver labels, raw tf
beat sublinear tf by 0.05 to 0.08 NDCG@10 at every min_df (0.681 vs 0.629 at min_df 1). Cosine favours
very short repositories; sublinear tf makes that worse (every distinct word adds to a repository's
length), raw tf softens it. To re-check on the real development labels (Phase 13).

Field weights count a field's words more than once: {"name": 3, "topics": 3} is the same as writing
the name and the topics three times in the text. Fields left out keep weight 1; weight 0 drops a
field ({"name": 0, "description": 0, "topics": 0} = README only).
"""

from __future__ import annotations

from collections import Counter

import numpy as np
import pandas as pd
from scipy import sparse

from discovery.preprocess.text import NS, tokenize
from discovery.rank.base import Hit, SearchMethod

FIELDS = ("name", "description", "topics", "readme")


def field_text(corpus: pd.DataFrame) -> dict[str, pd.Series]:
    """The four searchable fields, cleaned with the same rules as `doc_text` ("not specified"
    descriptions left out, topic hyphens as spaces). Joined with spaces, they give `doc_text`."""
    return {
        "name": corpus["name"],
        "description": corpus["description"].where(corpus["description"] != NS, ""),
        "topics": corpus["topics"].map(lambda t: " ".join(x.replace("-", " ") for x in t)),
        "readme": corpus["readme"],
    }


def field_tokens(corpus: pd.DataFrame) -> dict[str, list[list[str]]]:
    """Each field tokenized with the shared tokenizer. Tokenize once and pass it to several
    `fit(corpus, tokens=...)` calls when trying settings (tokenizing is most of the build time)."""
    return {f: [tokenize(t) for t in s] for f, s in field_text(corpus).items()}


class TfidfRanker(SearchMethod):
    name = "tfidf"

    def __init__(self, sublinear_tf: bool = False, min_df: int = 1, field_weights: dict | None = None):
        if not (isinstance(min_df, int) and min_df >= 1):
            raise ValueError("min_df is a number of repositories: an integer >= 1")
        if field_weights is not None:
            unknown = set(field_weights) - set(FIELDS)
            if unknown:
                raise ValueError(f"unknown field(s) {sorted(unknown)}: use {list(FIELDS)}")
            if any(not (w == 0 or w >= 1) for w in field_weights.values()):
                raise ValueError("a field weight is how many times its words count: 0 (left out) or >= 1")
            if not any({**dict.fromkeys(FIELDS, 1), **field_weights}.values()):
                raise ValueError("at least one field needs a weight above 0")
        self.sublinear_tf, self.min_df, self.field_weights = sublinear_tf, min_df, field_weights

    @property
    def weights(self) -> dict[str, float]:
        """Weight of every field (1 unless field_weights says otherwise)."""
        return {**dict.fromkeys(FIELDS, 1), **(self.field_weights or {})}

    def fit(self, corpus: pd.DataFrame, tokens: dict[str, list[list[str]]] | None = None) -> TfidfRanker:
        """Count words per field, weight and add the fields, then tf, idf and unit-length rows.
        `tokens` (from `field_tokens(corpus)`) lets a notebook skip tokenizing again."""
        tokens = tokens if tokens is not None else field_tokens(corpus)
        self.ids = corpus["full_name"].tolist()
        n = len(self.ids)

        vocab: dict[str, int] = {}
        rows, cols, vals = [], [], []
        for field, weight in self.weights.items():
            if weight == 0:
                continue
            for i, doc in enumerate(tokens[field]):
                for w, c in Counter(doc).items():
                    rows.append(i)
                    cols.append(vocab.setdefault(w, len(vocab)))
                    vals.append(weight * c)
        # duplicates (the same word in two fields) are added up: the weighted count of each word
        counts = sparse.csc_matrix((np.array(vals, dtype=np.float64), (rows, cols)), shape=(n, len(vocab)))
        counts.sum_duplicates()

        df = np.diff(counts.indptr)                                       # repositories containing each word
        keep = np.flatnonzero(df >= self.min_df)
        words = list(vocab)
        self.vocab = {words[j]: new for new, j in enumerate(keep)}
        self.df = df[keep]
        counts = counts[:, keep]

        self.idf = np.log((1 + n) / (1 + self.df)) + 1                    # smooth idf, as in scikit-learn
        tf = counts.copy()
        if self.sublinear_tf:
            tf.data = 1 + np.log(tf.data)
        X = (tf @ sparse.diags(self.idf)).tocsr()
        self.norms = np.sqrt(np.asarray(X.multiply(X).sum(axis=1)).ravel())  # length of each repository vector
        X = sparse.diags(1 / np.where(self.norms > 0, self.norms, 1)) @ X  # unit length: cosine = dot product
        self.X = X.tocsc()                                                # column w = the posting list of w
        return self

    def query_vector(self, query: str) -> tuple[np.ndarray, np.ndarray]:
        """The query's columns and their weights (tf * idf, scaled to length 1). Words the corpus
        does not have are left out. Empty arrays if no query word is known."""
        c = Counter(w for w in tokenize(query) if w in self.vocab)
        if not c:
            return np.empty(0, dtype=np.intp), np.empty(0)
        cols = np.array([self.vocab[w] for w in c], dtype=np.intp)
        tf = np.array(list(c.values()), dtype=np.float64)
        if self.sublinear_tf:
            tf = 1 + np.log(tf)
        q = tf * self.idf[cols]
        return cols, q / np.linalg.norm(q)

    def scores(self, query: str) -> np.ndarray:
        """Cosine of every repository with the query (numpy array, corpus order)."""
        cols, q = self.query_vector(query)
        if not len(cols):
            return np.zeros(len(self.ids))
        return self.X[:, cols] @ q                                        # only the query's columns

    def search(self, query: str, k: int = 10) -> list[Hit]:
        if k <= 0:
            return []
        s = self.scores(query)
        hit = np.flatnonzero(s > 0)                                       # only repositories with a query word
        top = hit[np.lexsort((hit, -s[hit]))][:k]                         # score descending, ties in corpus order
        return [{"doc_id": self.ids[i], "score": float(s[i])} for i in top]

    def explain(self, query: str, doc_id: str) -> pd.DataFrame:
        """Each query word's part of one repository's cosine: the hand calculation, as a table.
        count = weighted count in the repository, doc = its weight after scaling the row to length 1,
        query = the query's weight after scaling, part = doc * query. The parts add up to the score."""
        i = self.ids.index(doc_id)
        cols, q = self.query_vector(query)
        qw = dict(zip(cols.tolist(), q.tolist()))
        rows = []
        for w in dict.fromkeys(tokenize(query)):
            j = self.vocab.get(w)
            d = float(self.X[i, j]) if j is not None else 0.0
            tf = d * self.norms[i] / self.idf[j] if d else 0.0                # undo the scaling and the idf
            count = (np.exp(tf - 1) if self.sublinear_tf else tf) if d else 0.0
            rows.append({"word": w, "count": round(float(count), 3), "idf": round(float(self.idf[j]), 3) if j is not None else None,
                         "doc": round(d, 4), "query": round(qw.get(j, 0.0), 4), "part": round(d * qw.get(j, 0.0), 4)})
        return pd.DataFrame(rows)

    def params(self) -> dict:
        return {"tf": "sublinear" if self.sublinear_tf else "raw", "idf": "smooth", "min_df": self.min_df,
                "field_weights": self.weights}
