"""Phase 8 · TF-IDF + cosine: same numbers as scikit-learn, the formula by hand, field weights, edge cases."""

import math

import numpy as np
import pandas as pd
import pytest
from sklearn.feature_extraction.text import TfidfVectorizer

from discovery.preprocess.text import doc_text, tokenize
from discovery.rank.base import check_hits
from discovery.rank.tfidf import FIELDS, TfidfRanker, field_tokens

CORPUS = pd.DataFrame({
    "full_name": ["a/stock", "b/pos", "c/school", "d/inv-express", "e/tutorial", "f/inv-nest", "g/blog"],
    "name": ["stock-tracker", "pos", "school-admin", "inventory-express", "nest-tutorial", "inventory-api", "blog"],
    "description": ["Track stock in a warehouse", "Point of sale for small shops", "not specified",
                    "Inventory with Express", "Learn NestJS step by step", "Inventory management API",
                    "A Markdown blog in Next.js"],
    "topics": [["inventory"], ["pos", "react"], ["laravel"], ["express"], ["nestjs", "tutorial"],
               ["nestjs", "postgresql"], ["nextjs", "static-site"]],
    "readme": ["Warehouse stock tracker. Stock in, stock out.", "Sell products at the counter.",
               "Students and grades.", "Node.js inventory app.", "A NestJS tutorial.",
               "Inventory API in NestJS with PostgreSQL.", "Write posts in Markdown."],
})
QUERIES = ["inventory nestjs postgresql", "point of sale react", "stock stock warehouse", "markdown blog nextjs"]


def _sklearn(sublinear_tf=True, min_df=1):
    docs = [tokenize(t) for t in doc_text(CORPUS)]
    ref = TfidfVectorizer(analyzer=lambda d: d, sublinear_tf=sublinear_tf, min_df=min_df).fit(docs)
    return ref, ref.transform(docs)


@pytest.mark.parametrize("sublinear_tf", [True, False])
@pytest.mark.parametrize("min_df", [1, 2])
def test_same_as_sklearn(sublinear_tf, min_df):
    m = TfidfRanker(sublinear_tf=sublinear_tf, min_df=min_df).fit(CORPUS)
    ref, R = _sklearn(sublinear_tf, min_df)
    assert set(m.vocab) == set(ref.vocabulary_)
    perm = [ref.vocabulary_[w] for w in m.vocab]
    np.testing.assert_allclose(m.X.toarray(), R[:, perm].toarray(), atol=1e-12)
    for q in QUERIES:
        theirs = (R @ ref.transform([tokenize(q)]).T).toarray().ravel()
        np.testing.assert_allclose(m.scores(q), theirs, atol=1e-12)


def test_cosine_by_hand():
    # three repositories, only README text: d0 = inventory x2 + nestjs, d1 = inventory + react, d2 = blog
    tiny = pd.DataFrame({"full_name": ["a/x", "b/y", "c/z"], "name": ["", "", ""], "description": ["", "", ""],
                         "topics": [[], [], []], "readme": ["inventory inventory nestjs", "inventory react", "blog"]})
    run_by_hand(tiny, sublinear_tf=True, tf2=1 + math.log(2))
    run_by_hand(tiny, sublinear_tf=False, tf2=2)                                           # raw tf: the count


def run_by_hand(tiny, sublinear_tf, tf2):
    m = TfidfRanker(sublinear_tf=sublinear_tf).fit(tiny)
    n = 3
    idf_inv, idf_one = math.log((1 + n) / (1 + 2)) + 1, math.log((1 + n) / (1 + 1)) + 1   # df 2 and df 1
    d0 = {"inventory": tf2 * idf_inv, "nestjs": 1 * idf_one}                               # inventory twice in d0
    d1 = {"inventory": 1 * idf_inv, "react": 1 * idf_one}
    norm0, norm1 = math.hypot(*d0.values()), math.hypot(*d1.values())

    # query "inventory nestjs": both words once, same idf as the corpus, then length 1
    q = {"inventory": idf_inv, "nestjs": idf_one}
    qn = math.hypot(*q.values())
    s0 = sum(d0[w] / norm0 * q[w] / qn for w in q)
    s1 = d1["inventory"] / norm1 * q["inventory"] / qn
    hits = m.search("inventory nestjs", k=3)
    assert [h["doc_id"] for h in hits] == ["a/x", "b/y"]                    # c/z shares no word: left out
    assert hits[0]["score"] == pytest.approx(s0) and hits[1]["score"] == pytest.approx(s1)
    # a one-word query is the repository's own weight for that word
    assert m.search("nestjs", k=1)[0]["score"] == pytest.approx(d0["nestjs"] / norm0)
    # explain() gives the same parts, and finds the count back
    e = m.explain("inventory nestjs", "a/x").set_index("word")
    assert e["part"].sum() == pytest.approx(s0, abs=1e-3)
    assert e.loc["inventory", "count"] == pytest.approx(2) and e.loc["nestjs", "count"] == pytest.approx(1)


def test_fields_together_are_doc_text():
    fields = field_tokens(CORPUS)
    for i, t in enumerate(doc_text(CORPUS)):
        assert [w for f in FIELDS for w in fields[f][i]] == tokenize(t)


def test_field_weights_repeat_the_field():
    # name x3 = the name written three times; weight 0 = the field left out
    m = TfidfRanker(field_weights={"name": 3, "topics": 3}).fit(CORPUS)
    tripled = CORPUS.assign(name=CORPUS["name"].map(lambda s: " ".join([s] * 3)),
                            topics=CORPUS["topics"].map(lambda t: t * 3))
    same = TfidfRanker().fit(tripled)
    for q in QUERIES:
        np.testing.assert_allclose(m.scores(q), same.scores(q), atol=1e-12)

    readme_only = TfidfRanker(field_weights={"name": 0, "description": 0, "topics": 0}).fit(CORPUS)
    blank = CORPUS.assign(name="", description="", topics=[[] for _ in range(len(CORPUS))])
    for q in QUERIES:
        np.testing.assert_allclose(readme_only.scores(q), TfidfRanker().fit(blank).scores(q), atol=1e-12)

    assert TfidfRanker(field_weights=dict.fromkeys(FIELDS, 1)).fit(CORPUS).params() == TfidfRanker().fit(CORPUS).params()


@pytest.mark.parametrize("kwargs", [{"min_df": 0}, {"field_weights": {"title": 2}}, {"field_weights": {"name": 0.5}},
                                    {"field_weights": dict.fromkeys(FIELDS, 0)}])
def test_bad_settings(kwargs):
    with pytest.raises(ValueError):
        TfidfRanker(**kwargs)


def test_min_df_drops_rare_words():
    m = TfidfRanker(min_df=2).fit(CORPUS)
    assert "inventory" in m.vocab and "warehouse" not in m.vocab          # 3 repositories vs 1
    assert m.search("warehouse", k=5) == []


def test_edge_cases():
    m = TfidfRanker().fit(CORPUS)
    assert m.search("zzz qqq", k=5) == []                                  # no known word
    assert m.search("the and of", k=5) == []                               # only stop words
    assert m.search("inventory", k=0) == []
    assert not m.scores("zzz").any() and len(m.scores("zzz")) == len(CORPUS)
    hits = m.search("inventory", k=10)
    check_hits(hits, 10)
    assert all(h["score"] > 0 for h in hits) and len(hits) == 3            # only repositories with the word
    assert all(0 < h["score"] <= 1 + 1e-9 for q in QUERIES for h in m.search(q))


def test_ties_keep_corpus_order():
    twins = pd.DataFrame({"full_name": ["z/second", "a/first", "m/other"], "name": ["", "", ""],
                          "description": ["", "", ""], "topics": [[], [], []],
                          "readme": ["inventory app", "inventory app", "blog"]})
    hits = TfidfRanker().fit(twins).search("inventory", k=3)
    assert [h["doc_id"] for h in hits] == ["z/second", "a/first"]
    assert hits[0]["score"] == hits[1]["score"]
