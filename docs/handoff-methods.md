# Handoff: one retrieval method each (Phases 7–10)

Phases 0–6 were done together: the corpus is collected (8,657 repositories), cleaned (8,223), explored (EDA), and the shared tokenizer is written. From here, each member builds **one retrieval method** on their own branch. Member 6 builds the integration (query understanding, popularity, labels, evaluation, app) on `main`.

Full guide with starter code for every step, and the Results sheet: [team plan](https://claude.ai/artifact/Rst8GHxAbeHavg4JS2RZV3) (Methods tabs).

## Who does what

| Member | Phase | Method | Branch | Notebook | Your code | Class |
|---|---|---|---|---|---|---|
| 1 | 7 | Boolean | `dev-boolean` | `07-boolean.ipynb` | `src/discovery/index/boolean.py` (+ `index/inverted_index.py`) | `BooleanSearch` |
| 2 | 8 | TF-IDF + cosine | `dev-tfidf` | `08-tfidf.ipynb` | `src/discovery/rank/tfidf.py` | `TfidfRanker` |
| 3 | 9 | BM25 | `dev-bm25` | `09-bm25.ipynb` | `src/discovery/rank/bm25.py` | `BM25Ranker` |
| 4 | 10.1 | Semantic (MiniLM + FAISS) | `dev-semantic` | `10-1-semantic.ipynb` | `src/discovery/rank/embeddings.py` | `EmbeddingRanker` |
| 5 | 10.2 | Hybrid (weighted + RRF) | `dev-hybrid` | `10-2-hybrid.ipynb` | `src/discovery/rank/hybrid.py` | `HybridRanker` |
| 6 | 11–16 | Integration | `main` | `11-…` onwards | `query/`, `rank/popularity.py`, `graph/`, `evaluation/`, `search.py`, `api/` | `SearchEngine` |

The hybrid depends on BM25 and semantic: Members 3, 4 and 5 agree early on `scores(query)` (one score per repository, corpus order). Until those land on `main`, Member 5 uses stand-ins (`rank_bm25.BM25Okapi` and a plain MiniLM).

## 1. Get the code (once)

```bash
git clone https://github.com/RaksaOC/Open-Source-Project-Discovery.git
cd Open-Source-Project-Discovery
git checkout dev-<method>                # dev-boolean, dev-tfidf, dev-bm25, dev-semantic or dev-hybrid
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt && pip install -e .
python -m nltk.downloader stopwords wordnet omw-1.4
```

## 2. Get the data (not in git)

The data is too big for git (`backend/data/` is ignored), so it is shared as zips in the group chat / Drive:

| Zip | Size | Contents | Who needs it |
|---|---|---|---|
| `ir_data_processed_2026-11-24.zip` | 30 MB | `processed/corpus.parquet`, `processed/cleaning_log.csv` | **Everyone** |
| `ir_data_raw_2026-11-24.zip` | 96 MB | `raw/repos.jsonl` (API responses), `selected.csv`, `search_counts.json`, … | Only to re-run cleaning (`python -m discovery preprocess`) |

Put the zip in `backend/data/` and unzip it **there**: the zip already contains the `processed/` (or `raw/`) folder.

```bash
cd backend/data
unzip ir_data_processed_2026-11-24.zip      # -> backend/data/processed/corpus.parquet
cd ..
python -c "from discovery.rank.devkit import load_corpus; print(len(load_corpus()))"   # 8223
pytest                                     # everything passes; your method's tests are skipped for now
```

Never commit data or the zips. Never re-crawl GitHub: everyone must use the same 8,223 repositories.

## 3. Work on your branch

1. Open `backend/notebooks/<your notebook>` and follow steps 1–8. Each step ends with a **Check**.
2. Build it in the notebook first, then move it into your class (step 4). The stub already has the right signature.
3. `pytest tests/test_methods.py -k <method> -v` goes from *skipped* to *passed* when your class follows the contract. (Semantic and hybrid load a model: `IR_SLOW=1 pytest …`.)
4. Commit often, with the notebook **and its outputs**: `git add -A && git commit -m "9 BM25: grid over k1 and b" && git push`.
5. When Member 6 says `main` has changed (real queries, labels, someone's method merged), bring it in: `git pull origin main`.

## Rules (so the five results are comparable)

- **One tokenizer:** `from discovery.preprocess.text import tokenize`, for documents and queries.
- **One interface** (`src/discovery/rank/base.py`): `fit(corpus) -> self`, `search(query, k) -> [{"doc_id": full_name, "score": float}]`, best first, at most k, no repository twice. `check_hits()` checks it.
- **Shared files are read-only on your branch:** `rank/base.py`, `rank/devkit.py`, `preprocess/text.py`, `config/config.yaml`, `tests/test_methods.py`. Need a change? Ask Member 6, it goes on `main` for everyone.
- **Tune on the 5 development queries only.** The 20 test queries are used once, for the final number.
- **Seed 42**, paths from `PATHS`, no tokens in notebooks.

## What to hand in

- [ ] Your class in `src/discovery/…`, passing `tests/test_methods.py`
- [ ] Your notebook, all 8 steps done, committed with outputs
- [ ] `eval/results/<method>.json` (from `save_results`, metrics filled after Phase 14)
- [ ] The Results sheet PDF (team plan → Results sheet), in the group chat
- [ ] A pull request from your branch into `main`

## Shared helpers (`discovery.rank.devkit`)

| Name | What it does |
|---|---|
| `DEV` | the 5 development queries (placeholders until Phase 13) |
| `load_corpus()` | `corpus.parquet` as a DataFrame, `languages` as a dict |
| `show_top(method, corpus, DEV)` | prints the top 10 per query and checks the contract |
| `measure(lambda: Cls().fit(corpus), DEV)` | build time, median query time, size: the speed rows of the sheet |
| `save_results(method, speed)` | writes `eval/results/<name>.json` in the format the sheet imports |
| `doc_text(corpus)` (in `preprocess.text`) | name + description + topics + README, one string per repository |
