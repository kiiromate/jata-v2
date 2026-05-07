import {
  buildApplicationPackWorkflow,
  PackReadinessStatuses,
} from '../../../../../packages/common/src/packWorkflow';

describe('Application pack workflow contract', () => {
  it('builds copy-ready sections with visible review warnings', () => {
    const workflow = buildApplicationPackWorkflow({
      roleTitle: 'Product Operations Lead',
      company: 'Acme Climate',
      resumeText: 'Led reporting operations and stakeholder coordination for climate projects.',
      jobDescription: 'Own reporting, operations cadence, and cross-functional stakeholder updates.',
      matchedSkills: ['operations', 'stakeholder coordination'],
      missingSkills: ['grant compliance'],
      atsIssues: ['Add a clear skills section.'],
    });

    expect(PackReadinessStatuses).toEqual(['draft', 'needs_review', 'ready', 'used']);
    expect(workflow.status).toBe('needs_review');
    expect(workflow.sections.coverLetter).toContain('Dear Hiring Team,');
    expect(workflow.sections.shortIntro).toContain('Product Operations Lead');
    expect(workflow.sections.customQuestionAnswers).toContain('Use only verified resume facts');
    expect(workflow.sections.recruiterMessage).toContain('Acme Climate');
    expect(workflow.sections.followUpMessage).toContain('following up');
    expect(workflow.claimsToVerify).toEqual(
      expect.arrayContaining([
        'Verify every metric, employer name, credential, and date before sending.',
        'Do not claim grant compliance experience unless it is supported by the resume or notes.',
      ]),
    );
  });
});
