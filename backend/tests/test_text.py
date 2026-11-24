"""The shared tokenizer (Phase 6.1): every method depends on it, so its behaviour is pinned here."""

import pandas as pd

from discovery.preprocess.text import doc_text, tokenize


def test_tech_names_stay_whole():
    toks = tokenize("Built with Node.js, Next.js and C#")
    assert "node.js" in toks and "next.js" in toks and "c#" in toks


def test_lowercase_lemmatize_and_stop_words():
    assert tokenize("The Inventory Systems") == ["inventory", "system"]
    assert "install" not in tokenize("npm install and run")      # README boilerplate from the EDA


def test_camel_case_and_separators():
    assert tokenize("InventoryManager") == ["inventory", "manager"]
    assert tokenize("TypeScript JavaScript NestJS PostgreSQL") == ["typescript", "javascript", "nestjs", "postgresql"]
    assert tokenize("point-of-sale_app") == ["point", "sale", "app"]


def test_noise_is_dropped():
    assert tokenize("v1.2.3 e.g. 2024 a") == ["v1"]
    assert tokenize("") == [] and tokenize(None) == []


def test_query_and_document_agree():
    assert set(tokenize("nestjs postgresql")) <= set(tokenize("An API in NestJS with PostgreSQL"))


def test_doc_text_skips_not_specified():
    df = pd.DataFrame({"name": ["pos"], "description": ["not specified"], "topics": [["point-of-sale"]],
                       "readme": ["A shop app"]})
    assert doc_text(df).iloc[0] == "pos  point of sale A shop app"
