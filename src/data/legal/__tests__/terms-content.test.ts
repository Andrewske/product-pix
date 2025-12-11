import { termsSections, termsFooterLinks, termsLastUpdated } from '../terms-content';

describe('terms-content', () => {
  it('contains all 12 required sections', () => {
    expect(termsSections).toHaveLength(19); // 12 main sections + 7 subsections

    // Check that all main section titles are present
    const mainSectionTitles = termsSections
      .filter(section => section.level === 2)
      .map(section => section.title);

    expect(mainSectionTitles).toHaveLength(12);
    expect(mainSectionTitles).toEqual([
      '1. Introduction',
      '2. Eligibility',
      '3. Your Account',
      '4. The Service',
      '5. Credits & Payments',
      '6. Refunds',
      '7. Ownership & Intellectual Property',
      '8. Acceptable Use',
      '9. Account Termination',
      '10. Disclaimers & Liability',
      '11. Changes to Terms',
      '12. Contact'
    ]);
  });

  it('includes all subsections', () => {
    const subsectionTitles = termsSections
      .filter(section => section.level === 3)
      .map(section => section.title);

    expect(subsectionTitles).toEqual([
      'Credit Refunds (for bad generations)',
      'Cash Refunds',
      'Your Content',
      'What You Upload',
      'How We Use Your Images',
      'By You',
      'By Us'
    ]);
  });

  it('has valid section structure', () => {
    termsSections.forEach(section => {
      expect(section.id).toBeDefined();
      expect(section.title).toBeDefined();
      expect([1, 2, 3]).toContain(section.level);
      // content can be null for container sections
      expect(section.content === null || typeof section.content === 'object').toBe(true);
    });
  });

  it('exports required metadata', () => {
    expect(termsFooterLinks).toEqual([
      { href: '/privacy', label: 'Privacy Policy' },
    ]);

    expect(termsLastUpdated).toBe('December 11, 2025');
  });
});