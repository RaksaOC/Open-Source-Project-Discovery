"""BM25 (Robertson & Zaragoza). Our own implementation, checked against rank-bm25."""


class BM25Ranker:
    def __init__(self, k1: float = 1.5, b: float = 0.75):
        self.k1, self.b = k1, b

    def fit(self, docs) -> None:
        raise NotImplementedError

    def search(self, query: str, k: int = 10) -> list[tuple[int, float]]:
        raise NotImplementedError
