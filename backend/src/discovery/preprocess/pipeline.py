"""Raw JSON lines -> cleaned corpus (data/processed/corpus.parquet)."""


def build_corpus(raw_dir: str, out_path: str) -> None:
    """Clean, drop repos without README/description, drop non-English, de-duplicate forks/mirrors,
    fill missing values with 'not specified'."""
    raise NotImplementedError
