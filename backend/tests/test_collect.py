"""Phase 3 without the network: a fake GitHub answers, so these run offline in a second."""

import base64
import json

import pandas as pd
import pytest
import requests

from discovery.collect import crawler
from discovery.collect.github_client import GitHubClient


class FakeResponse:
    def __init__(self, status=200, body=None, headers=None):
        self.status_code, self._body = status, body if body is not None else {}
        self.headers = {"X-RateLimit-Remaining": "4999", **(headers or {})}
        self.text = json.dumps(self._body)

    def json(self):
        return self._body

    def raise_for_status(self):
        if self.status_code >= 400:
            raise requests.HTTPError(f"{self.status_code}", response=self)


class FakeSession:
    """Answers GET requests from a dict of path -> list of responses (used in order)."""

    def __init__(self, routes):
        self.routes, self.headers, self.calls = routes, {}, []

    def get(self, url, params=None, timeout=None):
        path = url.replace("https://api.github.com", "")
        key = path
        if path == "/search/repositories":
            key = f"{path}?q={params['q']}&page={params.get('page', 1)}"
        self.calls.append(key)
        answers = self.routes[key]
        return answers.pop(0) if len(answers) > 1 else answers[0]


def client(routes):
    return GitHubClient("t0ken", session=FakeSession(routes), search_gap=0, core_gap=0, sleep=lambda s: None, log=lambda m: None)


def item(name, stars=10):
    return {"full_name": name, "name": name.split("/")[1], "stargazers_count": stars, "forks_count": 1,
            "description": f"{name} app", "topics": [], "fork": False, "archived": False}


def test_token_and_user_agent_on_every_request():
    c = client({"/rate_limit": [FakeResponse(body={"resources": {k: {"limit": 1, "remaining": 1, "reset": 0} for k in ("core", "search")}})]})
    assert c.session.headers["Authorization"] == "Bearer t0ken"
    assert c.session.headers["User-Agent"]


def test_readme_is_base64_decoded_and_missing_readme_is_empty():
    text = "# Stock tracker\nBuilt with NestJS."
    c = client({"/repos/a/x/readme": [FakeResponse(body={"encoding": "base64", "content": base64.b64encode(text.encode()).decode()})],
                "/repos/a/none/readme": [FakeResponse(404, {"message": "Not Found"})]})
    assert c.get_readme("a/x") == text
    assert c.get_readme("a/none") == ""


def test_rate_limit_waits_until_reset_then_retries():
    waits = []
    s = FakeSession({"/repos/a/x/languages": [
        FakeResponse(403, {"message": "API rate limit exceeded"}, {"X-RateLimit-Remaining": "0", "X-RateLimit-Reset": "0"}),
        FakeResponse(200, {"Python": 100})]})
    c = GitHubClient("t", session=s, search_gap=0, core_gap=0, sleep=waits.append, log=lambda m: None)
    assert c.get_languages("a/x") == {"Python": 100}
    assert len(s.calls) == 2 and waits and waits[-1] >= 1


def test_secondary_rate_limit_uses_retry_after():
    waits = []
    s = FakeSession({"/repos/a/x/languages": [FakeResponse(403, {"message": "You have exceeded a secondary rate limit"}, {"Retry-After": "7"}),
                                              FakeResponse(200, {"Go": 5})]})
    c = GitHubClient("t", session=s, search_gap=0, core_gap=0, sleep=waits.append, log=lambda m: None)
    assert c.get_languages("a/x") == {"Go": 5}
    assert 8 in waits


def test_search_pages_until_a_short_page():
    q = "blog django"
    c = client({f"/search/repositories?q={q}&page=1": [FakeResponse(body={"items": [item(f"o/r{i}") for i in range(100)]})],
                f"/search/repositories?q={q}&page=2": [FakeResponse(body={"items": [item("o/last")]})]})
    names = [r["full_name"] for r in c.search_repositories(q)]
    assert len(names) == 101 and names[-1] == "o/last"


def test_contributors_keep_type_and_respect_limit():
    body = [{"login": "dev", "type": "User", "contributions": 9}, {"login": "dependabot[bot]", "type": "Bot", "contributions": 3}]
    c = client({"/repos/a/x/contributors": [FakeResponse(body=body)], "/repos/a/empty/contributors": [FakeResponse(204, None)]})
    assert c.get_contributors("a/x", limit=1) == [{"login": "dev", "type": "User", "contributions": 9}]
    assert c.get_contributors("a/empty") == []


@pytest.fixture
def plan_csv(tmp_path):
    rows = [  # two slices that overlap on o/shared, plus one "other" piece
        {"piece_id": "p000", "domain": "blog", "framework": "django", "stars_lo": 5, "stars_hi": "", "created": "", "count": 3, "take": 2, "query": "blog django"},
        {"piece_id": "p001", "domain": "blog", "framework": "flask", "stars_lo": 5, "stars_hi": "", "created": "", "count": 2, "take": 2, "query": "blog flask"},
        {"piece_id": "p002", "domain": "other", "framework": "", "stars_lo": 5, "stars_hi": "", "created": "", "count": 1, "take": 1, "query": "game"},
    ]
    p = tmp_path / "slices.csv"
    pd.DataFrame(rows).to_csv(p, index=False)
    return p


def routes_for_plan():
    r = {
        "/search/repositories?q=blog django&page=1": [FakeResponse(body={"items": [item("o/a"), item("o/b"), item("o/shared")]})],
        "/search/repositories?q=blog flask&page=1": [FakeResponse(body={"items": [item("o/shared"), item("o/c")]})],
        "/search/repositories?q=game&page=1": [FakeResponse(body={"items": [item("o/game")]})],
    }
    for n in ("a", "b", "shared", "c", "game"):
        r[f"/repos/o/{n}/readme"] = [FakeResponse(404)] if n == "c" else [FakeResponse(body={"encoding": "base64", "content": base64.b64encode(b"# hi").decode()})]
        r[f"/repos/o/{n}/languages"] = [FakeResponse(body={"Python": 1})]
        r[f"/repos/o/{n}/contributors"] = [FakeResponse(body=[{"login": "dev", "type": "User", "contributions": 1}])]
    return r


def test_collect_lists_dedupes_samples_and_fetches(tmp_path, plan_csv):
    out = tmp_path / "raw"
    crawler.collect({}, out, client=client(routes_for_plan()), plan_path=plan_csv, seed=42, log=lambda m: None)
    names = [r["full_name"] for r in crawler.iter_jsonl(out / "repos.jsonl")]
    sel = pd.read_csv(out / "selected.csv")
    assert len(names) == len(set(names)) == len(sel)                       # wc -l == unique full_names
    shared = sel.set_index("full_name").loc["o/shared"]
    assert set(shared["found_by"].split(";")) == {"p000", "p001"}         # found_by records both slices
    assert (out / "seen.txt").read_text().split() == sorted(names) or set((out / "seen.txt").read_text().split()) == set(names)
    rec = {r["full_name"]: r for r in crawler.iter_jsonl(out / "repos.jsonl")}
    if "o/c" in rec:
        assert rec["o/c"]["readme"] == ""                                  # no README: stored, not skipped


def test_sample_is_the_same_every_run(tmp_path, plan_csv):
    out = tmp_path / "raw"
    crawler.collect({}, out, client=client(routes_for_plan()), plan_path=plan_csv, steps=("list",), log=lambda m: None)
    plan = crawler.load_plan(plan_csv)
    a = crawler.sample(plan, out, seed=42)["full_name"].tolist()
    b = crawler.sample(plan, out, seed=42)["full_name"].tolist()
    assert a == b


def test_restart_continues_instead_of_starting_again(tmp_path, plan_csv):
    out = tmp_path / "raw"
    c = client(routes_for_plan())
    crawler.collect({}, out, client=c, plan_path=plan_csv, steps=("list", "sample"), log=lambda m: None)
    crawler.collect({}, out, client=c, plan_path=plan_csv, steps=("fetch",), limit=2, log=lambda m: None)   # "stopped halfway"
    with open(out / "repos.jsonl", "a") as f:
        f.write('{"full_name": "o/half-writ')                             # crash in the middle of a line
    calls_before = len(c.session.calls)
    crawler.collect({}, out, client=c, plan_path=plan_csv, steps=("list", "fetch"), log=lambda m: None)
    names = [r["full_name"] for r in crawler.iter_jsonl(out / "repos.jsonl")]
    assert len(names) == len(set(names)) == len(pd.read_csv(out / "selected.csv"))
    new = c.session.calls[calls_before:]
    assert not any(k.startswith("/search") for k in new)                  # listing was not redone
    assert len(new) == 3 * (len(names) - 2)                               # only the missing repositories fetched
