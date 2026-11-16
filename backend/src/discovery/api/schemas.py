"""Response shapes. Mirrors frontend/src/lib/api/types.ts."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel

Method = Literal["boolean", "tfidf", "bm25", "embedding", "hybrid"]


class Health(BaseModel):
    status: Literal["ok"]
    index_ready: bool
    """True once `python -m discovery index` has written files to the index directory."""


class Methods(BaseModel):
    methods: list[Method]
    default: Method


class ParsedQueryOut(BaseModel):
    functionality: str
    technologies: list[str]
    complexity: str | None


class ResultOut(BaseModel):
    full_name: str
    url: str
    description: str
    technologies: list[str]
    complexity: str
    stars: int
    forks: int
    score: float
    relevance: float
    popularity: float
    matched: dict[str, list[str]]
    """Why it matched, e.g. {"terms": [...], "technologies": [...], "complexity": [...]}."""


class SearchResponse(BaseModel):
    query: str
    method: Method
    parsed: ParsedQueryOut | None = None
    results: list[ResultOut]
