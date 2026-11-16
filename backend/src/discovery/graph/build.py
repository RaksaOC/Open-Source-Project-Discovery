"""Build a graph between repositories.

Candidate edges (decided after looking at the data):
- shared contributors
- shared topics
- fork_of (fork -> parent)
- README links to another repository in the corpus
"""


def build_graph(corpus):
    """Return a networkx graph with repositories as nodes."""
    raise NotImplementedError
