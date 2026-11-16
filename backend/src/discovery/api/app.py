"""FastAPI app. Thin: every route delegates to discovery.search.SearchEngine.

Stubs anywhere in the pipeline raise NotImplementedError; the handler turns that into
HTTP 501 so the frontend can show "not built yet" instead of crashing.
"""

from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path

from fastapi import FastAPI, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from discovery.api.schemas import Health, Method, Methods, SearchResponse
from discovery.search import METHODS, SearchEngine

INDEX_DIR = os.environ.get("DISCOVERY_INDEX_DIR", "data/index")
CORS_ORIGINS = os.environ.get("DISCOVERY_CORS_ORIGINS", "http://localhost:3300").split(",")


@lru_cache
def get_engine() -> SearchEngine:
    """Loaded once per process, on the first search."""
    return SearchEngine(index_dir=INDEX_DIR).load()


def create_app() -> FastAPI:
    app = FastAPI(
        title="Open Source Project Discovery Engine",
        version="0.1.0",
        description="Find GitHub repositories by what you want to build.",
    )
    app.add_middleware(CORSMiddleware, allow_origins=CORS_ORIGINS, allow_methods=["GET"], allow_headers=["*"])

    @app.exception_handler(NotImplementedError)
    async def not_implemented(_: Request, exc: NotImplementedError) -> JSONResponse:
        return JSONResponse(status_code=501, content={"detail": "Not implemented yet", "todo": str(exc) or None})

    @app.get("/api/health", response_model=Health, tags=["health"])
    def health() -> Health:
        index = Path(INDEX_DIR)
        ready = index.is_dir() and any(p.name != ".gitkeep" for p in index.iterdir())
        return Health(status="ok", index_ready=ready)

    @app.get("/api/methods", response_model=Methods, tags=["search"])
    def methods() -> Methods:
        return Methods(methods=list(METHODS), default="bm25")

    @app.get("/api/search", response_model=SearchResponse, tags=["search"])
    def search(
        q: str = Query(min_length=1, description="What you want to build, in your own words"),
        method: Method = "bm25",
        k: int = Query(10, ge=1, le=50),
        popularity: bool = True,
    ) -> SearchResponse:
        """TODO(Ory): map SearchEngine.search() results (models.SearchResult) to ResultOut."""
        get_engine().search(q, method=method, k=k, use_popularity=popularity)
        raise NotImplementedError("discovery.api.app.search: map results to ResultOut")

    return app


app = create_app()
