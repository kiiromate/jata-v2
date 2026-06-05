import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { performance } from 'node:perf_hooks';

import {
  computeMatch,
  extractSkills,
  FLAT_TAXONOMY,
  quickScore,
  scoreApplicationFit,
  splitEvidenceChunks,
  splitJobRequirements,
} from '../index.ts';

describe('deterministic scoring engine', () => {
  it('matches a known skill in both CV and JD with evidence spans', () => {
    const cvSkills = extractSkills('Built Python APIs for data workflows.', ['python']);
    const jdSkills = extractSkills('Requires Python experience for backend services.', ['python']);

    const result = computeMatch(cvSkills, jdSkills);

    assert.equal(result.score, 100);
    assert.deepEqual(result.matchedSkills, ['python']);
    assert.equal(result.evidenceMap.python.cvSpan, 'Python');
    assert.equal(result.evidenceMap.python.jdSpan, 'Python');
  });

  it('reports a JD skill missing from the CV', () => {
    const cvSkills = extractSkills('Built React interfaces.', ['react', 'kubernetes']);
    const jdSkills = extractSkills('Needs React and Kubernetes experience.', ['react', 'kubernetes']);

    const result = computeMatch(cvSkills, jdSkills);

    assert.deepEqual(result.matchedSkills, ['react']);
    assert.deepEqual(result.missingSkills, ['kubernetes']);
    assert.equal(result.score, 50);
    assert.equal(result.label, 'stretch');
  });

  it('reports a CV skill that is extra to the JD', () => {
    const cvSkills = extractSkills('Built React interfaces and PostgreSQL data models.', ['react', 'postgresql']);
    const jdSkills = extractSkills('Needs React experience.', ['react', 'postgresql']);

    const result = computeMatch(cvSkills, jdSkills);

    assert.deepEqual(result.extraSkills, ['postgresql']);
  });

  it('scores an empty CV as 0 and marks all JD skills missing', () => {
    const cvSkills = extractSkills('', ['python', 'sql']);
    const jdSkills = extractSkills('Requires Python and SQL.', ['python', 'sql']);

    const result = computeMatch(cvSkills, jdSkills);

    assert.equal(result.score, 0);
    assert.deepEqual(result.missingSkills, ['python', 'sql']);
    assert.equal(result.label, 'low');
  });

  it('scores identical CV and JD skill text as 100', () => {
    const output = quickScore({
      cvText: 'Python SQL project management',
      jdText: 'Python SQL project management',
    });

    assert.equal(output.match.score, 100);
    assert.equal(output.match.label, 'strong');
  });

  it('matches skills case-insensitively', () => {
    const result = computeMatch(
      extractSkills('Python automation', ['python']),
      extractSkills('python scripting', ['python']),
    );

    assert.deepEqual(result.matchedSkills, ['python']);
  });

  it('matches multi-word skills correctly', () => {
    const result = computeMatch(
      extractSkills('Led project management for cross-functional teams.', ['project management']),
      extractSkills('Project management experience is required.', ['project management']),
    );

    assert.deepEqual(result.matchedSkills, ['project management']);
    assert.equal(result.evidenceMap['project management'].cvSpan, 'project management');
  });

  it('does not match go inside going or cargo', () => {
    const skills = extractSkills('Going from cargo planning to market launch.', ['go']);

    assert.deepEqual(skills, []);
  });

  it('scores typical text under 50ms', () => {
    const cvText = `${'Python React SQL project management Docker AWS '.repeat(200)}${'delivery leadership '.repeat(80)}`;
    const jdText = `${'Requires Python, React, SQL, Docker, AWS, and project management. '.repeat(75)}`;

    const startedAt = performance.now();
    const output = quickScore({ cvText, jdText });
    const elapsedMs = performance.now() - startedAt;

    assert.equal(output.match.score, 100);
    assert.ok(FLAT_TAXONOMY.length >= 200);
    assert.ok(elapsedMs < 50, `quickScore took ${elapsedMs.toFixed(2)}ms`);
  });

  it('splits job descriptions into requirement chunks', () => {
    const requirements = splitJobRequirements(`
      Responsibilities:
      - Build React dashboards for customer workflows.
      - Maintain SQL reporting and stakeholder updates.

      Requirements:
      Experience with TypeScript and accessibility.
    `);

    assert.ok(requirements.length >= 3);
    assert.ok(requirements.some((requirement) => requirement.text.includes('React dashboards')));
    assert.ok(requirements.every((requirement) => requirement.text.length <= 240));
  });

  it('splits resume and profile text into evidence chunks', () => {
    const evidence = splitEvidenceChunks({
      resumeText: '- Built React dashboards for support teams.\n- Led SQL reporting.',
      profileText: 'Product engineer focused on accessibility and stakeholder management.',
      resumeSource: 'resume_extracted_text',
    });

    assert.ok(evidence.some((chunk) => chunk.source === 'resume_extracted_text'));
    assert.ok(evidence.some((chunk) => chunk.source === 'profile'));
    assert.ok(evidence.every((chunk) => chunk.text.length <= 260));
  });

  it('scores partial semantic-style matches with bounded evidence snippets', () => {
    const output = scoreApplicationFit({
      jobDescription:
        'Requirements: Build customer-facing React dashboards. Maintain SQL reporting for stakeholders. Improve WCAG accessibility.',
      resumeText:
        'Experience: Created React analytics panels for support teams. Owned SQL reports for weekly leadership reviews.',
      profileText: 'Frontend product engineer with accessibility review experience.',
      resumeSource: 'resume_extracted_text',
    });

    assert.ok(output.score >= 60, `expected useful match score, got ${output.score}`);
    assert.equal(output.recommendedAction, 'tailor');
    assert.ok(output.matchedSkills.includes('react'));
    assert.ok(output.matchedSkills.includes('sql'));
    assert.ok(output.evidenceMatches.length > 0);
    assert.ok(output.evidenceMatches.every((match) => match.requirementSnippet.length <= 180));
    assert.ok(output.evidenceMatches.every((match) => match.evidenceSnippet.length <= 180));
    assert.ok(!JSON.stringify(output).includes('Created React analytics panels for support teams. Owned SQL reports for weekly leadership reviews.'));
  });

  it('marks missing skills and claims to verify when evidence is weak', () => {
    const output = scoreApplicationFit({
      jobDescription: 'Requires Kubernetes, Terraform, and incident response ownership.',
      resumeText: 'Built React dashboards and wrote product documentation.',
      resumeSource: 'resume_content',
    });

    assert.ok(output.score < 50);
    assert.equal(output.recommendedAction, 'deprioritize');
    assert.ok(output.missingSkills.includes('kubernetes'));
    assert.ok(output.claimsToVerify.length > 0);
  });

  it('lowers confidence when final application resume text is the only evidence source', () => {
    const output = scoreApplicationFit({
      jobDescription: 'Requires Python automation and SQL reporting.',
      resumeText: 'Python automation and SQL reporting.',
      resumeSource: 'application_final_resume_text',
    });

    assert.equal(output.confidence, 'medium');
    assert.equal(output.metadata.resumeSource, 'application_final_resume_text');
    assert.ok(output.claimsToVerify.some((claim) => claim.includes('lower-confidence')));
  });
});
