"""Thin wrapper around the GitHub REST API.

Limits to respect (docs.github.com, REST API rate limits):
- core endpoints: 5,000 requests/hour with a token, 60 without
- search endpoints: 30 requests/minute with a token, 10 without
- one search query returns at most 1,000 results
"""

from __future__ import annotations

API = "https://api.github.com"


class GitHubClient:
    def __init__(self, token: str | None = None, user_agent: str = "open-source-ir/0.1"):
        self.token = token
        self.user_agent = user_agent

    def search_repositories(self, query: str, sort: str = "stars", per_page: int = 100, max_results: int = 1000):
        """GET /search/repositories. Yields raw repository JSON objects, page by page."""
        raise NotImplementedError

    def get_readme(self, full_name: str) -> str:
        """GET /repos/{owner}/{repo}/readme. Returns the decoded README text ('' if none)."""
        raise NotImplementedError

    def get_languages(self, full_name: str) -> dict[str, int]:
        """GET /repos/{owner}/{repo}/languages."""
        raise NotImplementedError

    def get_contributors(self, full_name: str, limit: int = 30) -> list[str]:
        """GET /repos/{owner}/{repo}/contributors. Used for the repository graph."""
        raise NotImplementedError

    def rate_limit(self) -> dict:
        """GET /rate_limit. Check remaining quota before long runs."""
        raise NotImplementedError
