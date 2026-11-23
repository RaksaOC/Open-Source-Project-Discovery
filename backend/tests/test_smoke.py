"""Every module imports, so the skeleton stays wired together while we fill it in."""

import importlib

import pytest

MODULES = [
    "discovery",
    "discovery.config",
    "discovery.models",
    "discovery.cli",
    "discovery.search",
    "discovery.collect.github_client",
    "discovery.collect.crawler",
    "discovery.preprocess.readme",
    "discovery.preprocess.text",
    "discovery.preprocess.technologies",
    "discovery.preprocess.complexity",
    "discovery.preprocess.pipeline",
    "discovery.index.inverted_index",
    "discovery.index.boolean",
    "discovery.rank.tfidf",
    "discovery.rank.bm25",
    "discovery.rank.embeddings",
    "discovery.rank.hybrid",
    "discovery.rank.popularity",
    "discovery.graph.build",
    "discovery.graph.centrality",
    "discovery.query.parser",
    "discovery.evaluation.metrics",
    "discovery.evaluation.runner",
    "discovery.api.app",
]


@pytest.mark.parametrize("name", MODULES)
def test_imports(name):
    importlib.import_module(name)


def test_search_method_contract():
    from discovery.rank.base import SearchMethod, check_hits

    class Dummy(SearchMethod):
        name = "dummy"
        def fit(self, corpus):
            self.ids = list(corpus["full_name"]); return self
        def search(self, query, k=10):
            return [{"doc_id": d, "score": float(len(self.ids) - i)} for i, d in enumerate(self.ids[:k])]

    import pandas as pd
    m = Dummy().fit(pd.DataFrame({"full_name": ["a/x", "b/y", "c/z"]}))
    check_hits(m.search("q", k=2), k=2)
