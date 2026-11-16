"""Run every method on every query, build the labelling pool, compute the metric table."""


def build_pool(engine, queries, depth: int = 10) -> None:
    """Union of the top-`depth` results of each method -> eval/pool.csv for labelling."""
    raise NotImplementedError


def evaluate(engine, queries, qrels, cutoffs=(5, 10)) -> None:
    """Writes eval/results.csv: one row per method, columns P@k, R@k, F1@k, MAP, NDCG@k."""
    raise NotImplementedError
