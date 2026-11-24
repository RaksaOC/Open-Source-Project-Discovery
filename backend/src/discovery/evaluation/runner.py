"""Run every method on every query, build the labelling pool, compute the metric table."""


def build_pool(engine, queries, depth: int = 10) -> None:
    """Union of the top-`depth` results of each method -> eval/pool.csv for labelling."""
    raise NotImplementedError


def evaluate(engine, queries, qrels, cutoffs=(5, 10)) -> None:
    """Writes eval/results.csv: one row per method, columns P@k, R@k, F1@k, MAP, NDCG@k."""
    raise NotImplementedError


def evaluate_method(method, split: str = "test", k: int = 10):
    """Phase 14 (Member 6): score one SearchMethod on the dev or test queries with eval/qrels.csv and
    write eval/results/<method.name>.json (metrics, groups, per-query rows), via rank.devkit.save_results.
    Members 1–5 call it at the end of their notebook once the labels exist."""
    raise NotImplementedError("Phase 14: needs the labelled queries from Phase 13")
