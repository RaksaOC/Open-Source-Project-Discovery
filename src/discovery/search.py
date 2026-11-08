"""SearchEngine: the one entry point used by the CLI and the UI.

query -> parse -> filter by technologies/complexity -> rank (chosen method)
      -> re-rank by popularity -> SearchResult list with 'why it matched'
"""

from __future__ import annotations

METHODS = ("boolean", "tfidf", "bm25", "embedding", "hybrid")


class SearchEngine:
    def __init__(self, index_dir: str = "data/index"):
        self.index_dir = index_dir

    def load(self) -> SearchEngine:
        raise NotImplementedError

    def search(self, query: str, method: str = "bm25", k: int = 10, use_popularity: bool = True):
        raise NotImplementedError
