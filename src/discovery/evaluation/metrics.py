"""IR metrics, written by us and cross-checked with ir-measures.
qrels: {query_id: {doc_id: grade}} with grades 0, 1, 2. A doc counts as relevant if grade >= 1."""


def precision_at_k(ranked: list[str], qrels: dict[str, int], k: int) -> float:
    raise NotImplementedError


def recall_at_k(ranked: list[str], qrels: dict[str, int], k: int) -> float:
    raise NotImplementedError


def f1_at_k(ranked: list[str], qrels: dict[str, int], k: int) -> float:
    raise NotImplementedError


def average_precision(ranked: list[str], qrels: dict[str, int]) -> float:
    raise NotImplementedError


def ndcg_at_k(ranked: list[str], qrels: dict[str, int], k: int) -> float:
    """Graded relevance (0/1/2)."""
    raise NotImplementedError
