"""Build the raw corpus from the frozen slice plan (config/slices.csv, made in notebooks/02-slices).

Three steps, each resumable and each writing to data/raw/:

1. list    page through every search piece (search requests only, cheap) → listing.jsonl
           one line per (piece, repository), the search item exactly as GitHub returned it
2. sample  de-duplicate by full_name, then draw each slice's quota at random (seed 42) from the
           repositories that slice found → selected.csv
3. fetch   for each selected repository: README, languages, top contributors (3 core requests)
           → repos.jsonl, one JSON object per line, appended as we go; seen.txt lets a restart
           skip what is done; errors.jsonl keeps repositories that could not be fetched

The expensive part (fetch, ~3 core requests per repository) only runs for the repositories we keep.
"""

from __future__ import annotations

import json
import time
from collections import defaultdict
from collections.abc import Callable
from pathlib import Path

import pandas as pd
import requests

from discovery.collect.github_client import GitHubClient

LISTING, LISTED = "listing.jsonl", "listing_done.txt"
SELECTED = "selected.csv"
REPOS, SEEN, ERRORS = "repos.jsonl", "seen.txt", "errors.jsonl"
STATUS = "status.json"


def write_status(out_dir: Path, client: GitHubClient | None = None, **fields) -> None:
    """A small heartbeat (data/raw/status.json) for a progress monitor: what step, which piece or
    repository, how many requests are left. Written atomically, so a reader never sees half a file."""
    path = Path(out_dir) / STATUS
    try:
        old = json.loads(path.read_text()) if path.exists() else {}
    except json.JSONDecodeError:
        old = {}
    new = {**old, **fields, "updated_at": time.strftime("%Y-%m-%dT%H:%M:%S")}
    if client is not None:
        new["remaining"], new["calls"] = dict(client.remaining), dict(client.calls)
    tmp = path.with_suffix(".tmp")
    tmp.write_text(json.dumps(new, ensure_ascii=False))
    tmp.replace(path)


# ---------- the plan ----------
def load_plan(path: str | Path) -> pd.DataFrame:
    """The frozen search pieces, with a `slice` key: 'domain|framework', or 'other|<piece_id>'."""
    plan = pd.read_csv(path, dtype={"piece_id": str, "framework": str}, keep_default_na=False)
    plan["take"] = plan["take"].astype(int)
    plan["slice"] = [f"other|{p}" if d == "other" else f"{d}|{f}"
                     for d, f, p in zip(plan["domain"], plan["framework"], plan["piece_id"])]
    return plan


def build_queries(config: dict, plan_path: str | Path | None = None) -> list[str]:
    """The search query of every piece in the frozen plan (config/slices.csv)."""
    from discovery.config import BACKEND
    return load_plan(plan_path or BACKEND / "config" / "slices.csv")["query"].tolist()


# ---------- small file helpers ----------
def _read_lines(path: Path) -> set[str]:
    return set(path.read_text().split()) if path.exists() else set()


def repair_jsonl(path: Path) -> int:
    """Drop a half-written last line (left by a crash mid-write). Returns the number of good lines."""
    if not path.exists():
        return 0
    lines = path.read_text(encoding="utf-8").splitlines()
    good = []
    for line in lines:
        try:
            json.loads(line)
            good.append(line)
        except json.JSONDecodeError:
            pass
    if len(good) != len(lines):
        path.write_text("".join(g + "\n" for g in good), encoding="utf-8")
    return len(good)


def iter_jsonl(path: Path):
    with open(path, encoding="utf-8") as f:
        for line in f:
            if line.strip():
                yield json.loads(line)


# ---------- 1. list ----------
def list_candidates(client: GitHubClient, plan: pd.DataFrame, out_dir: Path,
                    progress: Callable = lambda it, **k: it) -> int:
    """Page through every piece; write each search item with its piece_id. Resumes by piece."""
    out_dir.mkdir(parents=True, exist_ok=True)
    listing, done_file = out_dir / LISTING, out_dir / LISTED
    repair_jsonl(listing)
    done = _read_lines(done_file)
    todo = plan[~plan["piece_id"].isin(done) & (plan["count"] > 0)]
    written = 0
    write_status(out_dir, client, step="list", pieces_total=int((plan["count"] > 0).sum()), pieces_done=len(done),
                 step_started_at=time.strftime("%Y-%m-%dT%H:%M:%S"))
    for row in progress(list(todo.itertuples()), desc="list", unit="piece"):
        write_status(out_dir, client, current={"piece_id": row.piece_id, "domain": row.domain, "framework": row.framework,
                                               "query": row.query, "count": int(row.count)})
        items = list(client.search_repositories(row.query))           # a piece is written whole or not at all
        stamp = time.strftime("%Y-%m-%dT%H:%M:%S")
        with open(listing, "a", encoding="utf-8") as f:
            f.writelines(json.dumps({"piece_id": row.piece_id, "listed_at": stamp, "item": it}) + "\n" for it in items)
        with open(done_file, "a") as f:
            f.write(row.piece_id + "\n")
        written += len(items)
        done.add(row.piece_id)
        write_status(out_dir, client, pieces_done=len(done), last_piece={"piece_id": row.piece_id, "listed": len(items),
                     "sample": [it["full_name"] for it in items[:5]]})
    write_status(out_dir, client, pieces_done=len(done), current=None)
    return written


# ---------- 2. sample ----------
def sample(plan: pd.DataFrame, out_dir: Path, seed: int) -> pd.DataFrame:
    """De-duplicate the listing and draw each slice's quota at random. Writes selected.csv."""
    found_by: dict[str, set[str]] = defaultdict(set)
    for rec in iter_jsonl(out_dir / LISTING):
        found_by[rec["item"]["full_name"]].add(rec["piece_id"])
    piece_slice = dict(zip(plan["piece_id"], plan["slice"]))
    slice_of = {name: {piece_slice[p] for p in pieces if p in piece_slice} for name, pieces in found_by.items()}
    quota = plan.groupby("slice")["take"].sum()

    selected_by: dict[str, set[str]] = defaultdict(set)
    for sl in sorted(quota.index):                                   # fixed order → same draw every run
        cands = sorted(n for n, s in slice_of.items() if sl in s)
        k = min(int(quota[sl]), len(cands))
        for name in pd.Series(cands, dtype=str).sample(n=k, random_state=seed).tolist() if k else []:
            selected_by[name].add(sl)

    sel = pd.DataFrame({
        "full_name": sorted(selected_by),
        "found_by": [";".join(sorted(found_by[n])) for n in sorted(selected_by)],
        "slices_found": [";".join(sorted(slice_of[n])) for n in sorted(selected_by)],
        "selected_by": [";".join(sorted(selected_by[n])) for n in sorted(selected_by)],
    })
    sel["is_other"] = sel["selected_by"].str.split(";").map(lambda s: all(x.startswith("other|") for x in s))
    sel.to_csv(out_dir / SELECTED, index=False)
    write_status(out_dir, step="sample", unique_listed=len(found_by), selected=len(sel), other_selected=int(sel["is_other"].sum()))
    return sel


# ---------- 3. fetch ----------
def _search_items(out_dir: Path, names: set[str]) -> dict[str, dict]:
    first: dict[str, dict] = {}
    for rec in iter_jsonl(out_dir / LISTING):
        n = rec["item"]["full_name"]
        if n in names and n not in first:
            first[n] = rec["item"]
    return first


def fetch_details(client: GitHubClient, out_dir: Path, contributors_limit: int = 30, limit: int | None = None,
                  progress: Callable = lambda it, **k: it) -> dict:
    """README + languages + contributors for every selected repository not fetched yet."""
    sel = pd.read_csv(out_dir / SELECTED, keep_default_na=False)
    repos, seen_file, errors = out_dir / REPOS, out_dir / SEEN, out_dir / ERRORS
    repair_jsonl(repos)
    seen = _read_lines(seen_file) | {r["full_name"] for r in iter_jsonl(repos)} if repos.exists() else _read_lines(seen_file)
    todo = sel[~sel["full_name"].isin(seen)]
    if limit is not None:
        todo = todo.head(limit)
    items = _search_items(out_dir, set(todo["full_name"]))
    stats = {"fetched": 0, "no_readme": 0, "errors": 0, "skipped_already_done": len(sel) - len(sel[~sel["full_name"].isin(seen)])}

    write_status(out_dir, client, step="fetch", selected=len(sel), fetched_before=stats["skipped_already_done"],
                 step_started_at=time.strftime("%Y-%m-%dT%H:%M:%S"), current=None)
    for row in progress(list(todo.itertuples()), desc="fetch", unit="repo"):
        name = row.full_name
        write_status(out_dir, client, current={"full_name": name, "selected_by": row.selected_by})
        try:
            readme = client.get_readme(name)
            record = {
                "full_name": name,
                "search": items.get(name, {}),
                "readme": readme,
                "languages": client.get_languages(name),
                "contributors": client.get_contributors(name, contributors_limit),
                "found_by": row.found_by.split(";") if row.found_by else [],
                "slices_found": row.slices_found.split(";") if row.slices_found else [],
                "selected_by": row.selected_by.split(";") if row.selected_by else [],
                "fetched_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
            }
            with open(repos, "a", encoding="utf-8") as f:
                f.write(json.dumps(record, ensure_ascii=False) + "\n")
            stats["fetched"] += 1
            stats["no_readme"] += readme == ""
            s = record["search"]
            write_status(out_dir, client, last_repo={
                "full_name": name, "stars": s.get("stargazers_count"), "description": (s.get("description") or "")[:160],
                "readme_chars": len(readme), "readme_start": readme[:400], "languages": record["languages"],
                "contributors": len(record["contributors"]), "selected_by": record["selected_by"]})
        except requests.HTTPError as e:                  # gone, blocked (451), …: note it, don't retry forever
            with open(errors, "a", encoding="utf-8") as f:
                f.write(json.dumps({"full_name": name, "status": e.response.status_code if e.response is not None else None,
                                    "error": str(e)[:300], "at": time.strftime("%Y-%m-%dT%H:%M:%S")}) + "\n")
            stats["errors"] += 1
        with open(seen_file, "a") as f:
            f.write(name + "\n")
    write_status(out_dir, client, current=None, step="done" if limit is None else "fetch (paused after --limit)")
    return stats


# ---------- all together ----------
def collect(config: dict, out_dir: str | Path, client: GitHubClient | None = None, plan_path: str | Path | None = None,
            steps: tuple[str, ...] = ("list", "sample", "fetch"), limit: int | None = None,
            seed: int = 42, progress: Callable = lambda it, **k: it, log: Callable[[str], None] = print) -> None:
    """Run the plan: list every piece, sample each slice's quota, fetch README + languages + contributors."""
    from discovery.config import BACKEND
    out_dir = Path(out_dir)
    plan = load_plan(plan_path or BACKEND / "config" / "slices.csv")
    col = config.get("collection", {})
    if client is None:
        import os

        from dotenv import load_dotenv
        load_dotenv(BACKEND / ".env")
        client = GitHubClient(os.environ.get("GITHUB_TOKEN"), search_gap=col.get("search_gap_s", 2.1),
                              core_gap=col.get("core_gap_s", 0.75), log=log)
    if "list" in steps:
        n = list_candidates(client, plan, out_dir, progress)
        log(f"list: {n:,} search items written ({client.calls['search']} search requests)")
    if "sample" in steps:
        sel = sample(plan, out_dir, seed)
        log(f"sample: {len(sel):,} repositories selected ({int(sel['is_other'].sum()):,} other) → {out_dir / SELECTED}")
    if "fetch" in steps:
        s = fetch_details(client, out_dir, col.get("contributors_limit", 30), limit, progress)
        log(f"fetch: {s['fetched']:,} fetched, {s['no_readme']:,} without README, {s['errors']:,} errors, "
            f"{s['skipped_already_done']:,} already done ({client.calls['core']} core requests)")
