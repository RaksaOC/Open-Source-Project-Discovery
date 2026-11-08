"""Command line entry point:  python -m discovery <command>

  collect     fetch repositories from GitHub into data/raw
  preprocess  build data/processed/corpus.parquet
  index       build inverted index, TF-IDF, BM25, embeddings, graph
  search      run one query from the terminal
  pool        build the labelling pool for evaluation
  evaluate    compute the metric table
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
    args = parser.parse_args(argv)
    raise SystemExit(f"'{args.command}' is not implemented yet.")
