import type { Method } from "@/lib/api/types";

/** Order of the ranking tabs. */
export const METHOD_ORDER: Method[] = ["bm25", "hybrid", "embedding", "tfidf", "boolean"];

export const METHOD_INFO: Record<Method, { label: string; blurb: string }> = {
  boolean: { label: "Boolean", blurb: "Every word must appear (AND). Exact matches only, no ranking." },
  tfidf: { label: "TF-IDF", blurb: "Rare words count more; repeating a word keeps raising the score." },
  bm25: { label: "BM25", blurb: "Like TF-IDF, but repeats saturate and long READMEs are normalised." },
  embedding: { label: "Semantic", blurb: "Matches meaning: “stock tracker” finds “inventory management”." },
  hybrid: { label: "Hybrid", blurb: "Half BM25, half semantic: exact words plus meaning." },
};

const TECH_LABEL: Record<string, string> = {
  nestjs: "NestJS", express: "Express", nodejs: "Node.js", react: "React", nextjs: "Next.js", vue: "Vue", angular: "Angular", django: "Django",
  flask: "Flask", fastapi: "FastAPI", laravel: "Laravel", "spring-boot": "Spring Boot", rails: "Rails", flutter: "Flutter", postgresql: "PostgreSQL",
  mysql: "MySQL", mongodb: "MongoDB", sqlite: "SQLite", redis: "Redis", prisma: "Prisma", typeorm: "TypeORM", graphql: "GraphQL", docker: "Docker",
  kubernetes: "Kubernetes", typescript: "TypeScript", javascript: "JavaScript", python: "Python", java: "Java", php: "PHP", go: "Go",
  socketio: "Socket.IO", tailwind: "Tailwind", electron: "Electron", bootstrap: "Bootstrap",
};

export const techLabel = (t: string) => TECH_LABEL[t] ?? t;
