import { computeMatch, type MatchResult } from './matchScorer.ts';
import { extractSkills, type ExtractedSkill } from './skillExtractor.ts';
import { FLAT_TAXONOMY, SKILL_TAXONOMY } from './taxonomy.ts';

export {
  scoreApplicationFit,
  splitEvidenceChunks,
  splitJobRequirements,
  type EnhancedScoreMetadata,
  type EnhancedScoreOutput,
  type EvidenceChunk,
  type EvidenceMatch,
  type EvidenceSource,
  type RecommendedAction,
  type RequirementChunk,
  type ScoreApplicationFitInput,
  type ScoreConfidence,
  type SplitEvidenceInput,
} from './applicationFitScorer.ts';
export { extractSkills, type ExtractedSkill } from './skillExtractor.ts';
export { computeMatch, type MatchResult } from './matchScorer.ts';
export { FLAT_TAXONOMY, SKILL_TAXONOMY } from './taxonomy.ts';

export interface QuickScoreInput {
  cvText: string;
  jdText: string;
}

export interface QuickScoreOutput {
  match: MatchResult;
  cvSkillCount: number;
  jdSkillCount: number;
  timestamp: string;
}

export function quickScore(input: QuickScoreInput): QuickScoreOutput {
  const cvSkills: ExtractedSkill[] = extractSkills(input.cvText, FLAT_TAXONOMY);
  const jdSkills: ExtractedSkill[] = extractSkills(input.jdText, FLAT_TAXONOMY);

  return {
    match: computeMatch(cvSkills, jdSkills),
    cvSkillCount: cvSkills.length,
    jdSkillCount: jdSkills.length,
    timestamp: new Date().toISOString(),
  };
}
