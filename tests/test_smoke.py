"""Every module imports, so the skeleton stays wired together while we fill it in."""

import importlib

import pytest

MODULES = [
    "discovery",
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
]


@pytest.mark.parametrize("name", MODULES)
def test_imports(name):
    importlib.import_module(name)
