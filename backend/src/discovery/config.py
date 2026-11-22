"""Shared settings: paths, the random seed and config/config.yaml.

Use it everywhere, in notebooks and in src/, so every step reads the same settings:

    from discovery.config import SEED, PATHS, load_config, set_seed
    set_seed()                       # random, numpy (and torch, if installed) seeded with 42
    df.sample(50, random_state=SEED) # pass SEED wherever a function takes a random_state
"""

from __future__ import annotations

import random
from functools import lru_cache
from pathlib import Path

import yaml

# backend/  (this file is backend/src/discovery/config.py)
BACKEND = Path(__file__).resolve().parents[2]
CONFIG_FILE = BACKEND / "config" / "config.yaml"


@lru_cache
def load_config(path: str | Path = CONFIG_FILE) -> dict:
    """config/config.yaml as a dict. Relative paths are taken from backend/."""
    path = Path(path)
    if not path.is_absolute():
        path = BACKEND / path
    with open(path, encoding="utf-8") as f:
        return yaml.safe_load(f)


SEED: int = load_config()["seed"]

# Absolute folders, so code works the same from a notebook, the CLI or pytest.
PATHS: dict[str, Path] = {name: BACKEND / rel for name, rel in load_config()["paths"].items()}


def set_seed(seed: int = SEED) -> None:
    """Seed every random number generator we use."""
    random.seed(seed)
    try:
        import numpy as np
        np.random.seed(seed)
    except ImportError:
        pass
    try:
        import torch  # comes with sentence-transformers
        torch.manual_seed(seed)
    except ImportError:
        pass
