"""Positional inverted index (Phase 7), the base the other methods can reuse.

    idx = InvertedIndex()
    idx.build(tokenize(t) for t in doc_text(corpus))      # one token list per repository, corpus order
    idx.postings("inventory")                              # [3, 17, 52, ...] row numbers, sorted
    idx.positions("inventory")                             # {3: [0, 41], 17: [5], ...}
    idx.df("inventory"), idx.n_docs, len(idx)              # document frequency, corpus size, vocabulary

Rows are corpus row numbers (0 … n_docs-1); a method maps them to full_name itself. Positions are token
offsets after tokenize(), so they also let Boolean answer phrase queries ("point of sale").
"""

from __future__ import annotations

import pickle
from collections.abc import Iterable
from pathlib import Path


class InvertedIndex:
    def __init__(self) -> None:
        self.index: dict[str, dict[int, list[int]]] = {}   # term -> {row: [positions]}
        self.doc_len: list[int] = []                       # tokens per row (BM25 needs it)
        self._sets: dict[str, frozenset[int]] = {}         # cache: term -> rows as a set

    @property
    def n_docs(self) -> int:
        return len(self.doc_len)

    def __len__(self) -> int:
        return len(self.index)

    def __contains__(self, term: str) -> bool:
        return term in self.index

    def build(self, docs: Iterable[list[str]]) -> InvertedIndex:
        """`docs`: one list of tokens per repository, in corpus order (already through tokenize())."""
        index: dict[str, dict[int, list[int]]] = {}
        doc_len: list[int] = []
        for row, tokens in enumerate(docs):
            doc_len.append(len(tokens))
            for pos, term in enumerate(tokens):
                index.setdefault(term, {}).setdefault(row, []).append(pos)
        self.index, self.doc_len, self._sets = index, doc_len, {}
        return self

    def postings(self, term: str) -> list[int]:
        """Rows that contain `term`, sorted ([] if none)."""
        return sorted(self.index.get(term, ()))

    def rows(self, term: str) -> frozenset[int]:
        """Same as postings(), as a set, for AND / OR / NOT."""
        s = self._sets.get(term)
        if s is None:
            s = self._sets[term] = frozenset(self.index.get(term, ()))
        return s

    def positions(self, term: str) -> dict[int, list[int]]:
        return self.index.get(term, {})

    def df(self, term: str) -> int:
        return len(self.index.get(term, ()))

    def phrase(self, terms: list[str]) -> set[int]:
        """Rows where `terms` appear next to each other, in this order."""
        if not terms:
            return set()
        rows = set(self.rows(terms[0]))
        for t in terms[1:]:
            rows &= self.rows(t)
        out = set()
        for r in rows:
            starts = set(self.index[terms[0]][r])
            for offset, t in enumerate(terms[1:], 1):
                starts &= {p - offset for p in self.index[t][r]}
                if not starts:
                    break
            if starts:
                out.add(r)
        return out

    def save(self, path: str | Path) -> None:
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        with open(path, "wb") as f:
            pickle.dump({"index": self.index, "doc_len": self.doc_len}, f, protocol=pickle.HIGHEST_PROTOCOL)

    @classmethod
    def load(cls, path: str | Path) -> InvertedIndex:
        with open(path, "rb") as f:
            data = pickle.load(f)
        idx = cls()
        idx.index, idx.doc_len = data["index"], data["doc_len"]
        return idx

    def __getstate__(self):                                # don't pickle the set cache
        return {"index": self.index, "doc_len": self.doc_len}

    def __setstate__(self, state):
        self.index, self.doc_len, self._sets = state["index"], state["doc_len"], {}
