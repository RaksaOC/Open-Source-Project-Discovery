# Evaluation

- `queries.json`: 25 realistic queries (10 drafted, 15 to write). Mix functionality, technology and complexity, and include a few vague and a few very specific ones.
- `qrels.csv`: relevance labels, one row per (query, repository, labeller).
- `pool.csv` (generated): the top 10 of every method, merged, which is what we label.

## Labelling guide

| Grade | Meaning |
|---|---|
| 2 | Relevant: does what the query asks, with the requested technologies, at roughly the requested level |
| 1 | Partly relevant: right kind of project but a different stack or level, or only part of the features |
| 0 | Not relevant |

Two members label every pooled result without seeing the method or score. Disagreements are settled by discussion, and the agreement rate is reported.

## Metrics

P@5, P@10, R@10 (against the pool), F1@10, MAP, NDCG@10, for Boolean, TF-IDF, BM25, Embedding and Hybrid, with and without popularity re-ranking.
