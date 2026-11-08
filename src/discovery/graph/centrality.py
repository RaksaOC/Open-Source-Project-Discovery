"""PageRank and HITS on the repository graph."""


def pagerank(graph, alpha: float = 0.85) -> dict[str, float]:
    raise NotImplementedError


def hits(graph) -> tuple[dict[str, float], dict[str, float]]:
    """Returns (hubs, authorities)."""
    raise NotImplementedError


def related(graph, full_name: str, k: int = 5) -> list[str]:
    """Neighbouring repositories, for 'similar projects' in the UI."""
    raise NotImplementedError
