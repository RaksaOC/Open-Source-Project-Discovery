# Data

Nothing in here is committed (see `.gitignore`). Run the pipeline to rebuild it.

**Teammates:** don't rebuild it. Unzip the shared zips here (`ir_data_processed_<date>.zip` → `processed/`,
`ir_data_raw_<date>.zip` → `raw/`); see `docs/handoff-methods.md`. The zips themselves are git-ignored too.

| Folder | Made by | Contents |
|---|---|---|
| `raw/` | `python -m discovery collect` | GitHub API responses, one JSON object per repository (`repos.jsonl`) |
| `processed/` | `python -m discovery preprocess` | `corpus.parquet`: one row per repository, fields as in `src/discovery/models.py` |
| `index/` | `python -m discovery index` | inverted index, TF-IDF matrix, BM25 stats, FAISS embeddings, repository graph |

## Source and terms

- Public repository metadata and READMEs from the GitHub REST API, used under GitHub's terms of service with an authenticated token and within the rate limits.
- README text keeps its owner's copyright and licence. We index it for search and show short snippets with a link back to the repository. We do not republish it.
