"""Semantic search: sentence embeddings + FAISS. Finds repos that describe the same
functionality in different words ("stock tracker" for "inventory management")."""


class EmbeddingRanker:
    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        self.model_name = model_name

    def fit(self, docs) -> None:
        raise NotImplementedError

    def search(self, query: str, k: int = 10) -> list[tuple[int, float]]:
        raise NotImplementedError
