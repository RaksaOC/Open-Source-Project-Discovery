"""Find the technologies a repository uses (or a query asks for)."""


def load_dictionary(path: str = "config/technologies.yaml") -> dict[str, list[str]]:
    raise NotImplementedError


def extract_technologies(text: str, topics: list[str], languages: dict[str, int], dictionary: dict) -> list[str]:
    """Match aliases in description, topics, README and the language list; return canonical names."""
    raise NotImplementedError
