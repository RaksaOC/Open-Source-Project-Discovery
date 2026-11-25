from __future__ import annotations

import sys
from types import SimpleNamespace

import numpy as np
import pandas as pd

from discovery.rank import embeddings


def test_scores_pool_chunks_and_keep_corpus_order(monkeypatch):
    class TestEncoder:
        def __init__(self, model_name):
            pass

        def encode(self, texts, *, normalize_embeddings, **kwargs):
            assert normalize_embeddings
            return np.array(
                [[1, 0] if "stock" in text.split() else [0, 1] for text in texts],
                dtype=np.float32,
            )

    monkeypatch.setitem(sys.modules, "sentence_transformers", SimpleNamespace(
        SentenceTransformer=TestEncoder,
    ))
    monkeypatch.setattr(embeddings, "tokenize", str.split)
    corpus = pd.DataFrame({
        "full_name": ["z/blog", "b/inventory", "a/warehouse"],
        "name": ["blog", "inventory", "warehouse"],
        "description": ["", "", ""],
        "topics": [[], [], []],
        "readme": ["pages", "intro stock", "stock stock"],
    }, index=[5, 2, 9])

    ranker = embeddings.EmbeddingRanker(max_chars=6, readme_chunks=2).fit(corpus)

    np.testing.assert_array_equal(ranker.scores("stock"), [0, 1, 1])
    assert ranker.search("stock", k=1) == [{"doc_id": "b/inventory", "score": 1.0}]
    assert ranker.search("stock", k=10) == [
        {"doc_id": "b/inventory", "score": 1.0},
        {"doc_id": "a/warehouse", "score": 1.0},
        {"doc_id": "z/blog", "score": 0.0},
    ]
    assert ranker.search(" ") == []
    np.testing.assert_array_equal(ranker.scores(" "), [0, 0, 0])

    ranker.fit(corpus.iloc[:0])
    assert ranker.search("stock") == []
    assert ranker.scores("stock").size == 0
