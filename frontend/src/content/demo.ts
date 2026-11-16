/* Made-up example repositories for the tour's illustrations. Scores are illustrative,
   chosen to show how each method behaves; real numbers come from eval/. */

export interface DemoRepo {
  id: string;
  name: string;
  desc: string;
  tech: string[];
  level: "beginner" | "intermediate" | "advanced";
  stars: number;
  forks: number;
}

export const REPOS: Record<string, DemoRepo> = {
  starter: { id: "starter", name: "nest-inventory-starter", desc: "Beginner inventory management API: products, stock levels and suppliers.", tech: ["nestjs", "postgresql", "typeorm"], level: "beginner", stars: 214, forks: 61 },
  stockr: { id: "stockr", name: "stockr-api", desc: "Warehouse stock tracker for small shops.", tech: ["nestjs", "postgresql"], level: "beginner", stars: 18, forks: 4 },
  stuffed: { id: "stuffed", name: "inventory-management-nest-pg", desc: "Inventory management inventory system: inventory, inventory reports, inventory API.", tech: ["nestjs", "postgresql"], level: "intermediate", stars: 1840, forks: 402 },
  erp: { id: "erp", name: "nest-erp-suite", desc: "Modular ERP with inventory, HR and accounting modules.", tech: ["nestjs", "postgresql", "redis", "docker"], level: "advanced", stars: 3120, forks: 655 },
  pos: { id: "pos", name: "pos-nest", desc: "Point-of-sale backend with receipts and cash drawers.", tech: ["nestjs", "mysql"], level: "intermediate", stars: 96, forks: 22 },
};

export type Method = "boolean" | "tfidf" | "bm25" | "embedding" | "hybrid";

export const METHODS: { id: Method; label: string; note: string }[] = [
  { id: "boolean", label: "Boolean", note: "inventory AND nestjs: exact matches only, in no particular order. stockr-api never says “inventory”, so it's missing." },
  { id: "tfidf", label: "TF-IDF", note: "Rewards repeated words, so the README that says “inventory” eleven times comes first." },
  { id: "bm25", label: "BM25", note: "Term frequency saturates and long READMEs are normalised, so the focused starter moves up." },
  { id: "embedding", label: "Embedding", note: "Compares meaning: “warehouse stock tracker” ≈ “inventory management”, so stockr-api jumps up." },
  { id: "hybrid", label: "Hybrid", note: "0.5 × BM25 + 0.5 × embedding: precise words plus meaning." },
];

// score per method; null = not returned
export const SCORES: Record<Method, Record<string, number | null>> = {
  boolean: { starter: 1, stuffed: 1, erp: 1, stockr: null, pos: null },
  tfidf: { stuffed: 0.92, starter: 0.81, erp: 0.55, pos: 0.3, stockr: 0.12 },
  bm25: { starter: 0.88, stuffed: 0.8, erp: 0.61, pos: 0.33, stockr: 0.18 },
  embedding: { stockr: 0.86, starter: 0.84, erp: 0.7, stuffed: 0.66, pos: 0.41 },
  hybrid: { starter: 0.86, stuffed: 0.73, erp: 0.66, stockr: 0.52, pos: 0.37 },
};
