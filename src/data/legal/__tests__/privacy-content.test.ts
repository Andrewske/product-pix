import { privacySections, privacyFooterLinks, privacyLastUpdated } from '../privacy-content';

describe('privacy-content', () => {
  it('contains all 11 required sections', () => {
    expect(privacySections).toHaveLength(17); // 11 main sections + 6 subsections

    // Check that all main section titles are present
    const mainSectionTitles = privacySections
      .filter(section => section.level === 2)
      .map(section => section.title);

    expect(mainSectionTitles).toHaveLength(11);
    expect(mainSectionTitles).toEqual([
      '1. Introduction',
      '2. Information We Collect',
      '3. How We Use Your Information',
      '4. Cookies & Tracking',
      '5. Third-Party Services',
      '6. Data Retention',
      '7. Your Rights',
      '8. Data Security',
      '9. Children&apos;s Privacy',
      '10. Changes to This Policy',
      '11. Contact Us'
    ]);
  });

  it('includes all subsections', () => {
    const subsectionTitles = privacySections
      .filter(section => section.level === 3)
      .map(section => section.title);

    expect(subsectionTitles).toEqual([
      'Account Information',
      'Payment Information',
      'Content You Upload',
      'Usage Data',
      'Essential Cookies (Always On)',
      'Analytics & Marketing Cookies (Opt-In Only)'
    ]);
  });

  it('has valid section structure', () => {
    privacySections.forEach(section => {
      expect(section.id).toBeDefined();
      expect(section.title).toBeDefined();
      expect([1, 2, 3]).toContain(section.level);
      // content can be null for container sections
      expect(section.content === null || typeof section.content === 'object').toBe(true);
    });
  });

  it('exports required metadata', () => {
    expect(privacyFooterLinks).toEqual([
      { href: '/terms', label: 'Terms of Service' },
    ]);

    expect(privacyLastUpdated).toBe('December 11, 2025');
  });
});