import type { ComponentType } from "react";
import type { SceneId } from "@/content/steps";
import { ArchitectureScene } from "./ArchitectureScene";
import { CorpusScene } from "./CorpusScene";
import { EvaluationScene } from "./EvaluationScene";
import { IndexScene } from "./IndexScene";
import { IntroScene } from "./IntroScene";
import { PopularityScene } from "./PopularityScene";
import { PreprocessScene } from "./PreprocessScene";
import { ProblemScene } from "./ProblemScene";
import { QueryScene } from "./QueryScene";
import { RankScene } from "./RankScene";
import { ResultsScene } from "./ResultsScene";

export const SCENES: Record<SceneId, ComponentType> = {
  intro: IntroScene,
  problem: ProblemScene,
  corpus: CorpusScene,
  preprocess: PreprocessScene,
  index: IndexScene,
  query: QueryScene,
  rank: RankScene,
  popularity: PopularityScene,
  results: ResultsScene,
  evaluation: EvaluationScene,
  architecture: ArchitectureScene,
};
