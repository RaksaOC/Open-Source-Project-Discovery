"""Hybrid search: combine BM25 and embedding scores (weighted sum or reciprocal rank fusion)."""


def hybrid_search(query: str, bm25, embedder, alpha: float = 0.5, k: int = 10) -> list[tuple[int, float]]:
    raise NotImplementedError
