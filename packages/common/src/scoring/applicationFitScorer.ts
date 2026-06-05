import { computeMatch } from './matchScorer.ts';
import { extractSkills, type ExtractedSkill } from './skillExtractor.ts';
import { FLAT_TAXONOMY } from './taxonomy.ts';

export type ScoreConfidence = 'high' | 'medium' | 'low';
export type RecommendedAction = 'prioritize' | 'tailor' | 'stretch' | 'deprioritize';
export type EvidenceSource =
  | 'resume_extracted_text'
  | 'resume_content'
  | 'resume_original_text'
  | 'application_final_resume_text'
  | 'profile';

export interface RequirementChunk {
  id: string;
  text: string;
  skills: string[];
  tokens: string[];
}

export interface EvidenceChunk {
  id: string;
  text: string;
  source: EvidenceSource;
  skills: string[];
  tokens: string[];
}

export interface EvidenceMatch {
  requirementId: string;
  evidenceId: string;
  requirementSnippet: string;
  evidenceSnippet: string;
  evidenceSource: EvidenceSource;
  score: number;
  strength: 'high' | 'medium' | 'low';
  matchedSkills: string[];
  sharedTerms: string[];
}

export interface EnhancedScoreMetadata {
  algorithm: 'deterministic-v2';
  requirementCount: number;
  evidenceCount: number;
  resumeSource: EvidenceSource;
  usedProfile: boolean;
  generatedAt: string;
}

export interface EnhancedScoreOutput {
  score: number;
  confidence: ScoreConfidence;
  recommendedAction: RecommendedAction;
  matchedSkills: string[];
  missingSkills: string[];
  evidenceMatches: EvidenceMatch[];
  claimsToVerify: string[];
  metadata: EnhancedScoreMetadata;
}

export interface SplitEvidenceInput {
  resumeText: string;
  profileText?: string;
  resumeSource?: EvidenceSource;
}

export interface ScoreApplicationFitInput extends SplitEvidenceInput {
  jobDescription: string;
  now?: () => Date;
}

interface ScoredEvidence {
  evidence: EvidenceChunk;
  score: number;
  matchedSkills: string[];
  sharedTerms: string[];
}

const MAX_REQUIREMENT_CHARS = 240;
const MAX_EVIDENCE_CHARS = 260;
const MAX_SNIPPET_CHARS = 160;
const MAX_EVIDENCE_MATCHES = 8;
const MIN_MATCH_SCORE = 0.34;

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'for',
  'from',
  'in',
  'into',
  'is',
  'it',
  'of',
  'on',
  'or',
  'our',
  'the',
  'their',
  'this',
  'to',
  'with',
  'you',
  'your',
]);

const ACTION_TERMS = new Set([
  'analyze',
  'automate',
  'build',
  'built',
  'collaborate',
  'create',
  'created',
  'deliver',
  'design',
  'develop',
  'improve',
  'lead',
  'led',
  'maintain',
  'manage',
  'optimize',
  'own',
  'owned',
  'report',
  'reporting',
  'ship',
  'support',
  'test',
  'write',
]);

function compactText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function boundedText(value: string, maxLength: number): string {
  const compacted = compactText(value);
  if (compacted.length <= maxLength) return compacted;
  return `${compacted.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
}

function safeSnippet(value: string, fullSource: string): string {
  const compacted = compactText(value);
  const compactedSource = compactText(fullSource);
  if (compacted && compacted === compactedSource && compacted.length > 12) {
    return boundedText(compacted, Math.min(MAX_SNIPPET_CHARS, compacted.length - 4));
  }

  return boundedText(compacted, MAX_SNIPPET_CHARS);
}

function normalizeToken(value: string): string {
  const token = value.toLowerCase().replace(/^[^a-z0-9+#.]+|[^a-z0-9+#.]+$/g, '');
  if (token.length > 5 && token.endsWith('ing')) return token.slice(0, -3);
  if (token.length > 4 && token.endsWith('ies')) return `${token.slice(0, -3)}y`;
  if (token.length > 4 && token.endsWith('s') && !token.endsWith('ss')) return token.slice(0, -1);
  return token;
}

function tokenize(value: string): string[] {
  const tokens = value
    .toLowerCase()
    .match(/[a-z0-9+#.]+/g) ?? [];

  return Array.from(
    new Set(
      tokens
        .map(normalizeToken)
        .filter((token) => token.length > 2 && !STOP_WORDS.has(token)),
    ),
  );
}

function splitIntoCandidateChunks(text: string): string[] {
  const normalized = text
    .replace(/\r/g, '\n')
    .replace(/[•*]\s+/g, '\n')
    .replace(/\n\s*[-–—]\s+/g, '\n')
    .replace(/\s+-\s+/g, '. ');

  const candidates = normalized
    .split(/\n+|(?<=[.!?;])\s+/)
    .map((chunk) => compactText(chunk.replace(/^[-–—*\d.)\s]+/, '')))
    .filter((chunk) => chunk.length >= 12)
    .filter((chunk) => !/^(requirements?|responsibilities|qualifications?|about the role|what you'?ll do):?$/i.test(chunk));

  return candidates.length ? candidates : [compactText(text)].filter(Boolean);
}

function createSkillList(text: string): string[] {
  return Array.from(new Set(extractSkills(text, FLAT_TAXONOMY).map((skill) => skill.skill)));
}

function tokenIntersection(left: string[], right: string[]): string[] {
  const rightSet = new Set(right);
  return left.filter((token) => rightSet.has(token));
}

function ngrams(tokens: string[], size: number): Set<string> {
  const values = new Set<string>();
  for (let index = 0; index <= tokens.length - size; index += 1) {
    values.add(tokens.slice(index, index + size).join(' '));
  }
  return values;
}

function setIntersectionCount(left: Set<string>, right: Set<string>): number {
  let count = 0;
  for (const item of left) {
    if (right.has(item)) count += 1;
  }
  return count;
}

function phraseOverlap(left: string[], right: string[]): number {
  const leftPhrases = new Set([...ngrams(left, 2), ...ngrams(left, 3)]);
  const rightPhrases = new Set([...ngrams(right, 2), ...ngrams(right, 3)]);
  if (leftPhrases.size === 0) return 0;
  return setIntersectionCount(leftPhrases, rightPhrases) / leftPhrases.size;
}

function actionOverlap(left: string[], right: string[]): number {
  const leftActions = left.filter((token) => ACTION_TERMS.has(token));
  if (leftActions.length === 0) return 0;
  const rightSet = new Set(right);
  return leftActions.filter((token) => rightSet.has(token)).length / leftActions.length;
}

function scoreRequirementEvidence(requirement: RequirementChunk, evidence: EvidenceChunk): ScoredEvidence {
  const matchedSkills = requirement.skills.filter((skill) => evidence.skills.includes(skill));
  const sharedTerms = tokenIntersection(requirement.tokens, evidence.tokens).slice(0, 6);
  const skillScore = requirement.skills.length > 0 ? matchedSkills.length / requirement.skills.length : 0;
  const tokenScore = requirement.tokens.length > 0 ? sharedTerms.length / requirement.tokens.length : 0;
  const phraseScore = phraseOverlap(requirement.tokens, evidence.tokens);
  const actionScore = actionOverlap(requirement.tokens, evidence.tokens);
  const weightedScore = requirement.skills.length > 0
    ? skillScore * 0.58 + tokenScore * 0.24 + phraseScore * 0.1 + actionScore * 0.08
    : tokenScore * 0.55 + phraseScore * 0.3 + actionScore * 0.15;
  const scoreWithSkillSignal = matchedSkills.length > 0
    ? Math.max(weightedScore, 0.55 + tokenScore * 0.2 + phraseScore * 0.1)
    : weightedScore;

  return {
    evidence,
    score: Math.min(1, Math.max(0, scoreWithSkillSignal)),
    matchedSkills,
    sharedTerms,
  };
}

function scoreStrength(score: number): EvidenceMatch['strength'] {
  if (score >= 0.72) return 'high';
  if (score >= 0.5) return 'medium';
  return 'low';
}

function recommendedAction(score: number): RecommendedAction {
  if (score >= 90) return 'prioritize';
  if (score >= 60) return 'tailor';
  if (score >= 40) return 'stretch';
  return 'deprioritize';
}

function scoreConfidence(input: {
  score: number;
  requirementCount: number;
  evidenceCount: number;
  resumeSource: EvidenceSource;
  evidenceMatches: EvidenceMatch[];
}): ScoreConfidence {
  if (
    input.resumeSource === 'application_final_resume_text' ||
    input.requirementCount < 2 ||
    input.evidenceCount < 2 ||
    input.evidenceMatches.length === 0
  ) {
    return input.score >= 60 && input.evidenceMatches.length > 0 ? 'medium' : 'low';
  }

  if (input.score >= 70 && input.evidenceMatches.length >= Math.min(2, input.requirementCount)) {
    return 'high';
  }

  return 'medium';
}

function claimsToVerify(input: {
  missingSkills: string[];
  evidenceMatches: EvidenceMatch[];
  resumeSource: EvidenceSource;
}): string[] {
  const claims: string[] = [];

  if (input.resumeSource === 'application_final_resume_text') {
    claims.push('Resume evidence came from a lower-confidence generated/final resume fallback. Verify against the original resume before sending.');
  }

  for (const skill of input.missingSkills.slice(0, 6)) {
    claims.push(`Verify whether you have real evidence for missing requirement: ${skill}.`);
  }

  for (const match of input.evidenceMatches.filter((item) => item.strength === 'low').slice(0, 3)) {
    claims.push(`Verify weak evidence match before claiming it: ${match.requirementSnippet}`);
  }

  return claims.length ? claims : ['Verify every generated claim against the original resume and job description before sending.'];
}

/** Splits a job description into bounded requirement-like chunks. */
export function splitJobRequirements(jobDescription: string): RequirementChunk[] {
  return splitIntoCandidateChunks(jobDescription)
    .map((text) => boundedText(text, MAX_REQUIREMENT_CHARS))
    .filter(Boolean)
    .slice(0, 24)
    .map((text, index) => ({
      id: `requirement-${index + 1}`,
      text,
      skills: createSkillList(text),
      tokens: tokenize(text),
    }));
}

/** Splits resume/profile text into bounded evidence chunks. */
export function splitEvidenceChunks(input: SplitEvidenceInput): EvidenceChunk[] {
  const resumeSource = input.resumeSource ?? 'resume_extracted_text';
  const resumeChunks = splitIntoCandidateChunks(input.resumeText)
    .map((text) => boundedText(text, MAX_EVIDENCE_CHARS))
    .filter(Boolean)
    .slice(0, 32)
    .map((text, index) => ({
      id: `evidence-${index + 1}`,
      text,
      source: resumeSource,
      skills: createSkillList(text),
      tokens: tokenize(text),
    }));

  const profileChunks = input.profileText
    ? splitIntoCandidateChunks(input.profileText)
        .map((text) => boundedText(text, MAX_EVIDENCE_CHARS))
        .filter(Boolean)
        .slice(0, 8)
        .map((text, index) => ({
          id: `profile-${index + 1}`,
          text,
          source: 'profile' as const,
          skills: createSkillList(text),
          tokens: tokenize(text),
        }))
    : [];

  return [...resumeChunks, ...profileChunks];
}

/** Scores a resume/profile against a job description without external AI or paid services. */
export function scoreApplicationFit(input: ScoreApplicationFitInput): EnhancedScoreOutput {
  const requirements = splitJobRequirements(input.jobDescription);
  const evidence = splitEvidenceChunks(input);
  const resumeSource = input.resumeSource ?? 'resume_extracted_text';
  const cvSkills: ExtractedSkill[] = extractSkills(
    [input.resumeText, input.profileText ?? ''].join('\n'),
    FLAT_TAXONOMY,
  );
  const jdSkills: ExtractedSkill[] = extractSkills(input.jobDescription, FLAT_TAXONOMY);
  const deterministicMatch = computeMatch(cvSkills, jdSkills);
  const evidenceMatches: EvidenceMatch[] = [];
  const requirementScores: number[] = [];

  for (const requirement of requirements) {
    const ranked = evidence
      .map((candidate) => scoreRequirementEvidence(requirement, candidate))
      .sort((left, right) => right.score - left.score);
    const best = ranked[0];

    if (!best) {
      requirementScores.push(0);
      continue;
    }

    requirementScores.push(best.score);

    if (best.score >= MIN_MATCH_SCORE) {
      const evidenceFullSource = best.evidence.source === 'profile' ? input.profileText ?? '' : input.resumeText;
      evidenceMatches.push({
        requirementId: requirement.id,
        evidenceId: best.evidence.id,
        requirementSnippet: safeSnippet(requirement.text, input.jobDescription),
        evidenceSnippet: safeSnippet(best.evidence.text, evidenceFullSource),
        evidenceSource: best.evidence.source,
        score: Math.round(best.score * 100),
        strength: scoreStrength(best.score),
        matchedSkills: best.matchedSkills,
        sharedTerms: best.sharedTerms,
      });
    }
  }

  const averageRequirementScore = requirementScores.length
    ? requirementScores.reduce((sum, score) => sum + score, 0) / requirementScores.length
    : 0;
  const score = Math.round((averageRequirementScore * 0.65 + (deterministicMatch.score / 100) * 0.35) * 100);
  const boundedScore = Math.min(100, Math.max(0, score));
  const topEvidenceMatches = evidenceMatches
    .sort((left, right) => right.score - left.score)
    .slice(0, MAX_EVIDENCE_MATCHES);
  const confidence = scoreConfidence({
    score: boundedScore,
    requirementCount: requirements.length,
    evidenceCount: evidence.length,
    resumeSource,
    evidenceMatches: topEvidenceMatches,
  });

  return {
    score: boundedScore,
    confidence,
    recommendedAction: recommendedAction(boundedScore),
    matchedSkills: deterministicMatch.matchedSkills,
    missingSkills: deterministicMatch.missingSkills,
    evidenceMatches: topEvidenceMatches,
    claimsToVerify: claimsToVerify({
      missingSkills: deterministicMatch.missingSkills,
      evidenceMatches: topEvidenceMatches,
      resumeSource,
    }),
    metadata: {
      algorithm: 'deterministic-v2',
      requirementCount: requirements.length,
      evidenceCount: evidence.length,
      resumeSource,
      usedProfile: Boolean(input.profileText?.trim()),
      generatedAt: (input.now ?? (() => new Date()))().toISOString(),
    },
  };
}
