"""Shared data shapes. These fix the corpus schema; the logic lives in the other modules."""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class Repository:
    """One document in the corpus: a public GitHub repository."""

    full_name: str                      # "owner/name", the document id
    url: str
    name: str
    description: str = ""
    readme: str = ""                    # cleaned README text
    topics: list[str] = field(default_factory=list)
    languages: dict[str, int] = field(default_factory=dict)   # language -> bytes
    technologies: list[str] = field(default_factory=list)     # canonical names, see config/technologies.yaml
    complexity: str = "not specified"   # beginner | intermediate | advanced | not specified
    stars: int = 0
    forks: int = 0
    open_issues: int = 0
    license: str = "not specified"
    created_at: str = ""
    pushed_at: str = ""                 # last activity
    contributors: list[str] = field(default_factory=list)


@dataclass
class ParsedQuery:
    """A natural-language query split into what the user wants."""

    raw: str
    functionality: str = ""             # e.g. "inventory management system"
    technologies: list[str] = field(default_factory=list)   # e.g. ["nestjs", "postgresql"]
    complexity: str | None = None       # e.g. "beginner"


@dataclass
class SearchResult:
    repo: Repository
    score: float
    relevance: float = 0.0
    popularity: float = 0.0
    matched: dict[str, list[str]] = field(default_factory=dict)   # why it matched, for the UI
