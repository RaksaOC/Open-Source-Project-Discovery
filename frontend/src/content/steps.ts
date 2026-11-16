/* The onboarding tour: one entry per step. Copy lives here, visuals live in components/scenes. */

export type SceneId =
  | "intro"
  | "problem"
  | "corpus"
  | "preprocess"
  | "index"
  | "query"
  | "rank"
  | "popularity"
  | "results"
  | "evaluation"
  | "architecture";

export interface Step {
  id: SceneId;
  label: string; // short name in the progress rail
  eyebrow: string;
  title: string;
  lead: string;
  points: string[];
  note?: string;
  hint?: string; // shown when the scene is interactive
}

export const EXAMPLE_QUERY = "Find a beginner-friendly inventory management system using NestJS and PostgreSQL";

export const STEPS: Step[] = [
  {
    id: "intro",
    label: "Welcome",
    eyebrow: "Group 6 · Information Web Retrieval Analytics",
    title: "Open Source Project Discovery Engine",
    lead: "Find GitHub repositories by what you want to build, the technologies you need and the level you're at, instead of guessing repository names.",
    points: [
      "Search about 10,000 repositories by their README, topics and description",
      "Compare Boolean, TF-IDF, BM25, embeddings and a hybrid",
      "Every result explains why it matched",
    ],
  },
  {
    id: "problem",
    label: "Problem",
    eyebrow: "The problem",
    title: "GitHub search wants keywords, not sentences",
    lead: "People know what they want to build, not what the project is called. The repository that fits might be named stockr-api and mention NestJS only in its README.",
    points: [
      "The full sentence: 0 results from GitHub's search API",
      "Shortened to keywords: 138 results, sorted by stars only",
      "No way to filter by how hard a project is",
    ],
  },
  {
    id: "corpus",
    label: "Corpus",
    eyebrow: "Step 1 · Collect",
    title: "Build a corpus of 10,000 repositories",
    lead: "A single GitHub search returns at most 1,000 results, so we split the collection into many small queries: application domain × framework, then by star range.",
    points: [
      "12 domains (inventory, POS, blog, chat …) × 12 stacks (NestJS, Django, Laravel …)",
      "A token allows 30 search requests a minute and 5,000 other requests an hour",
      "Every response is cached, so a crawl can resume where it stopped",
    ],
  },
  {
    id: "preprocess",
    label: "Clean",
    eyebrow: "Step 2 · Preprocess",
    title: "Turn a README into searchable text",
    lead: "READMEs are full of badges, images and code. We keep the headings and prose, where the features are described, and label each repository's technologies and level.",
    points: [
      "Technology names stay whole: node.js, c#, next.js",
      "Aliases merge: postgres, pg, psql → postgresql",
      "Complexity (beginner, intermediate, advanced) from README words, size and dependencies",
    ],
  },
  {
    id: "index",
    label: "Index",
    eyebrow: "Step 3 · Index",
    title: "An inverted index for Boolean search",
    lead: "Each term points to the list of repositories that contain it. A Boolean query combines these lists with AND, OR and NOT.",
    points: [
      "AND intersects the lists, OR merges them, NOT removes from them",
      "Fast and exact, but there is no ranking: a repository either matches or it doesn't",
    ],
    hint: "Change the operator.",
  },
  {
    id: "query",
    label: "Query",
    eyebrow: "Query understanding",
    title: "Split the sentence into what the user wants",
    lead: "The query parser pulls out three parts. Technologies and level filter the corpus, and the functionality drives the ranking.",
    points: [
      "Functionality: inventory management system",
      "Technologies: nestjs, postgresql (matched through the alias dictionary)",
      "Complexity: beginner, used as a soft filter",
    ],
  },
  {
    id: "rank",
    label: "Rank",
    eyebrow: "Ranking",
    title: "Four ways to rank, one test set",
    lead: "TF-IDF and BM25 score matching words. Embeddings compare meaning, so a warehouse stock tracker can match inventory management. The hybrid blends BM25 with embeddings.",
    points: [
      "Every ranker has the same interface: fit(docs) and search(query, k)",
      "Scores are normalised to 0–1 before they are blended",
    ],
    hint: "Switch the ranking method.",
  },
  {
    id: "popularity",
    label: "Popularity",
    eyebrow: "Re-ranking",
    title: "Popularity, without burying small projects",
    lead: "Repositories link to each other through shared contributors, shared topics, forks and README links. PageRank on that graph, plus stars and forks, nudges well-known projects up.",
    points: [
      "Final score = 0.8 × relevance + 0.2 × popularity (weights to be tuned)",
      "The same graph suggests related projects",
      "Results are reported with and without popularity",
    ],
    hint: "Turn popularity on and off.",
  },
  {
    id: "results",
    label: "Results",
    eyebrow: "The interface",
    title: "Results that explain themselves",
    lead: "Each result card shows the description, tech tags, level, stars and forks, plus the reason it matched and a link back to GitHub.",
    points: [
      "Matched terms are highlighted",
      "Technology and level matches are shown as tags",
      "Related projects come from the repository graph",
    ],
  },
  {
    id: "evaluation",
    label: "Evaluate",
    eyebrow: "Evaluation",
    title: "Measure, don't guess",
    lead: "25 realistic queries. The top 10 results from every method go into one pool, and two people label each result without knowing which method found it.",
    points: [
      "Scale: 0 = not relevant, 1 = partly relevant, 2 = relevant",
      "Precision, Recall, F1, MAP and NDCG for every method",
      "We also discuss the queries where each method fails",
    ],
  },
  {
    id: "architecture",
    label: "Architecture",
    eyebrow: "How it's built",
    title: "One pipeline, six owners",
    lead: "An offline pipeline builds the corpus and indexes. Online, a FastAPI service runs every query through one SearchEngine: parse, filter, rank and re-rank. The Next.js frontend shows the results.",
    points: [
      "backend/src/discovery/: collect, preprocess, index, rank, graph, query, evaluation, api",
      "python -m discovery <command> runs each pipeline step",
      "frontend/: this tour, then the search page",
    ],
  },
];
