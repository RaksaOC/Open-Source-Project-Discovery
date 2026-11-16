# Open Source Project Discovery Engine

Find GitHub repositories by **what you want to build**, the **technologies** you need and the **level** you're at, instead of guessing repository names.

> "Find a beginner-friendly inventory management system using NestJS and PostgreSQL."

GitHub's repository search returns **0 results** for that sentence. This project aims to return a ranked list of matching repositories, with the reason each one matched.

Group 6 project for *Information Web Retrieval Analytics* (lecturer: Mr. Natt KORAT).

**Status:** project skeleton. Modules are placeholders (`NotImplementedError`) with the planned interfaces.

## Planned features

- **Corpus:** public GitHub repository metadata and README files, about 10,000 repositories (GitHub REST API).
- **Boolean search** over an inverted index (AND, OR, NOT).
- **Ranking:** TF-IDF + cosine, BM25, embedding-based semantic search, and BM25 + embedding hybrid.
- **Query understanding:** functionality, technologies and complexity are pulled out of a natural-language query.
- **Popularity re-ranking:** stars, forks and PageRank/HITS on a repository graph (shared contributors, topics, forks, README links), plus "related projects".
- **Evaluation:** 25 labelled queries; P, R, F1, MAP and NDCG for each method.
- **Interface:** Next.js search page over a FastAPI search API, with method switch and filters. An onboarding tour of the project is already in place.

## Repository layout

```
open-source-IR/
├── backend/                      Python: pipeline, search engine and API
│   ├── src/discovery/
│   │   ├── collect/              GitHub API client, corpus crawler
│   │   ├── preprocess/           README cleaning, tokenizing, technologies, complexity
│   │   ├── index/                inverted index, Boolean search
│   │   ├── rank/                 TF-IDF, BM25, embeddings, hybrid, popularity
│   │   ├── graph/                repository graph, PageRank, HITS
│   │   ├── query/                query parser
│   │   ├── evaluation/           metrics, evaluation runner
│   │   ├── api/                  FastAPI app (/api/search, /api/health) for the frontend
│   │   ├── models.py             Repository / ParsedQuery / SearchResult
│   │   ├── search.py             SearchEngine, the single entry point
│   │   └── cli.py                python -m discovery <command>
│   ├── config/
│   │   ├── config.yaml           paths, collection slices, ranking weights (TBD values)
│   │   └── technologies.yaml     technology names and aliases
│   ├── data/                     raw / processed / index (not committed, see data/README.md)
│   ├── eval/                     queries, relevance labels, labelling guide
│   ├── notebooks/                exploration only
│   ├── tests/
│   ├── requirements.txt, requirements-dev.txt, pyproject.toml
│   └── Dockerfile
├── frontend/                     Next.js: onboarding tour now, search page next
│   └── Dockerfile
├── docs/
│   ├── proposal.md               full project proposal (draft)
│   └── architecture.md           pipeline and module ownership
└── docker-compose.yml            backend + frontend, one command
```

## Run everything with Docker

```bash
docker compose up --build
```

- Frontend: http://localhost:3300
- API docs: http://localhost:8100/docs

`backend/data/` is mounted into the backend container, so indexes built by the pipeline are picked up.
Put the GitHub token in `backend/.env` (see `backend/.env.example`). Stop with `docker compose down`.

## Backend setup (local)

All Python commands run from `backend/`.

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
pip install -e .
cp .env.example .env        # then paste a GitHub token into GITHUB_TOKEN
pytest                      # smoke tests: every module imports, API answers
uvicorn discovery.api.app:app --reload --port 8100
```

Unbuilt parts raise `NotImplementedError`; the API returns that as **501** so the frontend can
show "not built yet".

## Frontend setup (local)

Needs Node 22+. Proxies `/api/*` to the backend (`API_URL`, default `http://127.0.0.1:8100`).

```bash
cd frontend
npm install
npm run dev                 # http://localhost:3300
```

Tour copy lives in `src/content/steps.ts`, one animated scene per step in `src/components/scenes/`.
The look (Deep Lab, from the study hub) is set internally in `src/theme/config.ts`, one CSS file
per look in `src/theme/`; there is no theme picker in the UI.

## Pipeline (planned commands, from `backend/`)

```bash
python -m discovery collect      # GitHub API -> data/raw
python -m discovery preprocess   # -> data/processed/corpus.parquet
python -m discovery index        # inverted index, TF-IDF, BM25, embeddings, graph
python -m discovery search "beginner inventory system nestjs postgres" --method hybrid
python -m discovery pool         # labelling pool for evaluation
python -m discovery evaluate     # metric table
```

## Team

| Member | Responsibility (draft) |
|---|---|
| Ory Chanraksa | Project lead, search interface |
| Rith Seyhak | Data collection, GitHub API terms and limits, repository graph |
| Chey Rotana | Preprocessing, technologies and complexity, inverted index, Boolean search |
| Man Arafat | TF-IDF, cosine similarity, BM25, popularity re-ranking |
| Keo Hengneitong | Embeddings, hybrid search, query understanding |
| Sao Visal | Queries, relevance labels, evaluation |

## Working together

- Branch per feature (`feat/bm25`, `feat/collector`), open a pull request into `main`, and get one review.
- Keep data out of git; share large files through the team drive.
- Do not commit `.env` or tokens.
