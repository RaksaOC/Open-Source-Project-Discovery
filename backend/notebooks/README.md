# Notebooks

Exploration only: looking at the API, checking the cleaning, plotting statistics and results.
Once a step works, move it into `src/discovery/` so `python -m discovery <command>` can re-run it in one go.

**Name:** `NN-topic.ipynb`, for example `01-api.ipynb`, `02-clean.ipynb`, `03-bm25.ipynb`.
Copy `00-template.ipynb` to start a new one.

## The notebooks

| Notebook | Phase | Status |
|---|---|---|
| `01-api` · `02-slices` · `03-collect` · `04-clean` · `05-eda` | 1–5 | done, together |
| `07-boolean` · `08-tfidf` · `09-bm25` · `10-1-semantic` · `10-2-hybrid` | 7–10 | one per member, on `dev-<method>` (see `docs/handoff-methods.md`) |
| `11-…` onwards | 11–16 | integration, on `main` |

## Where things go

| Where | What goes there |
|---|---|
| `backend/notebooks/` | Exploration notebooks (this folder) |
| `backend/src/discovery/` | Final, reusable code, one folder per step: `collect`, `preprocess`, `index`, `rank`, `graph`, `query`, `evaluation`, `api` |
| `backend/data/raw/` | API responses exactly as received. Never edit them |
| `backend/data/processed/` | `corpus.parquet` and anything derived from it |
| `backend/data/index/` | The inverted index, TF-IDF matrix, BM25 statistics, FAISS file and graph |
| `backend/eval/` | Queries, the pool, relevance labels, results |

## Rules

- **Seed 42 everywhere.** `from discovery.config import SEED, set_seed`, call `set_seed()` in the first cell and pass `random_state=SEED` to anything that samples.
- **Paths from `PATHS`**, not typed by hand: `PATHS["raw"]`, `PATHS["processed"]`, `PATHS["index"]`, `PATHS["eval"]`.
- **Never write into `data/raw/`** from a notebook except through the collector.
- **Commit notebooks with their outputs**, but no tokens: read `GITHUB_TOKEN` from `.env`, never paste it into a cell.
