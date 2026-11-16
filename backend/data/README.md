# Data

Nothing in here is committed (see `.gitignore`). Run the pipeline to rebuild it.

| Folder | Made by | Contents |
|---|---|---|
| `raw/` | `python -m discovery collect` | GitHub API responses, one JSON object per repository (`repos.jsonl`) |
| `processed/` | `python -m discovery preprocess` | `corpus.parquet`: one row per repository, fields as in `src/discovery/models.py` |
| `index/` | `python -m discovery index` | inverted index, TF-IDF matrix, BM25 stats, FAISS embeddings, repository graph |

## Source and terms

- Public repository metadata and READMEs from the GitHub REST API, used under GitHub's terms of service with an authenticated token and within the rate limits.
- README text keeps its owner's copyright and licence. We index it for search and show short snippets with a link back to the repository. We do not republish it.
