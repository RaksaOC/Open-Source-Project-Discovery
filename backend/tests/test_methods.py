"""The five methods follow the same contract (rank/base.py). A method that is not written yet is
skipped, so this file turns green method by method. Run: pytest tests/test_methods.py -v

The semantic and hybrid methods load a sentence-transformers model; they only run with IR_SLOW=1.
"""

import os

import pandas as pd
import pytest

from discovery.index.boolean import BooleanSearch
from discovery.rank.base import check_hits
from discovery.rank.bm25 import BM25Ranker
from discovery.rank.embeddings import EmbeddingRanker
from discovery.rank.hybrid import HybridRanker
from discovery.rank.tfidf import TfidfRanker

TINY = pd.DataFrame({
    "full_name": ["a/stock", "b/pos", "c/school", "d/chat", "e/blog", "f/inv-nest"],
    "name": ["stock-tracker", "pos", "school-admin", "chatty", "blog", "inventory-api"],
    "description": ["Track stock in a warehouse", "Point of sale for small shops", "School management in Laravel",
                    "Real-time chat with Socket.IO", "A Markdown blog in Next.js", "Inventory management API"],
    "topics": [["inventory"], ["pos", "react"], ["laravel"], ["chat"], ["nextjs"], ["nestjs", "postgresql"]],
    "readme": ["Warehouse stock tracker.", "Sell products at the counter. React.", "Students, grades and attendance.",
               "Rooms and messages.", "Write posts in Markdown.", "Inventory API in NestJS with PostgreSQL."],
    "stars": [5, 9, 12, 30, 7, 15],
})

SLOW = pytest.mark.skipif(not os.environ.get("IR_SLOW"), reason="loads a model: run with IR_SLOW=1")
METHODS = [
    pytest.param(BooleanSearch, id="boolean"),
    pytest.param(TfidfRanker, id="tfidf"),
    pytest.param(BM25Ranker, id="bm25"),
    pytest.param(EmbeddingRanker, id="semantic", marks=SLOW),
    pytest.param(HybridRanker, id="hybrid", marks=SLOW),
]


def _fitted(cls):
    try:
        return cls().fit(TINY)
    except NotImplementedError:
        pytest.skip(f"{cls.__name__} is not written yet")


@pytest.mark.parametrize("cls", METHODS)
def test_contract(cls):
    m = _fitted(cls)
    for q in ["inventory management nestjs postgresql", "point of sale", "zzz nothing matches qqq"]:
        check_hits(m.search(q, k=3), k=3)
    assert isinstance(m.params(), dict) and m.name


@pytest.mark.parametrize("cls", METHODS)
def test_finds_the_obvious_one(cls):
    hits = _fitted(cls).search("inventory nestjs postgresql", k=3)
    assert hits and hits[0]["doc_id"] == "f/inv-nest"
