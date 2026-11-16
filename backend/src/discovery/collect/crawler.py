"""Build the corpus: slice the search space into many small queries (domain x framework,
then by star range) so each stays under the 1,000-result cap, and de-duplicate by full_name."""

from __future__ import annotations


def build_queries(config: dict) -> list[str]:
    """Turn config.collection.domains x frameworks into GitHub search query strings."""
    raise NotImplementedError


def collect(config: dict, out_dir: str) -> None:
    """Run all queries, fetch README + languages + contributors, write JSON lines to data/raw."""
    raise NotImplementedError
