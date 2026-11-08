# Architecture

```
OFFLINE
GitHub REST API
  -> 1. collect      search slices, README, languages, contributors   -> data/raw
  -> 2. preprocess   clean README, tokens, technologies, complexity    -> data/processed
  -> 3. index        inverted index, TF-IDF, BM25, embeddings, graph   -> data/index

ONLINE
user query
  -> query parser    functionality | technologies | complexity
  -> filter          by technologies and level
  -> rank            Boolean | TF-IDF | BM25 | embedding | hybrid
  -> re-rank         + popularity (stars, forks, PageRank)
  -> results         with "why it matched" and related projects
```

## Module map

| Step | Module | Owner (draft) |
|---|---|---|
| Collect | `discovery/collect/github_client.py`, `crawler.py` | Rith |
| Preprocess | `discovery/preprocess/readme.py`, `text.py`, `technologies.py`, `complexity.py`, `pipeline.py` | Chey |
| Index and Boolean | `discovery/index/inverted_index.py`, `boolean.py` | Chey |
| Rank | `discovery/rank/tfidf.py`, `bm25.py` | Man |
| Semantic | `discovery/rank/embeddings.py`, `hybrid.py`, `discovery/query/parser.py` | Keo |
| Popularity and graph | `discovery/rank/popularity.py`, `discovery/graph/` | Rith, Man |
| Facade | `discovery/search.py` (`SearchEngine.search`) | Ory |
| Interface | `app/streamlit_app.py` | Ory |
| Evaluation | `discovery/evaluation/`, `eval/` | Sao |

## Interfaces to agree on early

- Every ranker: `fit(docs)` and `search(query, k) -> list[(doc_id, score)]`, so the evaluation runner and the UI can swap them.
- Document schema: `discovery.models.Repository`. `doc_id` is the row number in `corpus.parquet`, and `full_name` is the stable id used in `qrels.csv`.
- Scores are normalised to 0..1 before hybrid fusion and popularity re-ranking.
