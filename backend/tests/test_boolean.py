"""Phase 7 · Boolean search: exact set rules, the parser, phrases and the inverted index."""

import pandas as pd
import pytest

from discovery.index.boolean import BooleanSearch
from discovery.index.inverted_index import InvertedIndex
from discovery.rank.base import check_hits

CORPUS = pd.DataFrame({
    "full_name": ["a/stock", "b/pos", "c/school", "d/inv-express", "e/tutorial", "f/inv-nest", "g/sale-point"],
    "name": ["stock-tracker", "pos", "school-admin", "inventory-express", "nest-tutorial", "inventory-api", "sale"],
    "description": ["Track stock in a warehouse", "Point of sale for small shops", "not specified",
                    "Inventory with Express", "Learn NestJS step by step", "Inventory management API",
                    "Sale point for shops"],
    "topics": [["inventory"], ["pos", "react"], ["laravel"], ["express"], ["nestjs", "tutorial"],
               ["nestjs", "postgresql"], []],
    "readme": ["Warehouse stock tracker.", "Sell products at the counter.", "Students and grades.",
               "Node.js inventory app.", "A NestJS tutorial.", "Inventory API in NestJS with PostgreSQL.",
               "Point your shop at a sale."],
    "stars": [5, 9, 12, 3, 7, 15, 1],
})
ROW = {n: i for i, n in enumerate(CORPUS["full_name"])}


@pytest.fixture(scope="module")
def m():
    return BooleanSearch().fit(CORPUS)


def rows(*names):
    return {ROW[n] for n in names}


def test_single_terms(m):
    assert m.boolean("inventory") == rows("a/stock", "d/inv-express", "f/inv-nest")
    assert m.boolean("nestjs") == rows("e/tutorial", "f/inv-nest")


@pytest.mark.parametrize("a,b", [("inventory", "nestjs"), ("sale", "point"), ("express", "laravel")])
def test_set_identities(m, a, b):
    A, B, ALL = m.boolean(a), m.boolean(b), set(range(len(CORPUS)))
    assert m.boolean(f"{a} AND {b}") == A & B
    assert m.boolean(f"{a} OR {b}") == A | B
    assert len(m.boolean(f"{a} OR {b}")) == len(A) + len(B) - len(A & B)
    assert len(m.boolean(f"NOT {a}")) + len(A) == len(CORPUS)
    assert m.boolean(f"{a} {b}") == m.boolean(f"{a} AND {b}")           # implicit AND
    assert m.boolean(f"NOT {a} AND {b}") == (ALL - A) & B                # NOT binds tighter than AND
    assert m.boolean(f"NOT ({a} OR {b})") == ALL - (A | B)               # De Morgan
    assert m.boolean(f"NOT {a} AND NOT {b}") == ALL - (A | B)


def test_precedence_and_brackets(m):
    assert m.boolean("inventory AND (nestjs OR express)") == rows("d/inv-express", "f/inv-nest")
    # AND binds tighter than OR: inventory OR (nestjs AND tutorial)
    assert m.boolean("inventory OR nestjs AND tutorial") == rows("a/stock", "d/inv-express", "f/inv-nest", "e/tutorial")
    assert m.boolean("inventory AND NOT tutorial AND nestjs") == rows("f/inv-nest")


def test_tokenizer_is_shared(m):
    assert m.boolean("NestJS") == m.boolean("nestjs")                    # same tokenize() as documents
    assert m.boolean("Inventories") == m.boolean("inventory")            # lemmatised
    assert m.boolean("inventory AND the") == m.boolean("inventory")      # a stop word doesn't narrow an AND


def test_phrases(m):
    assert m.boolean('"point of sale"') == rows("b/pos")                  # 'of' is a stop word: point, sale adjacent
    assert m.boolean("point sale") == rows("b/pos", "g/sale-point")      # without quotes: both words anywhere
    assert m.boolean('"sale point"') == rows("g/sale-point")


@pytest.mark.parametrize("bad", ["inventory AND", "(inventory", "inventory)", "AND inventory", "NOT", "a OR OR b"])
def test_malformed_queries_raise(m, bad):
    with pytest.raises(ValueError):
        m.boolean(bad)


def test_search_and_then_or(m):
    hits = m.search("inventory nestjs postgresql", k=10)
    check_hits(hits, 10)
    assert [h["doc_id"] for h in hits] == ["f/inv-nest"]                 # AND finds it alone
    hits = m.search("laravel react", k=10)                               # AND finds nothing: OR
    assert {h["doc_id"] for h in hits} == {"c/school", "b/pos"}
    assert m.search("zzz qqq") == [] and m.search("") == [] and m.search("the of a") == []


def test_or_ranking_counts_matched_words():
    m = BooleanSearch(operator="or").fit(CORPUS)
    hits = m.search("inventory nestjs express", k=10)
    check_hits(hits, 10)
    assert hits[0]["score"] == 2.0 and hits[0]["doc_id"] in {"d/inv-express", "f/inv-nest"}
    tied = [h["doc_id"] for h in hits if h["score"] == 2.0]
    assert tied == sorted(tied, key=ROW.get)                             # ties keep corpus order


def test_and_only_returns_nothing_when_no_repo_has_all():
    assert BooleanSearch(operator="and").fit(CORPUS).search("laravel react") == []


def test_fields_setting():
    names_only = BooleanSearch(fields=("name",)).fit(CORPUS)
    assert names_only.boolean("inventory") == rows("d/inv-express", "f/inv-nest")
    with pytest.raises(ValueError):
        BooleanSearch(fields=("stars",))
    with pytest.raises(ValueError):
        BooleanSearch(operator="xor")


def test_index_roundtrip(tmp_path):
    idx = InvertedIndex().build([["a", "b", "a"], ["b", "c"], []])
    assert idx.postings("a") == [0] and idx.postings("b") == [0, 1] and idx.postings("zz") == []
    assert idx.positions("a") == {0: [0, 2]} and idx.df("b") == 2 and idx.n_docs == 3 and len(idx) == 3
    assert idx.phrase(["a", "b"]) == {0} and idx.phrase(["b", "a"]) == {0} and idx.phrase(["b", "c"]) == {1}
    idx.save(tmp_path / "idx.pkl")
    back = InvertedIndex.load(tmp_path / "idx.pkl")
    assert back.index == idx.index and back.doc_len == [3, 2, 0]
