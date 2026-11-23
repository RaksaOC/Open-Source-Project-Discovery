"""Thin, polite wrapper around the GitHub REST API.

Limits to respect (docs.github.com, REST API rate limits), checked in notebooks/01-api.ipynb:
- core endpoints: 5,000 requests/hour with a token, 60 without
- search endpoints: 30 requests/minute with a token, 10 without
- one search query returns at most 1,000 results, at most 100 per page

Every request carries the token and a User-Agent, is paced (one search every ~2 s, one core call
every ~0.75 s) and is retried by tenacity: on a rate limit it waits until X-RateLimit-Reset (or
Retry-After), on 5xx and network errors it backs off and tries again.
"""

from __future__ import annotations

import base64
import time
from collections.abc import Callable, Iterator

import requests
from tenacity import RetryCallState, Retrying, retry_if_exception_type, stop_after_attempt

API = "https://api.github.com"


class RateLimited(Exception):
    """GitHub said 'slow down'. `wait` is how long to sleep before trying again (seconds)."""

    def __init__(self, wait: float, message: str = ""):
        super().__init__(f"rate limited, waiting {wait:.0f} s: {message}")
        self.wait = wait


class TransientError(Exception):
    """A 5xx answer: GitHub's side, worth retrying."""


def _wait(state: RetryCallState) -> float:
    exc = state.outcome.exception() if state.outcome else None
    if isinstance(exc, RateLimited):
        return exc.wait
    return min(60.0, 2.0 ** state.attempt_number)        # 2, 4, 8, … s for 5xx / network errors


class GitHubClient:
    def __init__(self, token: str | None = None, user_agent: str = "open-source-ir/0.1",
                 search_gap: float = 2.1, core_gap: float = 0.75, max_attempts: int = 8,
                 session: requests.Session | None = None,
                 sleep: Callable[[float], None] = time.sleep, log: Callable[[str], None] = print):
        self.token = token
        self.user_agent = user_agent
        self.session = session or requests.Session()
        self.session.headers.update({"Accept": "application/vnd.github+json",
                                     "X-GitHub-Api-Version": "2022-11-28",
                                     "User-Agent": user_agent})
        if token:
            self.session.headers["Authorization"] = f"Bearer {token}"
        self.gaps = {"search": search_gap, "core": core_gap}
        self._last = {"search": 0.0, "core": 0.0}
        self.sleep, self.log = sleep, log
        self.remaining: dict[str, int | None] = {"search": None, "core": None}
        self.calls = {"search": 0, "core": 0}
        self._retrying = Retrying(
            retry=retry_if_exception_type((RateLimited, TransientError, requests.ConnectionError, requests.Timeout)),
            wait=_wait, stop=stop_after_attempt(max_attempts), sleep=sleep, reraise=True,
            before_sleep=lambda s: self.log(f"  retry {s.attempt_number}: {s.outcome.exception()}"),
        )

    # ---------- low level ----------
    def _pace(self, kind: str) -> None:
        wait = self.gaps[kind] - (time.monotonic() - self._last[kind])
        if wait > 0:
            self.sleep(wait)
        self._last[kind] = time.monotonic()

    def _once(self, path: str, params: dict | None, kind: str) -> requests.Response:
        self._pace(kind)
        r = self.session.get(f"{API}{path}", params=params, timeout=30)
        self.calls[kind] += 1
        if "X-RateLimit-Remaining" in r.headers:
            self.remaining[kind] = int(r.headers["X-RateLimit-Remaining"])
        if r.status_code in (403, 429):
            message = _message(r)
            if r.headers.get("Retry-After"):                                   # secondary rate limit
                raise RateLimited(float(r.headers["Retry-After"]) + 1, message)
            if r.headers.get("X-RateLimit-Remaining") == "0":                   # primary limit used up
                reset = int(r.headers.get("X-RateLimit-Reset", time.time() + 60))
                raise RateLimited(max(1.0, reset - time.time() + 2), message)
            if "secondary rate limit" in message.lower() or r.status_code == 429:
                raise RateLimited(60.0, message)
        if r.status_code >= 500:
            raise TransientError(f"{r.status_code} on {path}")
        return r

    def get(self, path: str, params: dict | None = None, kind: str = "core") -> requests.Response:
        """One GET with pacing and retries. 4xx answers other than rate limits are returned as they are."""
        return self._retrying(self._once, path, params, kind)

    # ---------- search ----------
    def search_count(self, query: str) -> int:
        """total_count for a query (one search request, one result)."""
        r = self.get("/search/repositories", {"q": query, "per_page": 1}, "search")
        r.raise_for_status()
        return r.json()["total_count"]

    def search_repositories(self, query: str, sort: str | None = None, per_page: int = 100,
                            max_results: int = 1000) -> Iterator[dict]:
        """GET /search/repositories. Yields raw repository JSON objects, page by page (≤ 10 pages)."""
        per_page = min(per_page, 100)
        params = {"q": query, "per_page": per_page}
        if sort:
            params["sort"] = sort
        got = 0
        for page in range(1, max_results // per_page + 1):
            r = self.get("/search/repositories", {**params, "page": page}, "search")
            if r.status_code == 422:                     # past the 1,000th result
                return
            r.raise_for_status()
            items = r.json()["items"]
            yield from items
            got += len(items)
            if len(items) < per_page or got >= max_results:
                return

    # ---------- one repository ----------
    def get_readme(self, full_name: str) -> str:
        """GET /repos/{owner}/{repo}/readme. Returns the decoded README text ('' if none)."""
        r = self.get(f"/repos/{full_name}/readme")
        if r.status_code == 404:
            return ""
        r.raise_for_status()
        body = r.json()
        content = body.get("content") or ""
        if body.get("encoding") == "base64":
            return base64.b64decode(content).decode("utf-8", errors="replace")
        return content

    def get_languages(self, full_name: str) -> dict[str, int]:
        """GET /repos/{owner}/{repo}/languages: bytes of code per language."""
        r = self.get(f"/repos/{full_name}/languages")
        if r.status_code == 404:
            return {}
        r.raise_for_status()
        return r.json()

    def get_contributors(self, full_name: str, limit: int = 30) -> list[dict]:
        """GET /repos/{owner}/{repo}/contributors: the top `limit` as {login, type, contributions}.
        Bots are kept here (raw data); cleaning drops them."""
        r = self.get(f"/repos/{full_name}/contributors", {"per_page": min(limit, 100)})
        if r.status_code in (204, 404):                  # empty repository / gone
            return []
        if r.status_code == 403 and "too large" in _message(r).lower():
            return []                                    # huge histories: GitHub won't list them
        r.raise_for_status()
        return [{"login": c.get("login") or c.get("name") or "", "type": c.get("type", "Anonymous"),
                 "contributions": c.get("contributions", 0)} for c in r.json()[:limit]]

    def rate_limit(self) -> dict:
        """GET /rate_limit (free). Check remaining quota before long runs."""
        r = self.session.get(f"{API}/rate_limit", timeout=30)
        r.raise_for_status()
        res = r.json()["resources"]
        return {k: {"limit": res[k]["limit"], "remaining": res[k]["remaining"], "reset": res[k]["reset"]}
                for k in ("core", "search")}


def _message(r: requests.Response) -> str:
    try:
        return str(r.json().get("message", ""))
    except ValueError:
        return r.text[:200]
