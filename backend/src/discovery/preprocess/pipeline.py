"""Raw JSON lines (data/raw/repos.jsonl) -> cleaned corpus (data/processed/corpus.parquet).

The rules run in a fixed order and every one is logged (data/processed/cleaning_log.csv): how many
repositories it removed or changed, so the report can say exactly what cleaning did.

  1. forks                 drop fork = true
  2. archived              drop archived (the plan excluded them; some get archived after listing)
  3. empty                 drop: no README and no description
  4. clean README          Markdown -> text (readme.clean_readme); count READMEs that end up empty
  5. length cap            keep the first readme_max_chars characters
  6. language              drop non-English READMEs (stop-word share); READMEs under 30 words are kept
  7. bots                  drop contributors whose type is Bot
  8. missing values        licence, description, complexity -> "not specified"
  9. duplicates            no full_name twice

Technologies and complexity are filled in Phase 6 (preprocess/technologies.py, complexity.py).
"""

from __future__ import annotations

import json
import re
from pathlib import Path

import pandas as pd

from discovery.collect.crawler import iter_jsonl
from discovery.preprocess.readme import clean_readme

NS = "not specified"
_WORD = re.compile(r"[a-z]+(?:'[a-z]+)?")


def english_score(text: str, stopwords: set[str]) -> tuple[float, int]:
    """Share of words that are English stop words, and the number of words."""
    words = _WORD.findall(text.lower())
    if not words:
        return 0.0, 0
    return sum(w in stopwords for w in words) / len(words), len(words)


def _flatten(rec: dict) -> dict:
    s = rec.get("search", {})
    lic = s.get("license") or {}
    return {
        "full_name": rec["full_name"],
        "url": s.get("html_url", f"https://github.com/{rec['full_name']}"),
        "name": s.get("name", rec["full_name"].split("/")[-1]),
        "description": s.get("description") or "",
        "readme_raw": rec.get("readme") or "",
        "topics": s.get("topics") or [],
        "languages": rec.get("languages") or {},
        "language": s.get("language") or NS,
        "stars": s.get("stargazers_count", 0),
        "forks": s.get("forks_count", 0),
        "open_issues": s.get("open_issues_count", 0),
        "license": lic.get("spdx_id") or lic.get("name") or "",
        "created_at": s.get("created_at", ""),
        "pushed_at": s.get("pushed_at", ""),
        "fork": bool(s.get("fork", False)),
        "archived": bool(s.get("archived", False)),
        "contributors_raw": rec.get("contributors") or [],
        "found_by": rec.get("found_by", []),
        "selected_by": rec.get("selected_by", []),
    }


def build_corpus(raw_dir: str | Path, out_path: str | Path, config: dict | None = None,
                 stopwords: set[str] | None = None) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Clean the raw records and write corpus.parquet + cleaning_log.csv next to it.
    Returns (corpus, log)."""
    config = config or {}
    pre = config.get("preprocessing", {})
    max_chars = pre.get("readme_max_chars", 20000)
    min_share = pre.get("english_min_stopword_share", 0.05)
    min_words = pre.get("english_min_words", 30)
    if stopwords is None:
        from nltk.corpus import stopwords as sw
        stopwords = set(sw.words("english"))

    raw_dir, out_path = Path(raw_dir), Path(out_path)
    df = pd.DataFrame([_flatten(r) for r in iter_jsonl(raw_dir / "repos.jsonl")])
    log = []

    def step(rule: str, keep: pd.Series | None = None, changed: int | None = None, note: str = ""):
        nonlocal df
        before = len(df)
        if keep is not None:
            df = df[keep].copy()
        log.append({"step": len(log), "rule": rule, "before": before, "removed": before - len(df),
                    "after": len(df), "changed": changed if changed is not None else 0, "note": note})

    step("loaded raw records")
    step("forks: fork = true", ~df["fork"])
    step("archived", ~df["archived"])
    step("empty: no README and no description", (df["readme_raw"].str.strip() != "") | (df["description"].str.strip() != ""))

    df["readme"] = df["readme_raw"].map(clean_readme)
    df["readme_raw_chars"] = df["readme_raw"].str.len()
    emptied = int(((df["readme_raw"].str.strip() != "") & (df["readme"] == "")).sum())
    step("clean README (badges, images, HTML, code, link URLs, TOC, emoji)", changed=int((df["readme"] != df["readme_raw"]).sum()),
         note=f"{emptied} READMEs had nothing left but badges/images/code; "
              f"chars {int(df['readme_raw_chars'].sum()):,} -> {int(df['readme'].str.len().sum()):,}")

    long = df["readme"].str.len() > max_chars
    df["readme"] = df["readme"].str.slice(0, max_chars)
    step(f"length cap: first {max_chars:,} characters", changed=int(long.sum()))

    text = df["readme"].where(df["readme"].str.strip() != "", df["description"])
    scored = text.map(lambda t: english_score(t, stopwords))
    df["english_share"] = scored.map(lambda x: round(x[0], 4))
    df["words"] = scored.map(lambda x: x[1])
    step(f"language: stop-word share < {min_share:.0%} (texts under {min_words} words kept)",
         (df["words"] < min_words) | (df["english_share"] >= min_share))

    def humans(cs):
        return [c["login"] for c in cs if c.get("type") != "Bot" and c.get("login")]
    n_bots = int(df["contributors_raw"].map(lambda cs: sum(c.get("type") == "Bot" for c in cs)).sum())
    df["contributors"] = df["contributors_raw"].map(humans)
    step("bots: contributors with type Bot", changed=n_bots, note=f"{n_bots} bot entries removed from contributor lists")

    missing = {c: int((df[c].astype(str).str.strip() == "").sum()) for c in ("license", "description")}
    for c in ("license", "description"):
        df[c] = df[c].where(df[c].astype(str).str.strip() != "", NS)
    df["complexity"] = NS
    df["technologies"] = [[] for _ in range(len(df))]
    step('missing values -> "not specified"', changed=sum(missing.values()),
         note=", ".join(f"{k}: {v}" for k, v in missing.items()) + "; complexity is filled in Phase 6")

    step("duplicates: full_name", ~df["full_name"].duplicated())

    cols = ["full_name", "url", "name", "description", "readme", "topics", "languages", "language", "technologies",
            "complexity", "stars", "forks", "open_issues", "license", "created_at", "pushed_at", "contributors",
            "found_by", "selected_by", "readme_raw_chars", "english_share", "words"]
    corpus = df[cols].reset_index(drop=True)
    corpus["languages"] = corpus["languages"].map(json.dumps)          # {"Python": 7053435, …} as JSON text: one column, any keys

    out_path.parent.mkdir(parents=True, exist_ok=True)
    log_df = pd.DataFrame(log)
    corpus.to_parquet(out_path, index=False)
    log_df.to_csv(out_path.parent / "cleaning_log.csv", index=False)
    return corpus, log_df
