"""Positional inverted index over name, description, topics and README (fielded)."""


class InvertedIndex:
    def build(self, docs) -> None:
        raise NotImplementedError

    def postings(self, term: str) -> list[int]:
        raise NotImplementedError

    def save(self, path: str) -> None:
        raise NotImplementedError

    @classmethod
    def load(cls, path: str) -> "InvertedIndex":
        raise NotImplementedError
