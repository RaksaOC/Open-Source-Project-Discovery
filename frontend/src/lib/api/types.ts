/* Mirrors backend/src/discovery/api/schemas.py. */

export type Method = "boolean" | "tfidf" | "bm25" | "embedding" | "hybrid";

export interface Health {
  status: "ok";
  index_ready: boolean;
}

export interface Methods {
  methods: Method[];
  default: Method;
}

export interface ResultOut {
  full_name: string;
  url: string;
  description: string;
  technologies: string[];
  complexity: string;
  stars: number;
  forks: number;
  score: number;
  relevance: number;
  popularity: number;
  matched: Record<string, string[]>;
}

export interface SearchResponse {
  query: string;
  method: Method;
  parsed: { functionality: string; technologies: string[]; complexity: string | null } | null;
  results: ResultOut[];
}
