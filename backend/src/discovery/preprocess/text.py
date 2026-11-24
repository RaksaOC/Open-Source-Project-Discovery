"""Text normalisation shared by indexing and query processing (Phase 6.1).

Every method tokenizes documents AND queries with this one function, so "Node.js" in a query and
"node.js" in a README end up as the same term for Boolean, TF-IDF, BM25 and the hybrid alike.

    from discovery.preprocess.text import tokenize, doc_text
    tokenize("A simple Inventory-Management system built with Node.js and C#")
    # ['simple', 'inventory', 'management', 'system', 'built', 'node.js', 'c#']

Steps, in order:
  1. split camelCase and PascalCase ("InventoryManager" -> "Inventory Manager") unless the word is a
     technology name ("TypeScript", "NestJS", "PostgreSQL" stay whole), then lowercase;
  2. find tokens: letters/digits, keeping '.', '+' and '#' inside a token ("node.js", "c++", "c#");
  3. a token with a dot that is not a known technology ("e.g", "v1.2") is split at the dots;
  4. drop stop words (NLTK English + README boilerplate from the EDA, config.yaml), pure numbers and
     one-letter tokens;
  5. lemmatize the rest with WordNet ("systems" -> "system"). Technology names are never changed.
"""

from __future__ import annotations

import re
from functools import lru_cache

import pandas as pd

from discovery.config import BACKEND, load_config

_CAMEL = re.compile(r"(?<=[a-z0-9])(?=[A-Z][a-z])")
_WORD = re.compile(r"[A-Za-z0-9]+")
_TOKEN = re.compile(r"[a-z0-9][a-z0-9+#]*(?:\.[a-z0-9][a-z0-9+#]*)*")
NS = "not specified"


@lru_cache
def keep_terms() -> frozenset[str]:
    """Every single-word alias in config/technologies.yaml: kept whole, never stemmed or dropped."""
    import yaml

    pre = load_config().get("preprocessing", {})
    with open(BACKEND / "config" / pre.get("keep_terms", "technologies.yaml"), encoding="utf-8") as f:
        tech = yaml.safe_load(f)
    terms = {a.lower() for aliases in tech.values() for a in aliases} | {c.lower() for c in tech}
    return frozenset(t for t in terms if " " not in t)


@lru_cache
def stop_words() -> frozenset[str]:
    from nltk.corpus import stopwords

    extra = load_config().get("preprocessing", {}).get("extra_stopwords", [])
    return frozenset(stopwords.words("english")) | {w.lower() for w in extra}


@lru_cache(maxsize=200_000)
def _lemma(word: str) -> str:
    return _lemmatizer().lemmatize(word)


@lru_cache
def _lemmatizer():
    from nltk.stem import WordNetLemmatizer

    return WordNetLemmatizer()


def tokenize(text: str, keep: frozenset[str] | set[str] | None = None) -> list[str]:
    """Lowercase, tokenize, remove stop words, lemmatize. Terms in `keep` (technology names such as
    'node.js', 'c#') are kept whole and never lemmatized. Order and repeats are kept (TF needs them)."""
    if not text:
        return []
    keep = keep_terms() if keep is None else keep
    stop = stop_words()
    out: list[str] = []
    def split_camel(m: re.Match) -> str:
        w = m.group(0)
        return w if w.lower() in keep else _CAMEL.sub(" ", w)

    for tok in _TOKEN.findall(_WORD.sub(split_camel, text).lower()):
        if tok in keep:
            out.append(tok)
            continue
        parts = tok.split(".") if "." in tok else (tok,)
        for p in parts:
            p = p.strip("+#") if p not in keep else p
            if p in keep:
                out.append(p)
            elif len(p) > 1 and not p.isdigit() and p not in stop:
                out.append(_lemma(p))
    return out


def doc_text(corpus: pd.DataFrame) -> pd.Series:
    """The searchable text of each repository: name, description, topics and README, in one string.
    "not specified" descriptions are left out. Methods that weight fields differently build their own
    mix from the same columns."""
    desc = corpus["description"].where(corpus["description"] != NS, "")
    topics = corpus["topics"].map(lambda t: " ".join(x.replace("-", " ") for x in t))
    return corpus["name"] + " " + desc + " " + topics + " " + corpus["readme"]
