"""Split a natural-language query into functionality, technologies and complexity.

"Find a beginner-friendly inventory management system using NestJS and PostgreSQL."
-> functionality = "inventory management system"
   technologies  = ["nestjs", "postgresql"]
   complexity    = "beginner"
"""

from discovery.models import ParsedQuery


def parse_query(text: str, tech_dictionary: dict) -> ParsedQuery:
    raise NotImplementedError
