import {
  parseSharedOpportunity,
  sharedOpportunityToCaptureInput,
} from '../../../../../packages/common/src/shareIntake';

describe('mobile share intake helpers', () => {
  it('prefills Quick Capture fields from Web Share Target title, text, and url params', () => {
    const parsed = parseSharedOpportunity({
      title: 'Senior Product Manager',
      text: 'Senior Product Manager at Acme\nLead platform delivery.',
      url: 'https://jobs.example/acme/product-manager?ref=telegram',
    });

    expect(parsed).toMatchObject({
      roleTitle: 'Senior Product Manager',
      sourceUrl: 'https://jobs.example/acme/product-manager?ref=telegram',
      rawText: 'Senior Product Manager at Acme\nLead platform delivery.',
      method: 'share',
    });
  });

  it('uses the first link pasted in text when url is not provided', () => {
    const parsed = parseSharedOpportunity({
      text: 'Worth reviewing https://jobs.example/ops-lead\nOperations Lead role',
    });

    expect(parsed.sourceUrl).toBe('https://jobs.example/ops-lead');
    expect(parsed.rawText).toContain('Operations Lead role');
    expect(parsed.method).toBe('url');
  });

  it('builds a pwa_share Capture Inbox payload without requiring Telegram', () => {
    const input = sharedOpportunityToCaptureInput('user-1', {
      title: 'Data Analyst',
      text: 'Data Analyst role',
    });

    expect(input).toMatchObject({
      userId: 'user-1',
      source: 'pwa_share',
      method: 'share',
      title: 'Data Analyst',
      rawText: 'Data Analyst role',
    });
  });
});
