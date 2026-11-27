"""Phase 7 · Boolean search (Member 1). Notebook: notebooks/07-boolean.ipynb · branch dev-boolean.

A repository either matches or it doesn't: AND, OR, NOT over an inverted index (term -> rows).
A free-text query is AND of its words; if that finds nothing, OR. Hits are ordered by how many query
words they contain (Boolean has no real score), then corpus order. The index lives in
index/inverted_index.py so the other methods can reuse it.

    method = BooleanSearch().fit(corpus)
    method.search("inventory nestjs postgresql", k=10)        # free text: AND, then OR
    method.boolean('inventory AND (nestjs OR express) AND NOT "point of sale"')   # -> set of rows
"""

from __future__ import annotations

import re

import pandas as pd

from discovery.index.inverted_index import InvertedIndex
from discovery.preprocess.text import NS, tokenize
from discovery.rank.base import Hit, SearchMethod

FIELDS = ("name", "description", "topics", "readme")
OPERATORS = ("and_or", "and", "or")       # and_or: AND, then OR if AND finds nothing
_QTOK = re.compile(r'"[^"]*"|\(|\)|\bAND\b|\bOR\b|\bNOT\b|[^\s()"]+')


def field_text(corpus: pd.DataFrame, fields: tuple[str, ...] = FIELDS) -> pd.Series:
    """The text of the chosen fields, one string per repository (all four = preprocess.text.doc_text)."""
    parts = []
    for f in fields:
        if f == "topics":
            parts.append(corpus["topics"].map(lambda t: " ".join(x.replace("-", " ") for x in t)))
        elif f == "description":
            parts.append(corpus["description"].where(corpus["description"] != NS, "").fillna(""))
        else:
            parts.append(corpus[f].fillna("").astype(str))
    out = parts[0]
    for p in parts[1:]:
        out = out + " " + p
    return out


class BooleanSearch(SearchMethod):
    name = "boolean"

    def __init__(self, operator: str = "and_or", fields: tuple[str, ...] = FIELDS) -> None:
        if operator not in OPERATORS:
            raise ValueError(f"operator must be one of {OPERATORS}, got {operator!r}")
        unknown = set(fields) - set(FIELDS)
        if not fields or unknown:
            raise ValueError(f"fields must be a non-empty subset of {FIELDS}, got {fields!r}")
        self.operator, self.fields = operator, tuple(fields)
        self.index = InvertedIndex()
        self.ids: list[str] = []
        self.all: frozenset[int] = frozenset()

    # ---- build -------------------------------------------------------------------------------
    def fit(self, corpus: pd.DataFrame) -> BooleanSearch:
        self.ids = corpus["full_name"].tolist()
        self.index.build(tokenize(t) for t in field_text(corpus, self.fields))
        self.all = frozenset(range(len(self.ids)))
        return self

    # ---- free-text search (the shared interface) -----------------------------------------------
    def search(self, query: str, k: int = 10) -> list[Hit]:
        terms = list(dict.fromkeys(tokenize(query)))           # distinct, in query order
        if not terms or k <= 0:
            return []
        sets = [self.index.rows(t) for t in terms]
        hits: set[int] = set()
        if self.operator in ("and_or", "and"):
            hits = set(frozenset.intersection(*sets))
        if not hits and self.operator in ("and_or", "or"):
            hits = set(frozenset.union(*sets))
        score = {i: sum(i in s for s in sets) for i in hits}
        best = sorted(hits, key=lambda i: (-score[i], i))[:k]
        return [{"doc_id": self.ids[i], "score": float(score[i])} for i in best]

    # ---- Boolean query language ----------------------------------------------------------------
    def boolean(self, query: str) -> set[int]:
        """'inventory AND (nestjs OR express) AND NOT "point of sale"' -> the matching row numbers.

        NOT binds tightest, then AND, then OR. Two operands next to each other mean AND. Operators are
        upper case (lower-case "and"/"or"/"not" are ordinary words, dropped as stop words). A quoted
        "phrase" must appear as consecutive tokens. A word that tokenize() splits into several terms
        ("point-of-sale") needs all of them; a word it drops entirely (a stop word) matches everything,
        so it doesn't change an AND. Raises ValueError for a malformed query.
        """
        toks = _QTOK.findall(query)
        if not toks:
            return set()
        pos = 0

        def peek():
            return toks[pos] if pos < len(toks) else None

        def take():
            nonlocal pos
            if pos >= len(toks):
                raise ValueError(f"query ends early: {query!r}")
            pos += 1
            return toks[pos - 1]

        def expr() -> frozenset[int]:
            r = term()
            while peek() == "OR":
                take()
                r = r | term()
            return r

        def term() -> frozenset[int]:
            r = factor()
            while peek() not in (None, "OR", ")"):
                if peek() == "AND":
                    take()
                r = r & factor()
            return r

        def factor() -> frozenset[int]:
            t = take()
            if t == "NOT":
                return self.all - factor()
            if t == "(":
                r = expr()
                if take() != ")":
                    raise ValueError(f"missing ')' in {query!r}")
                return r
            if t in (")", "AND", "OR"):
                raise ValueError(f"unexpected {t!r} in {query!r}")
            words = tokenize(t.strip('"'))
            if not words:
                return self.all
            if t.startswith('"'):
                return frozenset(self.index.phrase(words))
            return frozenset.intersection(*(self.index.rows(w) for w in words))

        result = expr()
        if pos != len(toks):
            raise ValueError(f"unexpected {toks[pos]!r} in {query!r}")
        return set(result)

    def params(self) -> dict:
        return {"operator": {"and_or": "AND, then OR", "and": "AND", "or": "OR"}[self.operator],
                "fields": list(self.fields)}
