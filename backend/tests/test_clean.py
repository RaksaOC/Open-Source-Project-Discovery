"""Phase 4: README cleaning and the corpus pipeline, on small hand-made examples."""

import json

from discovery.preprocess.pipeline import build_corpus, english_score
from discovery.preprocess.readme import clean_readme

README = """<div align="center">
  <img src="logo.png" alt="logo" width="200" />
  <h1>Stockr</h1>
</div>

<!-- Badges -->
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/license/MIT)
![CI](https://github.com/o/stockr/actions/workflows/ci.yml/badge.svg)

## Table of contents
- [About](#about)
- [Install](#install)

## About :star2:
A simple **warehouse stock tracker** built with [NestJS](https://nestjs.com) and PostgreSQL.
See https://example.com/docs for more. Run `npm start` to begin.

```bash
npm install
npm run start
```

| Feature | Status |
|---|---|
| Barcode scanning | done |
"""


def test_clean_readme_keeps_prose_and_headings():
    t = clean_readme(README)
    assert "Stockr" in t and "About" in t
    assert "A simple warehouse stock tracker built with NestJS and PostgreSQL." in t
    assert "Barcode scanning" in t                                    # tables are content, kept


def test_clean_readme_removes_noise():
    t = clean_readme(README)
    for gone in ("img.shields.io", "badge", "logo.png", "Badges", "http", "npm install", "npm start",
                 ":star2:", "Table of contents", "Install", "<div", "](", "**"):
        assert gone not in t, gone


def test_clean_readme_empty_and_badges_only():
    assert clean_readme("") == ""
    assert clean_readme("[![CI](https://x/badge.svg)](https://x)\n![logo](logo.png)") == ""


def test_english_score():
    sw = {"the", "a", "is", "and", "of", "to", "with"}
    share, n = english_score("This is a tracker of the stock, built with love and care.", sw)
    assert n == 12 and share > 0.3
    assert english_score("这是一个库存管理系统", sw) == (0.0, 0)


def rec(name, readme="", description="", fork=False, archived=False, contributors=None, license=None):
    return {"full_name": name, "readme": readme, "languages": {"Python": 10},
            "contributors": contributors or [], "found_by": ["p000"], "selected_by": ["blog|django"],
            "search": {"name": name.split("/")[1], "description": description, "fork": fork, "archived": archived,
                       "stargazers_count": 7, "forks_count": 1, "topics": [], "license": license}}


def test_build_corpus_rules_and_log(tmp_path):
    sw = {"the", "a", "is", "and", "of", "to", "with", "for", "this", "it", "in", "on"}
    english = "This is a simple blog engine for the web. It is built with Django and it runs on a small server. " * 3
    spanish = "Este proyecto es un sistema de gestión de inventario hecho con Django para pequeñas empresas locales. " * 3
    records = [
        rec("o/good", README + english, "A blog", contributors=[{"login": "dev", "type": "User"}, {"login": "dependabot[bot]", "type": "Bot"}],
            license={"spdx_id": "MIT"}),
        rec("o/fork", english, "x", fork=True),
        rec("o/archived", english, "x", archived=True),
        rec("o/empty", "", ""),
        rec("o/desc-only", "", "A tiny POS app"),
        rec("o/spanish", spanish, "inventario"),
        rec("o/good", README + english, "A blog"),                       # duplicate line
    ]
    raw = tmp_path / "raw"; raw.mkdir()
    (raw / "repos.jsonl").write_text("".join(json.dumps(r) + "\n" for r in records))
    corpus, log = build_corpus(raw, tmp_path / "processed" / "corpus.parquet", {}, stopwords=sw)

    assert sorted(corpus["full_name"]) == ["o/desc-only", "o/good"]
    assert log["before"].iloc[0] == 7 and log["after"].iloc[-1] == len(corpus)
    assert (log["before"] - log["removed"] == log["after"]).all()             # the log adds up
    assert log["removed"].sum() == 7 - len(corpus)
    good = corpus.set_index("full_name").loc["o/good"]
    assert list(good["contributors"]) == ["dev"]                               # bot dropped
    assert good["license"] == "MIT"
    assert corpus.set_index("full_name").loc["o/desc-only", "license"] == "not specified"
    assert (tmp_path / "processed" / "cleaning_log.csv").exists()
