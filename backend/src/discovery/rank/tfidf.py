"""TF-IDF vectors + cosine similarity."""


class TfidfRanker:
    def fit(self, docs) -> None:
        raise NotImplementedError

    def search(self, query: str, k: int = 10) -> list[tuple[int, float]]:
        raise NotImplementedError
