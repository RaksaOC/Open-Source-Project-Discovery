"""Hybrid fusion with fixed component lists: no model, no corpus, runs in milliseconds."""

import pandas as pd
import pytest

from discovery.rank.base import SearchMethod, check_hits
from discovery.rank.hybrid import HybridRanker, minmax

CORPUS = pd.DataFrame({"full_name": ["a/a", "b/b", "c/c", "d/d", "e/e"]})


class Fixed(SearchMethod):
    """A component that always returns the same ranked list."""

    def __init__(self, name, hits):
        self.name, self.hits, self.fits = name, hits, 0

    def fit(self, corpus):
        self.fits += 1
        return self

    def search(self, query, k=10):
        return [{"doc_id": d, "score": s} for d, s in self.hits][:k]

    def params(self):
        return {"fixed": True}


def _ranker(**kw):
    lex = Fixed("bm25", [("a/a", 30.0), ("b/b", 20.0), ("c/c", 10.0)])
    sem = Fixed("semantic", [("c/c", 0.9), ("d/d", 0.5), ("a/a", 0.1)])
    return HybridRanker(lex, sem, **kw).fit(CORPUS)


def test_minmax():
    assert minmax([]) == {}
    assert minmax([{"doc_id": "a/a", "score": 3.0}]) == {"a/a": 1.0}
    assert minmax([{"doc_id": "a/a", "score": 4.0}, {"doc_id": "b/b", "score": 2.0}]) == {"a/a": 1.0, "b/b": 0.0}


def test_rrf_adds_reciprocal_ranks():
    hits = _ranker(mode="rrf", c=60).search("q", 10)
    s = {h["doc_id"]: h["score"] for h in hits}
    assert s["a/a"] == pytest.approx(1 / 61 + 1 / 63)
    assert s["c/c"] == pytest.approx(1 / 63 + 1 / 61)
    assert s["b/b"] == pytest.approx(1 / 62)
    assert [h["doc_id"] for h in hits] == ["a/a", "c/c", "b/b", "d/d"]      # a/c tie: corpus order
    check_hits(hits, 10)


def test_weighted_rescales_then_mixes():
    hits = _ranker(mode="weighted", alpha=0.5).search("q", 10)
    s = {h["doc_id"]: h["score"] for h in hits}
    # bm25 minmax: a 1, b .5, c 0   semantic minmax: c 1, d .5, a 0
    assert s == pytest.approx({"a/a": 0.5, "b/b": 0.25, "c/c": 0.5, "d/d": 0.25})
    assert [h["doc_id"] for h in hits] == ["a/a", "c/c", "b/b", "d/d"]
    only_bm25 = _ranker(mode="weighted", alpha=1.0).search("q", 2)
    assert [h["doc_id"] for h in only_bm25] == ["a/a", "b/b"]


def test_k_depth_and_empty():
    r = _ranker()
    assert len(r.search("q", 2)) == 2
    assert r.search("q", 0) == []
    shallow = r.with_params(depth=1).search("q", 10)                     # top 1 of each list only
    assert {h["doc_id"] for h in shallow} == {"a/a", "c/c"}
    empty = HybridRanker(Fixed("x", []), Fixed("y", [])).fit(CORPUS)
    assert empty.search("q") == []


def test_with_params_shares_components_and_refit_false_keeps_them():
    r = _ranker()
    w = r.with_params(mode="weighted", alpha=0.8)
    assert w.lexical is r.lexical and w.semantic is r.semantic
    assert r.lexical.fits == 1                                            # with_params fits nothing
    HybridRanker(r.lexical, r.semantic).fit(CORPUS, refit=False)
    assert r.lexical.fits == 1
    assert w.params()["alpha"] == 0.8 and w.params()["lexical"] == {"method": "bm25", "fixed": True}


def test_extra_list_in_rrf():
    third = Fixed("tfidf", [("e/e", 1.0)])
    hits = _ranker(mode="rrf").with_params(extra=[third]).search("q", 10)
    assert "e/e" in {h["doc_id"] for h in hits}
    with pytest.raises(ValueError):
        _ranker(mode="weighted", extra=[third])


def test_bad_settings():
    for kw in ({"mode": "max"}, {"alpha": 1.5}, {"depth": 0}):
        with pytest.raises(ValueError):
            HybridRanker(**kw)
