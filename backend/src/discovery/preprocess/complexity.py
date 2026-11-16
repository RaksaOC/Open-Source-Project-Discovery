"""Estimate project complexity: beginner | intermediate | advanced.

Heuristic signals (to be tuned and checked by hand on a sample):
- README words: "beginner", "tutorial", "starter", "learning", "simple"
- topics such as good-first-issue, beginner-friendly
- size: number of languages, repository size, dependencies, contributors
"""


def estimate_complexity(repo) -> str:
    raise NotImplementedError
