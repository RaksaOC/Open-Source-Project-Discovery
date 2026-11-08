# Information Retrieval Project Proposal (draft)

**Course:** Information Web Retrieval Analytics
**Lecturer:** Mr. Natt KORAT
**Topic:** Open Source Project Discovery Engine
**Team members:** Ory Chanraksa, Rith Seyhak, Chey Rotana, Man Arafat, Keo Hengneitong, Sao Visal
**Group:** 6

> Draft. Numbers marked TBD are set once we have looked at the data.

## I. Problem

Students and developers often know what they want to build, but not what an existing project for it is called. They want "a beginner-friendly inventory management system using NestJS and PostgreSQL". The repository that fits might be called `stockr-api`, describe itself as a "warehouse stock tracker", and mention NestJS only in its README. GitHub's search matches words in names, descriptions and topics, so a query written as a sentence finds little or nothing. When we sent the sentence above to the GitHub repository search API, it returned **0 results**. Shortening it to "inventory management nestjs postgresql" returned 138. Users have to guess the right keywords, cannot filter by how hard a project is, and get results sorted by stars alone.

The goal of this project is a search engine over GitHub repositories. Users describe what they want to build in their own words, along with the technologies and level they want. The engine returns a ranked list of repositories with a link to each one, and shows why each repository matched.

The system will:

- Build an inverted index over repository names, descriptions, topics and README text, with Boolean search (AND, OR, NOT).
- Rank results three ways, with TF-IDF and cosine similarity, BM25, and embedding-based semantic search, plus a hybrid of BM25 and embeddings. All of them are compared on the same labelled test queries.
- Understand the query by splitting it into **functionality** ("inventory management system"), **technologies** (NestJS, PostgreSQL) and **complexity** ("beginner-friendly"). Technologies and complexity filter the results, and functionality drives the ranking.
- Re-rank by **popularity**: stars, forks, and the centrality of a repository in a graph of related repositories (PageRank, HITS). The same graph also suggests similar projects.
- Provide a simple interface. Users enter a query, switch between methods, filter by technology and level, and see result cards with the description, tech tags, stars and forks, the reason the repository matched, and a link to GitHub.

## II. Corpus

The corpus is public GitHub repository metadata and README files, collected through the GitHub REST API. Each repository is one document with these fields:

- full name, URL, description, topics, languages and README
- stars, forks, open issues, licence
- creation date and last activity date
- top contributors

Name, description, topics and README are searched. The other fields are used for filtering, popularity and display.

**Sampling.** We will collect about **10,000 repositories** (TBD). We focus on application projects that people build and learn from: inventory, point of sale, e-commerce, blogs, chat, school, hospital, library and booking systems. These are crossed with common stacks: NestJS, Express, Django, Flask, FastAPI, Laravel, Spring Boot, Rails, React, Vue, Next.js and Flutter. Other repositories are mixed in so that queries have non-relevant results to separate. One search query returns at most 1,000 results, and an authenticated token allows 30 search requests per minute and 5,000 other requests per hour. We therefore split the collection into many small queries (domain × stack, then by star range) and de-duplicate by repository name.

**Graph.** Repositories can be linked through:

- shared contributors
- shared topics
- forks (fork → parent)
- README links to other repositories in the corpus

We will build a graph from these links and apply PageRank and HITS to find central repositories. The scores feed into popularity ranking and "related projects". If the links are too sparse to give a reliable graph, we keep stars and forks for popularity and drop the graph.

**Preparing the corpus:**

- Clean READMEs from Markdown to plain text. Remove badges, images, HTML, code blocks and link URLs, and keep headings and prose, which is where features are described.
- Lowercase, tokenize, remove stop words and lemmatize. Technology names such as "node.js", "c#" and "next.js" are kept whole, using our technology dictionary (`config/technologies.yaml`).
- Map technology aliases to one name ("postgres", "pg", "postgresql" → postgresql), using the description, topics, README and language list.
- Estimate complexity (beginner, intermediate or advanced) from README words ("tutorial", "starter", "beginner"), topics, repository size, number of languages, and dependencies. We check a sample by hand.
- Remove repositories with no README and no description, archived mirrors, and duplicate forks. Keep English READMEs only. Mark missing values as "not specified".

**Evaluation.** We will write **25 realistic queries** that mix functionality, technology and level, for example "Find a beginner-friendly inventory management system using NestJS and PostgreSQL". The top 10 results from every method are pooled. Two team members label each result without seeing which method found it, on a three-point scale: 0 = not relevant, 1 = partly relevant, 2 = relevant. Disagreements are settled by discussion. We compare the methods, with and without popularity re-ranking, using Precision, Recall, F1, MAP and NDCG, and we discuss the queries where each method gives weak or wrong results.

## III. Team roles (draft, carried over from our previous proposal)

| Member | Responsibility |
|---|---|
| Ory Chanraksa | Project lead, search interface |
| Rith Seyhak | Data collection from the GitHub API, terms and rate limits, repository graph (PageRank, HITS) |
| Chey Rotana | README cleaning, preprocessing, technology and complexity extraction, inverted index, Boolean search |
| Man Arafat | TF-IDF, cosine similarity, BM25, popularity re-ranking |
| Keo Hengneitong | Embeddings, hybrid search, query understanding |
| Sao Visal | Queries, relevance labels, evaluation |

## IV. Risks

- **Short or empty READMEs.** Many repositories have a one-line description and a template README, which leaves little text to rank. We search name, description, topics and README together, and we expect embeddings to help most on these.
- **Inaccurate technology and complexity labels.** Topics are optional and READMEs may not list every tool. We combine several signals, check a sample by hand, and treat complexity as a soft filter, not a hard one.
- **Rate limits and the 1,000-result cap.** We collect in small slices with a token, cache every response, and resume from where we stopped.
- **Popularity bias.** Stars can bury small but well-matched beginner projects. Popularity has a limited weight, and we report results both with and without it.
- **Licences and terms.** README text belongs to its authors. We use the official API within its limits, store data only for this project, show short snippets, and always link back to the repository.
- **Graph quality.** Shared-contributor and topic links can be noisy. The graph is an extra feature that can be dropped without affecting the main search.
- **Schedule.** We build the Boolean, TF-IDF and BM25 baseline first, and add embeddings, hybrid search and the graph afterwards. That way a working engine exists even if the semantic part is late.
- **Evaluation reliability.** Every method uses the same 25 queries, a fixed relevance scale, and two labellers per result.

## V. Plan (TBD dates)

| Phase | Work | Owner |
|---|---|---|
| 1 | Collect corpus, clean READMEs, corpus statistics | Rith, Chey |
| 2 | Inverted index, Boolean, TF-IDF, BM25 baseline, first UI | Chey, Man, Ory |
| 3 | Embeddings, hybrid, query parser | Keo |
| 4 | Graph, PageRank and HITS, popularity re-ranking | Rith, Man |
| 5 | Queries, pooling, labelling, metrics | Sao, all |
| 6 | Report and presentation | All |
