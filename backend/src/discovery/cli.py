"""Command line entry point:  python -m discovery <command>

  collect     fetch repositories from GitHub into data/raw (list → sample → fetch; resumable)
  preprocess  build data/processed/corpus.parquet (+ cleaning_log.csv)
  index       build inverted index, TF-IDF, BM25, embeddings, graph
  search      run one query from the terminal
  pool        build the labelling pool for evaluation
  evaluate    compute the metric table

Examples:
  python -m discovery collect --step list            # cheap: search requests only (~15 min)
  python -m discovery collect --step sample          # no requests: draw each slice's quota (seed 42)
  python -m discovery collect --step fetch --limit 20   # try 20 repositories first
  python -m discovery collect                         # everything; stop with Ctrl+C, rerun to resume
  python -m discovery preprocess
"""

import argparse

COMMANDS = ("collect", "preprocess", "index", "search", "pool", "evaluate")


def main(argv=None) -> None:
    parser = argparse.ArgumentParser(prog="discovery", description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("command", choices=COMMANDS)
    parser.add_argument("query", nargs="?", help="query text (search only)")
    parser.add_argument("--method", default="bm25")
    parser.add_argument("--config", default="config/config.yaml")
    parser.add_argument("--step", choices=("list", "sample", "fetch", "all"), default="all", help="collect only")
    parser.add_argument("--limit", type=int, default=None, help="collect: fetch at most this many repositories")
    args = parser.parse_args(argv)

    from discovery.config import PATHS, SEED, load_config
    cfg = load_config(args.config)

    if args.command == "collect":
        from tqdm import tqdm

        from discovery.collect.crawler import collect
        steps = ("list", "sample", "fetch") if args.step == "all" else (args.step,)
        collect(cfg, PATHS["raw"], steps=steps, limit=args.limit, seed=SEED,
                progress=lambda it, **k: tqdm(it, **k))
        return
    if args.command == "preprocess":
        from discovery.preprocess.pipeline import build_corpus
        corpus, log = build_corpus(PATHS["raw"], PATHS["processed"] / "corpus.parquet", cfg)
        print(log.to_string(index=False))
        print(f"\nwrote {PATHS['processed'] / 'corpus.parquet'}: {len(corpus):,} repositories")
        return
    raise SystemExit(f"'{args.command}' is not implemented yet.")
