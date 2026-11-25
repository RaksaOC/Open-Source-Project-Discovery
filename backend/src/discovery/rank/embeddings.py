"""Phase 10.1: cosine similarity with MiniLM sentence embeddings and exact FAISS search."""

from __future__ import annotations

from textwrap import wrap

import numpy as np
import pandas as pd

from discovery.preprocess.text import doc_text, tokenize
from discovery.rank.base import Hit, SearchMethod

MODEL = "sentence-transformers/all-MiniLM-L6-v2"


class EmbeddingRanker(SearchMethod):
    """Embed repository metadata and optional README excerpts with the shared tokenizer."""

    name = "semantic"

    def __init__(self, model_name: str = MODEL, max_chars: int = 1000, readme_chunks: int = 1):
        if max_chars < 0 or readme_chunks < 1:
            raise ValueError("max_chars must be non-negative and readme_chunks must be positive")
        self.model_name = model_name
        self.max_chars = max_chars
        self.readme_chunks = readme_chunks
        self._ids: list[str] | None = None
        self._model = None
        self._index = None
        self._owners = np.empty(0, dtype=np.intp)

    def fit(self, corpus: pd.DataFrame) -> EmbeddingRanker:
        ids = corpus["full_name"].tolist()
        if len(ids) != len(set(ids)):
            raise ValueError("corpus must contain one row per full_name")
        if not ids:
            self._ids = []
            self._index = None
            self._owners = np.empty(0, dtype=np.intp)
            return self

        import faiss
        from sentence_transformers import SentenceTransformer

        metadata = doc_text(corpus[["name", "description", "topics"]].assign(
            name=corpus["name"].fillna(""),
            description=corpus["description"].fillna(""),
            topics=corpus["topics"].map(lambda topics: [] if topics is None else topics),
            readme="",
        ))
        texts = []
        owners = []
        for row, (head, readme) in enumerate(zip(metadata, corpus["readme"].fillna(""))):
            excerpt = readme[:self.max_chars * self.readme_chunks]
            chunks = [excerpt]
            if self.readme_chunks > 1 and excerpt:
                chunks = wrap(excerpt, width=self.max_chars, break_on_hyphens=False) or [""]
            for chunk in chunks[:self.readme_chunks]:
                texts.append(" ".join(tokenize(f"{head} {chunk}")))
                owners.append(row)

        model = self._model
        if model is None:
            model = SentenceTransformer(self.model_name)
        vectors = model.encode(texts, batch_size=32, normalize_embeddings=True)
        index = faiss.IndexFlatIP(vectors.shape[1])
        index.add(np.ascontiguousarray(vectors, dtype=np.float32))

        self._model, self._index = model, index
        self._ids = ids
        self._owners = np.asarray(owners, dtype=np.intp)
        return self

    def search(self, query: str, k: int = 10) -> list[Hit]:
        if self._ids is None:
            raise RuntimeError("fit the ranker before searching")
        if k <= 0 or not self._ids:
            return []
        scores = self._score_tokens(tokenize(query))
        if scores is None:
            return []
        rows = np.argsort(-scores, kind="stable")[:k]
        return [{"doc_id": self._ids[row], "score": float(scores[row])} for row in rows]

    def scores(self, query: str) -> np.ndarray:
        """Return one cosine score per repository in the original corpus order."""
        if self._ids is None:
            raise RuntimeError("fit the ranker before scoring")
        scores = self._score_tokens(tokenize(query)) if self._ids else None
        return scores if scores is not None else np.zeros(len(self._ids), dtype=np.float32)

    def _score_tokens(self, tokens: list[str]) -> np.ndarray | None:
        if not tokens:
            return None
        query = self._model.encode([" ".join(tokens)], normalize_embeddings=True)
        # Get all exact scores once, then pool chunks and restore corpus order for hybrid search.
        distances, rows = self._index.search(
            np.ascontiguousarray(query, dtype=np.float32), self._index.ntotal
        )
        scores = np.full(len(self._ids), -np.inf, dtype=np.float32)
        np.maximum.at(scores, self._owners[rows[0]], distances[0])
        return scores

    def params(self) -> dict:
        return {
            "model": self.model_name,
            "text": "name + description + topics" + (" + README" if self.max_chars else ""),
            "max_chars_per_chunk": self.max_chars,
            "readme_chunks": self.readme_chunks,
            "tokenizer": "discovery.preprocess.text.tokenize",
        }
