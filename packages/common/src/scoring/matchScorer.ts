import type { ExtractedSkill } from './skillExtractor.ts';

export interface MatchResult {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  extraSkills: string[];
  evidenceMap: Record<string, { cvSpan: string; jdSpan: string }>;
  label: 'strong' | 'moderate' | 'stretch' | 'low';
}

function byFirstSkillOccurrence(skills: ExtractedSkill[]): Map<string, ExtractedSkill> {
  const skillMap = new Map<string, ExtractedSkill>();

  for (const skill of skills) {
    if (!skillMap.has(skill.skill)) {
      skillMap.set(skill.skill, skill);
    }
  }

  return skillMap;
}

function scoreLabel(score: number): MatchResult['label'] {
  if (score >= 80) return 'strong';
  if (score >= 60) return 'moderate';
  if (score >= 40) return 'stretch';
  return 'low';
}

/** Computes deterministic overlap between CV skills and job-description skills. */
export function computeMatch(cvSkills: ExtractedSkill[], jdSkills: ExtractedSkill[]): MatchResult {
  const cvBySkill = byFirstSkillOccurrence(cvSkills);
  const jdBySkill = byFirstSkillOccurrence(jdSkills);
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];
  const extraSkills: string[] = [];
  const evidenceMap: MatchResult['evidenceMap'] = {};

  for (const [skill, jdEvidence] of jdBySkill) {
    const cvEvidence = cvBySkill.get(skill);

    if (cvEvidence) {
      matchedSkills.push(skill);
      evidenceMap[skill] = {
        cvSpan: cvEvidence.source,
        jdSpan: jdEvidence.source,
      };
    } else {
      missingSkills.push(skill);
    }
  }

  for (const skill of cvBySkill.keys()) {
    if (!jdBySkill.has(skill)) {
      extraSkills.push(skill);
    }
  }

  const score = jdBySkill.size > 0 ? Math.round((matchedSkills.length / jdBySkill.size) * 100) : 0;

  return {
    score,
    matchedSkills,
    missingSkills,
    extraSkills,
    evidenceMap,
    label: scoreLabel(score),
  };
}
