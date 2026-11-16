"""Text normalisation shared by indexing and query processing."""


def tokenize(text: str, keep_terms: set[str] | None = None) -> list[str]:
    """Lowercase, tokenize, remove stop words, lemmatize.
    Terms in keep_terms (tech names such as 'node.js', 'c#') are kept whole."""
    raise NotImplementedError
