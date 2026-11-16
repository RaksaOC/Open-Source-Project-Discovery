/* "Preview data" source: a fake search that shows how the app looks and behaves.
   It does no real ranking. It picks some sample repositories and gives them random scores,
   seeded by the query and method, so the same search always shows the same results and
   switching method reshuffles them. (The earlier BM25/TF-IDF mock engine is archived in
   IR/archive-mock-search-engine.) */

import type { Method } from "@/lib/api/types";
import { SAMPLE_REPOS, RELATED, type SampleRepo } from "@/content/sampleRepos";
import { METHOD_INFO, techLabel } from "@/lib/search/labels";
import { stemWord } from "@/lib/search/text";
import type { RelatedRepo, ResultView, SearchView } from "@/lib/search/types";
import { mulberry32 } from "@/lib/prng";

export const SAMPLE_SIZE = SAMPLE_REPOS.length;
const METHODS = Object.keys(METHOD_INFO) as Method[];

/* Just enough "query understanding" to fill the Understood-as chips. */
const TECH_WORDS: Record<string, string> = {
  nestjs: "nestjs", nest: "nestjs", express: "express", node: "nodejs", "node.js": "nodejs", react: "react", "next.js": "nextjs", nextjs: "nextjs",
  vue: "vue", angular: "angular", django: "django", flask: "flask", fastapi: "fastapi", laravel: "laravel", spring: "spring-boot", flutter: "flutter",
  postgresql: "postgresql", postgres: "postgresql", mysql: "mysql", mongodb: "mongodb", mongo: "mongodb", sqlite: "sqlite", redis: "redis",
  prisma: "prisma", graphql: "graphql", docker: "docker", kubernetes: "kubernetes", typescript: "typescript", python: "python", java: "java",
  php: "php", golang: "go", "socket.io": "socketio",
};
const LEVEL_WORDS: [string, RegExp][] = [
  ["beginner", /\b(beginner|beginner-friendly|simple|easy|starter|tutorial|student project|first project)\b/],
  ["advanced", /\b(advanced|production|enterprise|scalable)\b/],
  ["intermediate", /\bintermediate\b/],
];
const FILLER = new Set("a an the and or of for to in on with using use built build find me my i want need app application system project something like that boot".split(" "));

function parse(q: string) {
  const lower = q.toLowerCase();
  const excluded = [...lower.matchAll(/(?:^|\s)-([a-z0-9.#+-]+)/g)].map((m) => m[1]);
  const words = lower.replace(/(?:^|\s)-[a-z0-9.#+-]+/g, " ").split(/[^a-z0-9.#+-]+/).filter(Boolean);
  const technologies = [...new Set(words.map((w) => TECH_WORDS[w]).filter(Boolean))];
  const complexity = LEVEL_WORDS.find(([, re]) => re.test(lower))?.[0] ?? null;
  const levelRe = LEVEL_WORDS.map(([, re]) => re.source).join("|");
  const functionality = words.filter((w) => !TECH_WORDS[w] && !FILLER.has(w) && !new RegExp(levelRe).test(w)).join(" ");
  return { functionality, technologies, complexity, excluded };
}

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function related(name: string): RelatedRepo[] {
  return RELATED.flatMap(([a, b]) => (a === name ? [b] : b === name ? [a] : []))
    .map((n) => SAMPLE_REPOS.find((r) => r.full_name === n)!)
    .map(({ full_name, description, stars, complexity }) => ({ full_name, description, stars, complexity }));
}

function toView(r: SampleRepo, extra: Partial<ResultView> = {}): ResultView {
  return {
    full_name: r.full_name,
    url: `https://github.com/${r.full_name}`,
    description: r.description,
    technologies: r.technologies,
    complexity: r.complexity,
    stars: r.stars,
    forks: r.forks,
    score: 0,
    relevance: 0,
    popularity: 0,
    matched: {},
    language: r.language,
    updated: r.updated,
    license: r.license,
    readme: r.readme,
    topics: r.topics,
    snippet: r.readme.split(/(?<=\.)\s/)[0],
    reasons: [],
    methodScores: null,
    methodRanks: null,
    related: related(r.full_name),
    ...extra,
  };
}

export function fakeSearch(query: string, method: Method): Promise<SearchView> {
  const parsed = parse(query);
  const rand = mulberry32(hash(`${query.toLowerCase()}|${method}`));
  const scoreRand = mulberry32(hash(query.toLowerCase()));

  // a random 6–12 repos, nudged towards ones that use the requested technologies so it looks plausible
  const picked = SAMPLE_REPOS.map((r) => ({ r, k: rand() + 0.5 * r.technologies.filter((t) => parsed.technologies.includes(t)).length }))
    .sort((a, b) => b.k - a.k)
    .slice(0, 6 + Math.floor(rand() * 7));

  // a random score under every method, so the details panel can compare them
  const perMethod = new Map(picked.map(({ r }) => [r.full_name, Object.fromEntries(METHODS.map((m) => [m, 0.2 + scoreRand() * 0.8])) as Record<Method, number>]));
  const scoreOf = (name: string) => perMethod.get(name)![method] * 0.6 + 0.4 * rand();

  const results = picked
    .map(({ r }) => ({ r, score: scoreOf(r.full_name) }))
    .sort((a, b) => b.score - a.score)
    .map(({ r, score }, i, all) => {
      // top result ~0.95, then strictly decreasing
      const s = Math.max(0.08, 0.95 * (score / all[0].score) - i * 0.02);
      const techHit = r.technologies.filter((t) => parsed.technologies.includes(t));
      return toView(r, {
        score: s,
        relevance: s,
        popularity: Math.min(1, Math.log10(r.stars + 1) / 4),
        matched: { technologies: techHit },
        reasons: [
          { label: "Text", text: parsed.functionality ? `README and description mention “${parsed.functionality.split(" ")[0]}”` : "Description matches your query" },
          ...(parsed.technologies.length ? [{ label: "Tech", text: techHit.length ? techHit.map(techLabel).join(", ") : "None of the requested technologies" }] : []),
          ...(parsed.complexity ? [{ label: "Level", text: r.complexity === parsed.complexity ? `${r.complexity}, as asked` : `${r.complexity} (you asked for ${parsed.complexity})` }] : []),
          { label: "Popularity", text: `${r.stars.toLocaleString()} stars` },
        ],
        methodScores: perMethod.get(r.full_name)!,
        methodRanks: null,
      });
    });

  // rank of each repo under every method, from the random per-method scores
  for (const m of METHODS) {
    [...results].sort((a, b) => b.methodScores![m]! - a.methodScores![m]!).forEach((r, i) => {
      r.methodRanks ??= {} as Record<Method, number | null>;
      r.methodRanks[m] = i + 1;
    });
  }

  const view: SearchView = {
    source: "preview",
    query,
    method,
    parsed: { functionality: parsed.functionality, technologies: parsed.technologies, complexity: parsed.complexity },
    results,
    excluded: parsed.excluded,
    highlight: parsed.functionality.split(" ").map(stemWord).filter((w) => w.length > 2),
    tookMs: 20 + Math.floor(rand() * 40),
  };
  // pretend to be the network
  return new Promise((resolve) => setTimeout(() => resolve(view), 750 + Math.random() * 350));
}

/** A sample repository outside the current results (opened from "Related projects"). */
export function previewRepo(name: string): ResultView | undefined {
  const r = SAMPLE_REPOS.find((x) => x.full_name === name);
  return r && toView(r);
}
