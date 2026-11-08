"""Popularity score from stars, forks and graph centrality, and the final re-ranking."""


def popularity_score(stars: int, forks: int, pagerank: float, weights: dict) -> float:
    """Log-scaled, normalised to 0..1 so one huge repo does not dominate."""
    raise NotImplementedError


def rerank(results, popularity: dict, relevance_weight: float = 0.8):
    """final = relevance_weight * relevance + (1 - relevance_weight) * popularity"""
    raise NotImplementedError
