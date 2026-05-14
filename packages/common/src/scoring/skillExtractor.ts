export interface ExtractedSkill {
  skill: string;
  source: string;
  sourceIndex: number;
}

const TOKEN_CHAR_CLASS = 'A-Za-z0-9+#';
const AMBIGUOUS_SKILLS = new Set(['go', 'r']);
const TECHNICAL_CONTEXT_PATTERN =
  /\b(api|backend|cli|code|codebase|cloud|concurrency|data|developer|development|docker|engineer|framework|grpc|kubernetes|language|microservice|programming|repository|script|server|service|software|statistical|statistics|system|tidyverse)\b/i;

/** Escapes a string so it can be safely embedded in a regular expression. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeSkill(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

function buildTaxonomyPattern(skills: string[]): RegExp {
  const alternatives = skills
    .slice()
    .sort((left, right) => right.length - left.length)
    .map((skill) =>
      skill
        .split(' ')
        .map((part) => escapeRegExp(part))
        .join('\\s+'),
    );

  return new RegExp(`(^|[^${TOKEN_CHAR_CLASS}])(${alternatives.join('|')})(?=$|[^${TOKEN_CHAR_CLASS}])`, 'gi');
}

function hasRequiredContext(text: string, sourceIndex: number, sourceLength: number, skill: string): boolean {
  if (!AMBIGUOUS_SKILLS.has(skill)) {
    return true;
  }

  const windowStart = Math.max(0, sourceIndex - 80);
  const windowEnd = Math.min(text.length, sourceIndex + sourceLength + 80);
  return TECHNICAL_CONTEXT_PATTERN.test(text.slice(windowStart, windowEnd));
}

/** Extracts recognized taxonomy skills from plain text with source spans. */
export function extractSkills(text: string, taxonomy: string[]): ExtractedSkill[] {
  if (!text || taxonomy.length === 0) {
    return [];
  }

  const uniqueTaxonomy = Array.from(new Set(taxonomy.map(normalizeSkill).filter(Boolean)));
  const taxonomySet = new Set(uniqueTaxonomy);
  const pattern = buildTaxonomyPattern(uniqueTaxonomy);
  const matches: ExtractedSkill[] = [];
  const seen = new Set<string>();

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    const prefix = match[1] ?? '';
    const source = match[2] ?? '';
    const sourceIndex = match.index + prefix.length;
    const skill = normalizeSkill(source);

    if (!taxonomySet.has(skill) || !hasRequiredContext(text, sourceIndex, source.length, skill)) {
      continue;
    }

    const matchKey = `${skill}:${sourceIndex}:${source.toLowerCase()}`;
    if (seen.has(matchKey)) {
      continue;
    }

    seen.add(matchKey);
    matches.push({ skill, source, sourceIndex });
  }

  return matches.sort((left, right) => left.sourceIndex - right.sourceIndex || left.skill.localeCompare(right.skill));
}
